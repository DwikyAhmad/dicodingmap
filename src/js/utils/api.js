// API Base URL
const API_BASE_URL = 'https://story-api.dicoding.dev/v1';

// API utility class
class ApiClient {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Get auth token from localStorage
    getAuthToken() {
        return localStorage.getItem('auth_token');
    }

    // Set auth token to localStorage
    setAuthToken(token) {
        localStorage.setItem('auth_token', token);
    }

    // Remove auth token from localStorage
    removeAuthToken() {
        localStorage.removeItem('auth_token');
    }

    // Create request headers
    getHeaders(includeAuth = true, contentType = 'application/json') {
        const headers = {};
        
        if (contentType) {
            headers['Content-Type'] = contentType;
        }
        
        if (includeAuth) {
            const token = this.getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        return headers;
    }

    // Make HTTP request
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            method: 'GET',
            ...options,
            headers: {
                ...this.getHeaders(options.includeAuth !== false),
                ...options.headers
            }
        };

        // Remove Content-Type for FormData
        if (options.body instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Authentication endpoints
    async register(name, email, password) {
        return this.request('/register', {
            method: 'POST',
            includeAuth: false,
            body: JSON.stringify({ name, email, password })
        });
    }

    async login(email, password) {
        const response = await this.request('/login', {
            method: 'POST',
            includeAuth: false,
            body: JSON.stringify({ email, password })
        });

        if (response.loginResult?.token) {
            this.setAuthToken(response.loginResult.token);
        }

        return response;
    }

    async logout() {
        this.removeAuthToken();
    }

    // Story endpoints
    async getStories(page = 1, size = 20, location = 1) {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
            location: location.toString()
        });

        return this.request(`/stories?${params}`);
    }

    async getStoryById(id) {
        return this.request(`/stories/${id}`);
    }

    async addStory(description, photoFile, lat = null, lon = null) {
        const formData = new FormData();
        formData.append('description', description);
        formData.append('photo', photoFile);
        
        if (lat !== null && lon !== null) {
            formData.append('lat', lat.toString());
            formData.append('lon', lon.toString());
        }

        return this.request('/stories', {
            method: 'POST',
            body: formData
        });
    }

    async addStoryGuest(description, photoFile, lat = null, lon = null) {
        const formData = new FormData();
        formData.append('description', description);
        formData.append('photo', photoFile);
        
        if (lat !== null && lon !== null) {
            formData.append('lat', lat.toString());
            formData.append('lon', lon.toString());
        }

        return this.request('/stories/guest', {
            method: 'POST',
            includeAuth: false,
            body: formData
        });
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getAuthToken();
    }

    // Get user data from token (basic JWT parsing)
    getUserData() {
        const token = this.getAuthToken();
        if (!token) return null;

        try {
            // Simple JWT decode (not validation, just parsing)
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Failed to parse token:', error);
            return null;
        }
    }
}

// Create global API client instance
const apiClient = new ApiClient();

// Export for use in other modules
window.apiClient = apiClient; 