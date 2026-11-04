
const registerForm = document.getElementById("register-form");
const formMessage = document.getElementById("form-message");
const registerButton = registerForm.querySelector(".register-button");

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

// Register customer
registerForm.addEventListener("submit", async event => {
    event.preventDefault();

    const fullName = document.getElementById("full-name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const terms = document.getElementById("terms").checked;

    formMessage.className = "form-message";
    formMessage.textContent = "";

    // Check password match
    if (password !== confirmPassword) {
        formMessage.textContent = "Passwords do not match. Please try again.";
        formMessage.classList.add("error");
        return;
    }

    // Check terms and conditions
    if (!terms) {
        formMessage.textContent =
            "Please accept the Terms and Conditions.";
        formMessage.classList.add("error");
        return;
    }

    // Prevent multiple submissions
    registerButton.disabled = true;
    registerButton.textContent = "Creating Account...";

    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                fullName,
                email,
                phone,
                password,
                confirmPassword,
                terms
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Registration failed.");
        }

        formMessage.textContent = result.message;
        formMessage.classList.add("success");

        registerForm.reset();

    } catch (error) {
        formMessage.textContent =
            error.message || "Something went wrong. Please try again.";
        formMessage.classList.add("error");

    } finally {
        registerButton.disabled = false;
        registerButton.textContent = "Create Account";
    }
});
