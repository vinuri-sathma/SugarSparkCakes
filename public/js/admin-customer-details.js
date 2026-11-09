
document.addEventListener("DOMContentLoaded", () => {

    // Customer data loaded from the database
    let customers = [];

    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    const tableBody = document.getElementById("customersTableBody");
    const statusMessage = document.getElementById("statusMessage");
    const refreshButton = document.getElementById("refreshButton");

    const totalCustomers = document.getElementById("totalCustomers");
    const activeCustomers = document.getElementById("activeCustomers");
    const newCustomers = document.getElementById("newCustomers");
    const inactiveCustomers = document.getElementById("inactiveCustomers");

    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menuToggle");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    const customerModal = document.getElementById("customerModal");
    const modalBackdrop = document.getElementById("modalBackdrop");
    const closeModal = document.getElementById("closeModal");
    const doneModal = document.getElementById("doneModal");

    // Format database date
    function formatDate(dateString) {
        if (!dateString) {
            return "N/A";
        }

        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return "N/A";
        }

        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    // Generate customer initials
    function getInitials(name) {
        return name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0])
            .join("")
            .toUpperCase();
    }

    // Generate status CSS class
    function getStatusClass(status) {
        return `status-pill status-${status.toLowerCase().replace(/\s+/g, "-")}`;
    }

    // Load customers from MySQL database
    async function loadCustomers() {
        refreshButton.disabled = true;
        statusMessage.textContent = "Loading customer records...";

        try {
            const response = await fetch("/api/admin/customers");

            if (!response.ok) {
                throw new Error("Failed to load customer records.");
            }

            const data = await response.json();

            customers = data.map(customer => ({
                id: String(customer.customer_id),
                name: customer.full_name,
                email: customer.email,
                phone: customer.phone,
                registeredDate: customer.created_at,
                status: customer.status
            }));

            updateSummary();
            renderCustomers();

        } catch (error) {
            console.error("Error loading customers:", error);

            customers = [];

            updateSummary();

            tableBody.replaceChildren();

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 6;
            cell.className = "empty-state";
            cell.textContent =
                "Unable to load customer records. Please try again.";

            row.appendChild(cell);
            tableBody.appendChild(row);

            statusMessage.textContent = "Failed to load customer records.";

        } finally {
            refreshButton.disabled = false;
        }
    }

    // Update summary cards using automatic database status
    function updateSummary() {
        totalCustomers.textContent = customers.length;

        activeCustomers.textContent = customers.filter(
            customer => customer.status === "Active"
        ).length;

        newCustomers.textContent = customers.filter(
            customer => customer.status === "New Customer"
        ).length;

        inactiveCustomers.textContent = customers.filter(
            customer => customer.status === "Inactive"
        ).length;
    }

    // Search and status filtering
    function getFilteredCustomers() {
        const query = searchInput.value.trim().toLowerCase();
        const selectedStatus = statusFilter.value;

        return customers.filter(customer => {
            const matchesSearch = [
                customer.id,
                customer.name,
                customer.email,
                customer.phone
            ].some(value =>
                String(value).toLowerCase().includes(query)
            );

            const matchesStatus =
                selectedStatus === "all" ||
                customer.status === selectedStatus;

            return matchesSearch && matchesStatus;
        });
    }

    // Display customers in the table
    function renderCustomers() {
        const filteredCustomers = getFilteredCustomers();

        tableBody.replaceChildren();

        if (filteredCustomers.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 6;
            cell.className = "empty-state";
            cell.textContent =
                "No customers found. Try another search or filter.";

            row.appendChild(cell);
            tableBody.appendChild(row);

            statusMessage.textContent = "No matching customer records.";
            return;
        }

        filteredCustomers.forEach(customer => {
            const row = document.createElement("tr");

            // Customer ID
            const idCell = document.createElement("td");
            idCell.className = "customer-id";
            idCell.textContent = customer.id;

            // Customer name and email
            const customerCell = document.createElement("td");
            const customerInfo = document.createElement("div");
            customerInfo.className = "customer-cell";

            const avatar = document.createElement("span");
            avatar.className = "customer-avatar";
            avatar.textContent = getInitials(customer.name);

            const nameInfo = document.createElement("div");

            const name = document.createElement("span");
            name.className = "customer-name";
            name.textContent = customer.name;

            const email = document.createElement("span");
            email.className = "customer-email";
            email.textContent = customer.email;

            nameInfo.append(name, email);
            customerInfo.append(avatar, nameInfo);
            customerCell.appendChild(customerInfo);

            // Phone
            const phoneCell = document.createElement("td");
            phoneCell.textContent = customer.phone;

            // Registration date
            const dateCell = document.createElement("td");
            dateCell.textContent = formatDate(customer.registeredDate);

            // Status
            const statusCell = document.createElement("td");
            const statusPill = document.createElement("span");

            statusPill.className = getStatusClass(customer.status);
            statusPill.textContent = customer.status;

            statusCell.appendChild(statusPill);

            // View details button
            const actionCell = document.createElement("td");
            const viewButton = document.createElement("button");

            viewButton.type = "button";
            viewButton.className = "view-button";
            viewButton.textContent = "View Details";

            viewButton.setAttribute(
                "aria-label",
                `View details for ${customer.name}`
            );

            viewButton.addEventListener("click", () => {
                showCustomerDetails(customer.id);
            });

            actionCell.appendChild(viewButton);

            row.append(
                idCell,
                customerCell,
                phoneCell,
                dateCell,
                statusCell,
                actionCell
            );

            tableBody.appendChild(row);
        });

        statusMessage.textContent =
            `Showing ${filteredCustomers.length} of ${customers.length} customers.`;
    }

    // Show customer details modal
    function showCustomerDetails(customerId) {
        const customer = customers.find(
            item => item.id === customerId
        );

        if (!customer) {
            return;
        }

        document.getElementById("modalAvatar").textContent =
            getInitials(customer.name);

        document.getElementById("modalCustomerName").textContent =
            customer.name;

        const modalStatus =
            document.getElementById("modalCustomerStatus");

        modalStatus.textContent = customer.status;
        modalStatus.className = getStatusClass(customer.status);

        document.getElementById("modalCustomerId").textContent =
            customer.id;

        document.getElementById("modalCustomerEmail").textContent =
            customer.email;

        document.getElementById("modalCustomerPhone").textContent =
            customer.phone;

        document.getElementById("modalCustomerDate").textContent =
            formatDate(customer.registeredDate);

        document.getElementById("modalCustomerStatusText").textContent =
            customer.status;

        customerModal.classList.add("open");
        customerModal.setAttribute("aria-hidden", "false");

        document.body.style.overflow = "hidden";
        closeModal.focus();
    }

    // Close customer details modal
    function hideCustomerDetails() {
        customerModal.classList.remove("open");
        customerModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    // Mobile sidebar
    function closeSidebar() {
        sidebar.classList.remove("open");
        sidebarOverlay.classList.remove("visible");
        menuToggle.setAttribute("aria-expanded", "false");
    }

    function openSidebar() {
        sidebar.classList.add("open");
        sidebarOverlay.classList.add("visible");
        menuToggle.setAttribute("aria-expanded", "true");
    }

    // Search and filter events
    searchInput.addEventListener("input", renderCustomers);
    statusFilter.addEventListener("change", renderCustomers);

    // Refresh customer records from database
    refreshButton.addEventListener("click", () => {
        searchInput.value = "";
        statusFilter.value = "all";
        loadCustomers();
    });

    // Sidebar events
    menuToggle.addEventListener("click", () => {
        if (sidebar.classList.contains("open")) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    sidebarOverlay.addEventListener("click", closeSidebar);

    // Modal events
    closeModal.addEventListener("click", hideCustomerDetails);
    doneModal.addEventListener("click", hideCustomerDetails);
    modalBackdrop.addEventListener("click", hideCustomerDetails);

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            hideCustomerDetails();
            closeSidebar();
        }
    });

    // Initial database loading
    loadCustomers();

});
