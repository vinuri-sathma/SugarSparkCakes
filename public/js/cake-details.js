
/* Sugar Spark Cakes - Cake Details JavaScript */

document.addEventListener("DOMContentLoaded", function () {
    const CART_KEY = "sugarSparkCart";

    /*
      Temporary size pricing:
      250g = 50% of the 1kg price
      500g = 70%
      750g = 85%
      1kg  = 100%
      2kg  = 180%

      Replace these estimates with the actual bakery prices later.
    */

    const sizes = [
        { label: "250g", multiplier: 0.50 },
        { label: "500g", multiplier: 0.70 },
        { label: "750g", multiplier: 0.85 },
        { label: "1kg", multiplier: 1.00 },
        { label: "2kg", multiplier: 1.80 }
    ];

    const cakes = {
        "chocolate-cake": {
            name: "Chocolate Cake",
            basePrice: 2390,
            description:
                "Rich chocolate cake with smooth chocolate frosting, perfect for birthdays and special occasions.",
            images: [
                "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85",
                "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=700&q=80",
                "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=700&q=80"
            ]
        },

        "vanilla-cake": {
            name: "Vanilla Cake",
            basePrice: 2500,
            description:
                "A soft vanilla celebration cake with a light, creamy finish for your special moments.",
            images: [
                "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=900&q=85",
                "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=700&q=80",
                "https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=700&q=80"
            ]
        },

        "black-forest-cake": {
            name: "Black Forest Cake",
            basePrice: 2600,
            description:
                "A delicious Black Forest style cake, perfect for birthdays and family celebrations.",
            images: [
                "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85",
                "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=700&q=80",
                "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=700&q=80"
            ]
        },

        "ribbon-cake": {
            name: "Ribbon Cake",
            basePrice: 2250,
            description:
                "A classic ribbon cake for tea time, family gatherings and special occasions.",
            images: [
                "https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&w=900&q=85",
                "https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=700&q=80",
                "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=700&q=80"
            ]
        },

        "strawberry-cake": {
            name: "Strawberry Cake",
            basePrice: 2400,
            description:
                "A delightful cake for strawberry lovers and memorable celebrations.",
            images: [
                "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=85",
                "https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=700&q=80",
                "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=700&q=80"
            ]
        }
    };

    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");
    
let cake = cakes[productId];

if (!cake && productId) {
    try {
        const savedCake = JSON.parse(
            localStorage.getItem("selectedCakeDetails")
        );

        if (savedCake && savedCake.id === productId) {
            cake = {
                name: savedCake.name,
                basePrice: Number(savedCake.price) || 0,
                description:
                    savedCake.name +
                    " is a cake design for your special occasions.",
                images: [
                    savedCake.image,
                    savedCake.image,
                    savedCake.image
                ]
            };
        }
    } catch (error) {
        cake = undefined;
    }
}

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

    let selectedSize = sizes[3].label;
    let quantity = 1;
    let selectedImageIndex = 0;

    function formatPrice(price) {
        return "Rs. " + price.toLocaleString("en-LK");
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

    function getCart() {
        try {
            const cart = JSON.parse(localStorage.getItem(CART_KEY));
            return Array.isArray(cart) ? cart : [];
        } catch (error) {
            return [];
        }
    }

    function updateCartCount() {
        const total = getCart().reduce(function (sum, item) {
            return sum + Math.max(
                0,
                Math.floor(Number(item.quantity) || 0)
            );
        },  0);

        if (cartCount) {
        cartCount.textContent = total;
        cartCount.hidden = total === 0;
        }
    }

    function updatePrice() {
        const price = getPrice(selectedSize);

        priceElement.textContent = formatPrice(price);
        totalElement.textContent = formatPrice(price * quantity);
        quantityValue.textContent = quantity;

        sizeOptions.querySelectorAll(".size-button").forEach(function (button) {
            const isSelected = button.dataset.size === selectedSize;

            button.classList.toggle("active", isSelected);
            button.setAttribute("aria-pressed", String(isSelected));
        });
    }

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

    function buildSizeOptions() {
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

    function addToCart() {
        const cart = getCart();
        const price = getPrice(selectedSize);
        const image = cake.images[selectedImageIndex];

        const existingItem = cart.find(function (item) {
            return item.name === cake.name &&
                item.size === selectedSize &&
                Number(item.price) === price;
        });

        if (existingItem) {
            existingItem.quantity =
                (Number(existingItem.quantity) || 0) + quantity;
            existingItem.image = image;
        } else {
            cart.push({
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
            feedback.textContent =
                "Unable to save the cart. Please check your browser settings.";
        }
    }

    if (!cake) {
        nameElement.textContent = "Cake not found";
        priceElement.textContent = "";
        descriptionElement.textContent =
            "Please return to the shop and select a cake.";
        mainImage.hidden = true;
        sizeOptions.hidden = true;
        thumbnails.hidden = true;
        addButton.hidden = true;
        document.title = "Cake Not Found | Sugar Spark Cakes";
        return;
    }

    nameElement.textContent = cake.name;
    descriptionElement.textContent = cake.description;
    document.title = cake.name + " | Sugar Spark Cakes";

    buildGallery();
    buildSizeOptions();
    updatePrice();
    updateCartCount();

    document.getElementById("decrease-quantity")
        .addEventListener("click", function () {
            if (quantity > 1) {
                quantity--;
                updatePrice();
            }
        });

    document.getElementById("increase-quantity")
        .addEventListener("click", function () {
            if (quantity < 99) {
                quantity++;
                updatePrice();
            }
        });

    addButton.addEventListener("click", addToCart);

    window.addEventListener("storage", function (event) {
        if (event.key === CART_KEY || event.key === null) {
        updateCartCount();
        }
    });
});
