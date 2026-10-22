
document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("cake-search");
    const categoryFilter = document.getElementById("cake-filter");
    const cakeCards = document.querySelectorAll(".cake-card");
    const noResults = document.getElementById("no-results");
    const cartCount = document.getElementById("cart-count");
    const addCartButtons = document.querySelectorAll(".add-cart-button");

    let totalCartItems = 0;

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

    addCartButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            totalCartItems++;

            if (cartCount) {
                cartCount.textContent = totalCartItems;
            }

            const originalText = button.textContent;

            button.textContent = "Added ✓";
            button.disabled = true;

            window.setTimeout(function () {
                button.textContent = originalText;
                button.disabled = false;
            }, 1000);
        });
    });

    console.log("Dashboard JavaScript loaded successfully.");
});
