// Home View - displays stories list and map
class HomeView {
    constructor() {
        this.container = null;
        this.storiesContainer = null;
        this.mapContainer = null;
        this.searchInput = null;
        this.refreshButton = null;
    }

    // Render the home view
    render() {
        const html = `
            <div class="home-page">
                <!-- Page Header -->
                <header class="page-header">
                    <div class="page-title-section">
                        <h1 class="page-title">
                            <i class="fas fa-home" aria-hidden="true"></i>
                            Beranda Dicoding Stories
                        </h1>
                        <p class="page-subtitle">Jelajahi cerita-cerita menarik dari komunitas Dicoding</p>
                    </div>
                    <div class="page-actions">
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
                    </div>
                </header>

                <!-- Stories Statistics -->
                <section class="stats-section" aria-label="Statistik Stories">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-book" aria-hidden="true"></i>
                            </div>
                            <div class="stat-content">
                                <div class="stat-number" id="total-stories">-</div>
                                <div class="stat-label">Total Stories</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-map-marked-alt" aria-hidden="true"></i>
                            </div>
                            <div class="stat-content">
                                <div class="stat-number" id="stories-with-location">-</div>
                                <div class="stat-label">Dengan Lokasi</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-users" aria-hidden="true"></i>
                            </div>
                            <div class="stat-content">
                                <div class="stat-number" id="unique-authors">-</div>
                                <div class="stat-label">Penulis Unik</div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Map Section -->
                <section class="map-section" aria-label="Peta Lokasi Stories">
                    <div class="card">
                        <div class="card-header">
                            <h2 class="card-title">
                                <i class="fas fa-map" aria-hidden="true"></i>
                                Peta Stories
                            </h2>
                            <div class="map-controls">
                                <button class="btn btn-secondary" id="center-map">
                                    <i class="fas fa-crosshairs" aria-hidden="true"></i>
                                    Lokasi Saya
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div id="stories-map" class="map-container" tabindex="0" role="application" aria-label="Peta interaktif menampilkan lokasi stories"></div>
                        </div>
                    </div>
                </section>

                <!-- Stories Grid Section -->
                <section class="stories-section mt-4" aria-label="Daftar Stories">
                    <div class="section-header">
                        <h2 class="section-title">
                            <i class="fas fa-list" aria-hidden="true"></i>
                            Stories Terbaru
                        </h2>
                        <div class="sort-controls">
                            <label for="sort-select" class="form-label">Urutkan:</label>
                            <select id="sort-select" class="form-control">
                                <option value="newest">Terbaru</option>
                                <option value="oldest">Terlama</option>
                                <option value="name">Nama A-Z</option>
                            </select>
                        </div>
                    </div>
                    

                    <!-- Stories grid -->
                    <div id="stories-grid" class="stories-grid" role="region" aria-label="Grid stories">
                        <!-- Stories will be populated here -->
                    </div>
                </section>
            </div>
        `;

        return html;
    }

    // Render stories grid
    renderStoriesGrid(stories) {
        const storiesGrid = document.getElementById('stories-grid');
        const storiesLoading = document.getElementById('stories-loading');
        const storiesEmpty = document.getElementById('stories-empty');
        const storiesNoResults = document.getElementById('stories-no-results');

        if (!storiesGrid) return;

        // Hide loading
        if (storiesLoading) {
            storiesLoading.classList.add('hidden');
        }

        // Check if stories exist
        if (!stories || stories.length === 0) {
            storiesGrid.innerHTML = '';
            
            // Determine which empty state to show
            const searchInput = document.getElementById('story-search');
            const hasSearchTerm = searchInput && searchInput.value.trim() !== '';
            
            if (hasSearchTerm) {
                // Show no results state
                if (storiesEmpty) storiesEmpty.classList.add('hidden');
                if (storiesNoResults) storiesNoResults.classList.remove('hidden');
            } else {
                // Show empty state
                if (storiesEmpty) storiesEmpty.classList.remove('hidden');
                if (storiesNoResults) storiesNoResults.classList.add('hidden');
            }
            return;
        }

        // Hide empty states
        if (storiesEmpty) storiesEmpty.classList.add('hidden');
        if (storiesNoResults) storiesNoResults.classList.add('hidden');

        // Render stories
        const storiesHTML = stories.map(story => this.renderStoryCard(story)).join('');
        storiesGrid.innerHTML = storiesHTML;

        // Add click handlers for story cards
        this.addStoryCardHandlers();
    }

