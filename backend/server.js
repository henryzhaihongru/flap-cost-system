const express = require("express");
const path = require("path");
const { initializeDatabase } = require("../database/init");
const {
    createAuthRouter,
    initializeAuth,
    requireAuth,
    requireAuthPage,
    requireAdminPage
} = require("./auth");

const sandpaperRouter = require("./routes/sandpaper");
const productSpecsRouter = require("./routes/productSpecs");
const quotationsRouter = require("./routes/quotations");
const app = express();
const PORT = Number(process.env.PORT || 3000);
const frontend = path.join(__dirname, "../frontend");

// 页面和接口同源，不开放任意来源的凭据跨域请求。
app.use(express.json({ limit: "1mb" }));

// 登录页和登录接口必须允许未登录访问。
app.get("/login.html", (req, res) => res.sendFile(path.join(frontend, "login.html")));
app.get("/login.js", (req, res) => res.sendFile(path.join(frontend, "login.js")));
app.get("/style.css", (req, res) => res.sendFile(path.join(frontend, "style.css")));
app.use("/api/auth", createAuthRouter(express));

// 所有业务接口必须登录，不能通过直接调用接口绕过页面登录。
app.use("/api", requireAuth);
app.use("/api/sandpaper", sandpaperRouter);
app.use("/api/specs", productSpecsRouter);
app.use("/api/quotations", quotationsRouter);

// 除登录页外，所有网页和前端脚本必须登录。
app.use(requireAuthPage);
app.get("/admin.html", requireAdminPage, (req, res) => res.sendFile(path.join(frontend, "admin.html")));
app.get("/admin.js", requireAdminPage, (req, res) => res.sendFile(path.join(frontend, "admin.js")));
app.use(express.static(frontend));
app.get("/", (req, res) => res.sendFile(path.join(frontend, "index.html")));

app.use((req, res) => res.status(404).json({ error: "页面或接口不存在" }));
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "服务器内部错误" });
});

initializeDatabase()
    .then(() => initializeAuth())
    .then(() => {
        app.listen(PORT, process.env.HOST || "127.0.0.1", () => {
            console.log(`FlapCostSystem backend running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error("Authentication initialization failed:", err);
        process.exit(1);
    });
