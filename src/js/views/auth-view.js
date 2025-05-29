// Auth View - handles authentication UI (login and register)
class AuthView {
    constructor() {
        this.container = null;
        this.currentMode = 'login'; // 'login' or 'register'
    }

    // Render the authentication view
    render() {
        const html = `
            <div class="auth-page">
                <!-- Page Header -->
                <header class="page-header">
                    <h1 class="page-title">
                        <i class="fas fa-user-circle" aria-hidden="true"></i>
                        Autentikasi
                    </h1>
                    <p class="page-subtitle">Masuk atau daftar untuk mulai berbagi cerita</p>
                </header>

                <!-- Auth Forms Container -->
                <div class="auth-container">

                    <!-- Login Form -->
                    <div id="login-form-container" class="auth-form-container active">
                        <form id="login-form" class="card auth-form" novalidate>
                            <div class="card-header">
                                <h2 class="card-title">
                                    <i class="fas fa-sign-in-alt" aria-hidden="true"></i>
                                    Masuk ke Akun
                                </h2>
                                <p class="card-subtitle">Gunakan email dan password untuk masuk</p>
                            </div>
                            <div class="card-body">
                                <!-- Email Field -->
                                <div class="form-group">
                                    <div class="flex items-center gap-2">
                                        <i class="fas fa-envelope form-icon" aria-hidden="true"></i>
                                        <label for="login-email" class="form-label">
                                        Email *
                                        </label>
                                    </div>
                                    <div class="form-input-group">
                                        <input type="email" 
                                               id="login-email" 
                                               name="email"
                                               class="form-control" 
                                               placeholder="nama@email.com"
                                               required
                                               autocomplete="username"
                                               aria-describedby="login-email-help">
                                    </div>
                                    <div id="login-email-help" class="form-help">
                                        Masukkan alamat email yang valid
                                    </div>
                                    <div class="form-error" id="login-email-error"></div>
                                </div>

                                <!-- Password Field -->
                                <div class="form-group">
                                    <div class="flex items-center gap-2">
                                        <i class="fas fa-lock form-icon" aria-hidden="true"></i>
                                        <label for="login-password" class="form-label">
                                            Password *
                                        </label>
                                    </div>
                                    <div class="form-input-group">
                                        
                                        <input type="password" 
                                               id="login-password" 
                                               name="password"
                                               class="form-control" 
                                               placeholder="Masukkan password"
                                               required
                                               minlength="8"
                                               autocomplete="current-password"
                                               aria-describedby="login-password-help">
                                    </div>
                                    <div id="login-password-help" class="form-help">
                                        Password minimal 8 karakter
                                    </div>
                                    <div class="form-error" id="login-password-error"></div>
                                </div>

                                <!-- Form Actions -->
                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary btn-block" id="login-submit-btn">
                                        <i class="fas fa-sign-in-alt" aria-hidden="true"></i>
                                        <span id="login-submit-text">Masuk</span>
                                    </button>
                                </div>

                            </div>
                        </form>
                    </div>

                    <!-- Register Form -->
                    <div id="register-form-container" class="auth-form-container">
                        <form id="register-form" class="card auth-form" novalidate>
                            <div class="card-header">
                                <h2 class="card-title">
                                    <i class="fas fa-user-plus" aria-hidden="true"></i>
                                    Buat Akun Baru
                                </h2>
                                <p class="card-subtitle">Daftar untuk mulai berbagi cerita</p>
                            </div>
                            <div class="card-body">
                                <!-- Name Field -->
                                <div class="form-group">
                                    <div class="flex items-center gap-2">
                                        <i class="fas fa-user form-icon" aria-hidden="true"></i>
                                        <label for="register-name" class="form-label">
                                            Nama Lengkap *
                                        </label>
                                    </div>
                                    <div class="form-input-group">
                                        <input type="text" 
                                               id="register-name" 
                                               name="name"
                                               class="form-control" 
                                               placeholder="Nama lengkap Anda"
                                               required
                                               minlength="2"
                                               maxlength="50"
                                               autocomplete="name"
                                               aria-describedby="register-name-help">
                                    </div>
                                    <div id="register-name-help" class="form-help">
                                        Nama harus 2-50 karakter, hanya huruf dan spasi
                                    </div>
                                    <div class="form-error" id="register-name-error"></div>
                                </div>

                                <!-- Email Field -->
                                <div class="form-group">
                                    <div class="flex items-center gap-2">
                                        <i class="fas fa-envelope form-icon" aria-hidden="true"></i>
                                        <label for="register-email" class="form-label">
                                            Email *
                                        </label>
                                    </div>
                                    <div class="form-input-group">
                                        <input type="email" 
                                               id="register-email" 
                                               name="email"
                                               class="form-control" 
                                               placeholder="nama@email.com"
                                               required
                                               autocomplete="username"
                                               aria-describedby="register-email-help">
                                    </div>
                                    <div id="register-email-help" class="form-help">
                                        Email harus unik dan belum terdaftar
                                    </div>
                                    <div class="form-error" id="register-email-error"></div>
                                </div>

                                <!-- Password Field -->
                                <div class="form-group">
                                    <div class="flex items-center gap-2">
                                        <i class="fas fa-lock form-icon" aria-hidden="true"></i>
                                        <label for="register-password" class="form-label">
                                            Password *
                                        </label>
                                    </div>
                                    <div class="form-input-group">
                                        <input type="password" 
                                               id="register-password" 
                                               name="password"
                                               class="form-control" 
                                               placeholder="Buat password yang kuat"
                                               required
                                               minlength="8"
                                               autocomplete="new-password"
                                               aria-describedby="register-password-help">
                                    </div>
                                    <div id="register-password-help" class="form-help">
                                        Password minimal 8 karakter dengan kombinasi huruf dan angka
                                    </div>
                                    <div class="form-error" id="register-password-error"></div>
                                </div>

                                <!-- Form Actions -->
                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary btn-block" id="register-submit-btn">
                                        <i class="fas fa-user-plus" aria-hidden="true"></i>
                                        <span id="register-submit-text">Daftar</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                </div>
            </div>
        `;

        return html;
    }

