const db = require("../database/db");
const { resetAdminPassword } = require("./auth");

const username = process.argv[2] || "admin";
const newPassword = process.argv[3];

if (!newPassword) {
    console.error("用法: node reset-password.js 管理员账号 新密码");
    process.exit(1);
}

resetAdminPassword(username, newPassword)
    .then(() => {
        console.log("管理员密码已重置，所有设备需要重新登录。");
        db.close();
    })
    .catch(err => {
        console.error(err.message);
        db.close();
        process.exitCode = 1;
    });
