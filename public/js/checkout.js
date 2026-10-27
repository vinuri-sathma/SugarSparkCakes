
document.addEventListener("DOMContentLoaded", () => {
    const CART_KEY = "sugarSparkCart";
    const LAST_ORDER_KEY = "sugarSparkLastOrder";

    // Set the actual delivery fee here when the business fee is confirmed.
    const DELIVERY_FEE = 0;

    const checkoutForm = document.getElementById("checkout-form");
    const orderItems = document.getElementById("order-items");
    const cartCount = document.getElementById("cart-count");
    const itemCount = document.getElementById("bill-item-count");
    const subtotalElement = document.getElementById("subtotal");
    const deliveryFeeElement = document.getElementById("delivery-fee");
    const totalElement = document.getElementById("total-amount");
    const placeOrderButton = document.getElementById("place-order-btn");
    const pageMessage = document.getElementById("page-message");
    const generatedBill = document.getElementById("generated-bill");
    const receiptContent = document.getElementById("receipt-content");
    const printButton = document.getElementById("print-bill-btn");

    let cart = loadCart();
    let currentSubtotal = 0;
    let orderPlaced = false;

    // ---------- Helpers ----------

    function loadCart() {
        try {
            const storedCart = JSON.parse(
                localStorage.getItem(CART_KEY) || "[]"
            );

            return Array.isArray(storedCart) ? storedCart : [];
        } catch (error) {
            console.error("Unable to read cart:", error);
            return [];
        }
    }

    function money(amount) {
        return "LKR " + Number(amount).toLocaleString("en-LK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function getPrice(item) {
        const price = Number(
            String(item.price ?? 0).replace(/[^\d.-]/g, "")
        );

        return Number.isFinite(price) && price >= 0 ? price : 0;
    }

    function getQuantity(item) {
        const quantity = Number(item.quantity ?? 1);

        return Number.isInteger(quantity) && quantity > 0
            ? quantity
            : 1;
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[character];
        });
    }

    function showMessage(message) {
        pageMessage.textContent = message;
        pageMessage.hidden = false;
        pageMessage.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }

    function hideMessage() {
        pageMessage.textContent = "";
        pageMessage.hidden = true;
    }

    
    function updateCartBadge() {
        const count = cart.reduce((total, item) => {
            return total + getQuantity(item);
        }, 0);

        cartCount.textContent = count;
    }


    // ---------- Render cart and bill ----------

    function renderOrderSummary() {
        updateCartBadge();

        const count = cart.reduce((total, item) => {
            return total + getQuantity(item);
        }, 0);

        itemCount.textContent = `${count} item${count === 1 ? "" : "s"}`;

        if (cart.length === 0) {
            orderItems.innerHTML = `
                <p class="empty-cart">
                    Your cart is empty. Please add cakes before checkout.
                </p>
            `;

            subtotalElement.textContent = money(0);
            deliveryFeeElement.textContent = money(0);
            totalElement.textContent = money(0);
            placeOrderButton.disabled = true;
            placeOrderButton.textContent = "Your Cart Is Empty";
            return;
        }

        placeOrderButton.disabled = false;
        placeOrderButton.innerHTML = 'Place Order <span>→</span>';

        currentSubtotal = cart.reduce((total, item) => {
            return total + getPrice(item) * getQuantity(item);
        }, 0);

        const total = currentSubtotal + DELIVERY_FEE;

        orderItems.innerHTML = cart.map(item => {
            const name = escapeHTML(item.name || "Cake");
            const size = item.size
                ? `<p>Size: ${escapeHTML(item.size)}</p>`
                : "";

            const quantity = getQuantity(item);
            const price = getPrice(item);
            const image = item.image
                ? `<img src="${escapeHTML(item.image)}"
                        alt="${name}"
                        onerror="this.style.display='none'">`
                : "🧁";

            return `
                <div class="order-item">
                    <div class="item-image">${image}</div>

                    <div class="item-info">
                        <h3>${name}</h3>
                        ${size}
                        <p>Qty: ${quantity} × ${money(price)}</p>
                    </div>

                    <div class="item-price">
                        ${money(price * quantity)}
                    </div>
                </div>
            `;
        }).join("");

        subtotalElement.textContent = money(currentSubtotal);
        deliveryFeeElement.textContent = money(DELIVERY_FEE);
        totalElement.textContent = money(total);
    }

    // ---------- Delivery date ----------

    const deliveryDateInput = document.getElementById("delivery-date");

    // Use the visitor's local date, not a UTC date.
    const today = new Date();
    const localToday = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    deliveryDateInput.min = localToday;

    // ---------- Place order and generate bill ----------

    checkoutForm.addEventListener("submit", event => {
        event.preventDefault();
        hideMessage();

        if (cart.length === 0) {
            showMessage("Your cart is empty. Please add a cake first.");
            return;
        }

        if (!checkoutForm.reportValidity()) {
            return;
        }

        const selectedPayment = checkoutForm.querySelector(
            'input[name="paymentMethod"]:checked'
        );

        if (!selectedPayment) {
            showMessage("Please select a payment method.");
            return;
        }

        const formData = new FormData(checkoutForm);

        const customer = {
            name: String(formData.get("customerName") || "").trim(),
            phone: String(formData.get("customerPhone") || "").trim(),
            email: String(formData.get("customerEmail") || "").trim(),
            address: String(formData.get("deliveryAddress") || "").trim(),
            deliveryDate: String(formData.get("deliveryDate") || ""),
            deliveryNote: String(formData.get("deliveryNote") || "").trim()
        };

        const orderItemsCopy = cart.map(item => ({
            name: String(item.name || "Cake"),
            price: getPrice(item),
            size: String(item.size || ""),
            quantity: getQuantity(item),
            image: String(item.image || "")
        }));

        const subtotal = orderItemsCopy.reduce((total, item) => {
            return total + item.price * item.quantity;
        }, 0);

        const order = {
            orderNumber: "SSC-" + Date.now().toString().slice(-8),
            orderDate: new Date().toLocaleString(),
            customer,
            paymentMethod: selectedPayment.value,
            items: orderItemsCopy,
            subtotal,
            deliveryFee: DELIVERY_FEE,
            total: subtotal + DELIVERY_FEE,
            status: "Placed (Demo)"
        };

        // Save a demo order in this browser.
        try {
            localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
        } catch (error) {
            console.error("Unable to save order:", error);
            showMessage(
                "The order could not be saved in this browser. Please check available storage and try again."
            );
            return;
        }

        renderGeneratedBill(order);

        // Clear the cart after placing the demo order.
        try {
            localStorage.setItem(CART_KEY, JSON.stringify([]));
        } catch (error) {
            console.error("Unable to clear cart:", error);
        }

        cart = [];
        updateCartBadge();

        orderPlaced = true;
        checkoutForm.hidden = true;
        generatedBill.hidden = false;

        generatedBill.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });

    // ---------- Generate printable receipt ----------

    function renderGeneratedBill(order) {
        const customer = order.customer;

        const rows = order.items.map(item => `
            <tr>
                <td>
                    ${escapeHTML(item.name)}
                    ${item.size
                        ? `<br><small>Size: ${escapeHTML(item.size)}</small>`
                        : ""}
                </td>
                <td>${item.quantity}</td>
                <td>${money(item.price)}</td>
                <td>${money(item.price * item.quantity)}</td>
            </tr>
        `).join("");

        receiptContent.innerHTML = `
            <div class="receipt-brand">
                🧁 Sugar Spark Cakes
            </div>

            <div class="receipt-meta">
                <p>
                    <strong>Order Number</strong>
                    ${escapeHTML(order.orderNumber)}
                </p>

                <p>
                    <strong>Order Date</strong>
                    ${escapeHTML(order.orderDate)}
                </p>

                <p>
                    <strong>Customer</strong>
                    ${escapeHTML(customer.name)}
                </p>

                <p>
                    <strong>Contact Number</strong>
                    ${escapeHTML(customer.phone)}
                </p>

                ${customer.email ? `
                    <p>
                        <strong>Email</strong>
                        ${escapeHTML(customer.email)}
                    </p>
                ` : ""}

                <p>
                    <strong>Delivery Date</strong>
                    ${escapeHTML(customer.deliveryDate)}
                </p>

                <p>
                    <strong>Payment Method</strong>
                    ${escapeHTML(order.paymentMethod)}
                </p>

                <p>
                    <strong>Delivery Address</strong>
                    ${escapeHTML(customer.address)}
                </p>

                ${customer.deliveryNote ? `
                    <p>
                        <strong>Additional Note</strong>
                        ${escapeHTML(customer.deliveryNote)}
                    </p>
                ` : ""}
            </div>

            <table class="receipt-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Amount</th>
                    </tr>
                </thead>

                <tbody>
                    ${rows}
                </tbody>
            </table>

            <div class="receipt-totals">
                <div class="bill-row">
                    <span>Subtotal</span>
                    <strong>${money(order.subtotal)}</strong>
                </div>

                <div class="bill-row">
                    <span>Delivery Fee</span>
                    <strong>${money(order.deliveryFee)}</strong>
                </div>

                <div class="bill-divider"></div>

                <div class="bill-row total-row">
                    <span>Total</span>
                    <strong>${money(order.total)}</strong>
                </div>
            </div>

            <p class="receipt-message">
                Thank you for choosing Sugar Spark Cakes! ♡<br>
                We hope to make your celebration extra special.
            </p>
        `;
    }

    printButton.addEventListener("click", () => {
        if (orderPlaced) {
            window.print();
        }
    });

    renderOrderSummary();
});
