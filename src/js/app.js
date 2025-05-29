// Main Application Class
class App {
    constructor() {
        this.isInitialized = false;
        this.components = new Map();
        this.init();
    }

    // Initialize application
    async init() {
        try {
            console.log('Initializing Dicoding Stories App...');
            
            // Show initial loading
            this.showInitialLoading();

            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.startInitialization();
                });
            } else {
                this.startInitialization();
            }

        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showInitializationError(error);
        }
    }

    // Start the initialization process
    async startInitialization() {
        try {
            // Initialize core components
            await this.initializeComponents();

            // Setup event listeners
            this.setupEventListeners();

            // Setup application features
            this.setupApplicationFeatures();

            // Initialize authentication
            this.initializeAuthentication();

            // Mark as initialized
            this.isInitialized = true;

            // Hide loading
            this.hideInitialLoading();

            console.log('App initialized successfully');

        } catch (error) {
            console.error('Error during initialization:', error);
            this.showInitializationError(error);
        }
    }

    // Show initial loading screen
    showInitialLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.remove('hidden');
        }
    }

    // Hide initial loading screen
    hideInitialLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            setTimeout(() => {
                loading.classList.add('hidden');
            }, 500);
        }
    }

    // Initialize core components
    async initializeComponents() {
        console.log('Initializing core components...');

        // Initialize API client
        if (window.apiClient) {
            this.components.set('apiClient', apiClient);
        }

        // Initialize notification system
        if (window.notificationUtils) {
            notificationUtils.setupNetworkStatusNotifications();
            this.components.set('notificationUtils', notificationUtils);
        }

        // Initialize auth utilities
        if (window.authUtils) {
            authUtils.initAuthUI();
            this.components.set('authUtils', authUtils);
        }

        // Initialize camera utilities
        if (window.cameraUtils) {
            this.components.set('cameraUtils', cameraUtils);
        }

        // Initialize map utilities
        if (window.mapUtils) {
            this.components.set('mapUtils', mapUtils);
        }

        // Initialize models
        if (window.storyModel) {
            this.components.set('storyModel', storyModel);
        }

        if (window.authModel) {
            this.components.set('authModel', authModel);
        }

        // Initialize router (this should be last)
        if (window.router) {
            this.components.set('router', router);
        }
    }

    // Setup global event listeners
    setupEventListeners() {
        console.log('Setting up event listeners...');

        // Mobile menu toggle
        this.setupMobileMenu();

        // Global keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Window events
        this.setupWindowEvents();

        // Auth button event (if not handled by authUtils)
        this.setupAuthButton();
    }

    // Setup mobile menu functionality
    setupMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const navLinks = document.querySelector('.nav-links');

        if (mobileMenuToggle && navLinks) {
            mobileMenuToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                
                // Update aria-expanded
                const isExpanded = navLinks.classList.contains('active');
                mobileMenuToggle.setAttribute('aria-expanded', isExpanded);
                
                // Update icon
                const icon = mobileMenuToggle.querySelector('i');
                if (icon) {
                    if (isExpanded) {
                        icon.className = 'fas fa-times';
                    } else {
                        icon.className = 'fas fa-bars';
                    }
                }
            });

            // Close mobile menu when clicking on links
            navLinks.addEventListener('click', (e) => {
                if (e.target.classList.contains('nav-link')) {
                    navLinks.classList.remove('active');
                    mobileMenuToggle.setAttribute('aria-expanded', 'false');
                    
                    const icon = mobileMenuToggle.querySelector('i');
                    if (icon) {
                        icon.className = 'fas fa-bars';
                    }
                }
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!navLinks.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                    navLinks.classList.remove('active');
                    mobileMenuToggle.setAttribute('aria-expanded', 'false');
                    
                    const icon = mobileMenuToggle.querySelector('i');
                    if (icon) {
                        icon.className = 'fas fa-bars';
                    }
                }
            });
        }
    }

    // Setup keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt + H for Home
            if (e.altKey && e.key === 'h') {
                e.preventDefault();
                router.navigateTo('home');
            }
            
            // Alt + A for Add Story (if authenticated)
            if (e.altKey && e.key === 'a') {
                e.preventDefault();
                if (authUtils.isAuthenticated()) {
                    router.navigateTo('add-story');
                } else {
                    notificationUtils.showWarning('Silakan login terlebih dahulu');
                }
            }
            
            // Alt + L for Login/Logout
            if (e.altKey && e.key === 'l') {
                e.preventDefault();
                if (authUtils.isAuthenticated()) {
                    authUtils.logout();
                } else {
                    router.navigateTo('auth');
                }
            }
        });
    }

    // Setup window events
    setupWindowEvents() {
        // Handle app visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isInitialized) {
                // App became visible, refresh auth state
                if (authModel) {
                    authModel.refreshAuthState();
                }
            }
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            console.log('App is online');
            // Optionally refresh data when coming back online
        });

        window.addEventListener('offline', () => {
            console.log('App is offline');
        });

        // Handle before unload
        window.addEventListener('beforeunload', (e) => {
            this.cleanup();
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            
            // Show user-friendly error
            if (notificationUtils) {
                notificationUtils.showError('Terjadi kesalahan yang tidak terduga');
            }
        });

        // Handle global errors
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            
            // Show user-friendly error for critical issues
            if (e.error && e.error.message && e.error.message.includes('Script error')) {
                // Ignore script errors from external sources
                return;
            }
            
            if (notificationUtils) {
                notificationUtils.showError('Terjadi kesalahan aplikasi');
            }
        });
    }

    // Setup auth button functionality
    setupAuthButton() {
        // This is handled by authUtils, but we can add additional logic here if needed
    }

    // Setup application features
    setupApplicationFeatures() {
        console.log('Setting up application features...');

        // Setup performance monitoring
        this.setupPerformanceMonitoring();

        // Setup accessibility features
        this.setupAccessibilityFeatures();
    }

    // Setup performance monitoring
    setupPerformanceMonitoring() {
        // Monitor performance metrics
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData) {
                        console.log('App load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
                    }
                }, 1000);
            });
        }
    }

    // Setup accessibility features
    setupAccessibilityFeatures() {
        // Add focus indicators for keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // Add ARIA live region for dynamic content announcements
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
        liveRegion.id = 'live-region';
        document.body.appendChild(liveRegion);
    }

    // Initialize authentication
    initializeAuthentication() {
        console.log('Initializing authentication...');
        
    }

    // Get application information
    getAppInfo() {
        return {
            name: 'Dicoding Stories',
            version: '1.0.0',
            initialized: this.isInitialized,
            components: Array.from(this.components.keys()),
            currentRoute: router ? router.getCurrentRoute() : null,
            isAuthenticated: authUtils ? authUtils.isAuthenticated() : false
        };
    }

    // Show initialization error
    showInitializationError(error) {
        console.error('Initialization error:', error);
        
        const contentContainer = document.getElementById('page-content');
        if (contentContainer) {
            contentContainer.innerHTML = `
                <div class="initialization-error">
                    <div class="card">
                        <div class="card-header">
                            <h2 class="card-title text-danger">
                                <i class="fas fa-exclamation-triangle"></i>
                                Gagal Memuat Aplikasi
                            </h2>
                        </div>
                        <div class="card-body">
                            <p>Maaf, terjadi kesalahan saat memuat aplikasi.</p>
                            <p class="text-secondary">Error: ${error.message}</p>
                            <button class="btn btn-primary" onclick="window.location.reload()">
                                <i class="fas fa-refresh"></i>
                                Muat Ulang Aplikasi
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        this.hideInitialLoading();
    }

    // Cleanup application resources
    cleanup() {
        console.log('Cleaning up application...');
        
        // Cleanup router
        if (router) {
            router.cleanup();
        }

        // Cleanup camera
        if (cameraUtils) {
            cameraUtils.cleanup();
        }

        // Cleanup map
        if (mapUtils) {
            mapUtils.cleanup();
        }

    }

    // Restart application
    restart() {
        this.cleanup();
        window.location.reload();
    }

    // Get component by name
    getComponent(name) {
        return this.components.get(name);
    }

    // Check if app is ready
    isReady() {
        return this.isInitialized;
    }
}

// Initialize the application when script loads
const app = new App();

// Export for debugging and external access
window.app = app;

// Debug information
if (process?.env?.NODE_ENV === 'development') {
    window.addEventListener('load', () => {
        console.log('App Info:', app.getAppInfo());
    });
} 