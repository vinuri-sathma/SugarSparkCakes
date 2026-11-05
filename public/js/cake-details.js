
/* Sugar Spark Cakes - Cake Details JavaScript */

document.addEventListener("DOMContentLoaded", async function () {
    const CART_KEY = "sugarSparkCart";

    // Temporary size pricing based on the 1kg database price.
    const sizes = [
        { label: "250g", multiplier: 0.50 },
        { label: "500g", multiplier: 0.70 },
        { label: "750g", multiplier: 0.85 },
        { label: "1kg", multiplier: 1.00 },
        { label: "2kg", multiplier: 1.80 }
    ];

    const params = new URLSearchParams(window.location.search);
    const productId = Number(params.get("id"));

    const nameElement = document.getElementById("product-name");
    const priceElement = document.getElementById("product-price");
    const descriptionElement =
        document.getElementById("product-description");
    const mainImage = document.getElementById("main-product-image");
    const thumbnails = document.getElementById("product-thumbnails");
    const sizeOptions = document.getElementById("size-options");
    const quantityValue = document.getElementById("quantity-value");
    const totalElement = document.getElementById("product-total");
    const cartCount = document.getElementById("cart-count");
    const feedback = document.getElementById("cart-feedback");
    const addButton = document.getElementById("detail-add-cart");

    const decreaseButton = document.getElementById("decrease-quantity");
    const increaseButton = document.getElementById("increase-quantity");

    let cake = null;
    let selectedSize = "1kg";
    let quantity = 1;
    let selectedImageIndex = 0;

    // ---------- Price formatting ----------

    function formatPrice(price) {
        return "Rs. " + Number(price).toLocaleString("en-LK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function getPrice(sizeLabel) {
        const size = sizes.find(function (item) {
            return item.label === sizeLabel;
        });

        if (!size || !cake) {
            return 0;
        }

        return Math.round((cake.basePrice * size.multiplier) / 10) * 10;
    }

    // ---------- Cart functions ----------

    function getCart() {
        try {
            const cart = JSON.parse(localStorage.getItem(CART_KEY));
            return Array.isArray(cart) ? cart : [];
        } catch (error) {
            console.error("Unable to read cart:", error);
            return [];
        }
    }

    function updateCartCount() {
        const total = getCart().reduce(function (sum, item) {
            return sum + Math.max(
                0,
                Math.floor(Number(item.quantity) || 0)
            );
        }, 0);

        if (cartCount) {
            cartCount.textContent = total;
            cartCount.hidden = total === 0;
        }
    }

    // ---------- Display selected size and price ----------

    function updatePrice() {
        const price = getPrice(selectedSize);

        priceElement.textContent = formatPrice(price);
        totalElement.textContent = formatPrice(price * quantity);
        quantityValue.textContent = quantity;

        sizeOptions.querySelectorAll(".size-button").forEach(
            function (button) {
                const isSelected =
                    button.dataset.size === selectedSize;

                button.classList.toggle("active", isSelected);
                button.setAttribute("aria-pressed", String(isSelected));
            }
        );
    }

    // ---------- Product image gallery ----------

    function showMainImage(index) {
        selectedImageIndex = index;

        mainImage.src = cake.images[index];
        mainImage.alt = cake.name + " - photo " + (index + 1);

        thumbnails.querySelectorAll(".thumbnail-button")
            .forEach(function (button, buttonIndex) {
                const active = buttonIndex === index;

                button.classList.toggle("active", active);
                button.setAttribute("aria-pressed", String(active));
            });
    }

    function buildGallery() {
        thumbnails.innerHTML = "";

        cake.images.forEach(function (image, index) {
            const button = document.createElement("button");

            button.type = "button";
            button.className = "thumbnail-button";
            button.setAttribute(
                "aria-label",
                "View " + cake.name + " photo " + (index + 1)
            );
            button.setAttribute("aria-pressed", "false");

            const img = document.createElement("img");
            img.src = image;
            img.alt = "";
            img.loading = "lazy";

            button.appendChild(img);

            button.addEventListener("click", function () {
                showMainImage(index);
            });

            thumbnails.appendChild(button);
        });

        showMainImage(0);
    }

    // ---------- Build size selection buttons ----------

    function buildSizeOptions() {
        sizeOptions.innerHTML = "";

        sizes.forEach(function (size) {
            const button = document.createElement("button");

            button.type = "button";
            button.className = "size-button";
            button.dataset.size = size.label;
            button.textContent = size.label;
            button.setAttribute("aria-pressed", "false");

            button.addEventListener("click", function () {
                selectedSize = size.label;
                feedback.textContent = "";
                updatePrice();
            });

            sizeOptions.appendChild(button);
        });
    }

    // ---------- Add cake to cart ----------

    function addToCart() {
        const cart = getCart();
        const price = getPrice(selectedSize);
        const image = cake.images[selectedImageIndex];

        const existingItem = cart.find(function (item) {
            return (
                Number(item.productId) === cake.productId &&
                item.size === selectedSize
            );
        });

        if (existingItem) {
            existingItem.quantity =
                (Number(existingItem.quantity) || 0) + quantity;

            existingItem.image = image;
            existingItem.price = price;

        } else {
            cart.push({
                productId: cake.productId,
                name: cake.name,
                price: price,
                size: selectedSize,
                quantity: quantity,
                image: image
            });
        }

        try {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));

            updateCartCount();

            feedback.textContent =
                cake.name + " (" + selectedSize + ") added to cart.";

        } catch (error) {
            console.error("Unable to save cart:", error);

            feedback.textContent =
                "Unable to save the cart. Please check your browser settings.";
        }
    }

    // ---------- Show product not found message ----------

    function showProductNotFound(message) {
        nameElement.textContent = "Cake not found";
        priceElement.textContent = "";
        descriptionElement.textContent = message;

        mainImage.hidden = true;
        sizeOptions.hidden = true;
        thumbnails.hidden = true;
        addButton.hidden = true;

        document.title = "Cake Not Found | Sugar Spark Cakes";
    }

    // ---------- Load product from MySQL database ----------

    async function loadProduct() {
        if (!Number.isInteger(productId) || productId <= 0) {
            showProductNotFound(
                "Please return to the shop and select a cake."
            );
            return;
        }

        try {
            const response = await fetch("/api/products");

            if (!response.ok) {
                throw new Error("Unable to load products from the server.");
            }

            const products = await response.json();

            const product = products.find(function (item) {
                return Number(item.product_id) === productId;
            });

            if (!product) {
                showProductNotFound(
                    "This cake could not be found. Please return to the shop."
                );
                return;
            }

            const image = product.image || "";

            cake = {
                productId: Number(product.product_id),
                name: product.product_name,
                basePrice: Number(product.price),
                description: product.description || "",
                images: image ? [image] : []
            };

            // Display product information
            nameElement.textContent = cake.name;

            descriptionElement.textContent =
                cake.description || "A delicious cake for your special occasions.";

            document.title = cake.name + " | Sugar Spark Cakes";

            if (cake.images.length > 0) {
                mainImage.hidden = false;
                thumbnails.hidden = false;
                buildGallery();
            } else {
                mainImage.hidden = true;
                thumbnails.hidden = true;
            }

            buildSizeOptions();
            updatePrice();
            updateCartCount();

        } catch (error) {
            console.error("Cake details loading error:", error);

            showProductNotFound(
                "Unable to load cake details. Please try again later."
            );
        }
    }

    // ---------- Quantity controls ----------

    decreaseButton.addEventListener("click", function () {
        if (quantity > 1) {
            quantity--;
            updatePrice();
        }
    });

    increaseButton.addEventListener("click", function () {
        if (quantity < 99) {
            quantity++;
            updatePrice();
        }
    });

    // ---------- Add to Cart button ----------

    addButton.addEventListener("click", function () {
        if (cake) {
            addToCart();
        }
    });

    // Update cart count if another tab changes the cart.
    window.addEventListener("storage", function (event) {
        if (event.key === CART_KEY || event.key === null) {
            updateCartCount();
        }
    });

    // Load product when page opens.
    await loadProduct();
});
