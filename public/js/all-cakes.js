
const grid = document.getElementById("all-cakes-grid");
const searchInput = document.getElementById("cake-search");
const categoryFilter = document.getElementById("cake-filter");
const resultCount = document.getElementById("result-count");
const noResults = document.getElementById("no-results");

const CART_KEY = "sugarSparkCart";

let cakes = [];

function formatPrice(price) {
    return "Rs. " + Number(price).toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function getCart() {
    try {
        const cart = JSON.parse(localStorage.getItem(CART_KEY));
        return Array.isArray(cart) ? cart : [];
    } catch (error) {
        return [];
    }
}

function updateCartCount() {
    const cartCount = document.getElementById("cart-count");

    const total = getCart().reduce(function (sum, item) {
        return sum + Math.max(
            0,
            Math.floor(Number(item.quantity) || 0)
        );
    }, 0);

    cartCount.textContent = total;
    cartCount.hidden = total === 0;
}

// Load categories from database products
function loadCategories() {
    const categories = [];

    cakes.forEach(function (cake) {
        const exists = categories.some(function (category) {
            return Number(category.id) === Number(cake.category_id);
        });

        if (!exists && cake.category_id && cake.category) {
            categories.push({
                id: cake.category_id,
                name: cake.category
            });
        }
    });

    categoryFilter.innerHTML = '<option value="all">All Categories</option>';

    categories.forEach(function (category) {
        const option = document.createElement("option");
        option.value = String(category.id);
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });
}

// Load products from MySQL database through Express API
async function loadCakes() {
    try {
        resultCount.textContent = "Loading cakes...";

        const response = await fetch("/api/products");

        if (!response.ok) {
            throw new Error("Unable to load products.");
        }

        const products = await response.json();

        cakes = products.map(function (product) {
            return {
                id: Number(product.product_id),
                name: product.product_name,
                price: Number(product.price),
                image: product.image || "",
                category_id: product.category_id,
                category: product.category || "Other"
            };
        });

        loadCategories();
        renderCakes();

    } catch (error) {
        console.error("Error loading cakes:", error);

        grid.innerHTML = "";
        resultCount.textContent = "Unable to load cakes.";
        noResults.textContent =
            "Something went wrong while loading cakes. Please try again.";
        noResults.style.display = "block";
    }
}

function renderCakes() {
    const searchText = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;

    const filteredCakes = cakes.filter(function (cake) {
        const matchesSearch =
            cake.name.toLowerCase().includes(searchText);

        const matchesCategory =
            selectedCategory === "all" ||
            String(cake.category_id) === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    grid.innerHTML = "";

    filteredCakes.forEach(function (cake) {
        const card = document.createElement("article");
        card.className = "cake-card";

        const image = document.createElement("img");
        image.className = "cake-image";
        image.src = cake.image;
        image.alt = cake.name;
        image.loading = "lazy";

        image.onerror = function () {
            image.style.display = "none";
        };

        const info = document.createElement("div");
        info.className = "cake-info";

        const category = document.createElement("p");
        category.className = "category";
        category.textContent = cake.category;

        const name = document.createElement("h2");
        name.textContent = cake.name;

        const price = document.createElement("p");
        price.className = "price";
        price.textContent = formatPrice(cake.price);

        const actions = document.createElement("div");
        actions.className = "card-actions";

        const viewButton = document.createElement("a");
        viewButton.className = "view-button";
        viewButton.href =
            "cake-details.html?id=" + encodeURIComponent(cake.id);
        viewButton.textContent = "View";

        const addButton = document.createElement("button");
        addButton.className = "add-button";
        addButton.type = "button";
        addButton.textContent = "Add to Cart";

        addButton.addEventListener("click", function () {
            const cart = getCart();

            const existingItem = cart.find(function (item) {
                return Number(item.productId) === Number(cake.id) &&
                    item.size === "1kg";
            });

            if (existingItem) {
                existingItem.quantity =
                    (Number(existingItem.quantity) || 1) + 1;
            } else {
                cart.push({
                    productId: cake.id,
                    name: cake.name,
                    price: cake.price,
                    size: "1kg",
                    quantity: 1,
                    image: cake.image
                });
            }

            localStorage.setItem(CART_KEY, JSON.stringify(cart));
            updateCartCount();

            addButton.textContent = "Added ✓";
            addButton.disabled = true;

            window.setTimeout(function () {
                addButton.textContent = "Add to Cart";
                addButton.disabled = false;
            }, 1000);
        });

        actions.append(viewButton, addButton);
        info.append(category, name, price, actions);
        card.append(image, info);
        grid.appendChild(card);
    });

    resultCount.textContent =
        "Showing " + filteredCakes.length + " of " +
        cakes.length + " cakes";

    noResults.style.display =
        filteredCakes.length === 0 ? "block" : "none";
}

searchInput.addEventListener("input", renderCakes);
categoryFilter.addEventListener("change", renderCakes);

window.addEventListener("storage", function (event) {
    if (event.key === CART_KEY || event.key === null) {
        updateCartCount();
    }
});

// Initial loading
loadCakes();
updateCartCount();
