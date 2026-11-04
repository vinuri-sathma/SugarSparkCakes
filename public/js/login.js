
const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("toggle-password");
const loginButton = loginForm.querySelector(".login-button");

// Show or hide password
togglePassword.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";

    passwordInput.type = isHidden ? "text" : "password";
    togglePassword.textContent = isHidden ? "Hide" : "Show";

    togglePassword.setAttribute(
        "aria-label",
        isHidden ? "Hide password" : "Show password"
    );
});

// Customer login
loginForm.addEventListener("submit", async event => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = passwordInput.value;

    loginMessage.className = "login-message";
    loginMessage.textContent = "";

    loginButton.disabled = true;
    loginButton.textContent = "Signing In...";

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Login failed.");
        }

        loginMessage.textContent = result.message;
        loginMessage.classList.add("success");

        // Save customer information for the session
        sessionStorage.setItem(
            "customer",
            JSON.stringify(result.customer)
        );

        // Redirect to customer dashboard
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1000);

    } catch (error) {
        loginMessage.textContent =
            error.message || "Something went wrong. Please try again.";

        loginMessage.classList.add("error");

    } finally {
        loginButton.disabled = false;
        loginButton.innerHTML = 'Sign In <span>♡</span>';
    }
});
