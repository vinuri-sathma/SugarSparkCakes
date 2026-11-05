
document.addEventListener("DOMContentLoaded", () => {
    const CART_KEY = "sugarSparkCart";
    const LAST_ORDER_KEY = "sugarSparkLastOrder";
    const CUSTOMER_KEY = "customer";

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
    // ---------- Auto-fill customer details ----------

function fillCustomerDetails() {
    try {
        const customer = JSON.parse(
            sessionStorage.getItem("customer")
        );

        if (!customer) {
            return;
        }

        const nameInput = checkoutForm.querySelector(
            '[name="customerName"]'
        );

        const phoneInput = checkoutForm.querySelector(
            '[name="customerPhone"]'
        );

        const emailInput = checkoutForm.querySelector(
            '[name="customerEmail"]'
        );

        if (nameInput) {
            nameInput.value = customer.fullName || "";
        }

        if (phoneInput) {
            phoneInput.value = customer.phone || "";
        }

        if (emailInput) {
            emailInput.value = customer.email || "";
        }

    } catch (error) {
        console.error("Unable to load customer details:", error);
    }
}

// Fill customer details when checkout page loads
fillCustomerDetails();

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


    // ---------- Place order through backend ----------

    checkoutForm.addEventListener("submit", async event => {
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

        // Get logged-in customer details
        let customer;

        try {
            customer = JSON.parse(
                sessionStorage.getItem(CUSTOMER_KEY)
            );
        } catch (error) {
            customer = null;
        }

        if (
            !customer ||
            !Number.isInteger(Number(customer.customerId)) ||
            Number(customer.customerId) <= 0
        ) {
            showMessage(
                "Please log in before placing your order."
            );
            return;
        }

        const formData = new FormData(checkoutForm);

        const customerDetails = {
            name: String(formData.get("customerName") || "").trim(),
            phone: String(formData.get("customerPhone") || "").trim(),
            email: String(formData.get("customerEmail") || "").trim(),
            address: String(formData.get("deliveryAddress") || "").trim(),
            deliveryDate: String(formData.get("deliveryDate") || ""),
            deliveryNote: String(formData.get("deliveryNote") || "").trim()
        };

        // Include productId when sending cart items
        const orderItemsCopy = cart.map(item => ({
            productId: Number(item.productId),
            name: String(item.name || "Cake"),
            price: getPrice(item),
            size: String(item.size || ""),
            quantity: getQuantity(item),
            image: String(item.image || "")
        }));

        // Check product IDs before sending the order
        const invalidProduct = orderItemsCopy.some(item => {
            return (
                !Number.isInteger(item.productId) ||
                item.productId <= 0
            );
        });

        if (invalidProduct) {
            showMessage(
                "Some cart items have missing product information. Please return to the dashboard and add those cakes again."
            );
            return;
        }

        // Prepare order data for backend
        const orderData = {
            customerId: Number(customer.customerId),
            deliveryDate: customerDetails.deliveryDate,
            deliveryAddress: customerDetails.address,
            deliveryNote: customerDetails.deliveryNote,
            paymentMethod: selectedPayment.value,
            items: orderItemsCopy.map(item => ({
                productId: item.productId,
                size: item.size,
                quantity: item.quantity
            }))
        };

        // Prevent multiple submissions
        placeOrderButton.disabled = true;
        placeOrderButton.textContent = "Placing Order...";

        try {

            // Send order to Express backend
            const response = await fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Unable to place your order."
                );
            }

            // Use totals calculated by the backend
            const order = {
                orderId: result.orderId,
                orderNumber: "SSC-" + result.orderId,
                orderDate: new Date().toLocaleString(),
                customer: customerDetails,
                paymentMethod: selectedPayment.value,
                items: orderItemsCopy,
                subtotal: Number(result.subtotal),
                deliveryFee: Number(result.deliveryFee),
                total: Number(result.total),
                status: "Pending"
            };

            // Save the successfully placed order in this browser
            try {
                localStorage.setItem(
                    LAST_ORDER_KEY,
                    JSON.stringify(order)
                );
            } catch (error) {
                console.error("Unable to save order copy:", error);
            }

            // Generate bill after successful backend response
            renderGeneratedBill(order);

            // Clear cart only after successful order placement
            localStorage.setItem(CART_KEY, JSON.stringify([]));

            cart = [];
            updateCartBadge();

            orderPlaced = true;
            checkoutForm.hidden = true;
            generatedBill.hidden = false;

            generatedBill.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        } catch (error) {

            console.error("Order placement error:", error);

            showMessage(
                error.message || "Something went wrong. Please try again."
            );

            placeOrderButton.disabled = false;
            placeOrderButton.innerHTML = 'Place Order <span>→</span>';

        }

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


    // ---------- Print bill ----------

    printButton.addEventListener("click", () => {
        if (orderPlaced) {
            window.print();
        }
    });


    // Initial render
    renderOrderSummary();

});
