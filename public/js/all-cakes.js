
const imagePool = [
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=500&q=80"
];

const cakeGroups = [
    {
        category: "birthday",
        label: "Birthday Cakes",
        names: [
            "Classic Birthday Cake",
            "Pink Birthday Cake",
            "Rainbow Birthday Cake",
            "Chocolate Birthday Cake",
            "Unicorn Birthday Cake",
            "Birthday Flower Cake",
            "Birthday Drip Cake",
            "Birthday Sprinkle Cake",
            "Elegant Birthday Cake",
            "Birthday Heart Cake",
            "Birthday Number Cake",
            "Birthday Photo Cake"
        ]
    },
    {
        category: "chocolate",
        label: "Chocolate Cakes",
        names: [
            "Chocolate Fudge Cake",
            "Chocolate Truffle Cake",
            "Chocolate Drip Cake",
            "Chocolate Ganache Cake",
            "Chocolate Oreo Cake",
            "Chocolate Crunch Cake",
            "Chocolate Mousse Cake",
            "Double Chocolate Cake"
        ]
    },
    {
        category: "floral",
        label: "Floral Cakes",
        names: [
            "Pink Rose Cake",
            "White Floral Cake",
            "Buttercream Flower Cake",
            "Pastel Floral Cake",
            "Garden Flower Cake",
            "Elegant Rose Cake"
        ]
    },
    {
        category: "wedding",
        label: "Wedding & Anniversary",
        names: [
            "Classic Wedding Cake",
            "White Wedding Cake",
            "Romantic Anniversary Cake",
            "Red Velvet Anniversary Cake",
            "Elegant Tiered Cake",
            "Heart Anniversary Cake"
        ]
    },
    {
        category: "kids",
        label: "Cartoon & Kids Cakes",
        names: [
            "Cute Cartoon Cake",
            "Space Adventure Cake",
            "Dinosaur Kids Cake",
            "Princess Theme Cake",
            "Superhero Theme Cake",
            "Animal Friends Cake"
        ]
    },
    {
        category: "vanilla",
        label: "Ribbon & Vanilla Cakes",
        names: [
            "Classic Ribbon Cake",
            "Vanilla Buttercream Cake",
            "Vanilla Strawberry Cake",
            "Pink Ribbon Cake",
            "Vanilla Sprinkle Cake",
            "Classic Vanilla Celebration Cake"
        ]
    },
    {
        category: "special",
        label: "Special Occasion Cakes",
        names: [
            "Graduation Celebration Cake",
            "Thank You Cake",
            "Baby Shower Cake",
            "Engagement Celebration Cake",
            "Festive Celebration Cake",
            "Congratulations Cake"
        ]
    }
];

const cakes = [];
let cakeNumber = 0;

cakeGroups.forEach(function (group) {
    group.names.forEach(function (name) {
        cakeNumber++;

        cakes.push({
            id: name.toLowerCase()
                .replace(/&/g, "and")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, ""),
            name: name,
            category: group.category,
            categoryLabel: group.label,
            price: 2000 + (cakeNumber * 50),
            image: imagePool[(cakeNumber - 1) % imagePool.length]
        });
    });
});

const grid = document.getElementById("all-cakes-grid");
const searchInput = document.getElementById("cake-search");
const categoryFilter = document.getElementById("cake-filter");
const resultCount = document.getElementById("result-count");
const noResults = document.getElementById("no-results");

const CART_KEY = "sugarSparkCart";

function formatPrice(price) {
    return "Rs. " + Number(price).toLocaleString("en-LK");
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

function renderCakes() {
    const searchText = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;

    const filteredCakes = cakes.filter(function (cake) {
        const matchesSearch =
            cake.name.toLowerCase().includes(searchText);

        const matchesCategory =
            selectedCategory === "all" ||
            cake.category === selectedCategory;

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
        category.textContent = cake.categoryLabel;

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

        viewButton.addEventListener("click", function () {
            localStorage.setItem(
                "selectedCakeDetails",
                JSON.stringify(cake)
            );
        });

        const addButton = document.createElement("button");
        addButton.className = "add-button";
        addButton.type = "button";
        addButton.textContent = "Add to Cart";

        addButton.addEventListener("click", function () {
            const cart = getCart();

            const existingItem = cart.find(function (item) {
                return item.name === cake.name &&
                    item.size === "1kg" &&
                    Number(item.price) === cake.price;
            });

            if (existingItem) {
                existingItem.quantity =
                    (Number(existingItem.quantity) || 1) + 1;
            } else {
                cart.push({
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
        cakes.length + " cake designs";

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

renderCakes();
updateCartCount();
