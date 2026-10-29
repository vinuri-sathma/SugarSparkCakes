
document.addEventListener("DOMContentLoaded", () => {
    const customers = [
        {
            id: "CUS001",
            name: "Amaya Perera",
            email: "amaya.perera@example.com",
            phone: "077 123 4567",
            registeredDate: "2026-10-05",
            status: "Active"
        },
        {
            id: "CUS002",
            name: "Nethmi Fernando",
            email: "nethmi.fernando@example.com",
            phone: "071 234 5678",
            registeredDate: "2026-10-12",
            status: "Active"
        },
        {
            id: "CUS003",
            name: "Kavindu Silva",
            email: "kavindu.silva@example.com",
            phone: "076 345 6789",
            registeredDate: "2026-09-20",
            status: "Inactive"
        },
        {
            id: "CUS004",
            name: "Tharushi Jayawardena",
            email: "tharushi.j@example.com",
            phone: "075 456 7890",
            registeredDate: "2026-10-18",
            status: "Active"
        },
        {
            id: "CUS005",
            name: "Dinuka Peris",
            email: "dinuka.peris@example.com",
            phone: "078 567 8901",
            registeredDate: "2026-08-15",
            status: "Inactive"
        },
        {
            id: "CUS006",
            name: "Senuja Wickramasinghe",
            email: "senuja.w@example.com",
            phone: "072 678 9012",
            registeredDate: "2026-10-21",
            status: "Active"
        }
    ];

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

    function formatDate(dateString) {
        const date = new Date(`${dateString}T00:00:00`);

        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function getInitials(name) {
        return name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0])
            .join("")
            .toUpperCase();
    }

    function updateSummary() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        totalCustomers.textContent = customers.length;

        activeCustomers.textContent = customers.filter(
            customer => customer.status === "Active"
        ).length;

        inactiveCustomers.textContent = customers.filter(
            customer => customer.status === "Inactive"
        ).length;

        newCustomers.textContent = customers.filter(customer => {
            const registered = new Date(`${customer.registeredDate}T00:00:00`);
            return registered >= new Date(thirtyDaysAgo.toDateString())
                && registered <= new Date(now.toDateString());
        }).length;
    }

    function getFilteredCustomers() {
        const query = searchInput.value.trim().toLowerCase();
        const selectedStatus = statusFilter.value;

        return customers.filter(customer => {
            const matchesSearch = [
                customer.id,
                customer.name,
                customer.email,
                customer.phone
            ].some(value => value.toLowerCase().includes(query));

            const matchesStatus =
                selectedStatus === "all" || customer.status === selectedStatus;

            return matchesSearch && matchesStatus;
        });
    }

    function renderCustomers() {
        const filteredCustomers = getFilteredCustomers();

        tableBody.replaceChildren();

        if (filteredCustomers.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 6;
            cell.className = "empty-state";
            cell.textContent = "No customers found. Try another search or filter.";

            row.appendChild(cell);
            tableBody.appendChild(row);

            statusMessage.textContent = "No matching customer records.";
            return;
        }

        filteredCustomers.forEach(customer => {
            const row = document.createElement("tr");

            const idCell = document.createElement("td");
            idCell.className = "customer-id";
            idCell.textContent = customer.id;

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

            const phoneCell = document.createElement("td");
            phoneCell.textContent = customer.phone;

            const dateCell = document.createElement("td");
            dateCell.textContent = formatDate(customer.registeredDate);

            const statusCell = document.createElement("td");
            const statusPill = document.createElement("span");
            statusPill.className = `status-pill status-${customer.status.toLowerCase()}`;
            statusPill.textContent = customer.status;
            statusCell.appendChild(statusPill);

            const actionCell = document.createElement("td");
            const viewButton = document.createElement("button");

            viewButton.type = "button";
            viewButton.className = "view-button";
            viewButton.textContent = "View Details";
            viewButton.setAttribute("aria-label", `View details for ${customer.name}`);

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

    function showCustomerDetails(customerId) {
        const customer = customers.find(item => item.id === customerId);

        if (!customer) {
            return;
        }

        document.getElementById("modalAvatar").textContent = getInitials(customer.name);
        document.getElementById("modalCustomerName").textContent = customer.name;

        const modalStatus = document.getElementById("modalCustomerStatus");
        modalStatus.textContent = customer.status;
        modalStatus.className =
            `status-pill status-${customer.status.toLowerCase()}`;

        document.getElementById("modalCustomerId").textContent = customer.id;
        document.getElementById("modalCustomerEmail").textContent = customer.email;
        document.getElementById("modalCustomerPhone").textContent = customer.phone;
        document.getElementById("modalCustomerDate").textContent =
            formatDate(customer.registeredDate);
        document.getElementById("modalCustomerStatusText").textContent =
            customer.status;

        customerModal.classList.add("open");
        customerModal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        closeModal.focus();
    }

    function hideCustomerDetails() {
        customerModal.classList.remove("open");
        customerModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

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

    searchInput.addEventListener("input", renderCustomers);
    statusFilter.addEventListener("change", renderCustomers);

    refreshButton.addEventListener("click", () => {
        searchInput.value = "";
        statusFilter.value = "all";
        updateSummary();
        renderCustomers();
        statusMessage.textContent = "Customer list refreshed.";
    });

    menuToggle.addEventListener("click", () => {
        if (sidebar.classList.contains("open")) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    sidebarOverlay.addEventListener("click", closeSidebar);

    closeModal.addEventListener("click", hideCustomerDetails);
    doneModal.addEventListener("click", hideCustomerDetails);
    modalBackdrop.addEventListener("click", hideCustomerDetails);

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            hideCustomerDetails();
            closeSidebar();
        }
    });

    updateSummary();
    renderCustomers();
});