    // Render individual story card
    renderStoryCard(story) {
        const formattedStory = storyModel.formatStoryForDisplay(story);
        
        return `
            <article class="story-card" data-story-id="${story.id}" tabindex="0" role="button" aria-label="Story dari ${this.escapeHtml(story.name)}">
                <div class="story-image-container">
                    <img 
                        src="${story.photoUrl}" 
                        alt="Foto story dari ${this.escapeHtml(story.name)}: ${this.escapeHtml(formattedStory.shortDescription)}"
                        class="story-image"
                        loading="lazy"
                        onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y4ZmFmYyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2YjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5HYWdhbCBtZW11YXQgZ2FtYmFyPC90ZXh0Pjwvc3ZnPg=='"
                    >
                    ${formattedStory.hasLocation ? '<div class="location-badge" title="Story ini memiliki lokasi"><i class="fas fa-map-marker-alt"></i></div>' : ''}
                </div>
                <div class="story-content">
                    <h3 class="story-title">${this.escapeHtml(story.name || 'Tanpa Nama')}</h3>
                    <p class="story-description">${this.escapeHtml(formattedStory.shortDescription)}</p>
                    <div class="story-meta">
                        <span class="story-date">
                            <i class="fas fa-calendar" aria-hidden="true"></i>
                            <time datetime="${story.createdAt}">${formattedStory.formattedDate}</time>
                        </span>
                        ${formattedStory.hasLocation ? `
                            <span class="story-location">
                                <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                                Lokasi tersedia
                            </span>
                        ` : ''}
                    </div>
                </div>
            </article>
        `;
    }

    // Add click handlers for story cards
    addStoryCardHandlers() {
        const storyCards = document.querySelectorAll('.story-card');
        storyCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const storyId = card.dataset.storyId;
                this.onStoryCardClick(storyId);
            });

            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const storyId = card.dataset.storyId;
                    this.onStoryCardClick(storyId);
                }
            });
        });
    }

    // Handle story card click
    onStoryCardClick(storyId) {
        // For now, we'll just show the story details in a modal
        // In a full implementation, this might navigate to a detail page
        console.log('Story clicked:', storyId);
        
        // You can implement story detail modal here
        // or navigate to a detail route
    }

    // Update statistics display
    updateStatistics(stats) {
        const elements = {
            'total-stories': stats.total,
            'stories-with-location': stats.withLocation,
            'unique-authors': stats.uniqueAuthors
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value || 0;
            }
        });
    }

    // Show loading state
    showLoading() {
        const storiesLoading = document.getElementById('stories-loading');
        const storiesGrid = document.getElementById('stories-grid');
        
        if (storiesLoading) {
            storiesLoading.classList.remove('hidden');
        }
        
        if (storiesGrid) {
            storiesGrid.innerHTML = '';
        }
    }

    // Hide loading state
    hideLoading() {
        const storiesLoading = document.getElementById('stories-loading');
        
        if (storiesLoading) {
            storiesLoading.classList.add('hidden');
        }
    }

    // Get search input element
    getSearchInput() {
        return document.getElementById('story-search');
    }

    // Get sort select element
    getSortSelect() {
        return document.getElementById('sort-select');
    }

    // Get filter buttons
    getFilterButtons() {
        return document.querySelectorAll('.filter-btn');
    }

    // Get refresh button
    getRefreshButton() {
        return document.getElementById('refresh-stories');
    }

    // Get map control buttons
    getMapControlButtons() {
        return {
            centerMap: document.getElementById('center-map'),
            fitMarkers: document.getElementById('fit-markers')
        };
    }

    // Get clear search button
    getClearSearchButton() {
        return document.getElementById('clear-search');
    }

    // Update active filter button
    updateActiveFilter(activeFilter) {
        const filterButtons = this.getFilterButtons();
        filterButtons.forEach(btn => {
            if (btn.dataset.filter === activeFilter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // Helper function to escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Add additional CSS for home view
    addCustomStyles() {
        if (document.getElementById('home-view-styles')) return;

        const style = document.createElement('style');
        style.id = 'home-view-styles';
        style.textContent = `
            .search-input-wrapper {
                position: relative;
            }
            
            .search-icon {
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                color: var(--text-secondary);
                pointer-events: none;
            }
            
            .filter-controls {
                display: flex;
                gap: 0.5rem;
                margin-top: 1rem;
            }
            
            .filter-btn.active {
                background-color: var(--primary-color);
                color: white;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-bottom: 2rem;
            }
            
            .stat-card {
                background: var(--surface-color);
                border-radius: var(--border-radius);
                padding: 1.5rem;
                border: 1px solid var(--border-color);
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .stat-icon {
                font-size: 2rem;
                color: var(--primary-color);
            }
            
            .stat-number {
                font-size: 2rem;
                font-weight: 700;
                color: var(--text-primary);
            }
            
            .stat-label {
                color: var(--text-secondary);
                font-size: 0.875rem;
            }
            
            .location-badge {
                position: absolute;
                top: 8px;
                right: 8px;
                background: var(--primary-color);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.75rem;
            }
            
            .empty-state {
                text-align: center;
                padding: 3rem 1rem;
            }
            
            .empty-icon {
                font-size: 4rem;
                color: var(--text-secondary);
                margin-bottom: 1rem;
            }
            
            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
            }
            
            .sort-controls {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .sort-controls .form-control {
                width: auto;
                min-width: 120px;
            }
            
            @media (max-width: 768px) {
                .section-header {
                    flex-direction: column;
                    gap: 1rem;
                    align-items: stretch;
                }
                
                .page-actions {
                    flex-direction: column;
                    gap: 0.5rem;
                }
                
                .filter-controls {
                    flex-wrap: wrap;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize the view
    init() {
        this.addCustomStyles();
    }
}

// Export for use in presenter
window.HomeView = HomeView; 