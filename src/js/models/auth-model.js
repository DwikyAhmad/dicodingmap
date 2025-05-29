// Auth Model - handles authentication data operations
class AuthModel {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.isLoading = false;
        this.lastLoginTime = null;
        this.authListeners = [];
        this.init();
    }

    // Initialize auth model
    init() {
        this.checkExistingAuth();
        this.setupTokenExpirationCheck();
    }

    // Check if user is already authenticated on app start
    checkExistingAuth() {
        const token = apiClient.getAuthToken();
        if (token) {
            try {
                const userData = apiClient.getUserData();
                if (userData && !this.isTokenExpired(userData)) {
                    this.currentUser = userData;
                    this.isAuthenticated = true;
                    this.lastLoginTime = userData.iat ? new Date(userData.iat * 1000) : new Date();
                    this.notifyAuthListeners();
                } else {
                    // Token expired, clear it
                    this.logout();
                }
            } catch (error) {
                console.error('Error checking existing auth:', error);
                this.logout();
            }
        }
    }

    // Register new user
    async register(name, email, password) {
        // Validate input
        const validation = this.validateRegistrationData(name, email, password);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        try {
            this.isLoading = true;
            const response = await apiClient.register(name, email, password);
            return response;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    // Login user
    async login(email, password) {
        // Validate input
        const validation = this.validateLoginData(email, password);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        try {
            this.isLoading = true;
            const response = await apiClient.login(email, password);
            
            if (response.loginResult) {
                const userData = apiClient.getUserData();
                this.currentUser = {
                    ...userData,
                    name: response.loginResult.name,
                    userId: response.loginResult.userId
                };
                this.isAuthenticated = true;
                this.lastLoginTime = new Date();
                
                // Store login time in localStorage
                localStorage.setItem('last_login_time', this.lastLoginTime.toISOString());
                
                this.notifyAuthListeners();
            }

            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    // Logout user
    async logout() {
        try {
            this.isLoading = true;
            await apiClient.logout();
            this.clearUserData();
            this.notifyAuthListeners();
        } catch (error) {
            console.error('Logout error:', error);
            // Clear user data even if logout request fails
            this.clearUserData();
            this.notifyAuthListeners();
        } finally {
            this.isLoading = false;
        }
    }

    // Clear user data
    clearUserData() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.lastLoginTime = null;
        localStorage.removeItem('last_login_time');
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    getAuthenticationStatus() {
        return this.isAuthenticated;
    }

    // Get loading state
    getLoadingState() {
        return this.isLoading;
    }

    // Add authentication state listener
    addAuthListener(callback) {
        this.authListeners.push(callback);
    }

    // Remove authentication state listener
    removeAuthListener(callback) {
        const index = this.authListeners.indexOf(callback);
        if (index > -1) {
            this.authListeners.splice(index, 1);
        }
    }

    // Notify all auth listeners
    notifyAuthListeners() {
        this.authListeners.forEach(callback => {
            try {
                callback(this.isAuthenticated, this.currentUser);
            } catch (error) {
                console.error('Error in auth listener:', error);
            }
        });
    }

    // Validate registration data
    validateRegistrationData(name, email, password) {
        const errors = [];

        // Validate name
        if (!name || name.trim().length === 0) {
            errors.push('Nama tidak boleh kosong');
        } else if (name.trim().length < 2) {
            errors.push('Nama harus minimal 2 karakter');
        } else if (name.trim().length > 50) {
            errors.push('Nama maksimal 50 karakter');
        } else if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
            errors.push('Nama hanya boleh mengandung huruf dan spasi');
        }

        // Validate email
        if (!email || email.trim().length === 0) {
            errors.push('Email tidak boleh kosong');
        } else if (!this.isValidEmail(email)) {
            errors.push('Format email tidak valid');
        }

        // Validate password
        const passwordValidation = this.validatePassword(password);
        if (!passwordValidation.isValid) {
            errors.push(...passwordValidation.errors);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Validate login data
    validateLoginData(email, password) {
        const errors = [];

        // Validate email
        if (!email || email.trim().length === 0) {
            errors.push('Email tidak boleh kosong');
        } else if (!this.isValidEmail(email)) {
            errors.push('Format email tidak valid');
        }

        // Validate password
        if (!password || password.length === 0) {
            errors.push('Password tidak boleh kosong');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Validate password strength
    validatePassword(password) {
        const errors = [];

        if (!password) {
            errors.push('Password tidak boleh kosong');
            return { isValid: false, errors };
        }

        if (password.length < 8) {
            errors.push('Password harus minimal 8 karakter');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Password harus mengandung setidaknya satu huruf kapital');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Password harus mengandung setidaknya satu huruf kecil');
        }

        if (!/[0-9]/.test(password)) {
            errors.push('Password harus mengandung setidaknya satu angka');
        }

        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password harus mengandung setidaknya satu karakter khusus');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Check if token is expired
    isTokenExpired(userData = null) {
        const user = userData || this.currentUser;
        if (!user || !user.exp) return false;

        const currentTime = Math.floor(Date.now() / 1000);
        return user.exp < currentTime;
    }

    // Get time until token expires
    getTokenExpirationTime() {
        if (!this.currentUser || !this.currentUser.exp) return null;

        const expirationTime = this.currentUser.exp * 1000;
        const currentTime = Date.now();
        
        return expirationTime - currentTime;
    }

    // Setup automatic token expiration check
    setupTokenExpirationCheck() {
        // Check every minute
        setInterval(() => {
            if (this.isAuthenticated && this.isTokenExpired()) {
                this.handleTokenExpiration();
            }
        }, 60 * 1000);
    }

    // Handle token expiration
    handleTokenExpiration() {
        console.log('Token expired, logging out user');
        this.logout();
        
        // Show notification to user
        if (window.notificationUtils) {
            notificationUtils.showWarning('Sesi Anda telah berakhir. Silakan login kembali.');
        }

        // Redirect to auth page
        if (window.location.hash !== '#auth') {
            window.location.hash = '#auth';
        }
    }

    // Get user session information
    getSessionInfo() {
        if (!this.isAuthenticated) return null;

        const expirationTime = this.getTokenExpirationTime();
        
        return {
            user: this.currentUser,
            loginTime: this.lastLoginTime,
            expirationTime: expirationTime ? new Date(Date.now() + expirationTime) : null,
            isExpired: this.isTokenExpired(),
            timeUntilExpiration: expirationTime
        };
    }

    // Refresh authentication state
    refreshAuthState() {
        this.checkExistingAuth();
    }

    // Get auth statistics
    getAuthStatistics() {
        const lastLogin = localStorage.getItem('last_login_time');
        
        return {
            isAuthenticated: this.isAuthenticated,
            currentUser: this.currentUser,
            lastLoginTime: lastLogin ? new Date(lastLogin) : null,
            sessionDuration: this.lastLoginTime ? Date.now() - this.lastLoginTime.getTime() : 0,
            tokenExpired: this.isTokenExpired()
        };
    }

    // Reset model state
    reset() {
        this.clearUserData();
        this.authListeners = [];
        this.isLoading = false;
    }
}

// Create global auth model instance
const authModel = new AuthModel();

// Export for use in other modules
window.authModel = authModel; 