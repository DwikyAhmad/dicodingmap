// Add Story Presenter - coordinates between AddStoryView and StoryModel
class AddStoryPresenter {
    constructor() {
        this.view = new AddStoryView();
        this.model = storyModel;
        this.isInitialized = false;
        this.cameraInstance = null;
        this.mapInstance = null;
        this.selectedLocation = null;
        this.capturedImageBlob = null;
        this.isGuest = false;
    }

    // Initialize presenter and render view
    async init() {
        try {
            console.log('Initializing Add Story Presenter...');

            // Check authentication status
            this.isGuest = !authUtils.isAuthenticated();
            console.log('User is guest:', this.isGuest);

            // Initialize view
            this.view.init();

            // Render view to DOM
            await this.renderView();

            // Setup event listeners
            this.setupEventListeners();

            // Initialize camera component
            await this.initializeCamera();

            // Initialize location features
            await this.initializeLocationFeatures();

            this.isInitialized = true;
            console.log('Add Story Presenter initialized successfully');

        } catch (error) {
            console.error('Error initializing Add Story Presenter:', error);
            notificationUtils.handleApiError(error, 'Gagal memuat halaman tambah story');
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
        console.log('Setting up Add Story Presenter event listeners...');

        // Form submission
        const form = document.getElementById('add-story-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.handleCancel();
            });
        }

        // Location buttons
        this.setupLocationEventListeners();

        // Form validation on input
        const descriptionTextarea = document.getElementById('story-description');
        if (descriptionTextarea) {
            descriptionTextarea.addEventListener('input', () => {
                this.view.validateForm();
                this.view.updatePreview();
            });
        }

        // Listen for auth state changes
        if (authModel) {
            authModel.addAuthListener((isAuthenticated) => {
                this.handleAuthStateChange(isAuthenticated);
            });
        }

        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    // Setup location-related event listeners
    setupLocationEventListeners() {
        const useCurrentLocationBtn = document.getElementById('use-current-location');
        const selectOnMapBtn = document.getElementById('select-on-map');
        const clearLocationBtn = document.getElementById('clear-location');

        if (useCurrentLocationBtn) {
            useCurrentLocationBtn.addEventListener('click', () => {
                this.handleUseCurrentLocation();
            });
        }

        if (selectOnMapBtn) {
            selectOnMapBtn.addEventListener('click', () => {
                this.handleSelectOnMap();
            });
        }

        if (clearLocationBtn) {
            clearLocationBtn.addEventListener('click', () => {
                this.handleClearLocation();
            });
        }
    }

