// Auth Presenter - coordinates between AuthView and AuthModel
class AuthPresenter {
    constructor() {
        this.view = new AuthView();
        this.model = authModel;
        this.isInitialized = false;
        this.redirectUrl = null; // URL to redirect after successful auth
    }

    // Initialize presenter and render view
    async init() {
        try {
            console.log('Initializing Auth Presenter...');

            // Check if user is already authenticated
            if (this.model.getAuthenticationStatus()) {
                console.log('User already authenticated, redirecting to home');
                router.navigateTo('home');
                return;
            }

            // Initialize view
            this.view.init();

            // Render view to DOM
            await this.renderView();

            // Setup event listeners
            this.setupEventListeners();

            // Set redirect URL if specified in query params
            this.setRedirectFromQuery();

            this.isInitialized = true;
            console.log('Auth Presenter initialized successfully');

        } catch (error) {
            console.error('Error initializing Auth Presenter:', error);
            notificationUtils.handleApiError(error, 'Gagal memuat halaman autentikasi');
        }
    }

    // Render view to DOM
    async renderView() {
        const contentContainer = document.getElementById('page-content');
        if (!contentContainer) {
            throw new Error('Page content container not found');
        }

        contentContainer.innerHTML = this.view.render();
    }

    // Setup event listeners
    setupEventListeners() {
        console.log('Setting up Auth Presenter event listeners...');

        const formElements = this.view.getFormElements();

        // Login form submission
        if (formElements.loginForm) {
            formElements.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form submission
        if (formElements.registerForm) {
            formElements.registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Continue as guest
        if (formElements.continueAsGuestBtn) {
            formElements.continueAsGuestBtn.addEventListener('click', () => {
                this.handleContinueAsGuest();
            });
        }

        // Listen for auth state changes
        this.model.addAuthListener((isAuthenticated, user) => {
            this.handleAuthStateChange(isAuthenticated, user);
        });

        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    // Setup keyboard shortcuts for accessibility
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + Enter to submit current form
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                const currentMode = this.view.getCurrentMode();
                
                if (currentMode === 'login') {
                    this.handleLogin();
                } else {
                    this.handleRegister();
                }
            }
            
            // Escape to clear forms
            if (e.key === 'Escape') {
                this.view.clearForm();
            }
        });
    }

    // Handle login form submission
    async handleLogin() {
        try {
            console.log('Handling login...');

            // Validate form first
            if (!this.view.validateLoginForm()) {
                console.log('Login form validation failed');
                return;
            }

            // Get form data
            const formData = this.view.getLoginData();

            // Show loading state
            this.view.showLoadingState('login');

            // Attempt login
            const response = await this.model.login(formData.email, formData.password);

            console.log('Login successful');
            
            // Show success message
            notificationUtils.showSuccess('Login berhasil! Selamat datang kembali');

            // Redirect or go to home
            this.handleSuccessfulAuth();

        } catch (error) {
            console.error('Login error:', error);
            
            // Handle specific error cases
            this.handleAuthError(error, 'login');
            
        } finally {
            // Hide loading state
            this.view.hideLoadingState('login');
        }
    }

    // Handle registration form submission
    async handleRegister() {
        try {
            console.log('Handling registration...');

            // Validate form first
            if (!this.view.validateRegisterForm()) {
                console.log('Register form validation failed');
                return;
            }

            // Get form data
            const formData = this.view.getRegisterData();

            // Show loading state
            this.view.showLoadingState('register');

            // Attempt registration
            const response = await this.model.register(
                formData.name, 
                formData.email, 
                formData.password
            );

            console.log('Registration successful');
            
            // Show success message
            notificationUtils.showSuccess('Registrasi berhasil! Silakan login dengan akun baru Anda');

            // Switch to login form and pre-fill email
            this.view.switchMode('login');
            document.getElementById('login-email').value = formData.email;
            document.getElementById('login-password').focus();

        } catch (error) {
            console.error('Registration error:', error);
            
            // Handle specific error cases
            this.handleAuthError(error, 'register');
            
        } finally {
            // Hide loading state
            this.view.hideLoadingState('register');
        }
    }

    // Handle continue as guest
    handleContinueAsGuest() {
        console.log('Continuing as guest...');
        
        // Show notification
        notificationUtils.showInfo('Melanjutkan sebagai guest. Anda dapat menambahkan story tanpa registrasi');
        
        // Navigate to add story page
        router.navigateTo('add-story');
    }

    // Handle authentication errors
    handleAuthError(error, mode) {
        let errorMessage = 'Terjadi kesalahan saat proses autentikasi';
        
        // Parse error response
        if (error.message) {
            errorMessage = error.message;
        } else if (error.response && error.response.message) {
            errorMessage = error.response.message;
        }

        // Handle specific error cases
        if (errorMessage.toLowerCase().includes('email')) {
            if (mode === 'login') {
                this.view.showFieldError('login-email', 'Email atau password salah');
            } else {
                this.view.showFieldError('register-email', 'Email sudah terdaftar');
            }
        } else if (errorMessage.toLowerCase().includes('password')) {
            const fieldId = mode === 'login' ? 'login-password' : 'register-password';
            this.view.showFieldError(fieldId, 'Password tidak valid');
        } else if (errorMessage.toLowerCase().includes('network') || 
                   errorMessage.toLowerCase().includes('connection')) {
            notificationUtils.showError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda');
        } else {
            notificationUtils.showError(errorMessage);
        }
    }

    // Handle authentication state changes
    handleAuthStateChange(isAuthenticated, user) {
        if (isAuthenticated) {
            console.log('User authenticated:', user);
            this.handleSuccessfulAuth();
        } else {
            console.log('User not authenticated');
        }
    }

    // Handle successful authentication
    handleSuccessfulAuth() {
        // Determine redirect URL
        let redirectUrl = this.redirectUrl || 'home';
        
        // Clear redirect URL
        this.redirectUrl = null;
        
        // Navigate to target page
        router.navigateTo(redirectUrl);
    }

    // Set redirect URL from query parameters
    setRedirectFromQuery() {
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        
        if (redirect && router.hasRoute(redirect)) {
            this.redirectUrl = redirect;
            console.log('Will redirect to:', redirect, 'after authentication');
        }
    }

    // Set custom redirect URL
    setRedirectUrl(url) {
        this.redirectUrl = url;
    }

    // Handle logout (if called from somewhere else)
    async handleLogout() {
        try {
            console.log('Handling logout...');
            
            // Show loading
            notificationUtils.showLoading('Keluar...');
            
            // Logout through model
            await this.model.logout();
            
            // Show success message
            notificationUtils.showSuccess('Berhasil keluar dari akun');
            
            // Clear forms
            this.view.clearForm();
            
            // Switch to login mode
            this.view.switchMode('login');
            
        } catch (error) {
            console.error('Logout error:', error);
            notificationUtils.showError('Gagal keluar dari akun');
        } finally {
            notificationUtils.hideLoading();
        }
    }

    // Show specific auth mode (login or register)
    showMode(mode) {
        if (mode === 'login' || mode === 'register') {
            this.view.switchMode(mode);
        }
    }

    // Pre-fill login form with email
    prefillLoginEmail(email) {
        const emailInput = document.getElementById('login-email');
        if (emailInput && this.isValidEmail(email)) {
            emailInput.value = email;
            emailInput.dispatchEvent(new Event('input')); // Trigger validation
        }
    }

    // Email validation helper
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Get current authentication status
    getAuthStatus() {
        return {
            isAuthenticated: this.model.getAuthenticationStatus(),
            user: this.model.getCurrentUser(),
            isLoading: this.model.getLoadingState()
        };
    }

    // Check if user needs to authenticate for a specific action
    requiresAuthentication(action = 'default') {
        const isAuthenticated = this.model.getAuthenticationStatus();
        
        if (!isAuthenticated) {
            console.log(`Authentication required for action: ${action}`);
            
            // Set redirect URL for after authentication
            if (action !== 'default') {
                this.setRedirectUrl(action);
            }
            
            // Show auth page
            notificationUtils.showWarning('Silakan login untuk melanjutkan');
            return true;
        }
        
        return false;
    }

    // Handle error recovery
    handleErrorRecovery() {
        console.log('Attempting error recovery...');
        
        // Clear all errors
        this.view.clearAllErrors();
        
        // Clear forms
        this.view.clearForm();
        
        // Switch to login mode
        this.view.switchMode('login');
        
        // Show help message
        notificationUtils.showInfo('Form telah direset. Silakan coba lagi');
    }

    // Cleanup presenter
    cleanup() {
        console.log('Cleaning up Auth Presenter...');
        
        // Remove event listeners if needed
        this.isInitialized = false;
        
        // Clear redirect URL
        this.redirectUrl = null;
        
        // Clear any pending operations
        if (this.view) {
            this.view.clearForm();
        }
    }

    // Get presenter information
    getInfo() {
        return {
            name: 'AuthPresenter',
            isInitialized: this.isInitialized,
            currentMode: this.view ? this.view.getCurrentMode() : null,
            redirectUrl: this.redirectUrl,
            authStatus: this.getAuthStatus()
        };
    }
}

// Export to global scope
window.AuthPresenter = AuthPresenter; 