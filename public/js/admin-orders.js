
const API_URL = "/api/admin/orders";

const demoOrders = [
    {
        id: "ORD-1001",
        customer: "Customer One",
        email: "customer1@example.com",
        cake: "Chocolate Celebration Cake",
        date: "2026-10-25",
        amount: 6500,
        status: "Pending"
    },
    {
        id: "ORD-1002",
        customer: "Customer Two",
        email: "customer2@example.com",
        cake: "Pink Birthday Cake",
        date: "2026-10-24",
        amount: 5500,
        status: "Processing"
    },
    {
        id: "ORD-1003",
        customer: "Customer Three",
        email: "customer3@example.com",
        cake: "Wedding Elegance Cake",
        date: "2026-10-23",
        amount: 15000,
        status: "Completed"
    }
];

const ordersTableBody = document.getElementById("ordersTableBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const statusMessage = document.getElementById("statusMessage");
const dataNotice = document.getElementById("dataNotice");
const refreshButton = document.getElementById("refreshButton");

let orders = [];
let usingDemoData = true;

const allowedStatuses = [
    "Pending",
    "Processing",
    "Completed",
    "Cancelled"
];

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function formatPrice(amount) {
    return "LKR " + Number(amount || 0).toLocaleString("en-LK", {
        maximumFractionDigits: 2
    });
}

function formatDate(dateValue) {
    if (!dateValue) return "Not provided";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return escapeHTML(dateValue);
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function getStatusClass(status) {
    const classes = {
        Pending: "status-pending",
        Processing: "status-processing",
        Completed: "status-completed",
        Cancelled: "status-cancelled"
    };

    return classes[status] || "status-pending";
}

function showMessage(message) {
    statusMessage.textContent = message;
}

function updateSummary() {
    document.getElementById("totalOrders").textContent = orders.length;

    document.getElementById("pendingOrders").textContent =
        orders.filter(order => order.status === "Pending").length;

    document.getElementById("processingOrders").textContent =
        orders.filter(order => order.status === "Processing").length;

    document.getElementById("completedOrders").textContent =
        orders.filter(order => order.status === "Completed").length;
}

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
            </tr>`;
        return;
    }

    ordersTableBody.innerHTML = filteredOrders.map(order => {
        const safeStatus = allowedStatuses.includes(order.status)
            ? order.status
            : "Pending";

        const options = allowedStatuses.map(status => `
            <option value="${status}"
                ${status === safeStatus ? "selected" : ""}>
                ${status}
            </option>
        `).join("");

        return `
            <tr>
                <td class="order-id">${escapeHTML(order.id)}</td>

                <td>
                    <span class="customer-name">
                        ${escapeHTML(order.customer || "Unknown customer")}
                    </span>
                    <span class="customer-email">
                        ${escapeHTML(order.email || "No email provided")}
                    </span>
                </td>

                <td>${escapeHTML(order.cake || "Cake order")}</td>

                <td>${formatDate(order.date)}</td>

                <td class="amount">${formatPrice(order.amount)}</td>

                <td>
                    <span class="status-pill ${getStatusClass(safeStatus)}">
                        ${escapeHTML(safeStatus)}
                    </span>
                </td>

                <td>
                    <select class="status-select"
                        data-order-id="${escapeHTML(order.id)}"
                        aria-label="Update status for ${escapeHTML(order.id)}">
                        ${options}
                    </select>
                </td>
            </tr>
        `;
    }).join("");
}

/*
 Expected future API:
 GET /api/admin/orders

 Expected response:
 [
   {
     "id": "ORD-1001",
     "customer": "Customer One",
     "email": "customer@example.com",
     "cake": "Chocolate Cake",
     "date": "2026-10-25",
     "amount": 6500,
     "status": "Pending"
   }
 ]

 The backend will later map MongoDB documents
 to this response structure.
*/
async function loadOrders() {
    refreshButton.disabled = true;
    refreshButton.textContent = "Loading...";

    showMessage("");

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Orders API is not available yet.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Invalid orders response.");
        }

        orders = data;
        usingDemoData = false;

        dataNotice.textContent =
            "Orders loaded from the server. Database persistence depends on the connected backend.";

        renderOrders();
        showMessage("Orders refreshed successfully.");

    } catch (error) {
        console.info("Using preview order data:", error.message);

        orders = demoOrders.map(order => ({ ...order }));
        usingDemoData = true;

        dataNotice.textContent =
            "Preview mode: these are sample orders, not real customer orders. MongoDB integration is not connected yet.";

        renderOrders();
        showMessage("Showing sample orders until the orders API is available.");

    } finally {
        refreshButton.disabled = false;
        refreshButton.textContent = "↻ Refresh Orders";
    }
}

async function updateOrderStatus(orderId, newStatus) {
    if (!allowedStatuses.includes(newStatus)) {
        showMessage("Please select a valid order status.");
        renderOrders();
        return;
    }

    const order = orders.find(item => String(item.id) === String(orderId));

    if (!order) {
        showMessage("Order could not be found.");
        return;
    }

    const previousStatus = order.status;

    if (previousStatus === newStatus) return;

    if (usingDemoData) {
        order.status = newStatus;
        renderOrders();

        showMessage(
            "Preview status updated. This change is not saved to MongoDB."
        );
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/${encodeURIComponent(orderId)}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status: newStatus })
            }
        );

        if (!response.ok) {
            throw new Error("The server could not update this order.");
        }

        const updatedOrder = await response.json();

        order.status = updatedOrder.status || newStatus;

        renderOrders();
        showMessage("Order status updated successfully.");

    } catch (error) {
        order.status = previousStatus;
        renderOrders();

        showMessage(
            "Status update failed. Check the backend API connection."
        );

        console.error("Could not update order status:", error);
    }
}

/* Search and filtering */
searchInput.addEventListener("input", renderOrders);
statusFilter.addEventListener("change", renderOrders);

/* Status update */
ordersTableBody.addEventListener("change", event => {
    const select = event.target.closest(".status-select");

    if (!select) return;

    updateOrderStatus(select.dataset.orderId, select.value);
});

/* Refresh orders */
refreshButton.addEventListener("click", loadOrders);

/* Mobile sidebar */
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

/* Start page */
loadOrders();