    // Initialize form features and event listeners
    init() {
        this.setupPasswordToggles();
        this.setupFormValidation();
        this.setupModeSwitcher();
    }

    // Setup password visibility toggles
    setupPasswordToggles() {
        const toggles = ['login-password-toggle', 'register-password-toggle'];

        toggles.forEach(toggleId => {
            const toggle = document.getElementById(toggleId);
            const input = document.getElementById(toggleId.replace('-toggle', ''));

            if (toggle && input) {
                toggle.addEventListener('click', () => {
                    const isPassword = input.type === 'password';
                    input.type = isPassword ? 'text' : 'password';

                    const icon = toggle.querySelector('i');
                    if (icon) {
                        icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
                    }

                    toggle.setAttribute('aria-label',
                        isPassword ? 'Sembunyikan password' : 'Tampilkan password'
                    );
                });
            }
        });
    }

    // Setup real-time form validation
    setupFormValidation() {
        // Login form validation
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('input', () => {
                this.validateLoginForm();
            });
        }

        // Register form validation
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('input', () => {
                this.validateRegisterForm();
            });
        }
    }

    // Setup mode switcher
    setupModeSwitcher() {
        const modeBtns = document.querySelectorAll('.mode-btn');
        const switchToRegister = document.getElementById('switch-to-register');
        const switchToLogin = document.getElementById('switch-to-login');

        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.switchMode(mode);
            });
        });

        if (switchToRegister) {
            switchToRegister.addEventListener('click', () => {
                this.switchMode('register');
            });
        }

        if (switchToLogin) {
            switchToLogin.addEventListener('click', () => {
                this.switchMode('login');
            });
        }
    }

    // Switch between login and register modes
    switchMode(mode) {
        this.currentMode = mode;

        // Update mode buttons
        const modeBtns = document.querySelectorAll('.mode-btn');
        modeBtns.forEach(btn => {
            const isActive = btn.dataset.mode === mode;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive);
        });

        // Update form containers
        const loginContainer = document.getElementById('login-form-container');
        const registerContainer = document.getElementById('register-form-container');

        if (mode === 'login') {
            loginContainer.classList.add('active');
            registerContainer.classList.remove('active');

            // Focus first input
            setTimeout(() => {
                const firstInput = document.getElementById('login-email');
                if (firstInput) firstInput.focus();
            }, 100);
        } else {
            loginContainer.classList.remove('active');
            registerContainer.classList.add('active');

            // Focus first input
            setTimeout(() => {
                const firstInput = document.getElementById('register-name');
                if (firstInput) firstInput.focus();
            }, 100);
        }

        // Clear form errors
        this.clearAllErrors();
    }

    // Validate login form
    validateLoginForm() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const submitBtn = document.getElementById('login-submit-btn');

        let isValid = true;

        // Clear previous errors
        this.clearFieldError('login-email');
        this.clearFieldError('login-password');

        // Validate email
        if (!email) {
            this.showFieldError('login-email', 'Email tidak boleh kosong');
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showFieldError('login-email', 'Format email tidak valid');
            isValid = false;
        }

        // Validate password
        if (!password) {
            this.showFieldError('login-password', 'Password tidak boleh kosong');
            isValid = false;
        } else if (password.length < 8) {
            this.showFieldError('login-password', 'Password minimal 8 karakter');
            isValid = false;
        }

        // Update submit button
        submitBtn.disabled = !isValid;

        return isValid;
    }

    // Validate register form
    validateRegisterForm() {
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const submitBtn = document.getElementById('register-submit-btn');

        let isValid = true;

        // Clear previous errors
        this.clearFieldError('register-name');
        this.clearFieldError('register-email');
        this.clearFieldError('register-password');

        // Validate name
        if (!name) {
            this.showFieldError('register-name', 'Nama tidak boleh kosong');
            isValid = false;
        } else if (name.length < 2) {
            this.showFieldError('register-name', 'Nama minimal 2 karakter');
            isValid = false;
        } else if (name.length > 50) {
            this.showFieldError('register-name', 'Nama maksimal 50 karakter');
            isValid = false;
        } else if (!/^[a-zA-Z\s]+$/.test(name)) {
            this.showFieldError('register-name', 'Nama hanya boleh huruf dan spasi');
            isValid = false;
        }

        // Validate email
        if (!email) {
            this.showFieldError('register-email', 'Email tidak boleh kosong');
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showFieldError('register-email', 'Format email tidak valid');
            isValid = false;
        }

        // Validate password
        if (!password) {
            this.showFieldError('register-password', 'Password tidak boleh kosong');
            isValid = false;
        } else if (password.length < 8) {
            this.showFieldError('register-password', 'Password minimal 8 karakter');
            isValid = false;
        }

        // Update submit button
        submitBtn.disabled = !isValid;

        return isValid;
    }

    // Show field error
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}-error`);

        if (field && errorElement) {
            field.classList.add('error');
            field.setAttribute('aria-invalid', 'true');
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    // Clear field error
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}-error`);

        if (field && errorElement) {
            field.classList.remove('error');
            field.setAttribute('aria-invalid', 'false');
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    // Clear all form errors
    clearAllErrors() {
        const errorElements = document.querySelectorAll('.form-error');
        const inputElements = document.querySelectorAll('.form-control');

        errorElements.forEach(element => {
            element.textContent = '';
            element.style.display = 'none';
        });

        inputElements.forEach(element => {
            element.classList.remove('error');
            element.setAttribute('aria-invalid', 'false');
        });
    }

    // Get form data for login
    getLoginData() {
        return {
            email: document.getElementById('login-email').value.trim(),
            password: document.getElementById('login-password').value
        };
    }

    // Get form data for registration
    getRegisterData() {
        return {
            name: document.getElementById('register-name').value.trim(),
            email: document.getElementById('register-email').value.trim(),
            password: document.getElementById('register-password').value
        };
    }

    // Show loading state
    showLoadingState(mode = this.currentMode) {
        const submitBtn = document.getElementById(`${mode}-submit-btn`);
        const submitText = document.getElementById(`${mode}-submit-text`);

        if (submitBtn && submitText) {
            submitBtn.disabled = true;
            submitText.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Memproses...';
        }
    }

    // Hide loading state
    hideLoadingState(mode = this.currentMode) {
        const submitBtn = document.getElementById(`${mode}-submit-btn`);
        const submitText = document.getElementById(`${mode}-submit-text`);

        if (submitBtn && submitText) {
            submitBtn.disabled = false;
            if (mode === 'login') {
                submitText.innerHTML = '<i class="fas fa-sign-in-alt" aria-hidden="true"></i> Masuk';
            } else {
                submitText.innerHTML = '<i class="fas fa-user-plus" aria-hidden="true"></i> Daftar';
            }
        }
    }

    // Clear form data
    clearForm(mode = 'both') {
        if (mode === 'login' || mode === 'both') {
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
        }

        if (mode === 'register' || mode === 'both') {
            document.getElementById('register-name').value = '';
            document.getElementById('register-email').value = '';
            document.getElementById('register-password').value = '';
        }

        this.clearAllErrors();
    }

    // Email validation helper
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Get current mode
    getCurrentMode() {
        return this.currentMode;
    }

    // Get form elements
    getFormElements() {
        return {
            loginForm: document.getElementById('login-form'),
            registerForm: document.getElementById('register-form'),
            continueAsGuestBtn: document.getElementById('continue-as-guest')
        };
    }
}

// Export to global scope
window.AuthView = AuthView; 