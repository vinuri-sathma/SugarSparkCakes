
const API_URL = "/api/admin/orders";

const allowedStatuses = ["Pending", "Completed"];

const ordersTableBody = document.getElementById("ordersTableBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const statusMessage = document.getElementById("statusMessage");
const dataNotice = document.getElementById("dataNotice");
const refreshButton = document.getElementById("refreshButton");

let orders = [];


// Escape HTML to prevent unsafe content from being inserted
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


// Format prices
function formatPrice(amount) {
    return "LKR " + Number(amount || 0).toLocaleString("en-LK", {
        maximumFractionDigits: 2
    });
}


// Format dates
function formatDate(dateValue) {
    if (!dateValue) return "Not provided";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Invalid date";
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


// Get status CSS class
function getStatusClass(status) {
    return status === "Completed"
        ? "status-completed"
        : "status-pending";
}


// Show messages
function showMessage(message) {
    statusMessage.textContent = message;
}


// Update order summary cards
function updateSummary() {
    document.getElementById("totalOrders").textContent = orders.length;

    document.getElementById("pendingOrders").textContent =
        orders.filter(order => order.status === "Pending").length;

    document.getElementById("completedOrders").textContent =
        orders.filter(order => order.status === "Completed").length;
}


// Display orders in the table
function renderOrders() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;

    const filteredOrders = orders.filter(order => {

        const matchesSearch = [
            order.id,
            order.customer,
            order.email,
            order.cake
        ].some(value =>
            String(value || "").toLowerCase().includes(searchTerm)
        );

        const matchesStatus =
            !selectedStatus || order.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    updateSummary();

    if (filteredOrders.length === 0) {
        ordersTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    No orders found.
                </td>
            </tr>
        `;
        return;
    }

    ordersTableBody.innerHTML = filteredOrders.map(order => {

        const options = allowedStatuses.map(status => `
            <option value="${status}"
                ${status === order.status ? "selected" : ""}>
                ${status}
            </option>
        `).join("");

        return `
            <tr>
                <td class="order-id">
                    #${escapeHTML(order.id)}
                </td>

                <td>
                    <span class="customer-name">
                        ${escapeHTML(order.customer)}
                    </span>

                    <span class="customer-email">
                        ${escapeHTML(order.email)}
                    </span>
                </td>

                <td>${escapeHTML(order.cake)}</td>

                <td>${formatDate(order.date)}</td>

                <td class="amount">
                    ${formatPrice(order.amount)}
                </td>

                <td>
                    <span class="status-pill ${getStatusClass(order.status)}">
                        ${escapeHTML(order.status)}
                    </span>
                </td>

                <td>
                    <select
                        class="status-select"
                        data-order-id="${escapeHTML(order.id)}"
                        aria-label="Update status for order ${escapeHTML(order.id)}">

                        ${options}

                    </select>
                </td>
            </tr>
        `;
    }).join("");
}


// Load real orders from MySQL database
async function loadOrders() {
    refreshButton.disabled = true;
    refreshButton.textContent = "Loading...";

    showMessage("");

    dataNotice.textContent = "Loading orders from database...";

    ordersTableBody.innerHTML = `
        <tr>
            <td colspan="7" class="empty-state">
                Loading orders...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to load orders.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Invalid orders response.");
        }

        // Convert backend response into frontend format
        orders = data.map(order => {

            const cakeNames = Array.isArray(order.items)
                ? order.items.map(item => {
                    return `${item.product_name} (x${item.quantity})`;
                }).join(", ")
                : "Cake order";

            return {
                id: order.order_id,
                customer: order.full_name,
                email: order.email,
                cake: cakeNames || "Cake order",
                date: order.order_date,
                amount: order.total,
                status: order.order_status || "Pending"
            };
        });

        dataNotice.textContent =
            "Order information is loaded from the MySQL database.";

        renderOrders();

        showMessage("Orders loaded successfully.");

    } catch (error) {

        console.error("Error loading orders:", error);

        orders = [];
        renderOrders();

        dataNotice.textContent =
            "Unable to load orders from the database.";

        showMessage(
            "Could not load orders. Please check the server connection."
        );

    } finally {

        refreshButton.disabled = false;
        refreshButton.textContent = "↻ Refresh Orders";
    }
}


// Update order status in the database
async function updateOrderStatus(orderId, newStatus) {

    if (!allowedStatuses.includes(newStatus)) {
        showMessage("Please select a valid order status.");
        await loadOrders();
        return;
    }

    const order = orders.find(item =>
        String(item.id) === String(orderId)
    );

    if (!order) {
        showMessage("Order could not be found.");
        return;
    }

    const previousStatus = order.status;

    if (previousStatus === newStatus) return;

    try {

        const response = await fetch(
            `${API_URL}/${encodeURIComponent(orderId)}/status`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    orderStatus: newStatus
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Status update failed.");
        }

        // Update frontend after successful database update
        order.status = result.orderStatus;

        renderOrders();

        showMessage(
            `Order #${orderId} status updated to ${result.orderStatus}.`
        );

    } catch (error) {

        console.error("Error updating order status:", error);

        showMessage(
            error.message || "Could not update order status."
        );

        // Restore the actual status from the database
        await loadOrders();
    }
}


// Search orders
searchInput.addEventListener("input", renderOrders);


// Filter orders by status
statusFilter.addEventListener("change", renderOrders);


// Update order status when dropdown changes
ordersTableBody.addEventListener("change", event => {

    const select = event.target.closest(".status-select");

    if (!select) return;

    updateOrderStatus(
        select.dataset.orderId,
        select.value
    );
});


// Refresh orders
refreshButton.addEventListener("click", loadOrders);


// Mobile sidebar
const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");
const sidebarOverlay = document.getElementById("sidebarOverlay");


function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("visible");

    menuToggle.setAttribute("aria-expanded", "false");
}


menuToggle.addEventListener("click", () => {

    const isOpen = sidebar.classList.toggle("open");

    sidebarOverlay.classList.toggle("visible", isOpen);

    menuToggle.setAttribute("aria-expanded", String(isOpen));
});


sidebarOverlay.addEventListener("click", closeSidebar);


window.addEventListener("resize", () => {

    if (window.innerWidth > 900) {
        closeSidebar();
    }
});


// Load orders when page opens
loadOrders();
