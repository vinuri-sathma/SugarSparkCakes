
document.addEventListener("DOMContentLoaded", function () {
    const itemsContainer = document.getElementById("cart-items");
    const table = document.querySelector(".cart-table");
    const emptyCart = document.getElementById("empty-cart");
    const cartFooter = document.getElementById("cart-footer");
    const cartCount = document.getElementById("header-cart-count");
    const grandTotal = document.getElementById("grand-total");
    const summaryTotal = document.getElementById("summary-total");
    const checkoutButton = document.getElementById("checkout-button");

    const CART_KEY = "sugarSparkCart";

    function getCart() {
        try {
            const cart = JSON.parse(localStorage.getItem(CART_KEY));
            return Array.isArray(cart) ? cart : [];
        } catch (error) {
            return [];
        }
    }

    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
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

    function renderCart() {
        const cart = getCart();
        itemsContainer.innerHTML = "";

        let total = 0;
        let quantityTotal = 0;

        cart.forEach(function (item, index) {
            const price = Math.max(0, Number(item.price) || 0);
            const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
            const itemTotal = price * quantity;
            const name = escapeHTML(item.name || "Cake");

            total += itemTotal;
            quantityTotal += quantity;

            const image = item.image
                ? `<img class="product-image"
                        src="${escapeHTML(item.image)}"
                        alt="${name}">`
                : `<div class="product-placeholder" aria-label="Cake image unavailable">♡</div>`;

            const row = document.createElement("tr");

            row.innerHTML = `
                <td class="product-cell">
                    <div class="product-info">
                        ${image}
                        <div>
                            <span class="product-name">${name}</span>
                            <span class="product-caption">Sugar Spark Cakes</span>
                        </div>
                    </div>
                </td>
                <td>${escapeHTML(item.size || "1kg")}</td>
                <td class="price-cell">${money(price)}</td>
                <td>
                    <div class="quantity-control">
                        <button type="button" data-action="decrease"
                            data-index="${index}" aria-label="Decrease quantity">−</button>
                        <span class="quantity-number">${quantity}</span>
                        <button type="button" data-action="increase"
                            data-index="${index}" aria-label="Increase quantity">+</button>
                    </div>
                </td>
                <td class="item-total">${money(itemTotal)}</td>
                <td>
                    <button type="button" class="remove-button"
                        data-action="remove" data-index="${index}"
                        aria-label="Delete ${name}" title="Delete item">
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

        const hasItems = cart.length > 0;
        emptyCart.hidden = hasItems;
        cartFooter.hidden = !hasItems;
        table.hidden = !hasItems;
    }

    itemsContainer.addEventListener("click", function (event) {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const index = Number(button.dataset.index);
        const cart = getCart();

        if (!Number.isInteger(index) || !cart[index]) return;

        if (button.dataset.action === "increase") {
            cart[index].quantity =
                Math.max(1, Number(cart[index].quantity) || 1) + 1;
        } else if (button.dataset.action === "decrease") {
            const quantity = Math.max(1, Number(cart[index].quantity) || 1);

            if (quantity > 1) {
                cart[index].quantity = quantity - 1;
            } else {
                cart.splice(index, 1);
            }
        } else if (button.dataset.action === "remove") {
            cart.splice(index, 1);
        }

        saveCart(cart);
        renderCart();
    });

    checkoutButton.addEventListener("click", function () {
        if (getCart().length === 0) {
            alert("Your cart is empty. Please select a cake first.");
            return;
        }

        alert("Checkout functionality will be implemented in the next development step.");
    });

    window.addEventListener("storage", function (event) {
        if (event.key === CART_KEY) {
            renderCart();
        }
    });

    renderCart();
});
