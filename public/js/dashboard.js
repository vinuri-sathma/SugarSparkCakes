
/* Sugar Spark Cakes - Customer Dashboard JavaScript */

document.addEventListener("DOMContentLoaded", function () {

    const searchInput = document.getElementById("cake-search");
    const cakeGrid = document.getElementById("all-cakes");
    const noResults = document.getElementById("no-results");
    const cartCount = document.getElementById("cart-count");

    const slides = document.querySelectorAll(".hero-slide");
    const sliderDots = document.querySelectorAll(".slider-dot");

    const CART_KEY = "sugarSparkCart";

    let cakeCards = [];
    let addCartButtons = [];


    /* =====================================
       LOAD CAKES FROM DATABASE
    ===================================== */

    async function loadCakes() {

        if (!cakeGrid) return;

        try {

            const response = await fetch("/api/products");

            if (!response.ok) {
                throw new Error("Unable to load products");
            }

            const products = await response.json();

            // Add productId to existing cart items
            updateExistingCartProductIds(products);

            cakeGrid.innerHTML = "";

            if (products.length === 0) {
                cakeGrid.innerHTML = "<p>No cakes available.</p>";
                return;
            }

            products.forEach(function (product) {

                const card = document.createElement("article");
                card.className = "cake-card";

                card.dataset.name = product.product_name;
                card.dataset.category = product.category || "";

                const image = document.createElement("img");
                image.src = product.image
                    ? product.image
                    : "https://placehold.co/500x350?text=Cake";
                image.alt = product.product_name;
                image.loading = "lazy";

                const imageLink = document.createElement("a");
                imageLink.className = "cake-image-link";
                imageLink.href = "cake-details.html?id=" + encodeURIComponent(product.product_id);
                imageLink.setAttribute("aria-label", "View " + product.product_name + " details");
                imageLink.appendChild(image);

                const name = document.createElement("h3");
                name.textContent = product.product_name;

                const price = document.createElement("p");
                price.className = "cake-price";
                price.textContent = "Rs. " + Number(product.price).toLocaleString("en-LK", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });

                const actions = document.createElement("div");
                actions.className = "card-actions";

                const viewButton = document.createElement("a");
                viewButton.className = "view-button";
                viewButton.href = "cake-details.html?id=" + encodeURIComponent(product.product_id);
                viewButton.textContent = "View";

                const addButton = document.createElement("button");
                addButton.type = "button";
                addButton.className = "add-cart-button";
                addButton.dataset.product = product.product_name;
                addButton.dataset.price = product.price;
                addButton.dataset.productId = product.product_id;
                addButton.textContent = "Add to Cart";

                actions.appendChild(viewButton);
                actions.appendChild(addButton);

                card.appendChild(imageLink);
                card.appendChild(name);

                if (product.description) {
                    const description = document.createElement("p");
                    description.className = "cake-description";
                    description.textContent = product.description;
                    card.appendChild(description);
                }

                card.appendChild(price);
                card.appendChild(actions);

                cakeGrid.appendChild(card);

            });

            cakeCards = cakeGrid.querySelectorAll(".cake-card");
            addCartButtons = cakeGrid.querySelectorAll(".add-cart-button");

            attachCartEvents();
            filterCakes();

            console.log("Cakes loaded successfully from database.");

        } catch (error) {

            console.error("Error loading cakes:", error);

            cakeGrid.innerHTML =
                "<p>Unable to load cakes. Please try again later.</p>";

        }

    }


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


    // Add productId to previously saved cart items
    function updateExistingCartProductIds(products) {

        const cart = getCart();
        let cartUpdated = false;

        cart.forEach(function (item) {

            if (Number(item.productId) > 0) return;

            const matchingProduct = products.find(function (product) {

                return product.product_name === item.name &&
                    Number(product.price) === Number(item.price);

            });

            if (matchingProduct) {

                item.productId = Number(matchingProduct.product_id);
                cartUpdated = true;

            }

        });

        if (cartUpdated) {
            saveCart(cart);
            console.log("Existing cart items updated with productId.");
        }

    }


    function updateCartCount() {

        const cart = getCart();

        const totalItems = cart.reduce(function (total, item) {
            return total + Math.max(0, Number(item.quantity) || 0);
        }, 0);

        if (cartCount) {

            cartCount.textContent = totalItems;

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

    function attachCartEvents() {

        addCartButtons.forEach(function (button) {

            button.addEventListener("click", function () {

                const card = button.closest(".cake-card");

                const productId = Number(button.dataset.productId);

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

                    const itemProductId = Number(item.productId);

                    const sameProduct = itemProductId > 0
                        ? itemProductId === productId
                        : item.name === name &&
                          Number(item.price) === price;

                    return sameProduct && item.size === size;

                });

                if (existingItem) {

                    existingItem.productId = productId;

                    existingItem.quantity =
                        (Number(existingItem.quantity) || 1) + 1;

                } else {

                    cart.push({
                        productId: productId,
                        name: name,
                        price: price,
                        size: size,
                        quantity: 1,
                        image: image
                    });

                }

                if (!saveCart(cart)) return;

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

    }


    /* Update count if cart changes in another tab */

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

        if (!slides.length) return;

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

        if (slides.length < 2) return;

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

    updateCartCount();
    loadCakes();

    console.log("Dashboard JavaScript loaded successfully.");

});
