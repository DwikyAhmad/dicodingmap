// Story Model - handles story data operations
class StoryModel {
    constructor() {
        this.stories = [];
        this.currentStory = null;
        this.isLoading = false;
        this.lastFetchTime = null;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Get all stories with caching
    async getStories(forceRefresh = false) {
        const cacheKey = 'stories';
        const now = Date.now();

        // Check cache first
        if (!forceRefresh && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (now - cached.timestamp < this.cacheTimeout) {
                this.stories = cached.data;
                return this.stories;
            }
        }

        try {
            this.isLoading = true;
            console.log('API call - attempting to get stories...');
            
            let response;
            
            // Check if user is authenticated
            if (authUtils && authUtils.isAuthenticated()) {
                console.log('User is authenticated, calling authenticated API');
                response = await apiClient.getStories(1, 50, 1); // Get first 50 stories with location
            } else {
                console.log('User is not authenticated, calling guest API');
                // For guest users, we'll try without auth first
                try {
                    response = await apiClient.request('/stories?page=1&size=50&location=1', {
                        includeAuth: false
                    });
                } catch (guestError) {
                    console.log('Guest API failed, trying with default auth');
                    // If guest fails, try with whatever token we have (might be null)
                    response = await apiClient.getStories(1, 50, 1);
                }
            }
            
            console.log('API response received:', response);
            
            if (response && response.listStory) {
                this.stories = response.listStory;
                this.lastFetchTime = now;
                
                // Cache the data
                this.cache.set(cacheKey, {
                    data: this.stories,
                    timestamp: now
                });
                
                console.log(`Successfully loaded ${this.stories.length} stories`);
            } else {
                console.log('No stories found in response');
                this.stories = [];
            }

            return this.stories;
        } catch (error) {
            console.error('Error fetching stories:', error);
            
            // Return empty array on error instead of throwing
            this.stories = [];
            return this.stories;
        } finally {
            this.isLoading = false;
        }
    }

    // Get story by ID with caching
    async getStoryById(id, forceRefresh = false) {
        const cacheKey = `story_${id}`;
        const now = Date.now();

        // Check cache first
        if (!forceRefresh && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (now - cached.timestamp < this.cacheTimeout) {
                this.currentStory = cached.data;
                return this.currentStory;
            }
        }

        try {
            this.isLoading = true;
            const response = await apiClient.getStoryById(id);
            
            if (response && response.story) {
                this.currentStory = response.story;
                
                // Cache the data
                this.cache.set(cacheKey, {
                    data: this.currentStory,
                    timestamp: now
                });
            }

            return this.currentStory;
        } catch (error) {
            console.error('Error fetching story:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    // Add new story
    async addStory(description, photoFile, lat = null, lon = null) {
        try {
            this.isLoading = true;
            
            const response = await apiClient.addStory(description, photoFile, lat, lon);

            // Clear cache to force refresh
            this.clearCache();
            
            return response;
        } catch (error) {
            console.error('Error adding story:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    // Add new story as guest
    async addStoryGuest(storyData) {
        try {
            this.isLoading = true;
            
            const response = await apiClient.addStoryGuest(
                storyData.description, 
                storyData.photo, 
                storyData.lat, 
                storyData.lon
            );

            // Clear cache to force refresh
            this.clearCache();
            
            return response;
        } catch (error) {
            console.error('Error adding story as guest:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    // Search stories by text
    searchStories(query) {
        if (!query || query.trim() === '') {
            return this.stories;
        }

        const searchTerm = query.toLowerCase().trim();
        return this.stories.filter(story => {
            return (
                story.name?.toLowerCase().includes(searchTerm) ||
                story.description?.toLowerCase().includes(searchTerm)
            );
        });
    }

    // Filter stories by location
    getStoriesWithLocation() {
        return this.stories.filter(story => story.lat && story.lon);
    }

    // Get stories without location
    getStoriesWithoutLocation() {
        return this.stories.filter(story => !story.lat || !story.lon);
    }

    // Sort stories by date
    sortStoriesByDate(ascending = false) {
        return [...this.stories].sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return ascending ? dateA - dateB : dateB - dateA;
        });
    }

    // Get stories by date range
    getStoriesByDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return this.stories.filter(story => {
            const storyDate = new Date(story.createdAt);
            return storyDate >= start && storyDate <= end;
        });
    }

    // Get stories near a location (within radius in km)
    getStoriesNearLocation(lat, lon, radiusKm = 10) {
        if (!lat || !lon) return [];

        return this.stories.filter(story => {
            if (!story.lat || !story.lon) return false;
            
            const distance = this.calculateDistance(lat, lon, story.lat, story.lon);
            return distance <= radiusKm;
        });
    }

    // Calculate distance between two coordinates (Haversine formula)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // Convert degrees to radians
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Get statistics about stories
    getStoriesStatistics() {
        const total = this.stories.length;
        const withLocation = this.getStoriesWithLocation().length;
        const withoutLocation = this.getStoriesWithoutLocation().length;
        
        // Get date range
        const dates = this.stories.map(story => new Date(story.createdAt));
        const oldestDate = dates.length > 0 ? new Date(Math.min(...dates)) : null;
        const newestDate = dates.length > 0 ? new Date(Math.max(...dates)) : null;

        // Get unique authors
        const authors = new Set(this.stories.map(story => story.name));

        return {
            total,
            withLocation,
            withoutLocation,
            uniqueAuthors: authors.size,
            oldestDate,
            newestDate
        };
    }

    // Validate story data before adding
    validateStoryData(description, photoFile, lat = null, lon = null) {
        const errors = [];

        // Validate description
        if (!description || description.trim().length === 0) {
            errors.push('Deskripsi story tidak boleh kosong');
        } else if (description.trim().length < 10) {
            errors.push('Deskripsi story harus minimal 10 karakter');
        } else if (description.trim().length > 1000) {
            errors.push('Deskripsi story maksimal 1000 karakter');
        }

        // Validate photo
        if (!photoFile) {
            errors.push('Foto harus disertakan');
        } else {
            // Check file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(photoFile.type)) {
                errors.push('Format foto harus JPEG, PNG, atau WebP');
            }

            // Check file size (max 1MB as per API)
            const maxSize = 1 * 1024 * 1024; // 1MB
            if (photoFile.size > maxSize) {
                errors.push('Ukuran foto maksimal 1MB');
            }
        }

        // Validate coordinates (optional)
        if (lat !== null && lon !== null) {
            if (typeof lat !== 'number' || typeof lon !== 'number') {
                errors.push('Koordinat harus berupa angka');
            } else if (lat < -90 || lat > 90) {
                errors.push('Latitude harus antara -90 dan 90');
            } else if (lon < -180 || lon > 180) {
                errors.push('Longitude harus antara -180 dan 180');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Format story data for display
    formatStoryForDisplay(story) {
        if (!story) return null;

        return {
            ...story,
            formattedDate: this.formatDate(story.createdAt),
            shortDescription: this.truncateText(story.description, 150),
            hasLocation: !!(story.lat && story.lon)
        };
    }

    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Hari ini';
        } else if (diffDays === 1) {
            return 'Kemarin';
        } else if (diffDays < 7) {
            return `${diffDays} hari yang lalu`;
        } else {
            return date.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    // Truncate text with ellipsis
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength).trim() + '...';
    }

    // Clear all cache
    clearCache() {
        this.cache.clear();
        this.lastFetchTime = null;
    }

    // Clear specific cache entry
    clearCacheEntry(key) {
        this.cache.delete(key);
    }

    // Get loading state
    getLoadingState() {
        return this.isLoading;
    }

    // Reset model state
    reset() {
        this.stories = [];
        this.currentStory = null;
        this.isLoading = false;
        this.clearCache();
    }
}

// Create global story model instance
const storyModel = new StoryModel();

// Export for use in other modules
window.storyModel = storyModel; 