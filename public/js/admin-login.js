
const adminLoginForm = document.getElementById("adminLoginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const loginMessage = document.getElementById("loginMessage");

function showMessage(message, type) {
    loginMessage.textContent = message;
    loginMessage.className = `login-message ${type}`;
}

// Show or hide the password
togglePassword.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";

    passwordInput.type = isHidden ? "text" : "password";
    togglePassword.textContent = isHidden ? "Hide" : "Show";
    togglePassword.setAttribute(
        "aria-label",
        isHidden ? "Hide password" : "Show password"
    );
});

// Admin login form
adminLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password.trim()) {
        showMessage("Please enter your username and password.", "error");
        return;
    }

    showMessage(
        "Login interface is ready. Secure authentication needs to be connected.",
        "error"
    );
});
