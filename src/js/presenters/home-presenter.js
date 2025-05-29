// Home Presenter - coordinates between HomeView and StoryModel
class HomePresenter {
    constructor() {
        this.view = new HomeView();
        this.model = storyModel;
        this.mapInstance = null;
        this.currentFilter = 'all';
        this.currentSortOrder = 'newest';
        this.searchTerm = '';
        this.debounceTimer = null;
        this.isInitialized = false;
    }

    // Initialize presenter and render view
    async init() {
        try {
            console.log('Initializing Home Presenter...');
            
            // Initialize view
            this.view.init();

            // Render view to DOM
            await this.renderView();

            // Setup event listeners
            this.setupEventListeners();

            // Initialize map
            await this.initializeMap();

            // Load initial data
            await this.loadStories();

            this.isInitialized = true;
            console.log('Home Presenter initialized successfully');

        } catch (error) {
            console.error('Error initializing Home Presenter:', error);
            notificationUtils.handleApiError(error, 'Gagal memuat halaman beranda');
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
        console.log('Setting up Home Presenter event listeners...');

        // Search functionality
        const searchInput = this.view.getSearchInput();
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });

            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleSearch(e.target.value);
                }
            });
        }

        // Sort functionality
        const sortSelect = this.view.getSortSelect();
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.handleSortChange(e.target.value);
            });
        }

        // Filter functionality
        const filterButtons = this.view.getFilterButtons();
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter || e.target.closest('[data-filter]').dataset.filter;
                this.handleFilterChange(filter);
            });
        });

        // Refresh functionality
        const refreshButton = this.view.getRefreshButton();
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.handleRefresh();
            });
        }

        // Map control buttons
        const mapControls = this.view.getMapControlButtons();
        if (mapControls.centerMap) {
            mapControls.centerMap.addEventListener('click', () => {
                this.handleCenterMap();
            });
        }

        if (mapControls.fitMarkers) {
            mapControls.fitMarkers.addEventListener('click', () => {
                this.handleFitMarkers();
            });
        }

        // Clear search button
        const clearSearchButton = this.view.getClearSearchButton();
        if (clearSearchButton) {
            clearSearchButton.addEventListener('click', () => {
                this.handleClearSearch();
            });
        }

        // Listen for auth state changes
        if (authModel) {
            authModel.addAuthListener(() => {
                this.handleAuthStateChange();
            });
        }
    }

    // Initialize map
    async initializeMap() {
        try {
            console.log('Initializing map...');
            
            // Initialize map instance
            this.mapInstance = mapUtils.initializeMap('stories-map', {
                center: [-6.2088, 106.8456], // Jakarta
                zoom: 10
            });

            console.log('Map initialized successfully');

        } catch (error) {
            console.error('Error initializing map:', error);
            
            // Show map placeholder with error message
            const mapContainer = document.getElementById('stories-map');
            if (mapContainer) {
                mapContainer.innerHTML = `
                    <div class="map-placeholder">
                        <i class="fas fa-map-marked-alt" aria-hidden="true"></i>
                        <p>Gagal memuat peta</p>
                        <button class="btn btn-secondary" onclick="window.location.reload()">
                            Muat Ulang
                        </button>
                    </div>
                `;
            }
        }
    }

    // Load stories from API
    async loadStories(forceRefresh = false) {
        try {
            console.log('Loading stories...');
            
            // Show loading state
            this.view.showLoading();

            // Fetch stories from model
            console.log('Calling model.getStories...');
            const stories = await this.model.getStories(forceRefresh);
            console.log('Stories received from model:', stories);

            // Process and display stories
            console.log('Displaying stories...');
            this.displayStories(stories);

            // Update statistics
            console.log('Updating statistics...');
            this.updateStatistics(stories);

            // Update map with stories
            console.log('Updating map...');
            this.updateMap(stories);

            console.log(`Loaded ${stories.length} stories successfully`);

        } catch (error) {
            console.error('Error loading stories:', error);
            notificationUtils.handleApiError(error, 'Gagal memuat stories');
            
            // Show empty state on error
            this.view.renderStoriesGrid([]);
        } finally {
            // Always hide loading state
            console.log('Hiding loading state...');
            this.view.hideLoading();
        }
    }

    // Display stories with current filter and sort
    displayStories(stories) {
        let filteredStories = this.applyFilters(stories);
        let sortedStories = this.applySorting(filteredStories);

        this.view.renderStoriesGrid(sortedStories);
    }

    // Apply current filters to stories
    applyFilters(stories) {
        let filtered = [...stories];

        // Apply search filter
        if (this.searchTerm) {
            filtered = this.model.searchStories(this.searchTerm);
        }

        // Apply location filter
        switch (this.currentFilter) {
            case 'with-location':
                filtered = filtered.filter(story => story.lat && story.lon);
                break;
            case 'without-location':
                filtered = filtered.filter(story => !story.lat || !story.lon);
                break;
            default:
                // 'all' - no additional filtering
                break;
        }

        return filtered;
    }

    // Apply current sorting to stories
    applySorting(stories) {
        switch (this.currentSortOrder) {
            case 'oldest':
                return this.model.sortStoriesByDate(true);
            case 'name':
                return [...stories].sort((a, b) => 
                    (a.name || '').localeCompare(b.name || '')
                );
            default: // 'newest'
                return this.model.sortStoriesByDate(false);
        }
    }

    // Update statistics display
    updateStatistics(stories) {
        const stats = this.model.getStoriesStatistics();
        this.view.updateStatistics(stats);
    }

    // Update map with stories
    updateMap(stories) {
        if (!this.mapInstance) return;

        try {
            // Display stories with location on map
            const storiesWithLocation = this.model.getStoriesWithLocation();
            mapUtils.displayStoriesOnMap(storiesWithLocation);

        } catch (error) {
            console.error('Error updating map:', error);
        }
    }

    // Handle search input
    handleSearch(searchTerm) {
        // Clear previous debounce timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Debounce search to avoid excessive API calls
        this.debounceTimer = setTimeout(() => {
            this.searchTerm = searchTerm.trim();
            this.refreshDisplay();
        }, 300);
    }

    // Handle sort change
    handleSortChange(sortOrder) {
        this.currentSortOrder = sortOrder;
        this.refreshDisplay();
    }

    // Handle filter change
    handleFilterChange(filter) {
        this.currentFilter = filter;
        this.view.updateActiveFilter(filter);
        this.refreshDisplay();
    }

    // Handle refresh button click
    async handleRefresh() {
        try {
            const refreshButton = this.view.getRefreshButton();
            if (refreshButton) {
                refreshButton.disabled = true;
                const icon = refreshButton.querySelector('i');
                if (icon) {
                    icon.style.animation = 'spin 1s linear infinite';
                }
            }

            await this.loadStories(true); // Force refresh
            notificationUtils.showSuccess('Stories berhasil dimuat ulang', true);

        } catch (error) {
            notificationUtils.handleApiError(error, 'Gagal memuat ulang stories');
        } finally {
            const refreshButton = this.view.getRefreshButton();
            if (refreshButton) {
                refreshButton.disabled = false;
                const icon = refreshButton.querySelector('i');
                if (icon) {
                    icon.style.animation = '';
                }
            }
        }
    }

    // Handle center map on user location
    async handleCenterMap() {
        if (!this.mapInstance) return;

        try {
            const centerButton = this.view.getMapControlButtons().centerMap;
            if (centerButton) {
                centerButton.disabled = true;
            }

            await mapUtils.centerOnCurrentLocation();
            notificationUtils.showSuccess('Peta dipusatkan pada lokasi Anda', true);

        } catch (error) {
            console.error('Error centering map:', error);
            notificationUtils.showWarning('Gagal mendapatkan lokasi Anda');
        } finally {
            const centerButton = this.view.getMapControlButtons().centerMap;
            if (centerButton) {
                centerButton.disabled = false;
            }
        }
    }

    // Handle fit all markers in map view
    handleFitMarkers() {
        if (!this.mapInstance) return;

        try {
            const storiesWithLocation = this.model.getStoriesWithLocation();
            if (storiesWithLocation.length === 0) {
                notificationUtils.showInfo('Tidak ada stories dengan lokasi untuk ditampilkan');
                return;
            }

            // Map utils will handle fitting bounds
            mapUtils.displayStoriesOnMap(storiesWithLocation);
            notificationUtils.showSuccess('Menampilkan semua stories dengan lokasi', true);

        } catch (error) {
            console.error('Error fitting markers:', error);
            notificationUtils.showWarning('Gagal menampilkan semua markers');
        }
    }

    // Handle clear search
    handleClearSearch() {
        const searchInput = this.view.getSearchInput();
        if (searchInput) {
            searchInput.value = '';
        }
        
        this.searchTerm = '';
        this.refreshDisplay();
    }

    // Handle auth state changes
    handleAuthStateChange() {
        // Re-render page header to update action buttons
        const pageHeader = document.querySelector('.page-header');
        if (pageHeader) {
            // Update action buttons based on auth state
            const pageActions = pageHeader.querySelector('.page-actions');
            if (pageActions) {
                pageActions.innerHTML = `
                    <button class="btn btn-secondary" id="refresh-stories">
                        <i class="fas fa-sync-alt" aria-hidden="true"></i>
                        Muat Ulang
                    </button>
                    ${authUtils.isAuthenticated() ? `
                        <a href="#add-story" class="btn btn-primary">
                            <i class="fas fa-plus" aria-hidden="true"></i>
                            Tambah Story
                        </a>
                    ` : `
                        <a href="#auth" class="btn btn-primary">
                            <i class="fas fa-user" aria-hidden="true"></i>
                            Login untuk Tambah Story
                        </a>
                    `}
                `;

                // Re-attach refresh button event listener
                const refreshButton = pageActions.querySelector('#refresh-stories');
                if (refreshButton) {
                    refreshButton.addEventListener('click', () => {
                        this.handleRefresh();
                    });
                }
            }
        }
    }

    // Refresh display with current filters and sort
    refreshDisplay() {
        const stories = this.model.stories || [];
        this.displayStories(stories);
    }

    // Get current view state
    getViewState() {
        return {
            currentFilter: this.currentFilter,
            currentSortOrder: this.currentSortOrder,
            searchTerm: this.searchTerm,
            storiesCount: this.model.stories?.length || 0,
            isInitialized: this.isInitialized
        };
    }

    // Handle story selection (for future implementation)
    handleStorySelection(storyId) {
        console.log('Story selected:', storyId);
        
        // Future implementation:
        // - Show story detail modal
        // - Navigate to story detail page
        // - Highlight story on map
    }

    // Handle errors
    handleError(error, context = 'Unknown') {
        console.error(`Error in ${context}:`, error);
        notificationUtils.handleApiError(error, `Terjadi kesalahan: ${context}`);
    }

    // Cleanup resources
    cleanup() {
        console.log('Cleaning up Home Presenter...');

        // Clear debounce timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }

        // Cleanup map
        if (this.mapInstance) {
            mapUtils.cleanup();
            this.mapInstance = null;
        }

        // Remove auth listener
        if (authModel) {
            // Note: we'd need to implement removeAuthListener with specific callback reference
            // For now, we'll leave this as a placeholder
        }

        this.isInitialized = false;
    }

    // Get presenter info for debugging
    getInfo() {
        return {
            name: 'HomePresenter',
            isInitialized: this.isInitialized,
            viewState: this.getViewState(),
            hasMap: !!this.mapInstance,
            modelStats: this.model ? this.model.getStoriesStatistics() : null
        };
    }
}

// Export for use in router
window.HomePresenter = HomePresenter; 