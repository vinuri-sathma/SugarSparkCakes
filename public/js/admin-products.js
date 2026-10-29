
const STORAGE_KEY = "sugarSparkAdminProducts";

const defaultProducts = [
    {
        id: 1,
        name: "Chocolate Delight",
        category: "Chocolate Cakes",
        flavour: "Chocolate",
        price: 4500,
        image: "",
        description: "Rich chocolate cake for special occasions.",
        available: true
    },
    {
        id: 2,
        name: "Birthday Bliss",
        category: "Birthday Cakes",
        flavour: "Vanilla",
        price: 5000,
        image: "",
        description: "A beautiful cake for birthday celebrations.",
        available: true
    },
    {
        id: 3,
        name: "Wedding Elegance",
        category: "Wedding Cakes",
        flavour: "Ribbon",
        price: 15000,
        image: "",
        description: "An elegant cake for your special day.",
        available: true
    },
    {
        id: 4,
        name: "Red Velvet Love",
        category: "Anniversary Cakes",
        flavour: "Red Velvet",
        price: 6500,
        image: "",
        description: "Soft red velvet cake with creamy frosting.",
        available: false
    }
];

let products = loadProducts();

const productForm = document.getElementById("productForm");
const productTableBody = document.getElementById("productTableBody");
const statusMessage = document.getElementById("statusMessage");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

function loadProducts() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved === null ? [...defaultProducts] : JSON.parse(saved);
    } catch (error) {
        console.error("Could not load saved products:", error);
        return [...defaultProducts];
    }
}

function saveProducts() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
        return true;
    } catch (error) {
        console.error("Could not save products:", error);
        showMessage("Could not save changes in this browser.");
        return false;
    }
}

function showMessage(message) {
    statusMessage.textContent = message;
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

function renderProducts() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;

    const filteredProducts = products.filter(product => {
        const matchesSearch = [
            product.name,
            product.category,
            product.flavour
        ].some(value => String(value).toLowerCase().includes(searchTerm));

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
        const image = product.image
            ? `<img class="product-image" src="${escapeHTML(product.image)}"
                    alt="${escapeHTML(product.name)}"
                    onerror="this.hidden=true;this.nextElementSibling.hidden=false">
               <span class="product-placeholder" hidden>🎂</span>`
            : `<span class="product-placeholder">🎂</span>`;

        return `
            <tr>
                <td>
                    <div class="product-cell">
                        ${image}
                        <div>
                            <div class="product-name">${escapeHTML(product.name)}</div>
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
                        product.available ? "status-available" : "status-unavailable"
                    }">
                        ${product.available ? "Available" : "Unavailable"}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn"
                            data-action="edit" data-id="${product.id}">Edit</button>
                        <button class="action-btn delete-btn"
                            data-action="delete" data-id="${product.id}">Delete</button>
                    </div>
                </td>
            </tr>`;
    }).join("");
}

function resetForm() {
    productForm.reset();
    document.getElementById("productId").value = "";
    document.getElementById("cakeAvailable").checked = true;
    document.getElementById("formTitle").textContent = "Add New Product";
    document.getElementById("saveBtn").textContent = "Save Product";
}

function openAddForm() {
    resetForm();
    productForm.hidden = false;
    document.getElementById("cakeName").focus();
}

function editProduct(id) {
    const product = products.find(item => item.id === id);
    if (!product) return;

    document.getElementById("productId").value = product.id;
    document.getElementById("cakeName").value = product.name;
    document.getElementById("cakePrice").value = product.price;
    document.getElementById("cakeCategory").value = product.category;
    document.getElementById("cakeFlavour").value = product.flavour;
    document.getElementById("cakeImage").value = product.image || "";
    document.getElementById("cakeDescription").value = product.description || "";
    document.getElementById("cakeAvailable").checked = product.available;

    document.getElementById("formTitle").textContent = "Edit Product";
    document.getElementById("saveBtn").textContent = "Update Product";

    productForm.hidden = false;
    productForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteProduct(id) {
    const product = products.find(item => item.id === id);
    if (!product) return;

    if (!confirm(`Delete "${product.name}"? This cannot be undone in this demo.`)) {
        return;
    }

    const previousProducts = products;
    products = products.filter(item => item.id !== id);

    if (!saveProducts()) {
        products = previousProducts;
        return;
    }

    renderProducts();
    showMessage("Product deleted successfully.");
}

document.getElementById("showFormBtn").addEventListener("click", openAddForm);

document.getElementById("cancelBtn").addEventListener("click", () => {
    productForm.hidden = true;
    resetForm();
    showMessage("");
});

searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);

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

productForm.addEventListener("submit", event => {
    event.preventDefault();

    const idValue = document.getElementById("productId").value;
    const name = document.getElementById("cakeName").value.trim();
    const price = Number(document.getElementById("cakePrice").value);
    const category = document.getElementById("cakeCategory").value;
    const flavour = document.getElementById("cakeFlavour").value;
    const image = document.getElementById("cakeImage").value.trim();
    const description = document.getElementById("cakeDescription").value.trim();
    const available = document.getElementById("cakeAvailable").checked;

    if (!name || !category || !flavour || !Number.isFinite(price) || price <= 0) {
        showMessage("Please enter valid product details.");
        return;
    }

    const product = {
        id: idValue ? Number(idValue) : Date.now(),
        name,
        price,
        category,
        flavour,
        image,
        description,
        available
    };

    const previousProducts = products;

    if (idValue) {
        products = products.map(item =>
            item.id === product.id ? product : item
        );
    } else {
        products = [product, ...products];
    }

    if (!saveProducts()) {
        products = previousProducts;
        return;
    }

    renderProducts();
    productForm.hidden = true;
    resetForm();
    showMessage(idValue ? "Product updated successfully." : "Product added successfully.");
});


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

renderProducts();

