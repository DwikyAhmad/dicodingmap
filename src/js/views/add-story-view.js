// Add Story View - form for adding new stories
class AddStoryView {
    constructor() {
        this.container = null;
    }

    // Render the add story view
    render() {
        const html = `
            <div class="add-story-page">
                <!-- Page Header -->
                <header class="page-header">
                    <h1 class="page-title">
                        <i class="fas fa-plus" aria-hidden="true"></i>
                        Tambah Story Baru
                    </h1>
                    <p class="page-subtitle">Bagikan cerita menarik Anda kepada komunitas Dicoding</p>
                </header>

                <!-- Add Story Form -->
                <div class="add-story-form">
                    <form id="add-story-form" class="card" novalidate>
                        <div class="card-header">
                            <h2 class="card-title">
                                <i class="fas fa-edit" aria-hidden="true"></i>
                                Detail Story
                            </h2>
                        </div>
                        <div class="card-body">
                            <!-- Description Field -->
                            <div class="form-group">
                                <label for="story-description" class="form-label">
                                    Deskripsi Story *
                                </label>
                                <textarea
                                    id="story-description"
                                    name="description"
                                    class="form-control"
                                    rows="4"
                                    placeholder="Ceritakan pengalaman menarik Anda di Dicoding..."
                                    required
                                    minlength="10"
                                    maxlength="1000"
                                    aria-describedby="description-help description-counter"
                                ></textarea>
                                <div id="description-help" class="form-help">
                                    Minimal 10 karakter, maksimal 1000 karakter
                                </div>
                                <div id="description-counter" class="form-counter">
                                    <span id="char-count">0</span>/1000 karakter
                                </div>
                            </div>

                            <!-- Photo Section -->
                            <div class="form-group">
                                <label class="form-label">
                                    Foto Story *
                                </label>
                                <div id="camera-section">
                                    <!-- Camera UI will be injected here -->
                                </div>
                                <div class="form-help">
                                    Ambil foto menggunakan kamera atau pilih dari galeri (max 1MB)
                                </div>
                            </div>

                            <!-- Location Section -->
                            <div class="form-group">
                                <label class="form-label">
                                    Lokasi Story (Opsional)
                                </label>
                                <div class="location-section">
                                    <div class="location-options">
                                        <button type="button" class="btn btn-secondary" id="use-current-location">
                                            <i class="fas fa-crosshairs" aria-hidden="true"></i>
                                            Gunakan Lokasi Saat Ini
                                        </button>
                                        <button type="button" class="btn btn-secondary" id="select-on-map">
                                            <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                                            Pilih di Peta
                                        </button>
                                        <button type="button" class="btn btn-secondary" id="clear-location">
                                            <i class="fas fa-times" aria-hidden="true"></i>
                                            Hapus Lokasi
                                        </button>
                                    </div>
                                    
                                    <!-- Location Display -->
                                    <div id="location-display" class="location-display hidden">
                                        <div class="location-info">
                                            <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                                            <span id="location-text">Lokasi dipilih</span>
                                        </div>
                                        <div class="location-coords">
                                            <small id="coordinates-text"></small>
                                        </div>
                                    </div>

                                    <!-- Map Container -->
                                    <div id="location-map-container" class="map-container hidden">
                                        <!-- Map will be initialized here -->
                                    </div>
                                </div>
                                <div class="form-help">
                                    Menambahkan lokasi akan membantu orang lain menemukan story Anda di peta
                                </div>
                            </div>

                            <!-- Form Actions -->
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" id="cancel-btn">
                                    <i class="fas fa-times" aria-hidden="true"></i>
                                    Batal
                                </button>
                                <button type="submit" class="btn btn-primary" id="submit-btn" disabled>
                                    <i class="fas fa-paper-plane" aria-hidden="true"></i>
                                    <span id="submit-text">Bagikan Story</span>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <!-- Preview Section -->
                <div id="story-preview" class="card hidden">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-eye" aria-hidden="true"></i>
                            Preview Story
                        </h3>
                    </div>
                    <div class="card-body">
                        <div class="story-preview-content">
                            <div class="preview-image-container">
                                <img id="preview-image" src="" alt="Preview foto story" class="preview-image">
                            </div>
                            <div class="preview-content">
                                <h4 class="preview-title">Story dari ${authUtils.isAuthenticated() ? 'Anda' : 'Guest'}</h4>
                                <p id="preview-description" class="preview-description"></p>
                                <div class="preview-meta">
                                    <span class="preview-date">
                                        <i class="fas fa-calendar" aria-hidden="true"></i>
                                        Baru saja
                                    </span>
                                    <span id="preview-location" class="preview-location hidden">
                                        <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                                        Dengan lokasi
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    // Initialize form validation and character counter
    initializeFormFeatures() {
        const descriptionTextarea = document.getElementById('story-description');
        const charCount = document.getElementById('char-count');
        const submitBtn = document.getElementById('submit-btn');

        if (descriptionTextarea && charCount) {
            // Character counter
            descriptionTextarea.addEventListener('input', (e) => {
                const length = e.target.value.length;
                charCount.textContent = length;
                
                // Update character counter color
                if (length > 1000) {
                    charCount.style.color = 'var(--danger-color)';
                } else if (length > 800) {
                    charCount.style.color = 'var(--warning-color)';
                } else {
                    charCount.style.color = 'var(--text-secondary)';
                }

                // Validate form
                this.validateForm();
                
                // Update preview
                this.updatePreview();
            });
        }

        // Form validation on input
        const form = document.getElementById('add-story-form');
        if (form) {
            form.addEventListener('input', () => {
                this.validateForm();
            });
        }
    }

    // Validate form and enable/disable submit button
    validateForm() {
        const description = document.getElementById('story-description')?.value.trim() || '';
        const hasPhoto = cameraUtils.capturedImageData !== null;
        const submitBtn = document.getElementById('submit-btn');

        const isValid = description.length >= 10 && description.length <= 1000 && hasPhoto;

        if (submitBtn) {
            submitBtn.disabled = !isValid;
            
            if (isValid) {
                submitBtn.classList.remove('btn-secondary');
                submitBtn.classList.add('btn-primary');
            } else {
                submitBtn.classList.remove('btn-primary');
                submitBtn.classList.add('btn-secondary');
            }
        }

        return isValid;
    }

    // Update story preview
    updatePreview() {
        const description = document.getElementById('story-description')?.value.trim() || '';
        const previewSection = document.getElementById('story-preview');
        const previewDescription = document.getElementById('preview-description');
        const previewImage = document.getElementById('preview-image');
        const previewLocation = document.getElementById('preview-location');

        if (!previewSection || !previewDescription) return;

        // Show/hide preview based on content
        if (description.length >= 10 && cameraUtils.capturedImageData) {
            previewSection.classList.remove('hidden');
            previewDescription.textContent = description;
            
            // Update preview image
            if (previewImage && cameraUtils.capturedImageData) {
                previewImage.src = cameraUtils.capturedImageData;
            }

            // Update location display
            const coordinates = mapUtils.getSelectedCoordinates();
            if (coordinates && previewLocation) {
                previewLocation.classList.remove('hidden');
            } else if (previewLocation) {
                previewLocation.classList.add('hidden');
            }
        } else {
            previewSection.classList.add('hidden');
        }
    }

    // Show location display
    showLocationDisplay(lat, lon) {
        const locationDisplay = document.getElementById('location-display');
        const coordinatesText = document.getElementById('coordinates-text');

        if (locationDisplay) {
            locationDisplay.classList.remove('hidden');
        }

        if (coordinatesText) {
            coordinatesText.textContent = `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`;
        }

        this.updatePreview();
    }

    // Hide location display
    hideLocationDisplay() {
        const locationDisplay = document.getElementById('location-display');
        
        if (locationDisplay) {
            locationDisplay.classList.add('hidden');
        }

        this.updatePreview();
    }

    // Show map container
    showMapContainer() {
        const mapContainer = document.getElementById('location-map-container');
        
        if (mapContainer) {
            mapContainer.classList.remove('hidden');
        }
    }

    // Hide map container
    hideMapContainer() {
        const mapContainer = document.getElementById('location-map-container');
        
        if (mapContainer) {
            mapContainer.classList.add('hidden');
        }
    }

    // Get form data
    getFormData() {
        const description = document.getElementById('story-description')?.value.trim() || '';
        const photoFile = cameraUtils.getCapturedPhotoFile();
        const coordinates = mapUtils.getSelectedCoordinates();

        return {
            description,
            photoFile,
            lat: coordinates?.lat || null,
            lon: coordinates?.lon || null
        };
    }

    // Clear form
    clearForm() {
        const form = document.getElementById('add-story-form');
        if (form) {
            form.reset();
        }

        // Clear camera
        cameraUtils.cleanup();

        // Clear map selection
        mapUtils.clearSelectedCoordinates();

        // Hide preview
        const previewSection = document.getElementById('story-preview');
        if (previewSection) {
            previewSection.classList.add('hidden');
        }

        // Hide location display
        this.hideLocationDisplay();

        // Reset character counter
        const charCount = document.getElementById('char-count');
        if (charCount) {
            charCount.textContent = '0';
            charCount.style.color = 'var(--text-secondary)';
        }

        // Disable submit button
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
        }
    }

    // Show form errors
    showFormErrors(errors) {
        const form = document.getElementById('add-story-form');
        if (!form) return;

        // Clear previous errors
        const existingErrors = form.querySelectorAll('.form-error');
        existingErrors.forEach(error => error.remove());

        // Show new errors
        errors.forEach(error => {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            errorDiv.textContent = error;
            
            // Add error after form actions
            const formActions = form.querySelector('.form-actions');
            if (formActions) {
                formActions.parentNode.insertBefore(errorDiv, formActions);
            }
        });
    }

    // Clear form errors
    clearFormErrors() {
        const form = document.getElementById('add-story-form');
        if (!form) return;

        const existingErrors = form.querySelectorAll('.form-error');
        existingErrors.forEach(error => error.remove());
    }

    // Show loading state
    showLoadingState() {
        const submitBtn = document.getElementById('submit-btn');
        const submitText = document.getElementById('submit-text');

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <div class="loading-spinner" style="width: 16px; height: 16px; margin-right: 8px;"></div>
                Membagikan...
            `;
        }
    }

    // Hide loading state
    hideLoadingState() {
        const submitBtn = document.getElementById('submit-btn');
        const submitText = document.getElementById('submit-text');

        if (submitBtn && submitText) {
            submitBtn.innerHTML = `
                <i class="fas fa-paper-plane" aria-hidden="true"></i>
                <span>Bagikan Story</span>
            `;
            this.validateForm(); // Re-validate to set correct state
        }
    }

    // Add custom styles for add story view
    addCustomStyles() {
        if (document.getElementById('add-story-view-styles')) return;

        const style = document.createElement('style');
        style.id = 'add-story-view-styles';
        style.textContent = `
            .add-story-form {
                max-width: 800px;
                margin: 0 auto;
            }

            .form-counter {
                text-align: right;
                margin-top: 0.25rem;
                font-size: 0.875rem;
            }

            .form-help {
                font-size: 0.875rem;
                color: var(--text-secondary);
                margin-top: 0.25rem;
            }

            .location-options {
                display: flex;
                gap: 0.5rem;
                margin-bottom: 1rem;
                flex-wrap: wrap;
            }

            .location-display {
                background: var(--background-color);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                padding: 1rem;
                margin-bottom: 1rem;
            }

            .location-info {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: var(--primary-color);
                font-weight: 500;
            }

            .location-coords {
                margin-top: 0.5rem;
                color: var(--text-secondary);
            }

            .form-actions {
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
                margin-top: 2rem;
                padding-top: 1rem;
                border-top: 1px solid var(--border-color);
            }

            .story-preview-content {
                display: flex;
                gap: 1rem;
                align-items: flex-start;
            }

            .preview-image-container {
                flex-shrink: 0;
            }

            .preview-image {
                width: 150px;
                height: 100px;
                object-fit: cover;
                border-radius: var(--border-radius);
                border: 1px solid var(--border-color);
            }

            .preview-content {
                flex: 1;
            }

            .preview-title {
                font-size: 1.125rem;
                font-weight: 600;
                margin-bottom: 0.5rem;
                color: var(--text-primary);
            }

            .preview-description {
                color: var(--text-secondary);
                margin-bottom: 0.75rem;
                line-height: 1.5;
            }

            .preview-meta {
                display: flex;
                gap: 1rem;
                font-size: 0.875rem;
                color: var(--text-secondary);
            }

            .preview-date, .preview-location {
                display: flex;
                align-items: center;
                gap: 0.25rem;
            }

            @media (max-width: 768px) {
                .form-actions {
                    flex-direction: column;
                }

                .location-options {
                    flex-direction: column;
                }

                .story-preview-content {
                    flex-direction: column;
                }

                .preview-image {
                    width: 100%;
                    height: 200px;
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
window.AddStoryView = AddStoryView; 