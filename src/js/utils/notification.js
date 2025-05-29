// Notification utility functions
class NotificationUtils {
    constructor() {
        this.modal = null;
        this.toastContainer = null;
        this.init();
    }

    // Initialize notification system
    init() {
        this.modal = document.getElementById('notification-modal');
        this.setupModal();
        this.createToastContainer();
    }

    // Setup modal functionality
    setupModal() {
        if (!this.modal) return;

        const closeBtn = this.modal.querySelector('#modal-close');
        const okBtn = this.modal.querySelector('#modal-ok');

        // Close modal handlers
        const closeModal = () => {
            this.hideModal();
        };

        if (closeBtn) {
            closeBtn.onclick = closeModal;
        }

        if (okBtn) {
            okBtn.onclick = closeModal;
        }

        // Close on overlay click
        this.modal.onclick = (e) => {
            if (e.target === this.modal) {
                closeModal();
            }
        };

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                closeModal();
            }
        });
    }

    // Create toast container
    createToastContainer() {
        this.toastContainer = document.createElement('div');
        this.toastContainer.id = 'toast-container';
        this.toastContainer.className = 'toast-container';
        this.toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1001;
            max-width: 300px;
        `;
        document.body.appendChild(this.toastContainer);
    }

    // Show modal notification
    showModal(title, message, type = 'info') {
        if (!this.modal) return;

        const titleElement = this.modal.querySelector('#modal-title');
        const messageElement = this.modal.querySelector('#modal-message');
        const modalContent = this.modal.querySelector('.modal-content');

        if (titleElement) {
            titleElement.textContent = title;
        }

        if (messageElement) {
            messageElement.textContent = message;
        }

        // Update modal style based on type
        if (modalContent) {
            modalContent.className = `modal-content modal-${type}`;
        }

        // Show modal
        this.modal.classList.remove('hidden');
        this.modal.setAttribute('aria-hidden', 'false');

        // Focus on modal for accessibility
        const okBtn = this.modal.querySelector('#modal-ok');
        if (okBtn) {
            setTimeout(() => okBtn.focus(), 100);
        }

        // Add View Transition API support if available
        if (document.startViewTransition) {
            document.startViewTransition(() => {
                this.modal.style.display = 'flex';
            });
        }
    }

    // Hide modal
    hideModal() {
        if (!this.modal) return;

        this.modal.classList.add('hidden');
        this.modal.setAttribute('aria-hidden', 'true');

        // Add View Transition API support if available
        if (document.startViewTransition) {
            document.startViewTransition(() => {
                this.modal.style.display = 'none';
            });
        }
    }

    // Show toast notification
    showToast(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            background: var(--surface-color);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            padding: 1rem;
            margin-bottom: 0.5rem;
            box-shadow: var(--shadow-lg);
            animation: slideInRight 0.3s ease-out;
            position: relative;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;

        // Set border color based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#2563eb'
        };

        toast.style.borderLeftColor = colors[type] || colors.info;
        toast.style.borderLeftWidth = '4px';

        // Add icon based on type
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        const iconClass = icons[type] || icons.info;
        const iconColor = colors[type] || colors.info;

        toast.innerHTML = `
            <i class="${iconClass}" style="color: ${iconColor}; flex-shrink: 0;" aria-hidden="true"></i>
            <span>${this.escapeHtml(message)}</span>
            <button class="toast-close" aria-label="Tutup notifikasi" style="
                background: none;
                border: none;
                font-size: 1.2rem;
                color: var(--text-secondary);
                cursor: pointer;
                margin-left: auto;
                padding: 0;
                line-height: 1;
            ">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add close functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.onclick = () => {
            this.removeToast(toast);
        };

        // Add to container
        this.toastContainer.appendChild(toast);

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeToast(toast);
            }, duration);
        }

        // Add CSS animation keyframes if not already added
        if (!document.querySelector('#toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        return toast;
    }

    // Remove toast with animation
    removeToast(toast) {
        if (!toast || !toast.parentNode) return;

        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    // Clear all toasts
    clearAllToasts() {
        if (this.toastContainer) {
            this.toastContainer.innerHTML = '';
        }
    }

    // Convenience methods for different notification types
    showSuccess(message, useToast = true) {
        if (useToast) {
            this.showToast(message, 'success');
        } else {
            this.showModal('Berhasil', message, 'success');
        }
    }

    showError(message, useToast = false) {
        if (useToast) {
            this.showToast(message, 'error');
        } else {
            this.showModal('Error', message, 'error');
        }
    }

    showWarning(message, useToast = true) {
        if (useToast) {
            this.showToast(message, 'warning');
        } else {
            this.showModal('Peringatan', message, 'warning');
        }
    }

    showInfo(message, useToast = true) {
        if (useToast) {
            this.showToast(message, 'info');
        } else {
            this.showModal('Informasi', message, 'info');
        }
    }

    // Generic notification method
    showNotification(message, type = 'info', useToast = true) {
        switch (type) {
            case 'success':
                this.showSuccess(message, useToast);
                break;
            case 'error':
                this.showError(message, useToast);
                break;
            case 'warning':
                this.showWarning(message, useToast);
                break;
            default:
                this.showInfo(message, useToast);
        }
    }

    // Show confirmation dialog
    showConfirmation(title, message, onConfirm, onCancel = null) {
        // Create confirmation modal
        const confirmModal = document.createElement('div');
        confirmModal.className = 'modal';
        confirmModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1002;
            backdrop-filter: blur(4px);
        `;

        confirmModal.innerHTML = `
            <div class="modal-content" style="
                background: var(--surface-color);
                border-radius: var(--border-radius);
                max-width: 400px;
                width: 90%;
                box-shadow: var(--shadow-lg);
                animation: modalIn 0.3s ease-out;
            ">
                <div class="modal-header" style="
                    padding: 1.5rem 1.5rem 0;
                    border-bottom: 1px solid var(--border-color);
                ">
                    <h2>${this.escapeHtml(title)}</h2>
                </div>
                <div class="modal-body" style="padding: 1.5rem;">
                    <p>${this.escapeHtml(message)}</p>
                </div>
                <div class="modal-footer" style="
                    padding: 0 1.5rem 1.5rem;
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.5rem;
                ">
                    <button class="btn btn-secondary confirm-cancel">Batal</button>
                    <button class="btn btn-primary confirm-ok">OK</button>
                </div>
            </div>
        `;

        document.body.appendChild(confirmModal);

        const cancelBtn = confirmModal.querySelector('.confirm-cancel');
        const okBtn = confirmModal.querySelector('.confirm-ok');

        const cleanup = () => {
            document.body.removeChild(confirmModal);
        };

        cancelBtn.onclick = () => {
            cleanup();
            if (onCancel) onCancel();
        };

        okBtn.onclick = () => {
            cleanup();
            if (onConfirm) onConfirm();
        };

        // Close on overlay click
        confirmModal.onclick = (e) => {
            if (e.target === confirmModal) {
                cleanup();
                if (onCancel) onCancel();
            }
        };

        // Focus on OK button
        setTimeout(() => okBtn.focus(), 100);
    }

    // Show loading notification
    showLoading(message = 'Memuat...') {
        const loading = document.getElementById('loading');
        if (loading) {
            const loadingText = loading.querySelector('p');
            if (loadingText) {
                loadingText.textContent = message;
            }
            loading.classList.remove('hidden');
        }
    }

    // Hide loading notification
    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('hidden');
        }
    }

    // Helper function to escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Handle API errors and show appropriate notifications
    handleApiError(error, defaultMessage = 'Terjadi kesalahan') {
        console.error('API Error:', error);
        
        let message = defaultMessage;
        
        if (error.message) {
            message = error.message;
        } else if (typeof error === 'string') {
            message = error;
        }

        this.showError(message);
    }

    // Network status notifications
    setupNetworkStatusNotifications() {
        window.addEventListener('online', () => {
            this.showSuccess('Koneksi internet kembali tersedia', true);
        });

        window.addEventListener('offline', () => {
            this.showWarning('Koneksi internet terputus', true);
        });
    }
}

// Create global notification utils instance
const notificationUtils = new NotificationUtils();

// Export for use in other modules
window.notificationUtils = notificationUtils; 