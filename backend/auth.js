const crypto = require("crypto");
const db = require("../database/db");

const ADMIN_SESSION_MAX_AGE = 90 * 24 * 60 * 60 * 1000;
const VISITOR_SESSION_MAX_AGE = 24 * 60 * 60 * 1000;
const loginAttempts = new Map();

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
    });
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
    return new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, 64, (err, key) => {
            if (err) reject(err);
            else resolve(`${salt}:${key.toString("hex")}`);
        });
    });
}

async function verifyPassword(password, storedHash) {
    if (!storedHash || !storedHash.includes(":")) return false;
    const [salt, expectedHex] = storedHash.split(":");
    const actual = await hashPassword(password, salt);
    const actualBuffer = Buffer.from(actual.split(":")[1], "hex");
    const expectedBuffer = Buffer.from(expectedHex, "hex");
    return actualBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function tokenHash(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

function parseCookies(req) {
    const cookies = {};
    for (const part of (req.headers.cookie || "").split(";")) {
        const index = part.indexOf("=");
        if (index !== -1) {
            try { cookies[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim()); } catch { /* 忽略无效 Cookie */ }
        }
    }
    return cookies;
}

function cookieHeader(token, maxAgeSeconds) {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    return `system_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}${secure}`;
}

async function initializeAuth() {
    await run(`CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        password_changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    const userColumns = await new Promise((resolve, reject) => {
        db.all("PRAGMA table_info(admin_users)", [], (err, rows) => err ? reject(err) : resolve(rows));
    });
    if (!userColumns.some(column => column.name === "role")) {
        await run("ALTER TABLE admin_users ADD COLUMN role TEXT NOT NULL DEFAULT 'admin'");
    }
    await run(`CREATE TABLE IF NOT EXISTS auth_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token_hash TEXT UNIQUE NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES admin_users(id) ON DELETE CASCADE
    )`);
    await run("CREATE INDEX IF NOT EXISTS idx_auth_session_token ON auth_sessions(token_hash)");
    await run("DELETE FROM auth_sessions WHERE expires_at <= ?", [Date.now()]);

    const existingAdmin = await get("SELECT id FROM admin_users WHERE role = 'admin' LIMIT 1");
    if (!existingAdmin && process.env.ADMIN_PASSWORD) {
        const username = String(process.env.ADMIN_USERNAME || "admin").trim();
        const password = String(process.env.ADMIN_PASSWORD);
        if (password.length < 8) throw new Error('ADMIN_PASSWORD must contain at least 8 characters');
        const passwordHash = await hashPassword(password);
        await run("INSERT INTO admin_users(username, password_hash, role) VALUES(?, ?, 'admin')", [username, passwordHash]);
        console.log(`Initial administrator created: ${username}`);
    }

    const existingVisitor = await get("SELECT id FROM admin_users WHERE role = 'visitor' LIMIT 1");
    if (!existingVisitor && process.env.VISITOR_PASSWORD) {
        const username = String(process.env.VISITOR_USERNAME || "visitor").trim();
        const password = String(process.env.VISITOR_PASSWORD);
        if (password.length < 8) throw new Error("VISITOR_PASSWORD must contain at least 8 characters");
        const passwordHash = await hashPassword(password);
        await run("INSERT INTO admin_users(username, password_hash, role) VALUES(?, ?, 'visitor')", [username, passwordHash]);
        console.log(`Initial visitor created: ${username}`);
    }
}

async function getSession(req) {
    const token = parseCookies(req).system_session;
    if (!token) return null;
    const session = await get(`
        SELECT s.id, s.user_id, s.expires_at, u.username, u.role
        FROM auth_sessions s
        JOIN admin_users u ON u.id = s.user_id
        WHERE s.token_hash = ?
    `, [tokenHash(token)]);
    if (!session || session.expires_at <= Date.now()) {
        if (session) await run("DELETE FROM auth_sessions WHERE id = ?", [session.id]);
        return null;
    }
    return { ...session, token };
}

async function requireAuth(req, res, next) {
    try {
        const session = await getSession(req);
        if (!session) return res.status(401).json({ error: "请先登录" });
        req.auth = session;
        next();
    } catch (err) {
        next(err);
    }
}

async function requireAuthPage(req, res, next) {
    try {
        const session = await getSession(req);
        if (!session) return res.redirect("/login.html");
        req.auth = session;
        next();
    } catch (err) {
        next(err);
    }
}

async function requireAdmin(req, res, next) {
    try {
        const session = req.auth || await getSession(req);
        if (!session) return res.status(401).json({ error: "请先登录" });
        if (session.role !== "admin") return res.status(403).json({ error: "游客账号无权执行此操作" });
        req.auth = session;
        next();
    } catch (err) {
        next(err);
    }
}

async function requireAdminPage(req, res, next) {
    try {
        const session = await getSession(req);
        if (!session) return res.redirect("/login.html");
        if (session.role !== "admin") return res.redirect("/index.html");
        req.auth = session;
        next();
    } catch (err) {
        next(err);
    }
}

function createAuthRouter(express) {
    const router = express.Router();

    router.post("/login", async (req, res, next) => {
        try {
            const key = req.ip;
            const attempt = loginAttempts.get(key);
            if (attempt && attempt.blockedUntil > Date.now()) {
                return res.status(429).json({ error: "尝试次数过多，请10分钟后再试" });
            }

            const username = String(req.body.username || "").trim();
            const password = String(req.body.password || "");
            const user = await get("SELECT * FROM admin_users WHERE username = ?", [username]);
            const valid = user && await verifyPassword(password, user.password_hash);
            if (!valid) {
                const failures = (attempt?.failures || 0) + 1;
                loginAttempts.set(key, {
                    failures: failures >= 5 ? 0 : failures,
                    blockedUntil: failures >= 5 ? Date.now() + 10 * 60 * 1000 : 0
                });
                return res.status(401).json({ error: "用户名或密码错误" });
            }

            loginAttempts.delete(key);
            const token = crypto.randomBytes(32).toString("hex");
            const sessionMaxAge = user.role === "visitor" ? VISITOR_SESSION_MAX_AGE : ADMIN_SESSION_MAX_AGE;
            const expiresAt = Date.now() + sessionMaxAge;
            await run(
                "INSERT INTO auth_sessions(user_id, token_hash, expires_at) VALUES(?, ?, ?)",
                [user.id, tokenHash(token), expiresAt]
            );
            res.setHeader("Set-Cookie", cookieHeader(token, sessionMaxAge / 1000));
            res.json({ message: "登录成功", username: user.username, role: user.role });
        } catch (err) {
            next(err);
        }
    });

    router.get("/status", async (req, res, next) => {
        try {
            const session = await getSession(req);
            res.json({ loggedIn: Boolean(session), username: session?.username || null, role: session?.role || null });
        } catch (err) {
            next(err);
        }
    });

    router.post("/change-password", requireAuth, async (req, res, next) => {
        try {
            const currentPassword = String(req.body.currentPassword || "");
            const newPassword = String(req.body.newPassword || "");
            const user = await get("SELECT * FROM admin_users WHERE id = ?", [req.auth.user_id]);
            if (!await verifyPassword(currentPassword, user.password_hash)) {
                return res.status(400).json({ error: "当前密码不正确" });
            }
            if (newPassword.length < 8) {
                return res.status(400).json({ error: "新密码至少需要8位" });
            }
            if (await verifyPassword(newPassword, user.password_hash)) {
                return res.status(400).json({ error: "新密码不能与当前密码相同" });
            }
            const passwordHash = await hashPassword(newPassword);
            await run("UPDATE admin_users SET password_hash = ?, password_changed_at = CURRENT_TIMESTAMP WHERE id = ?", [passwordHash, user.id]);
            await run("DELETE FROM auth_sessions WHERE user_id = ?", [user.id]);
            res.setHeader("Set-Cookie", cookieHeader("", 0));
            res.json({ message: "密码修改成功，请重新登录" });
        } catch (err) {
            next(err);
        }
    });

    router.post("/logout", async (req, res, next) => {
        try {
            const session = await getSession(req);
            if (session) await run("DELETE FROM auth_sessions WHERE id = ?", [session.id]);
            res.setHeader("Set-Cookie", cookieHeader("", 0));
            res.json({ message: "已退出登录" });
        } catch (err) {
            next(err);
        }
    });

    return router;
}

async function resetAdminPassword(username, newPassword) {
    await initializeAuth();
    if (newPassword.length < 8) throw new Error("新密码至少需要8位");
    const user = await get("SELECT id FROM admin_users WHERE username = ?", [username]);
    if (!user) throw new Error("账号不存在");
    const passwordHash = await hashPassword(newPassword);
    await run("UPDATE admin_users SET password_hash = ?, password_changed_at = CURRENT_TIMESTAMP WHERE id = ?", [passwordHash, user.id]);
    await run("DELETE FROM auth_sessions WHERE user_id = ?", [user.id]);
}

module.exports = {
    createAuthRouter,
    initializeAuth,
    requireAdmin,
    requireAuth,
    requireAuthPage,
    requireAdminPage,
    resetAdminPassword
};
