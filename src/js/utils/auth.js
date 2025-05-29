// Authentication utility functions
class AuthUtils {
    constructor() {
        this.authChangeListeners = [];
    }

    // Add listener for auth state changes
    onAuthStateChange(callback) {
        this.authChangeListeners.push(callback);
    }

    // Remove listener for auth state changes
    removeAuthStateListener(callback) {
        const index = this.authChangeListeners.indexOf(callback);
        if (index > -1) {
            this.authChangeListeners.splice(index, 1);
        }
    }

    // Notify all listeners about auth state change
    notifyAuthStateChange() {
        this.authChangeListeners.forEach(callback => callback());
    }

    // Check if user is authenticated
    isAuthenticated() {
        return apiClient.isAuthenticated();
    }

    // Get current user data
    getCurrentUser() {
        return apiClient.getUserData();
    }

    // Login user
    async login(email, password) {
        try {
            const response = await apiClient.login(email, password);
            this.updateAuthUI();
            this.notifyAuthStateChange();
            return response;
        } catch (error) {
            throw error;
        }
    }

    // Register user
    async register(name, email, password) {
        try {
            const response = await apiClient.register(name, email, password);
            return response;
        } catch (error) {
            throw error;
        }
    }

    // Logout user
    async logout() {
        try {
            await apiClient.logout();
            this.updateAuthUI();
            this.notifyAuthStateChange();
            // Redirect to home after logout
            window.location.hash = '#home';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // Update authentication UI elements
    updateAuthUI() {
        const authBtn = document.getElementById('auth-btn');
        const authText = document.getElementById('auth-text');
        
        if (!authBtn || !authText) return;

        if (this.isAuthenticated()) {
            const userData = this.getCurrentUser();
            authText.textContent = userData ? 'Keluar' : 'Keluar';
            authBtn.onclick = () => this.logout();
        } else {
            authText.textContent = 'Masuk';
            authBtn.onclick = () => {
                window.location.hash = '#auth';
            };
        }
    }

    // Initialize auth UI on page load
    initAuthUI() {
        this.updateAuthUI();
        
        // Also update navigation link visibility
        this.updateNavigationLinks();
    }

    // Update navigation links based on auth state
    updateNavigationLinks() {
        const addStoryLink = document.getElementById('add-story-link');
        
        if (addStoryLink) {
            if (this.isAuthenticated()) {
                addStoryLink.style.display = 'flex';
            } else {
                addStoryLink.style.display = 'none';
            }
        }
    }

    // Validate email format
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate password strength
    validatePassword(password) {
        const errors = [];
        
        if (password.length < 8) {
            errors.push('Password harus minimal 8 karakter');
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push('Password harus mengandung huruf kapital');
        }
        
        if (!/[a-z]/.test(password)) {
            errors.push('Password harus mengandung huruf kecil');
        }
        
        if (!/[0-9]/.test(password)) {
            errors.push('Password harus mengandung angka');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Validate name
    validateName(name) {
        const errors = [];
        
        if (name.trim().length < 2) {
            errors.push('Nama harus minimal 2 karakter');
        }
        
        if (!/^[a-zA-Z\s]+$/.test(name)) {
            errors.push('Nama hanya boleh mengandung huruf dan spasi');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Show form validation errors
    showFormErrors(formElement, errors) {
        // Clear previous errors
        const existingErrors = formElement.querySelectorAll('.form-error');
        existingErrors.forEach(error => error.remove());

        // Show new errors
        Object.keys(errors).forEach(fieldName => {
            const field = formElement.querySelector(`[name="${fieldName}"]`);
            if (field && errors[fieldName].length > 0) {
                field.classList.add('error');
                
                const errorDiv = document.createElement('div');
                errorDiv.className = 'form-error';
                errorDiv.textContent = errors[fieldName][0]; // Show first error
                
                field.parentNode.insertBefore(errorDiv, field.nextSibling);
            }
        });
    }

    // Clear form errors
    clearFormErrors(formElement) {
        const existingErrors = formElement.querySelectorAll('.form-error');
        existingErrors.forEach(error => error.remove());
        
        const errorFields = formElement.querySelectorAll('.form-control.error');
        errorFields.forEach(field => field.classList.remove('error'));
    }

    // Handle unauthorized access
    handleUnauthorized() {
        this.logout();
        notificationUtils.showNotification('Sesi Anda telah berakhir. Silakan login kembali.', 'warning');
        window.location.hash = '#auth';
    }

    // Check if token is expired (basic check)
    isTokenExpired() {
        const userData = this.getCurrentUser();
        if (!userData || !userData.exp) return false;
        
        const currentTime = Math.floor(Date.now() / 1000);
        return userData.exp < currentTime;
    }

    // Auto-logout if token is expired
    checkTokenExpiration() {
        if (this.isAuthenticated() && this.isTokenExpired()) {
            this.handleUnauthorized();
        }
    }

    // Set up token expiration check interval
    startTokenExpirationCheck() {
        // Check every 5 minutes
        setInterval(() => {
            this.checkTokenExpiration();
        }, 5 * 60 * 1000);
    }
}

// Create global auth utils instance
const authUtils = new AuthUtils();

// Export for use in other modules
window.authUtils = authUtils; 