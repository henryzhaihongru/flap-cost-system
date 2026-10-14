const form = document.getElementById("changePasswordForm");
const message = document.getElementById("changeMessage");

form.addEventListener("submit", async event => {
    event.preventDefault();
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
        message.textContent = "两次输入的新密码不一致";
        return;
    }

    message.textContent = "正在修改…";
    try {
        const response = await fetch("/api/auth/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "修改失败");
        message.textContent = data.message;
        setTimeout(() => window.location.replace("/login.html"), 1000);
    } catch (error) {
        message.textContent = error.message;
    }
});
