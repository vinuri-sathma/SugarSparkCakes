
document.addEventListener('DOMContentLoaded', () => {

    const requestsTableBody = document.getElementById('requestsTableBody');
    const totalRequests = document.getElementById('totalRequests');
    const pendingRequests = document.getElementById('pendingRequests');
    const completedRequests = document.getElementById('completedRequests');
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const refreshButton = document.getElementById('refreshButton');
    const statusMessage = document.getElementById('statusMessage');
    const dataNotice = document.getElementById('dataNotice');

    let customizationRequests = [];

    // Sidebar menu
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    function closeSidebar() {
        sidebar?.classList.remove('open');
        sidebarOverlay?.classList.remove('visible');
        menuToggle?.setAttribute('aria-expanded', 'false');
    }

    menuToggle?.addEventListener('click', () => {
        const isOpen = sidebar.classList.toggle('open');

        sidebarOverlay?.classList.toggle('visible', isOpen);
        menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    sidebarOverlay?.addEventListener('click', closeSidebar);

    // Format date
    function formatDate(dateValue) {
        if (!dateValue) return 'Not specified';

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return 'Invalid date';
        }

        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    // Safe HTML text
    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        })[character]);
    }

    // Update summary cards
    function updateSummary() {
        totalRequests.textContent = customizationRequests.length;

        pendingRequests.textContent =
            customizationRequests.filter(
                request => request.request_status === 'Pending'
            ).length;

        completedRequests.textContent =
            customizationRequests.filter(
                request => request.request_status === 'Completed'
            ).length;
    }

    // Render requests
    function renderRequests() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedStatus = statusFilter.value;

        const filteredRequests = customizationRequests.filter(request => {
            const searchableText = [
                request.customization_id,
                request.customer_name,
                request.customer_phone,
                request.flavour,
                request.occasion
            ].join(' ').toLowerCase();

            const matchesSearch = searchableText.includes(searchTerm);

            const matchesStatus =
                !selectedStatus ||
                request.request_status === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        if (filteredRequests.length === 0) {
            requestsTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">
                        No customization requests found.
                    </td>
                </tr>
            `;
            return;
        }

        requestsTableBody.innerHTML = filteredRequests.map(request => {

            const statusClass = {
                Pending: 'status-pending',
                Processing: 'status-processing',
                Completed: 'status-completed'
            }[request.request_status] || '';

            const imageCell = request.reference_image
                ? `<a href="${escapeHTML(request.reference_image)}"
                     target="_blank" rel="noopener noreferrer">
                     <img src="${escapeHTML(request.reference_image)}"
                          alt="Customer reference design"
                          class="reference-image">
                   </a>`
                : '<span class="no-image">No image</span>';

            return `
                <tr>
                    <td>
                        <span class="order-id">
                            #${escapeHTML(request.customization_id)}
                        </span>
                    </td>

                    <td>
                        <span class="customer-name">
                            ${escapeHTML(request.customer_name)}
                        </span>
                        <span class="customer-email">
                            ${escapeHTML(request.customer_phone)}
                        </span>
                    </td>

                    <td>
                        <strong>${escapeHTML(request.flavour)}</strong>
                        <span class="customer-email">
                            ${escapeHTML(request.cake_size)}
                        </span>
                    </td>

                    <td>${escapeHTML(request.occasion || 'Not specified')}</td>

                    <td>${formatDate(request.delivery_date)}</td>

                    <td>${imageCell}</td>
                    <td>
                        <button type="button"
                                class="view-details-button"
                                data-id="${escapeHTML(request.customization_id)}">
                            View Details
                        </button>
                    </td>

                    <td>
                        <span class="status-pill ${statusClass}">
                            ${escapeHTML(request.request_status)}
                        </span>
                    </td>

                    <td>
                        <select class="status-select"
                                data-id="${escapeHTML(request.customization_id)}"
                                aria-label="Update request status">
                            <option value="Pending"
                                ${request.request_status === 'Pending' ? 'selected' : ''}>
                                Pending
                            </option>

                            <option value="Processing"
                                ${request.request_status === 'Processing' ? 'selected' : ''}>
                                Processing
                            </option>

                            <option value="Completed"
                                ${request.request_status === 'Completed' ? 'selected' : ''}>
                                Completed
                            </option>
                        </select>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Load requests from database
    async function loadRequests() {
        requestsTableBody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    Loading customization requests...
                </td>
            </tr>
        `;

        statusMessage.textContent = '';
        refreshButton.disabled = true;

        try {
            const response = await fetch(
                '/api/admin/customization-requests'
            );

            if (!response.ok) {
                throw new Error('Failed to load customization requests.');
            }

            customizationRequests = await response.json();

            updateSummary();
            renderRequests();

            dataNotice.textContent =
                'Customization request information loaded successfully.';

        } catch (error) {
            console.error('Loading error:', error);

            requestsTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">
                        Unable to load customization requests.
                    </td>
                </tr>
            `;

            dataNotice.textContent =
                'Please check the server connection and try again.';

        } finally {
            refreshButton.disabled = false;
        }
    }

    // Update request status
    requestsTableBody.addEventListener('change', async event => {
        if (!event.target.classList.contains('status-select')) {
            return;
        }

        const select = event.target;
        const requestId = select.dataset.id;
        const newStatus = select.value;

        const previousRequest = customizationRequests.find(
            request => String(request.customization_id) === requestId
        );

        if (!previousRequest) return;

        const previousStatus = previousRequest.request_status;

        select.disabled = true;
        statusMessage.textContent = 'Updating request status...';

        try {
            const response = await fetch(
                `/api/admin/customization-requests/${requestId}/status`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        requestStatus: newStatus
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || 'Status update failed.'
                );
            }

            previousRequest.request_status = newStatus;

            updateSummary();
            renderRequests();

            statusMessage.textContent =
                'Request status updated successfully.';

        } catch (error) {
            console.error('Status update error:', error);

            statusMessage.textContent = error.message;
            select.value = previousStatus;
            select.disabled = false;
        }
    });

    // Search and filter
    searchInput.addEventListener('input', renderRequests);
    statusFilter.addEventListener('change', renderRequests);

    // Refresh
    refreshButton.addEventListener('click', loadRequests);

    
    // View customization request details
    const detailsModal = document.getElementById('detailsModal');
    const detailsModalBody = document.getElementById('detailsModalBody');
    const closeDetailsModal = document.getElementById('closeDetailsModal');

    requestsTableBody.addEventListener('click', event => {
        const button = event.target.closest('.view-details-button');

        if (!button) return;

        const requestId = button.dataset.id;

        const request = customizationRequests.find(
            item => String(item.customization_id) === requestId
        );

        if (!request) return;

        const imageHTML = request.reference_image
            ? `
                <div class="detail-item">
                    <strong>Reference Image</strong>
                    <a href="${escapeHTML(request.reference_image)}"
                       target="_blank" rel="noopener noreferrer">
                        <img src="${escapeHTML(request.reference_image)}"
                             alt="Customer reference design"
                             class="details-reference-image">
                    </a>
                </div>
            `
            : `
                <div class="detail-item">
                    <strong>Reference Image</strong>
                    <p>No reference image uploaded.</p>
                </div>
            `;

        detailsModalBody.innerHTML = `
            <div class="details-grid">

                <div class="detail-item">
                    <strong>Request ID</strong>
                    <p>#${escapeHTML(request.customization_id)}</p>
                </div>

                <div class="detail-item">
                    <strong>Customer Name</strong>
                    <p>${escapeHTML(request.customer_name)}</p>
                </div>

                <div class="detail-item">
                    <strong>Contact Number</strong>
                    <p>${escapeHTML(request.customer_phone)}</p>
                </div>

                <div class="detail-item">
                    <strong>Cake Flavour</strong>
                    <p>${escapeHTML(request.flavour)}</p>
                </div>

                <div class="detail-item">
                    <strong>Cake Size</strong>
                    <p>${escapeHTML(request.cake_size)}</p>
                </div>

                <div class="detail-item">
                    <strong>Occasion</strong>
                    <p>${escapeHTML(request.occasion || 'Not specified')}</p>
                </div>

                <div class="detail-item">
                    <strong>Preferred Design</strong>
                    <p>${escapeHTML(request.preferred_design || 'Not specified')}</p>
                </div>

                <div class="detail-item">
                    <strong>Cake Message</strong>
                    <p>${escapeHTML(request.cake_message || 'Not specified')}</p>
                </div>

                <div class="detail-item">
                    <strong>Delivery Date</strong>
                    <p>${formatDate(request.delivery_date)}</p>
                </div>

                <div class="detail-item">
                    <strong>Request Status</strong>
                    <p>${escapeHTML(request.request_status)}</p>
                </div>

                <div class="detail-item full-width">
                    <strong>Special Instructions</strong>
                    <p>${escapeHTML(request.special_instructions || 'Not specified')}</p>
                </div>

                <div class="detail-item full-width">
                    ${imageHTML}
                </div>

            </div>
        `;

        detailsModal.classList.add('active');
        detailsModal.setAttribute('aria-hidden', 'false');
    });

    // Close modal
    function hideDetailsModal() {
        detailsModal.classList.remove('active');
        detailsModal.setAttribute('aria-hidden', 'true');
    }

    closeDetailsModal.addEventListener('click', hideDetailsModal);

    detailsModal.addEventListener('click', event => {
        if (event.target === detailsModal) {
            hideDetailsModal();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            hideDetailsModal();
        }
    });

    // Initial load
    loadRequests();

});
