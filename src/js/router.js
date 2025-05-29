class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.defaultRoute = 'auth';
        this.init();
    }

    init() {
        this.setupRoutes();
        this.setupEventListeners();
        this.handleInitialRoute();
    }

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

        this.addRoute('', {
            path: '#',
            title: 'Beranda',
            component: 'home',
            presenter: () => {
                if (authUtils && authUtils.isAuthenticated()) {
                    return new HomePresenter();
                } else {
                    router.navigateTo('auth');
                    return new AuthPresenter();
                }
            },
            requiresAuth: false
        });
    }

    addRoute(name, config) {
        this.routes.set(name, config);
    }

    setupEventListeners() {
        window.addEventListener('hashchange', (e) => {
            this.handleRouteChange();
        });

        if (window.authModel) {
            authModel.addAuthListener((isAuthenticated) => {
                this.handleAuthStateChange(isAuthenticated);
            });
        }
    }

    handleInitialRoute() {
        setTimeout(() => {
            this.handleRouteChange();
        }, 100);
    }


    async handleRouteChange() {
        const hash = window.location.hash;
        const routeName = this.extractRouteFromHash(hash);
        const route = this.routes.get(routeName);

        if (!route) {
            console.warn(`Route not found: ${routeName}, redirecting to default`);
            this.navigateTo(this.defaultRoute);
            return;
        }

        const isAuthenticated = authUtils.isAuthenticated();

        if (!isAuthenticated && routeName !== 'auth') {
            console.log('User not authenticated, redirecting to auth page');
            this.navigateTo('auth');
            return;
        }

        if (isAuthenticated && routeName === 'auth') {
            console.log('User already authenticated, redirecting to home');
            this.navigateTo('home');
            return;
        }

        if (route.requiresAuth && !isAuthenticated) {
            console.log('Route requires authentication, redirecting to auth page');
            this.navigateTo('auth');
            return;
        }

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

    async loadRoute(route, routeName) {
        notificationUtils.showLoading('Memuat halaman...');

        try {
            document.title = `${route.title} - Dicoding Stories`;

            this.updateActiveNavigation(routeName);

            if (document.startViewTransition) {
                await document.startViewTransition(() => {
                    return this.renderComponent(route);
                });
            } else {
                await this.renderComponent(route);
            }

            this.currentRoute = routeName;

        } finally {
            notificationUtils.hideLoading();
        }
    }

    async renderComponent(route) {
        const contentContainer = document.getElementById('page-content');
        if (!contentContainer) {
            throw new Error('Page content container not found');
        }

        try {
            const presenter = route.presenter();

            await presenter.init();

            this.currentPresenter = presenter;

        } catch (error) {
            console.error('Error rendering component:', error);

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

    extractRouteFromHash(hash) {
        if (!hash || hash === '#') {
            if (authUtils && authUtils.isAuthenticated()) {
                return 'home';
            } else {
                return 'auth';
            }
        }

        return hash.replace('#', '');
    }

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

    updateActiveNavigation(currentRoute) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        const currentLink = document.querySelector(`[href="#${currentRoute}"]`);
        if (currentLink) {
            currentLink.classList.add('active');
        }
    }

    // Handle authentication state changes
    handleAuthStateChange(isAuthenticated) {
        console.log('Auth state changed:', isAuthenticated);

        // Update navigation visibility
        if (window.authUtils) {
            authUtils.updateNavigationLinks();
        }

        // Handle authentication state changes
        if (isAuthenticated) {
            // User just logged in
            if (this.currentRoute === 'auth') {
                // If user is on auth page, redirect to home
                console.log('User authenticated, redirecting from auth to home');
                this.navigateTo('home');
            }
        } else {
            // User just logged out or is not authenticated
            if (this.currentRoute !== 'auth') {
                // If user is not on auth page, redirect to auth
                console.log('User not authenticated, redirecting to auth page');
                this.navigateTo('auth');
            }
        }
    }

    getCurrentRoute() {
        return this.currentRoute;
    }

    getCurrentRouteConfig() {
        return this.routes.get(this.currentRoute);
    }

    hasRoute(routeName) {
        return this.routes.has(routeName);
    }

    replaceRoute(routeName) {
        this.navigateTo(routeName, true);
    }

    cleanup() {
        if (this.currentPresenter && typeof this.currentPresenter.cleanup === 'function') {
            this.currentPresenter.cleanup();
        }
    }

    addRouteGuard(routeName, guardFunction) {
        const route = this.routes.get(routeName);
        if (route) {
            route.guard = guardFunction;
        }
    }

    async checkRouteGuards(route, routeName) {
        if (route.guard && typeof route.guard === 'function') {
            const canActivate = await route.guard(routeName);
            if (!canActivate) {
                throw new Error('Route guard denied access');
            }
        }
    }

    getAllRoutes() {
        return Array.from(this.routes.entries()).map(([name, config]) => ({
            name,
            ...config
        }));
    }

    getBreadcrumbs() {
        const currentRoute = this.getCurrentRouteConfig();
        if (!currentRoute) return [];

        return [
            { name: 'Beranda', path: '#home' },
            { name: currentRoute.title, path: currentRoute.path, active: true }
        ];
    }
}

const router = new Router();

window.router = router; 