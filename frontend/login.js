const form = document.getElementById("loginForm");
const message = document.getElementById("loginMessage");

fetch("/api/auth/status")
    .then(response => response.json())
    .then(data => {
        if (data.loggedIn) window.location.replace("/index.html");
    });

form.addEventListener("submit", async event => {
    event.preventDefault();
    message.textContent = "正在登录…";

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: document.getElementById("username").value,
                password: document.getElementById("password").value
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "登录失败");
        window.location.replace("/index.html");
    } catch (error) {
        message.textContent = error.message;
    }
});
