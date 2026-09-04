// public/js/login.js - runs only on login.html
document.getElementById("login-form").addEventListener("submit", async e => {
  e.preventDefault();
  const errorEl = document.getElementById("login-error");
  errorEl.textContent = "";

  const fd = new FormData(e.target);
  try {
    await api("/auth/login", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(fd)),
    });
    window.location.href = "/index.html";
  } catch (err) {
    errorEl.textContent = err.message || "Login failed";
  }
});
