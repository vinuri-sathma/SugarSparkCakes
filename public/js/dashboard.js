
/* Sugar Spark Cakes - Customer Dashboard JavaScript */

document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("cake-search");
    const categoryFilter = document.getElementById("cake-filter");
    const cakeCards = document.querySelectorAll(".cake-card");
    const noResults = document.getElementById("no-results");
    const cartCount = document.getElementById("cart-count");
    const addCartButtons = document.querySelectorAll(".add-cart-button");

    const CART_KEY = "sugarSparkCart";

    function filterCakes() {
        const searchText = searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

        const selectedCategory = categoryFilter
            ? categoryFilter.value.toLowerCase()
            : "all";

        let visibleCakes = 0;

        cakeCards.forEach(function (card) {
            const cakeName = (card.dataset.name || "").toLowerCase();
            const cakeCategory = (card.dataset.category || "").toLowerCase();

            const matchesSearch = cakeName.includes(searchText);
            const matchesCategory =
                selectedCategory === "all" ||
                cakeCategory === selectedCategory;

            if (matchesSearch && matchesCategory) {
                card.style.display = "";
                visibleCakes++;
            } else {
                card.style.display = "none";
            }
        });

        if (noResults) {
            noResults.hidden = visibleCakes > 0;
        }
    }

    if (searchInput) {
        searchInput.addEventListener("input", filterCakes);
    }

    if (categoryFilter) {
        categoryFilter.addEventListener("change", filterCakes);
    }

    function getCart() {
        try {
            const savedCart = JSON.parse(localStorage.getItem(CART_KEY));
            return Array.isArray(savedCart) ? savedCart : [];
        } catch (error) {
            return [];
        }
    }

    function updateCartCount() {
        const cart = getCart();

        const totalItems = cart.reduce(function (total, item) {
            return total + (Number(item.quantity) || 0);
        }, 0);

        if (cartCount) {
            cartCount.textContent = totalItems;
        }
    }

    addCartButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const card = button.closest(".cake-card");

            const name =
                button.dataset.product ||
                (card && card.dataset.name) ||
                "Cake";

            const price = Number(button.dataset.price) || 0;

            const imageElement = card ? card.querySelector("img") : null;
            const image = imageElement
                ? imageElement.getAttribute("src")
                : "";

            const size =
                button.dataset.size ||
                (card && card.dataset.size) ||
                "1kg";

            const cart = getCart();

            const existingItem = cart.find(function (item) {
                return item.name === name &&
                    item.size === size &&
                    Number(item.price) === price;
            });

            if (existingItem) {
                existingItem.quantity =
                    (Number(existingItem.quantity) || 1) + 1;
            } else {
                cart.push({
                    name: name,
                    price: price,
                    size: size,
                    quantity: 1,
                    image: image
                });
            }

            localStorage.setItem(CART_KEY, JSON.stringify(cart));
            updateCartCount();

            const originalText = button.textContent;
            button.textContent = "Added ✓";
            button.disabled = true;

            window.setTimeout(function () {
                button.textContent = originalText;
                button.disabled = false;
            }, 1000);
        });
    });

    window.addEventListener("storage", function (event) {
        if (event.key === CART_KEY) {
            updateCartCount();
        }
    });

    filterCakes();
    updateCartCount();

    console.log("Dashboard JavaScript loaded successfully.");
});
