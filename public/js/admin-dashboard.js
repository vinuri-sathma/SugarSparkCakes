
document.addEventListener("DOMContentLoaded", () => {

    // Display today's date
    const currentDate = document.getElementById("currentDate");

    if (currentDate) {
        currentDate.textContent = new Date().toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }

    // Format currency in Sri Lankan Rupees
    function formatCurrency(amount) {
        return "LKR " + Number(amount || 0).toLocaleString("en-LK");
    }

    // Update dashboard summary cards using database statistics
    async function loadDashboardStats() {
        try {
            const response = await fetch("/api/admin/dashboard-stats");

            if (!response.ok) {
                throw new Error("Failed to load dashboard statistics.");
            }

            const stats = await response.json();

            document.getElementById("totalProducts").textContent =
                stats.totalProducts;

            document.getElementById("totalOrders").textContent =
                stats.totalOrders;

            document.getElementById("pendingOrders").textContent =
                stats.pendingOrders;

            document.getElementById("totalCustomers").textContent =
                stats.totalCustomers;

            document.getElementById("pendingCustomizations").textContent =
                stats.pendingCustomizations;

        } catch (error) {
            console.error("Dashboard statistics error:", error);

            document.getElementById("totalProducts").textContent = "-";
            document.getElementById("totalOrders").textContent = "-";
            document.getElementById("pendingOrders").textContent = "-";
            document.getElementById("totalCustomers").textContent = "-";
            document.getElementById("pendingCustomizations").textContent = "-";
        }
    }

    // Render recent orders using database information
    const ordersBody = document.getElementById("recentOrdersBody");

    function renderOrders(orders) {
        if (!ordersBody) return;

        ordersBody.replaceChildren();

        if (orders.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 5;
            cell.className = "empty-state";
            cell.textContent = "No orders available yet.";

            row.appendChild(cell);
            ordersBody.appendChild(row);
            return;
        }

        // Display the five most recent orders
        orders.slice(0, 5).forEach(order => {
            const row = document.createElement("tr");

            const orderCell = document.createElement("td");
            orderCell.className = "order-id";
            orderCell.textContent = "#" + order.order_id;

            const customerCell = document.createElement("td");
            customerCell.textContent = order.full_name || "Unknown Customer";

            const cakeCell = document.createElement("td");

            const cakeNames = Array.isArray(order.items)
                ? order.items.map(item =>
                    `${item.product_name} (x${item.quantity})`
                ).join(", ")
                : "Cake Order";

            cakeCell.textContent = cakeNames || "Cake Order";

            const amountCell = document.createElement("td");
            amountCell.className = "amount";
            amountCell.textContent = formatCurrency(order.total);

            const statusCell = document.createElement("td");
            const statusBadge = document.createElement("span");

            statusBadge.className = "status";

            const statusClass = {
                Pending: "status-pending",
                Completed: "status-completed"
            };

            statusBadge.classList.add(
                statusClass[order.order_status] || "status-pending"
            );

            statusBadge.textContent = order.order_status || "Pending";

            statusCell.appendChild(statusBadge);

            [
                orderCell,
                customerCell,
                cakeCell,
                amountCell,
                statusCell
            ].forEach(cell => row.appendChild(cell));

            ordersBody.appendChild(row);
        });
    }

    // Load recent orders from MySQL database
    async function loadRecentOrders() {
        try {
            const response = await fetch("/api/admin/orders");

            if (!response.ok) {
                throw new Error("Failed to load recent orders.");
            }

            const orders = await response.json();

            renderOrders(orders);

        } catch (error) {
            console.error("Recent orders error:", error);

            if (ordersBody) {
                ordersBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="empty-state">
                            Unable to load orders. Please try again.
                        </td>
                    </tr>
                `;
            }
        }
    }

    // Load dashboard information
    loadDashboardStats();
    loadRecentOrders();

    // Mobile sidebar navigation
    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menuToggle");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    function openSidebar() {
        if (!sidebar || !sidebarOverlay || !menuToggle) return;

        sidebar.classList.add("open");
        sidebarOverlay.classList.add("visible");
        menuToggle.setAttribute("aria-expanded", "true");
    }

    function closeSidebar() {
        if (!sidebar || !sidebarOverlay || !menuToggle) return;

        sidebar.classList.remove("open");
        sidebarOverlay.classList.remove("visible");
        menuToggle.setAttribute("aria-expanded", "false");
    }

    if (menuToggle) {
        menuToggle.addEventListener("click", () => {
            if (sidebar && sidebar.classList.contains("open")) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", closeSidebar);
    }

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeSidebar();
        }
    });

    // Close the mobile sidebar after choosing a navigation link
    if (sidebar) {
        sidebar.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("click", closeSidebar);
        });
    }

    // Logout placeholder
    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            alert(
                "Secure logout will be enabled when admin authentication is connected."
            );
        });
    }

});
