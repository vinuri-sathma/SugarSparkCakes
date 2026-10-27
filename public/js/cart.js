
document.addEventListener("DOMContentLoaded", function () {
    const itemsContainer = document.getElementById("cart-items");
    const table = document.querySelector(".cart-table");
    const emptyCart = document.getElementById("empty-cart");
    const cartFooter = document.getElementById("cart-footer");
    const cartCount = document.getElementById("cart-count");
    const grandTotal = document.getElementById("grand-total");
    const summaryTotal = document.getElementById("summary-total");
    const checkoutButton = document.getElementById("checkout-button");

    const CART_KEY = "sugarSparkCart";

    // Must match the customer session key set after successful login.
    const CUSTOMER_KEY = "sugarSparkCustomer";
    const RETURN_KEY = "sugarSparkReturnTo";

    function getCart() {
        try {
            const cart = JSON.parse(localStorage.getItem(CART_KEY));
            return Array.isArray(cart) ? cart : [];
        } catch (error) {
            return [];
        }
    }

    function saveCart(cart) {
        try {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
        } catch (error) {
            console.error("Unable to save the cart:", error);
        }
    }

    function money(amount) {
        return "LKR " + Number(amount).toLocaleString("en-LK", {
            maximumFractionDigits: 2
        });
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, function (character) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[character];
        });
    }

    // Checks whether a customer session exists.
    function isCustomerLoggedIn() {
        try {
            const customer = JSON.parse(
                localStorage.getItem(CUSTOMER_KEY)
            );

            return Boolean(
                customer &&
                typeof customer === "object" &&
                !Array.isArray(customer) &&
                customer.loggedIn === true
            );
        } catch (error) {
            return false;
        }
    }

    // Prevent checkout access when the customer is not logged in.
    if (checkoutButton) {
        checkoutButton.addEventListener("click", function (event) {
            event.preventDefault();

            const cart = getCart();

            if (cart.length === 0) {
                alert("Your cart is empty. Please add a cake before checkout.");
                return;
            }

            if (!isCustomerLoggedIn()) {
                try {
                    sessionStorage.setItem(RETURN_KEY, "checkout.html");
                } catch (error) {
                    console.error("Unable to save the redirect:", error);
                }

                window.location.href = "login.html?redirect=checkout.html";
                return;
            }

            window.location.href = "checkout.html";
        });
    }

    function renderCart() {
        const cart = getCart();

        itemsContainer.innerHTML = "";

        let total = 0;
        let quantityTotal = 0;

        cart.forEach(function (item, index) {
            const price = Math.max(0, Number(item.price) || 0);
            const quantity = Math.max(
                1,
                Math.floor(Number(item.quantity) || 1)
            );

            const itemTotal = price * quantity;
            const name = escapeHTML(item.name || "Cake");

            total += itemTotal;
            quantityTotal += quantity;

            const image = item.image
                ? `<img class="product-image"
                        src="${escapeHTML(item.image)}"
                        alt="${name}">`
                : `<div class="product-placeholder"
                        aria-label="Cake image unavailable">♡</div>`;

            const row = document.createElement("tr");

            row.innerHTML = `
                <td class="product-cell">
                    <div class="product-info">
                        ${image}
                        <div>
                            <span class="product-name">${name}</span>
                            <span class="product-caption">
                                Sugar Spark Cakes
                            </span>
                        </div>
                    </div>
                </td>

                <td>${escapeHTML(item.size || "1kg")}</td>

                <td class="price-cell">${money(price)}</td>

                <td>
                    <div class="quantity-control">
                        <button type="button"
                            data-action="decrease"
                            data-index="${index}"
                            aria-label="Decrease quantity">
                            −
                        </button>

                        <span class="quantity-number">${quantity}</span>

                        <button type="button"
                            data-action="increase"
                            data-index="${index}"
                            aria-label="Increase quantity">
                            +
                        </button>
                    </div>
                </td>

                <td class="item-total">${money(itemTotal)}</td>

                <td>
                    <button type="button"
                        class="remove-button"
                        data-action="remove"
                        data-index="${index}"
                        aria-label="Delete ${name}"
                        title="Delete item">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M3 6h18"></path>
                            <path d="M8 6V4h8v2"></path>
                            <path d="m19 6-1 14H6L5 6"></path>
                            <path d="M10 10v6"></path>
                            <path d="M14 10v6"></path>
                        </svg>
                    </button>
                </td>
            `;

            itemsContainer.appendChild(row);
        });

        grandTotal.textContent = money(total);
        summaryTotal.textContent = money(total);

        cartCount.textContent = quantityTotal;
        cartCount.hidden = quantityTotal === 0;

        const hasItems = cart.length > 0;

        emptyCart.hidden = hasItems;
        cartFooter.hidden = !hasItems;
        table.hidden = !hasItems;
    }

    // Increase, decrease or remove cart items.
    itemsContainer.addEventListener("click", function (event) {
        const button = event.target.closest("button[data-action]");

        if (!button) return;

        const index = Number(button.dataset.index);
        const cart = getCart();

        if (!Number.isInteger(index) || !cart[index]) return;

        const action = button.dataset.action;
        const currentQuantity = Math.max(
            1,
            Math.floor(Number(cart[index].quantity) || 1)
        );

        if (action === "increase") {
            cart[index].quantity = currentQuantity + 1;
        } else if (action === "decrease") {
            if (currentQuantity > 1) {
                cart[index].quantity = currentQuantity - 1;
            } else {
                cart.splice(index, 1);
            }
        } else if (action === "remove") {
            cart.splice(index, 1);
        } else {
            return;
        }

        saveCart(cart);
        renderCart();
    });

    // Update cart when another browser tab changes it.
    window.addEventListener("storage", function (event) {
        if (event.key === CART_KEY || event.key === null) {
            renderCart();
        }
    });

    renderCart();
});
