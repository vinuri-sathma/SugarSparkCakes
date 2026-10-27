
const registerForm = document.getElementById("register-form");
const formMessage = document.getElementById("form-message");

// Show or hide passwords
document.querySelectorAll(".toggle-password").forEach(button => {
    button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.target);
        const showPassword = input.type === "password";

        input.type = showPassword ? "text" : "password";
        button.textContent = showPassword ? "Hide" : "Show";
        button.setAttribute(
            "aria-label",
            showPassword ? "Hide password" : "Show password"
        );
    });
});

// Validate the registration form
registerForm.addEventListener("submit", event => {
    event.preventDefault();

    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    formMessage.className = "form-message";

    if (password !== confirmPassword) {
        formMessage.textContent = "Passwords do not match. Please try again.";
        formMessage.classList.add("error");
        return;
    }

    formMessage.textContent =
        "Form validated! Database registration needs to be connected.";
    formMessage.classList.add("success");
});
