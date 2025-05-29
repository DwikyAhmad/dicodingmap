// Map utility functions using Leaflet
class MapUtils {
    constructor() {
        this.map = null;
        this.markers = [];
        this.selectedCoordinates = null;
        this.clickHandler = null;
    }

    // Initialize map
    initializeMap(containerId, options = {}) {
        const defaultOptions = {
            center: [-6.2088, 106.8456], // Jakarta coordinates
            zoom: 10,
            zoomControl: true,
            attributionControl: true
        };

        const mapOptions = { ...defaultOptions, ...options };

        // Create map instance
        this.map = L.map(containerId, {
            center: mapOptions.center,
            zoom: mapOptions.zoom,
            zoomControl: mapOptions.zoomControl,
            attributionControl: mapOptions.attributionControl
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(this.map);

        return this.map;
    }

    // Destroy map instance
    destroyMap() {
        if (this.map) {
            this.map.remove();
            this.map = null;
            this.markers = [];
            this.selectedCoordinates = null;
            this.clickHandler = null;
        }
    }

    // Add marker to map
    addMarker(lat, lon, popupContent = '', options = {}) {
        if (!this.map) {
            throw new Error('Map belum diinisialisasi');
        }

        const defaultOptions = {
            color: '#2563eb',
            fillColor: '#3b82f6',
            fillOpacity: 0.8,
            radius: 8
        };

        const markerOptions = { ...defaultOptions, ...options };

        const marker = L.circleMarker([lat, lon], markerOptions).addTo(this.map);

        if (popupContent) {
            marker.bindPopup(popupContent);
        }

        this.markers.push(marker);
        return marker;
    }

    // Remove all markers
    clearMarkers() {
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = [];
    }

    // Add stories to map
    displayStoriesOnMap(stories) {
        if (!this.map) {
            throw new Error('Map belum diinisialisasi');
        }

        this.clearMarkers();

        stories.forEach(story => {
            if (story.lat && story.lon) {
                const popupContent = `
                    <div class="story-popup">
                        <h4>${this.escapeHtml(story.name || 'Tanpa Nama')}</h4>
                        <p>${this.escapeHtml(story.description || 'Tidak ada deskripsi')}</p>
                        ${story.photoUrl ? `<img src="${story.photoUrl}" alt="Story photo" style="width: 100%; max-width: 200px; height: auto; border-radius: 4px; margin-top: 8px;">` : ''}
                        <p style="font-size: 0.8em; color: #666; margin-top: 8px;">
                            <i class="fas fa-calendar"></i> ${this.formatDate(story.createdAt)}
                        </p>
                    </div>
                `;

                this.addMarker(story.lat, story.lon, popupContent, {
                    color: '#10b981',
                    fillColor: '#34d399'
                });
            }
        });

        // Fit map to show all markers if there are any
        if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    // Enable location selection mode
    enableLocationSelection(callback) {
        if (!this.map) {
            throw new Error('Map belum diinisialisasi');
        }

        // Remove previous click handler
        if (this.clickHandler) {
            this.map.off('click', this.clickHandler);
        }

        // Add new click handler
        this.clickHandler = (e) => {
            const { lat, lng } = e.latlng;
            this.selectedCoordinates = { lat: lat, lon: lng };

            // Clear previous selection marker
            this.clearSelectionMarker();

            // Add selection marker
            this.selectionMarker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'selection-marker',
                    html: '<i class="fas fa-map-pin" style="color: #ef4444; font-size: 24px;"></i>',
                    iconSize: [30, 30],
                    iconAnchor: [15, 30]
                })
            }).addTo(this.map);

            // Show popup with coordinates
            this.selectionMarker.bindPopup(`
                <div>
                    <strong>Lokasi Dipilih</strong><br>
                    Latitude: ${lat.toFixed(6)}<br>
                    Longitude: ${lng.toFixed(6)}
                </div>
            `).openPopup();

            // Call callback if provided
            if (callback) {
                callback(lat, lng);
            }
        };

        this.map.on('click', this.clickHandler);
        
