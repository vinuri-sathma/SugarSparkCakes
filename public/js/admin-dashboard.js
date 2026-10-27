
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

    // Demo data for dashboard preview
    // Replace with MongoDB data when the backend is connected.
    const demoProducts = [
        { id: "P001", name: "Chocolate Celebration Cake", price: 6500 },
        { id: "P002", name: "Pink Birthday Cake", price: 5500 },
        { id: "P003", name: "Vanilla Blossom Cake", price: 4800 },
        { id: "P004", name: "Strawberry Cream Cake", price: 5200 },
        { id: "P005", name: "Wedding Special Cake", price: 15000 }
    ];

    const demoCustomers = [
        { id: "C001", name: "Customer One" },
        { id: "C002", name: "Customer Two" },
        { id: "C003", name: "Customer Three" }
    ];

    const demoOrders = [
        {
            id: "ORD-1001",
            customer: "Customer One",
            cake: "Chocolate Celebration Cake",
            amount: 6500,
            status: "Pending"
        },
        {
            id: "ORD-1002",
            customer: "Customer Two",
            cake: "Pink Birthday Cake",
            amount: 5500,
            status: "Processing"
        },
        {
            id: "ORD-1003",
            customer: "Customer Three",
            cake: "Vanilla Blossom Cake",
            amount: 4800,
            status: "Completed"
        }
    ];

    // Update summary cards
    document.getElementById("totalProducts").textContent =
        demoProducts.length;

    document.getElementById("totalOrders").textContent =
        demoOrders.length;

    document.getElementById("pendingOrders").textContent =
        demoOrders.filter(order => order.status === "Pending").length;

    document.getElementById("totalCustomers").textContent =
        demoCustomers.length;

    // Format currency in Sri Lankan Rupees
    function formatCurrency(amount) {
        return "LKR " + Number(amount).toLocaleString("en-LK");
    }

    // Render the recent orders table safely
    const ordersBody = document.getElementById("recentOrdersBody");

    function renderOrders(orders) {
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

        orders.forEach(order => {
            const row = document.createElement("tr");

            const orderCell = document.createElement("td");
            orderCell.className = "order-id";
            orderCell.textContent = order.id;

            const customerCell = document.createElement("td");
            customerCell.textContent = order.customer;

            const cakeCell = document.createElement("td");
            cakeCell.textContent = order.cake;

            const amountCell = document.createElement("td");
            amountCell.className = "amount";
            amountCell.textContent = formatCurrency(order.amount);

            const statusCell = document.createElement("td");
            const statusBadge = document.createElement("span");

            statusBadge.className = "status";

            const statusClass = {
                Pending: "status-pending",
                Processing: "status-processing",
                Completed: "status-completed",
                Cancelled: "status-cancelled"
            };

            statusBadge.classList.add(
                statusClass[order.status] || "status-pending"
            );

            statusBadge.textContent = order.status;
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

    renderOrders(demoOrders);

    // Mobile sidebar navigation
    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menuToggle");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    function openSidebar() {
        sidebar.classList.add("open");
        sidebarOverlay.classList.add("visible");
        menuToggle.setAttribute("aria-expanded", "true");
    }

    function closeSidebar() {
        sidebar.classList.remove("open");
        sidebarOverlay.classList.remove("visible");
        menuToggle.setAttribute("aria-expanded", "false");
    }

    menuToggle.addEventListener("click", () => {
        if (sidebar.classList.contains("open")) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    sidebarOverlay.addEventListener("click", closeSidebar);

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeSidebar();
        }
    });

    // Close the mobile sidebar after choosing a navigation link
    sidebar.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", closeSidebar);
    });

    // Logout placeholder
    document.getElementById("logoutButton").addEventListener("click", () => {
        alert(
            "Secure logout will be enabled when admin authentication is connected."
        );
    });

});
