
/* Sugar Spark Cakes - Customer Dashboard JavaScript */

document.addEventListener("DOMContentLoaded", function () {

    const searchInput = document.getElementById("cake-search");
    const cakeCards = document.querySelectorAll(".cake-card");
    const noResults = document.getElementById("no-results");
    const cartCount = document.getElementById("cart-count");
    const addCartButtons = document.querySelectorAll(".add-cart-button");

    const slides = document.querySelectorAll(".hero-slide");
    const sliderDots = document.querySelectorAll(".slider-dot");

    const CART_KEY = "sugarSparkCart";

    /* =====================================
       CAKE SEARCH
    ===================================== */

    function filterCakes() {
        const searchText = searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

        let visibleCakes = 0;

        cakeCards.forEach(function (card) {
            const cakeName = (card.dataset.name || "").toLowerCase();

            if (cakeName.includes(searchText)) {
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


    /* =====================================
       CART FUNCTIONS
    ===================================== */

    function getCart() {
        try {
            const savedCart = JSON.parse(
                localStorage.getItem(CART_KEY)
            );

            return Array.isArray(savedCart) ? savedCart : [];

        } catch (error) {
            return [];
        }
    }

    function saveCart(cart) {
        try {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
            return true;
        } catch (error) {
            alert("Unable to update the cart. Please try again.");
            return false;
        }
    }

    function updateCartCount() {
        const cart = getCart();

        const totalItems = cart.reduce(function (total, item) {
            return total + Math.max(0, Number(item.quantity) || 0);
        }, 0);

        if (cartCount) {
            cartCount.textContent = totalItems;

            // Hide the badge when the cart is empty.
            cartCount.style.display =
                totalItems > 0 ? "inline-flex" : "none";

            cartCount.setAttribute(
                "aria-label",
                totalItems + (totalItems === 1 ? " item" : " items")
            );
        }
    }


    /* =====================================
       ADD CAKES TO CART
    ===================================== */

    addCartButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const card = button.closest(".cake-card");

            const name =
                button.dataset.product ||
                (card && card.dataset.name) ||
                "Cake";

            const price = Number(button.dataset.price) || 0;

            const imageElement = card
                ? card.querySelector("img")
                : null;

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

            if (!saveCart(cart)) {
                return;
            }

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


    /* Update count if the cart changes in another tab */

    window.addEventListener("storage", function (event) {
        if (event.key === CART_KEY) {
            updateCartCount();
        }
    });


    /* =====================================
       AUTOMATIC HERO IMAGE SLIDER
    ===================================== */

    let currentSlide = 0;
    let sliderInterval = null;

    function showSlide(index) {
        if (!slides.length) {
            return;
        }

        currentSlide = (index + slides.length) % slides.length;

        slides.forEach(function (slide, slideIndex) {
            const isActive = slideIndex === currentSlide;

            slide.classList.toggle("active", isActive);
            slide.setAttribute("aria-hidden", String(!isActive));
        });

        sliderDots.forEach(function (dot, dotIndex) {
            const isActive = dotIndex === currentSlide;

            dot.classList.toggle("active", isActive);
            dot.setAttribute("aria-pressed", String(isActive));
        });
    }

    function startSlider() {
        if (slides.length < 2) {
            return;
        }

        stopSlider();

        sliderInterval = window.setInterval(function () {
            showSlide(currentSlide + 1);
        }, 4000);
    }

    function stopSlider() {
        if (sliderInterval !== null) {
            window.clearInterval(sliderInterval);
            sliderInterval = null;
        }
    }

    sliderDots.forEach(function (dot, index) {
        dot.addEventListener("click", function () {
            showSlide(index);
            startSlider();
        });
    });

    const heroSlider = document.getElementById("hero-slider");

    if (heroSlider) {
        heroSlider.addEventListener("mouseenter", stopSlider);
        heroSlider.addEventListener("mouseleave", startSlider);

        heroSlider.addEventListener("focusin", stopSlider);
        heroSlider.addEventListener("focusout", startSlider);
    }

    if (slides.length > 0) {
        showSlide(0);
        startSlider();
    }


    /* =====================================
       INITIALISE DASHBOARD
    ===================================== */

    filterCakes();
    updateCartCount();

    console.log("Dashboard JavaScript loaded successfully.");

});
