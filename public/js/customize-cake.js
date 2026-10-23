
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


// Send customer name and contact number through WhatsApp
customizeForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const customerName =
        document.getElementById("customer-name").value.trim();

    const customerPhone =
        document.getElementById("customer-phone").value.trim();

    if (!customizeForm.reportValidity()) {
        return;
    }

    const message =
        "Hello Sugar Spark Cakes! 🧁\n\n" +
        "I would like to place a customized cake order.\n\n" +
        "Customer Name: " + customerName + "\n" +
        "Contact Number: " + customerPhone + "\n\n" +
        "Please note my customized cake order. " +
        "I will discuss the cake details with you. Thank you!";

    const whatsappURL =
        "https://wa.me/" +
        whatsappNumber +
        "?text=" +
        encodeURIComponent(message);

    window.open(
        whatsappURL,
        "_blank",
        "noopener,noreferrer"
    );
});
