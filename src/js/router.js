// Hash-based Router for SPA
class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.defaultRoute = 'home';
        this.init();
    }

    // Initialize router
    init() {
        this.setupRoutes();
        this.setupEventListeners();
        this.handleInitialRoute();
    }

    // Setup application routes
    setupRoutes() {
        this.addRoute('home', {
            path: '#home',
            title: 'Beranda',
            component: 'home',
            presenter: () => new HomePresenter(),
            requiresAuth: false
        });

        this.addRoute('add-story', {
            path: '#add-story',
            title: 'Tambah Story',
            component: 'add-story',
            presenter: () => new AddStoryPresenter(),
            requiresAuth: false // Allow guest access too
        });

        this.addRoute('auth', {
            path: '#auth',
            title: 'Autentikasi',
            component: 'auth',
            presenter: () => new AuthPresenter(),
            requiresAuth: false
        });

        // Default route
        this.addRoute('', {
            path: '#',
            title: 'Beranda',
            component: 'home',
            presenter: () => new HomePresenter(),
            requiresAuth: false
        });
    }

    // Add route to routes map
    addRoute(name, config) {
        this.routes.set(name, config);
    }

    // Setup event listeners
    setupEventListeners() {
        // Listen for hash changes
        window.addEventListener('hashchange', (e) => {
            this.handleRouteChange();
        });

        // Listen for authentication state changes
        if (window.authModel) {
            authModel.addAuthListener((isAuthenticated) => {
                this.handleAuthStateChange(isAuthenticated);
            });
        }
    }

    // Handle initial route on app load
    handleInitialRoute() {
        // Small delay to ensure all components are loaded
        setTimeout(() => {
            this.handleRouteChange();
        }, 100);
    }

    // Handle route changes
    async handleRouteChange() {
        const hash = window.location.hash;
        const routeName = this.extractRouteFromHash(hash);
        const route = this.routes.get(routeName);

        if (!route) {
            console.warn(`Route not found: ${routeName}, redirecting to default`);
            this.navigateTo(this.defaultRoute);
            return;
        }

        // Check authentication requirements
        if (route.requiresAuth && !authUtils.isAuthenticated()) {
            console.log('Route requires authentication, redirecting to auth page');
            this.navigateTo('auth');
            return;
        }

        // Skip if already on this route
        if (this.currentRoute === routeName) {
            return;
        }

        try {
            await this.loadRoute(route, routeName);
        } catch (error) {
            console.error('Error loading route:', error);
            notificationUtils.showError('Gagal memuat halaman');
        }
    }

    // Load route and its components
    async loadRoute(route, routeName) {
        // Show loading
        notificationUtils.showLoading('Memuat halaman...');

        try {
            // Update page title
            document.title = `${route.title} - Dicoding Stories`;

            // Update active navigation
            this.updateActiveNavigation(routeName);

            // Load component with View Transition API
            if (document.startViewTransition) {
                await document.startViewTransition(() => {
                    return this.renderComponent(route);
                });
            } else {
                await this.renderComponent(route);
            }

            // Set current route
            this.currentRoute = routeName;

            // Update browser history if needed
            this.updateHistory(route.path);

        } finally {
            // Hide loading
            notificationUtils.hideLoading();
        }
    }

    // Render component for route
    async renderComponent(route) {
        const contentContainer = document.getElementById('page-content');
        if (!contentContainer) {
            throw new Error('Page content container not found');
        }

        try {
            // Create presenter instance
            const presenter = route.presenter();
            
            // Initialize presenter and render view
            await presenter.init();
            
            // Store current presenter for cleanup
            this.currentPresenter = presenter;

        } catch (error) {
            console.error('Error rendering component:', error);
            
            // Show error page
            contentContainer.innerHTML = `
                <div class="error-page">
                    <div class="card">
                        <div class="card-header">
                            <h2 class="card-title">
                                <i class="fas fa-exclamation-triangle"></i>
                                Error Memuat Halaman
                            </h2>
                        </div>
                        <div class="card-body">
                            <p>Maaf, terjadi kesalahan saat memuat halaman ini.</p>
                            <button class="btn btn-primary" onclick="window.location.reload()">
                                <i class="fas fa-refresh"></i>
                                Muat Ulang
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            throw error;
        }
    }

    // Extract route name from hash
    extractRouteFromHash(hash) {
        if (!hash || hash === '#') {
            return this.defaultRoute;
        }
        
        return hash.replace('#', '');
    }

    // Navigate to route
    navigateTo(routeName, replace = false) {
        const route = this.routes.get(routeName);
        if (!route) {
            console.error(`Route not found: ${routeName}`);
            return;
        }

        if (replace) {
            window.location.replace(route.path);
        } else {
            window.location.hash = route.path.replace('#', '');
        }
    }

    // Update active navigation links
    updateActiveNavigation(currentRoute) {
        // Remove active class from all nav links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to current route link
        const currentLink = document.querySelector(`[href="#${currentRoute}"]`);
        if (currentLink) {
            currentLink.classList.add('active');
        }
    }

    // Update browser history
    updateHistory(path) {
        const currentPath = window.location.hash;
        if (currentPath !== path) {
            // Don't update history if we're already on this path
            // This prevents unnecessary history entries
        }
    }

    // Handle authentication state changes
    handleAuthStateChange(isAuthenticated) {
        // Update navigation visibility
        if (window.authUtils) {
            authUtils.updateNavigationLinks();
        }

        // If user logged out and on protected route, redirect
        if (!isAuthenticated && this.currentRoute) {
            const route = this.routes.get(this.currentRoute);
            if (route && route.requiresAuth) {
                this.navigateTo('home');
            }
        }
    }

    // Get current route name
    getCurrentRoute() {
        return this.currentRoute;
    }

    // Get current route configuration
    getCurrentRouteConfig() {
        return this.routes.get(this.currentRoute);
    }

    // Check if route exists
    hasRoute(routeName) {
        return this.routes.has(routeName);
    }

    // Go back in history
    goBack() {
        window.history.back();
    }

    // Go forward in history
    goForward() {
        window.history.forward();
    }

    // Replace current route
    replaceRoute(routeName) {
        this.navigateTo(routeName, true);
    }

    // Cleanup current presenter before navigation
    cleanup() {
        if (this.currentPresenter && typeof this.currentPresenter.cleanup === 'function') {
            this.currentPresenter.cleanup();
        }
    }

    // Add route guard
    addRouteGuard(routeName, guardFunction) {
        const route = this.routes.get(routeName);
        if (route) {
            route.guard = guardFunction;
        }
    }

    // Check route guards
    async checkRouteGuards(route, routeName) {
        if (route.guard && typeof route.guard === 'function') {
            const canActivate = await route.guard(routeName);
            if (!canActivate) {
                throw new Error('Route guard denied access');
            }
        }
    }

    // Get all routes
    getAllRoutes() {
        return Array.from(this.routes.entries()).map(([name, config]) => ({
            name,
            ...config
        }));
    }

    // Get route breadcrumbs
    getBreadcrumbs() {
        const currentRoute = this.getCurrentRouteConfig();
        if (!currentRoute) return [];

        return [
            { name: 'Beranda', path: '#home' },
            { name: currentRoute.title, path: currentRoute.path, active: true }
        ];
    }
}

// Create global router instance
const router = new Router();

// Export for use in other modules
window.router = router; 