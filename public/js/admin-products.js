
let products = [];

const API_URL = "/api/products";
const ADMIN_API_URL = "/api/admin/products";

const productForm = document.getElementById("productForm");
const productTableBody = document.getElementById("productTableBody");
const statusMessage = document.getElementById("statusMessage");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

const cakeImages = document.getElementById("cakeImages");
const imagePreview = document.getElementById("imagePreview");

function showMessage(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.style.color = isError ? "#c0392b" : "#218838";
}

function formatPrice(price) {
    return "LKR " + Number(price).toLocaleString("en-LK", {
        maximumFractionDigits: 2
    });
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Load products from MySQL through the API
async function loadProducts() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Could not load products.");
        }

        const data = await response.json();

        products = data.map(product => ({
            id: Number(product.product_id),
            name: product.product_name,
            category: product.category || "",
            flavour: product.flavour || "",
            price: Number(product.price),
            image: product.image || "",
            images: product.images || [],
            description: product.description || "",
            available: product.available
        }));

        renderProducts();

    } catch (error) {
        console.error("Product loading error:", error);
        showMessage("Could not load products. Please check the server.", true);
    }
}


function renderProducts() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;

    const filteredProducts = products.filter(product => {
        const matchesSearch = [
            product.name,
            product.category,
            product.flavour
        ].some(value =>
            String(value || "").toLowerCase().includes(searchTerm)
        );

        const matchesCategory =
            !selectedCategory || product.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    document.getElementById("totalProducts").textContent = products.length;

    document.getElementById("availableProducts").textContent =
        products.filter(product => product.available).length;

    if (filteredProducts.length === 0) {
        productTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    No products found.
                </td>
            </tr>`;
        return;
    }

    productTableBody.innerHTML = filteredProducts.map(product => {

        // Get all images belonging to this product
        const productImages = product.images && product.images.length > 0
            ? product.images
            : product.image
                ? [product.image]
                : [];

        // Display all product images
        const image = productImages.length > 0
            ? productImages.map(imagePath => {
                const imageURL = "/" + imagePath.replace(/^\/+/, "");

                return `
                    <img
                        class="product-image"
                        src="${escapeHTML(imageURL)}"
                        alt="${escapeHTML(product.name)}"
                        onerror="this.hidden=true"
                    >
                `;
            }).join("")
            : `<span class="product-placeholder">🎂</span>`;

        return `
            <tr>
                <td>
                    <div class="product-cell">
                        ${image}
                        <div>
                            <div class="product-name">
                                ${escapeHTML(product.name)}
                            </div>
                            <div class="product-description">
                                ${escapeHTML(product.description || "No description")}
                            </div>
                        </div>
                    </div>
                </td>

                <td>${escapeHTML(product.category)}</td>
                <td>${escapeHTML(product.flavour)}</td>
                <td class="price">${formatPrice(product.price)}</td>

                <td>
                    <span class="status-pill ${
                        product.available
                            ? "status-available"
                            : "status-unavailable"
                    }">
                        ${product.available ? "Available" : "Unavailable"}
                    </span>
                </td>

                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn"
                            data-action="edit"
                            data-id="${product.id}">
                            Edit
                        </button>

                        <button class="action-btn delete-btn"
                            data-action="delete"
                            data-id="${product.id}">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join("");
}

// Image preview
function showImagePreview(files) {
    imagePreview.innerHTML = "";

    Array.from(files).forEach(file => {
        if (!file.type.startsWith("image/")) return;

        const imageURL = URL.createObjectURL(file);

        const image = document.createElement("img");
        image.src = imageURL;
        image.alt = file.name;
        image.className = "preview-image";

        imagePreview.appendChild(image);
    });
}

cakeImages.addEventListener("change", () => {
    showImagePreview(cakeImages.files);
});

// Show existing images when editing
function showExistingImages(images) {
    imagePreview.innerHTML = "";

    images.forEach(imagePath => {
        const imageURL = "/" + imagePath.replace(/^\/+/, "");

        const image = document.createElement("img");
        image.src = imageURL;
        image.alt = "Existing cake image";
        image.className = "preview-image";

        imagePreview.appendChild(image);
    });
}

function resetForm() {
    productForm.reset();

    document.getElementById("productId").value = "";
    document.getElementById("cakeAvailable").checked = true;

    document.getElementById("formTitle").textContent = "Add New Product";
    document.getElementById("saveBtn").textContent = "Save Product";

    imagePreview.innerHTML = "";
    cakeImages.value = "";
}

function openAddForm() {
    resetForm();

    productForm.hidden = false;
    document.getElementById("cakeName").focus();

    productForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function editProduct(id) {
    const product = products.find(item => item.id === id);

    if (!product) return;

    document.getElementById("productId").value = product.id;
    document.getElementById("cakeName").value = product.name;
    document.getElementById("cakePrice").value = product.price;
    document.getElementById("cakeCategory").value = product.category;
    document.getElementById("cakeFlavour").value = product.flavour;
    document.getElementById("cakeDescription").value = product.description;
    document.getElementById("cakeAvailable").checked = product.available;

    cakeImages.value = "";

    showExistingImages(product.images);

    document.getElementById("formTitle").textContent = "Edit Product";
    document.getElementById("saveBtn").textContent = "Update Product";

    productForm.hidden = false;

    productForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// Add or update product through API
productForm.addEventListener("submit", async event => {
    event.preventDefault();

    const idValue = document.getElementById("productId").value;
    const name = document.getElementById("cakeName").value.trim();
    const price = Number(document.getElementById("cakePrice").value);
    const category = document.getElementById("cakeCategory").value;
    const flavour = document.getElementById("cakeFlavour").value;
    const description = document.getElementById("cakeDescription").value.trim();
    const available = document.getElementById("cakeAvailable").checked;

    if (!name || !category || !flavour || !Number.isFinite(price) || price <= 0) {
        showMessage("Please enter valid product details.", true);
        return;
    }

    const selectedImages = Array.from(cakeImages.files);

    if (!idValue && selectedImages.length === 0) {
        showMessage("Please select at least one cake image.", true);
        return;
    }

    const formData = new FormData();

    formData.append("name", name);
    formData.append("price", String(price));
    formData.append("category", category);
    formData.append("flavour", flavour);
    formData.append("description", description);
    formData.append("available", String(available));

    selectedImages.forEach(file => {
        formData.append("images", file);
    });

    const saveButton = document.getElementById("saveBtn");
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        const url = idValue
            ? `${ADMIN_API_URL}/${idValue}`
            : ADMIN_API_URL;

        const response = await fetch(url, {
            method: idValue ? "PUT" : "POST",
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Could not save product.");
        }

        await loadProducts();

        productForm.hidden = true;
        resetForm();

        showMessage(
            idValue
                ? "Product updated successfully!"
                : "Product added successfully!"
        );

    } catch (error) {
        console.error("Product saving error:", error);
        showMessage(error.message || "Could not save product.", true);

    } finally {
        saveButton.disabled = false;

        document.getElementById("saveBtn").textContent =
            document.getElementById("productId").value
                ? "Update Product"
                : "Save Product";
    }
});

// Delete product through API
async function deleteProduct(id) {
    const product = products.find(item => item.id === id);

    if (!product) return;

    if (!confirm(`Delete "${product.name}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`${ADMIN_API_URL}/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Could not delete product.");
        }

        await loadProducts();

        showMessage("Product deleted successfully!");

    } catch (error) {
        console.error("Product deletion error:", error);
        showMessage(error.message || "Could not delete product.", true);
    }
}

// Form buttons
document.getElementById("showFormBtn").addEventListener("click", openAddForm);

document.getElementById("cancelBtn").addEventListener("click", () => {
    productForm.hidden = true;
    resetForm();
    showMessage("");
});

// Search and category filter
searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);

// Edit and delete buttons
productTableBody.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = Number(button.dataset.id);

    if (button.dataset.action === "edit") {
        editProduct(id);
    } else if (button.dataset.action === "delete") {
        deleteProduct(id);
    }
});

// Mobile sidebar
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => {
        const isOpen = sidebar.classList.toggle("open");
        menuBtn.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", event => {
        if (
            window.innerWidth <= 900 &&
            sidebar.classList.contains("open") &&
            !sidebar.contains(event.target) &&
            !menuBtn.contains(event.target)
        ) {
            sidebar.classList.remove("open");
            menuBtn.setAttribute("aria-expanded", "false");
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
            sidebar.classList.remove("open");
            menuBtn.setAttribute("aria-expanded", "false");
        }
    });
}

// Load database products when page opens
loadProducts();