        // Change cursor to crosshair
        this.map.getContainer().style.cursor = 'crosshair';
    }

    // Disable location selection mode
    disableLocationSelection() {
        if (this.map && this.clickHandler) {
            this.map.off('click', this.clickHandler);
            this.clickHandler = null;
            this.map.getContainer().style.cursor = '';
            this.clearSelectionMarker();
        }
    }

    // Clear selection marker
    clearSelectionMarker() {
        if (this.selectionMarker) {
            this.map.removeLayer(this.selectionMarker);
            this.selectionMarker = null;
        }
    }

    // Get selected coordinates
    getSelectedCoordinates() {
        return this.selectedCoordinates;
    }

    // Clear selected coordinates
    clearSelectedCoordinates() {
        this.selectedCoordinates = null;
        this.clearSelectionMarker();
    }

    // Center map on coordinates
    centerMap(lat, lon, zoom = 15) {
        if (!this.map) {
            throw new Error('Map belum diinisialisasi');
        }

        this.map.setView([lat, lon], zoom);
    }

    // Get user's current location
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation tidak didukung oleh browser ini'));
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    resolve({ lat: latitude, lon: longitude });
                },
                (error) => {
                    let errorMessage = 'Gagal mendapatkan lokasi';
                    
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Akses lokasi ditolak oleh pengguna';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Informasi lokasi tidak tersedia';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Permintaan lokasi timeout';
                            break;
                    }
                    
                    reject(new Error(errorMessage));
                },
                options
            );
        });
    }

    // Center map on user's current location
    async centerOnCurrentLocation() {
        try {
            const location = await this.getCurrentLocation();
            this.centerMap(location.lat, location.lon);
            
            // Add marker for current location
            const currentLocationMarker = L.marker([location.lat, location.lon], {
                icon: L.divIcon({
                    className: 'current-location-marker',
                    html: '<i class="fas fa-location-arrow" style="color: #2563eb; font-size: 20px;"></i>',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                })
            }).addTo(this.map);

            currentLocationMarker.bindPopup('Lokasi Anda saat ini').openPopup();
            
            return location;
        } catch (error) {
            throw error;
        }
    }

    // Initialize map with location selection UI
    initializeLocationSelectionMap(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container dengan ID '${containerId}' tidak ditemukan`);
        }

        // Create map UI HTML
        container.innerHTML = `
            <div class="map-container">
                <div id="location-map" style="height: 400px; width: 100%;"></div>
                <div class="map-controls" style="margin-top: 1rem;">
                    <button type="button" id="current-location-btn" class="btn btn-secondary">
                        <i class="fas fa-location-arrow"></i>
                        Lokasi Saya
                    </button>
                    <button type="button" id="clear-location-btn" class="btn btn-secondary">
                        <i class="fas fa-times"></i>
                        Hapus Pilihan
                    </button>
                </div>
                <div class="map-status">
                    <p id="location-status">Klik pada peta untuk memilih lokasi</p>
                </div>
                <div class="selected-coordinates" style="margin-top: 0.5rem;">
                    <small id="coordinates-display" class="text-secondary"></small>
                </div>
            </div>
        `;

        // Initialize map
        this.initializeMap('location-map');

        // Get UI elements
        const currentLocationBtn = container.querySelector('#current-location-btn');
        const clearLocationBtn = container.querySelector('#clear-location-btn');
        const statusElement = container.querySelector('#location-status');
        const coordinatesDisplay = container.querySelector('#coordinates-display');

        // Enable location selection
        this.enableLocationSelection((lat, lon) => {
            statusElement.textContent = 'Lokasi dipilih!';
            coordinatesDisplay.textContent = `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`;
        });

        // Event handlers
        currentLocationBtn.onclick = async () => {
            try {
                statusElement.textContent = 'Mendapatkan lokasi Anda...';
                const location = await this.centerOnCurrentLocation();
                statusElement.textContent = 'Peta dipusatkan pada lokasi Anda';
            } catch (error) {
                statusElement.textContent = `Error: ${error.message}`;
                console.error('Current location error:', error);
            }
        };

        clearLocationBtn.onclick = () => {
            this.clearSelectedCoordinates();
            statusElement.textContent = 'Klik pada peta untuk memilih lokasi';
            coordinatesDisplay.textContent = '';
        };

        return {
            map: this.map,
            currentLocationBtn,
            clearLocationBtn,
            statusElement,
            coordinatesDisplay
        };
    }

    // Helper function to escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Helper function to format date
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Cleanup when component is destroyed
    cleanup() {
        this.disableLocationSelection();
        this.clearMarkers();
        this.destroyMap();
    }
}

// Create global map utils instance
const mapUtils = new MapUtils();

// Export for use in other modules
window.mapUtils = mapUtils; 