    // Setup keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + Enter to submit form
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.handleSubmit();
            }
            
            // Escape to cancel
            if (e.key === 'Escape') {
                this.handleCancel();
            }
        });
    }

    // Initialize camera component
    async initializeCamera() {
        try {
            console.log('Initializing camera...');

            const cameraSection = document.getElementById('camera-section');
            if (!cameraSection) {
                throw new Error('Camera section not found');
            }

            // Initialize camera UI using camera utility
            this.cameraInstance = await cameraUtils.initCamera(cameraSection, {
                onCapture: (imageBlob) => {
                    this.handleImageCapture(imageBlob);
                },
                onError: (error) => {
                    this.handleCameraError(error);
                },
                maxSize: 1024 * 1024, // 1MB max
                allowGallery: true
            });

            console.log('Camera initialized successfully');

        } catch (error) {
            console.error('Error initializing camera:', error);
            this.showCameraError('Gagal menginisialisasi kamera');
        }
    }

    // Initialize location features
    async initializeLocationFeatures() {
        try {
            console.log('Initializing location features...');

            // Initialize map for location selection
            const mapContainer = document.getElementById('location-map-container');
            if (mapContainer) {
                // Initially hide the map
                this.view.hideMapContainer();
            }

            console.log('Location features initialized successfully');

        } catch (error) {
            console.error('Error initializing location features:', error);
            notificationUtils.showWarning('Fitur lokasi tidak tersedia');
        }
    }

    // Handle image capture from camera
    handleImageCapture(imageBlob) {
        console.log('Image captured:', imageBlob);

        this.capturedImageBlob = imageBlob;

        // Create object URL for preview
        const imageUrl = URL.createObjectURL(imageBlob);

        // Update preview
        const previewImage = document.getElementById('preview-image');
        if (previewImage) {
            previewImage.src = imageUrl;
            previewImage.onload = () => {
                // Clean up previous object URL
                URL.revokeObjectURL(imageUrl);
            };
        }

        // Show preview section
        const previewSection = document.getElementById('story-preview');
        if (previewSection) {
            previewSection.classList.remove('hidden');
        }

        // Update form validation
        this.view.validateForm();
        this.view.updatePreview();

        // Show success message
        notificationUtils.showSuccess('Foto berhasil diambil!');
    }

    // Handle camera errors
    handleCameraError(error) {
        console.error('Camera error:', error);
        
        let errorMessage = 'Gagal mengakses kamera';
        if (error.name === 'NotAllowedError') {
            errorMessage = 'Akses kamera ditolak. Silakan izinkan akses kamera di browser';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'Kamera tidak ditemukan di perangkat ini';
        }

        this.showCameraError(errorMessage);
    }

    // Show camera error
    showCameraError(message) {
        const cameraSection = document.getElementById('camera-section');
        if (cameraSection) {
            cameraSection.innerHTML = `
                <div class="camera-error">
                    <i class="fas fa-camera-slash" aria-hidden="true"></i>
                    <p>${message}</p>
                    <button type="button" class="btn btn-secondary" onclick="window.location.reload()">
                        Coba Lagi
                    </button>
                </div>
            `;
        }
    }

    // Handle use current location
    async handleUseCurrentLocation() {
        try {
            console.log('Getting current location...');

            // Show loading
            notificationUtils.showLoading('Mendapatkan lokasi...');

            // Get current position
            const position = await this.getCurrentPosition();
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            console.log('Current location:', lat, lon);

            // Set location
            this.setLocation(lat, lon);

            // Show success message
            notificationUtils.showSuccess('Lokasi saat ini berhasil didapatkan');

        } catch (error) {
            console.error('Error getting current location:', error);
            
            let errorMessage = 'Gagal mendapatkan lokasi saat ini';
            if (error.code === error.PERMISSION_DENIED) {
                errorMessage = 'Akses lokasi ditolak. Silakan izinkan akses lokasi di browser';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                errorMessage = 'Lokasi tidak tersedia';
            } else if (error.code === error.TIMEOUT) {
                errorMessage = 'Waktu tunggu lokasi habis';
            }

            notificationUtils.showError(errorMessage);
        } finally {
            notificationUtils.hideLoading();
        }
    }

    // Handle select location on map
    async handleSelectOnMap() {
        try {
            console.log('Opening map for location selection...');

            // Show map container
            this.view.showMapContainer();

            // Initialize map if not already done
            if (!this.mapInstance) {
                const mapContainer = document.querySelector('#location-map-container');
                if (mapContainer) {
                    // Create map div
                    mapContainer.innerHTML = '<div id="location-map" style="height: 400px; width: 100%;"></div>';

                    // Initialize map
                    this.mapInstance = mapUtils.initializeMap('location-map', {
                        center: [-6.2088, 106.8456], // Jakarta default
                        zoom: 13
                    });

                    // Add click handler for location selection
                    this.mapInstance.on('click', (e) => {
                        const lat = e.latlng.lat;
                        const lon = e.latlng.lng;
                        console.log('Location selected on map:', lat, lon);
                        this.setLocation(lat, lon);
                        this.view.hideMapContainer();
                    });
                }
            }

            // Show instruction
            notificationUtils.showInfo('Klik pada peta untuk memilih lokasi');

        } catch (error) {
            console.error('Error opening map:', error);
            notificationUtils.showError('Gagal membuka peta');
        }
    }

    // Handle clear location
    handleClearLocation() {
        console.log('Clearing location...');

        this.selectedLocation = null;
        this.view.hideLocationDisplay();
        this.view.hideMapContainer();

        // Update preview
        this.view.updatePreview();

        notificationUtils.showInfo('Lokasi dihapus');
    }

    // Set location coordinates
    setLocation(lat, lon) {
        this.selectedLocation = { lat, lon };

        // Show location display
        this.view.showLocationDisplay(lat, lon);

        // Update preview
        this.view.updatePreview();

        console.log('Location set:', this.selectedLocation);
    }

    // Get current position using Geolocation API
    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        });
    }

    // Handle form submission
    async handleSubmit() {
        try {
            console.log('Handling story submission...');

            // Validate form
            if (!this.view.validateForm()) {
                console.log('Form validation failed');
                notificationUtils.showError('Mohon lengkapi form dengan benar');
                return;
            }

            // Check if image is captured
            if (!this.capturedImageBlob) {
                notificationUtils.showError('Mohon ambil foto terlebih dahulu');
                return;
            }

            // Get form data
            const formData = this.view.getFormData();

            // Show loading state
            this.view.showLoadingState();

            // Prepare story data
            const storyData = {
                description: formData.description,
                photo: this.capturedImageBlob,
                lat: this.selectedLocation ? this.selectedLocation.lat : null,
                lon: this.selectedLocation ? this.selectedLocation.lon : null
            };

            console.log('Story data prepared:', {
                description: storyData.description,
                hasPhoto: !!storyData.photo,
                hasLocation: !!(storyData.lat && storyData.lon)
            });

            // Submit story based on authentication status
            let response;
            if (this.isGuest) {
                response = await this.model.addStoryGuest(storyData);
            } else {
                response = await this.model.addStory(
                    storyData.description,
                    storyData.photo,
                    storyData.lat,
                    storyData.lon
                );
            }

            console.log('Story submitted successfully');

            // Show success message
            const userType = this.isGuest ? 'guest' : 'user';
            notificationUtils.showSuccess(`Story berhasil ditambahkan sebagai ${userType}!`);

            // Clear form and redirect
            this.clearForm();
            
            // Navigate to home page to see the new story
            setTimeout(() => {
                router.navigateTo('home');
            }, 1500);

        } catch (error) {
            console.error('Error submitting story:', error);
            this.handleSubmissionError(error);
        } finally {
            this.view.hideLoadingState();
        }
    }

    // Handle submission errors
    handleSubmissionError(error) {
        let errorMessage = 'Gagal menambahkan story';

        if (error.message) {
            errorMessage = error.message;
        } else if (error.response && error.response.message) {
            errorMessage = error.response.message;
        }

        // Handle specific error cases
        if (errorMessage.toLowerCase().includes('file') || 
            errorMessage.toLowerCase().includes('image')) {
            notificationUtils.showError('Gagal mengupload foto. Pastikan ukuran file tidak lebih dari 1MB');
        } else if (errorMessage.toLowerCase().includes('network') || 
                   errorMessage.toLowerCase().includes('connection')) {
            notificationUtils.showError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda');
        } else if (errorMessage.toLowerCase().includes('auth')) {
            notificationUtils.showError('Sesi login telah berakhir. Silakan login ulang');
            router.navigateTo('auth');
        } else {
            notificationUtils.showError(errorMessage);
        }
    }

    // Handle cancel button
    handleCancel() {
        console.log('Canceling story creation...');

        // Show confirmation dialog
        if (this.hasUnsavedChanges()) {
            const confirmed = confirm('Anda memiliki perubahan yang belum disimpan. Yakin ingin membatalkan?');
            if (!confirmed) {
                return;
            }
        }

        // Clear form and navigate back
        this.clearForm();
        router.navigateTo('home');
    }

    // Check if there are unsaved changes
    hasUnsavedChanges() {
        const description = document.getElementById('story-description')?.value.trim() || '';
        return description.length > 0 || this.capturedImageBlob || this.selectedLocation;
    }

    // Clear form data
    clearForm() {
        console.log('Clearing form...');

        // Clear view
        this.view.clearForm();

        // Clear captured image
        this.capturedImageBlob = null;

        // Clear location
        this.selectedLocation = null;

        // Reset camera
        if (this.cameraInstance) {
            try {
                cameraUtils.cleanup(this.cameraInstance);
            } catch (error) {
                console.error('Error cleaning up camera:', error);
            }
        }

        // Hide preview and map
        const previewSection = document.getElementById('story-preview');
        if (previewSection) {
            previewSection.classList.add('hidden');
        }

        this.view.hideMapContainer();
        this.view.hideLocationDisplay();
    }

    // Handle authentication state changes
    handleAuthStateChange(isAuthenticated) {
        console.log('Auth state changed:', isAuthenticated);
        
        this.isGuest = !isAuthenticated;
        
        // Update UI based on auth state
        this.updateUIForAuthState();
    }

    // Update UI based on authentication state
    updateUIForAuthState() {
        // Update user name in preview
        const previewTitle = document.querySelector('.preview-title');
        if (previewTitle) {
            const userName = this.isGuest ? 'Guest' : 'Anda';
            previewTitle.textContent = `Story dari ${userName}`;
        }

        // Show different messaging for guest vs authenticated users
        if (this.isGuest) {
            console.log('User is guest, showing guest messaging');
        } else {
            console.log('User is authenticated');
        }
    }

    // Handle error recovery
    handleErrorRecovery() {
        console.log('Attempting error recovery...');

        // Clear any error states
        this.view.clearFormErrors();

        // Reinitialize camera if needed
        if (!this.cameraInstance) {
            this.initializeCamera();
        }

        // Show help message
        notificationUtils.showInfo('Sistem telah direset. Silakan coba lagi');
    }

    // Cleanup presenter
    cleanup() {
        console.log('Cleaning up Add Story Presenter...');

        // Cleanup camera
        if (this.cameraInstance) {
            try {
                cameraUtils.cleanup(this.cameraInstance);
            } catch (error) {
                console.error('Error cleaning up camera:', error);
            }
        }

        // Cleanup map
        if (this.mapInstance) {
            try {
                this.mapInstance.remove();
            } catch (error) {
                console.error('Error cleaning up map:', error);
            }
        }

        // Clear captured image blob
        if (this.capturedImageBlob) {
            URL.revokeObjectURL(this.capturedImageBlob);
            this.capturedImageBlob = null;
        }

        this.isInitialized = false;
    }

    // Get presenter information
    getInfo() {
        return {
            name: 'AddStoryPresenter',
            isInitialized: this.isInitialized,
            isGuest: this.isGuest,
            hasImage: !!this.capturedImageBlob,
            hasLocation: !!this.selectedLocation,
            hasUnsavedChanges: this.hasUnsavedChanges()
        };
    }
}

// Export to global scope
window.AddStoryPresenter = AddStoryPresenter; 