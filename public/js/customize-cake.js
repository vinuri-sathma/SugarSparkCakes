
const imageInput = document.getElementById("cake-image");
const imagePreview = document.getElementById("image-preview");
const previewContainer = document.getElementById("image-preview-container");
const imageFileName = document.getElementById("image-file-name");
const removeImageButton = document.getElementById("remove-image");
const customizeForm = document.getElementById("customize-form");
const deliveryDateInput = document.getElementById("delivery-date");

const whatsappNumber = "94742446828";

const cartCount = document.getElementById("cart-count");
const CART_KEY = "sugarSparkCart";

function updateCartCount() {
    try {
        const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

        const total = Array.isArray(cart)
            ? cart.reduce(function (sum, item) {
                return sum + Math.max(
                    0,
                    Math.floor(Number(item.quantity) || 0)
                );
            }, 0)
            : 0;

        cartCount.textContent = total;
        cartCount.hidden = total === 0;

    } catch (error) {
        cartCount.textContent = "0";
        cartCount.hidden = true;
    }
}

updateCartCount();

window.addEventListener("storage", function (event) {
    if (event.key === CART_KEY || event.key === null) {
        updateCartCount();
    }
});

let selectedImage = null;
let previewUrl = null;

// Set today's date as the earliest selectable date
const today = new Date();

const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
].join("-");

deliveryDateInput.min = localToday;


// Upload cake picture and display preview
imageInput.addEventListener("change", function () {
    const file = imageInput.files[0];

    if (!file) {
        return;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        alert("Please upload a JPG, PNG or WEBP image.");
        imageInput.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("Please upload an image smaller than 5 MB.");
        imageInput.value = "";
        return;
    }

    selectedImage = file;

    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
    }

    previewUrl = URL.createObjectURL(file);

    imagePreview.src = previewUrl;
    imageFileName.textContent = "Selected picture: " + file.name;

    previewContainer.hidden = false;
});


// Remove uploaded picture
removeImageButton.addEventListener("click", function () {
    imageInput.value = "";
    selectedImage = null;

    imagePreview.removeAttribute("src");
    imageFileName.textContent = "";
    previewContainer.hidden = true;

    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = null;
    }
});


// Submit customization request to the database
customizeForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!customizeForm.reportValidity()) {
        return;
    }

    const customerName =
        document.getElementById("customer-name").value.trim();

    const customerPhone =
        document.getElementById("customer-phone").value.trim();

    const flavour =
        document.getElementById("cake-flavour").value;

    const cakeSize =
        document.getElementById("cake-weight").value;

    const occasion =
        document.getElementById("cake-occasion").value;

    const preferredDesign =
        document.getElementById("cake-design").value.trim();

    const cakeMessage =
        document.getElementById("cake-greeting").value.trim();

    const specialInstructions =
        document.getElementById("additional-notes").value.trim();

    const deliveryDate =
        deliveryDateInput.value;

    // Prepare form data for the API
    const formData = new FormData();

    formData.append("customerName", customerName);
    formData.append("customerPhone", customerPhone);
    formData.append("flavour", flavour);
    formData.append("cakeSize", cakeSize);
    formData.append("occasion", occasion);
    formData.append("preferredDesign", preferredDesign);
    formData.append("cakeMessage", cakeMessage);
    formData.append("specialInstructions", specialInstructions);
    formData.append("deliveryDate", deliveryDate);

    // Add reference image only if the customer selected one
    if (selectedImage) {
        formData.append("referenceImage", selectedImage);
    }

    // Open a blank tab first to avoid browser popup blocking
    const whatsappWindow = window.open("about:blank", "_blank");

    const submitButton = customizeForm.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

    if (submitButton) {
        submitButton.disabled = true;
    }

    try {
        const response = await fetch("/api/customization-requests", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to submit customization request."
            );
        }

        // Prepare WhatsApp message after successful database save
        const message =
            "Hello Sugar Spark Cakes! 🧁\n\n" +
            "I have submitted a customized cake request through your website.\n\n" +
            "Customer Name: " + customerName + "\n" +
            "Contact Number: " + customerPhone + "\n" +
            "Flavour: " + flavour + "\n" +
            "Cake Size: " + cakeSize + "\n" +
            "Occasion: " + (occasion || "Not specified") + "\n" +
            "Preferred Design: " + (preferredDesign || "Not specified") + "\n" +
            "Cake Message: " + (cakeMessage || "Not specified") + "\n" +
            "Additional Instructions: " +
            (specialInstructions || "Not specified") + "\n" +
            "Delivery Date: " + deliveryDate + "\n\n" +
            "Customization Request ID: " + result.customizationId + "\n\n" +
            "Thank you!";

        const whatsappURL =
            "https://wa.me/" +
            whatsappNumber +
            "?text=" +
            encodeURIComponent(message);

        alert("Your customization request has been saved successfully!");

        if (whatsappWindow) {
            whatsappWindow.location.href = whatsappURL;
        } else {
            window.location.href = whatsappURL;
        }

    } catch (error) {
        console.error("Customization submission error:", error);

        if (whatsappWindow) {
            whatsappWindow.close();
        }

        alert(
            error.message ||
            "Something went wrong. Please try again."
        );

    } finally {
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
});
