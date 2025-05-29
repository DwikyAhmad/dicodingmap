// Camera utility functions
class CameraUtils {
    constructor() {
        this.stream = null;
        this.video = null;
        this.canvas = null;
        this.capturedImageData = null;
    }

    // Check if camera is supported
    isCameraSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    // Get camera stream
    async startCamera(videoElement, constraints = {}) {
        if (!this.isCameraSupported()) {
            throw new Error('Camera tidak didukung oleh browser ini');
        }

        try {
            // Default camera constraints
            const defaultConstraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'environment' // Use back camera if available
                },
                audio: false
            };

            const finalConstraints = { ...defaultConstraints, ...constraints };

            this.stream = await navigator.mediaDevices.getUserMedia(finalConstraints);
            this.video = videoElement;
            
            videoElement.srcObject = this.stream;
            
            return new Promise((resolve, reject) => {
                videoElement.onloadedmetadata = () => {
                    videoElement.play();
                    resolve(this.stream);
                };
                
                videoElement.onerror = () => {
                    reject(new Error('Gagal memuat video stream'));
                };
            });

        } catch (error) {
            console.error('Error accessing camera:', error);
            
            let errorMessage = 'Gagal mengakses kamera';
            
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Akses kamera ditolak. Silakan berikan izin untuk menggunakan kamera.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'Kamera tidak ditemukan pada perangkat ini.';
            } else if (error.name === 'NotReadableError') {
                errorMessage = 'Kamera sedang digunakan oleh aplikasi lain.';
            } else if (error.name === 'OverconstrainedError') {
                errorMessage = 'Kamera tidak mendukung pengaturan yang diminta.';
            }
            
            throw new Error(errorMessage);
        }
    }

    // Stop camera stream
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
            });
            this.stream = null;
        }

        if (this.video) {
            this.video.srcObject = null;
            this.video = null;
        }
    }

    // Capture photo from video stream
    capturePhoto(videoElement, canvasElement) {
        if (!videoElement || !canvasElement) {
            throw new Error('Video atau canvas element tidak ditemukan');
        }

        if (!this.stream || videoElement.videoWidth === 0) {
            throw new Error('Camera stream tidak aktif');
        }

        this.canvas = canvasElement;
        const context = canvasElement.getContext('2d');
        
        // Set canvas size to match video
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        
        // Draw video frame to canvas
        context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
        
        // Get image data
        this.capturedImageData = canvasElement.toDataURL('image/jpeg', 0.8);
        
        return this.capturedImageData;
    }

    // Convert data URL to File object
    dataURLtoFile(dataURL, filename = 'captured-photo.jpg') {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        return new File([u8arr], filename, { type: mime });
    }

    // Get captured photo as File object
    getCapturedPhotoFile(filename = 'captured-photo.jpg') {
        if (!this.capturedImageData) {
            throw new Error('Belum ada foto yang diambil');
        }
        
        return this.dataURLtoFile(this.capturedImageData, filename);
    }

    // Clear captured photo
    clearCapturedPhoto() {
        this.capturedImageData = null;
        if (this.canvas) {
            const context = this.canvas.getContext('2d');
            context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    // Switch camera (front/back)
    async switchCamera() {
        if (!this.video) {
            throw new Error('Camera tidak aktif');
        }

        const currentConstraints = this.stream.getVideoTracks()[0].getSettings();
        const newFacingMode = currentConstraints.facingMode === 'user' ? 'environment' : 'user';
        
        this.stopCamera();
        
        await this.startCamera(this.video, {
            video: {
                facingMode: newFacingMode
            }
        });
    }

    // Get available cameras
    async getAvailableCameras() {
        if (!this.isCameraSupported()) {
            return [];
        }

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'videoinput');
        } catch (error) {
            console.error('Error getting camera devices:', error);
            return [];
        }
    }

    // Initialize camera with custom options and callbacks
    async initCamera(containerElement, options = {}) {
        if (!containerElement) {
            throw new Error('Container element tidak ditemukan');
        }

        const {
            onCapture = null,
            onError = null,
            maxSize = 1024 * 1024, // 1MB default
            allowGallery = false
        } = options;

        // Create camera UI HTML
        containerElement.innerHTML = `
            <div class="camera-container">
                <div class="camera-preview-container">
                    <video id="camera-video" class="camera-preview" autoplay muted playsinline style="display: none;"></video>
                    <canvas id="camera-canvas" class="camera-preview" style="display: none;"></canvas>
                    <img id="captured-image" class="camera-preview" style="display: none;" alt="Foto yang diambil">
                </div>
                <div class="camera-controls">
                    <button type="button" id="start-camera-btn" class="btn btn-primary">
                        <i class="fas fa-camera"></i>
                        Mulai Kamera
                    </button>
                    <button type="button" id="capture-btn" class="btn btn-success" style="display: none;">
                        <i class="fas fa-camera-retro"></i>
                        Ambil Foto
                    </button>
                    <button type="button" id="retake-btn" class="btn btn-secondary" style="display: none;">
                        <i class="fas fa-redo"></i>
                        Ambil Ulang
                    </button>
                    <button type="button" id="stop-camera-btn" class="btn btn-danger" style="display: none;">
                        <i class="fas fa-stop"></i>
                        Stop Kamera
                    </button>
                    ${allowGallery ? `
                        <input type="file" id="gallery-input" accept="image/*" style="display: none;">
                        <button type="button" id="gallery-btn" class="btn btn-secondary">
                            <i class="fas fa-images"></i>
                            Galeri
                        </button>
                    ` : ''}
                </div>
                <div class="camera-status">
                    <p id="camera-status-text">Klik "Mulai Kamera" untuk mengambil foto</p>
                </div>
            </div>
        `;

        // Get UI elements
        const video = containerElement.querySelector('#camera-video');
        const canvas = containerElement.querySelector('#camera-canvas');
        const capturedImage = containerElement.querySelector('#captured-image');
        const startBtn = containerElement.querySelector('#start-camera-btn');
        const captureBtn = containerElement.querySelector('#capture-btn');
        const retakeBtn = containerElement.querySelector('#retake-btn');
        const stopBtn = containerElement.querySelector('#stop-camera-btn');
        const statusText = containerElement.querySelector('#camera-status-text');
        const galleryInput = containerElement.querySelector('#gallery-input');
        const galleryBtn = containerElement.querySelector('#gallery-btn');

        // Helper function to handle captured photo
        const handlePhotoCapture = (imageDataUrl) => {
            try {
                // Convert to blob
                const photoFile = this.dataURLtoFile(imageDataUrl, 'captured-photo.jpg');
                
                // Check file size
                if (photoFile.size > maxSize) {
                    const maxSizeMB = maxSize / (1024 * 1024);
                    throw new Error(`Ukuran foto terlalu besar. Maksimal ${maxSizeMB}MB`);
                }

                // Show captured image
                capturedImage.src = imageDataUrl;
                capturedImage.style.display = 'block';
                video.style.display = 'none';
                
                captureBtn.style.display = 'none';
                retakeBtn.style.display = 'inline-flex';
                
                statusText.textContent = 'Foto berhasil diambil!';

                // Call onCapture callback with blob
                if (onCapture) {
                    // Convert file to blob
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const arrayBuffer = e.target.result;
                        const blob = new Blob([arrayBuffer], { type: photoFile.type });
                        onCapture(blob);
                    };
                    reader.readAsArrayBuffer(photoFile);
                }
            } catch (error) {
                statusText.textContent = `Error: ${error.message}`;
                if (onError) {
                    onError(error);
                }
            }
        };

        // Event handlers
        startBtn.onclick = async () => {
            try {
                statusText.textContent = 'Memulai kamera...';
                await this.startCamera(video);
                
                video.style.display = 'block';
                canvas.style.display = 'none';
                capturedImage.style.display = 'none';
                
                startBtn.style.display = 'none';
                captureBtn.style.display = 'inline-flex';
                stopBtn.style.display = 'inline-flex';
                
                statusText.textContent = 'Kamera aktif - Klik "Ambil Foto" untuk mengambil gambar';
            } catch (error) {
                statusText.textContent = `Error: ${error.message}`;
                if (onError) {
                    onError(error);
                }
            }
        };

        captureBtn.onclick = () => {
            try {
                const imageData = this.capturePhoto(video, canvas);
                handlePhotoCapture(imageData);
            } catch (error) {
                statusText.textContent = `Error: ${error.message}`;
                if (onError) {
                    onError(error);
                }
            }
        };

        retakeBtn.onclick = () => {
            this.clearCapturedPhoto();
            
            video.style.display = 'block';
            capturedImage.style.display = 'none';
            
            retakeBtn.style.display = 'none';
            captureBtn.style.display = 'inline-flex';
            
            statusText.textContent = 'Kamera aktif - Klik "Ambil Foto" untuk mengambil gambar';
        };

        stopBtn.onclick = () => {
            this.stopCamera();
            this.clearCapturedPhoto();
            
            video.style.display = 'none';
            canvas.style.display = 'none';
            capturedImage.style.display = 'none';
            
            startBtn.style.display = 'inline-flex';
            captureBtn.style.display = 'none';
            retakeBtn.style.display = 'none';
            stopBtn.style.display = 'none';
            
            statusText.textContent = 'Klik "Mulai Kamera" untuk mengambil foto';
        };

        // Gallery input handler (if enabled)
        if (allowGallery && galleryInput && galleryBtn) {
            galleryBtn.onclick = () => {
                galleryInput.click();
            };

            galleryInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    // Check file type
                    if (!file.type.startsWith('image/')) {
                        statusText.textContent = 'File yang dipilih bukan gambar';
                        return;
                    }

                    // Check file size
                    if (file.size > maxSize) {
                        const maxSizeMB = maxSize / (1024 * 1024);
                        statusText.textContent = `Ukuran foto terlalu besar. Maksimal ${maxSizeMB}MB`;
                        return;
                    }

                    // Convert file to data URL and handle
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        handlePhotoCapture(e.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            };
        }

        // Return camera instance object
        return {
            video,
            canvas,
            capturedImage,
            startBtn,
            captureBtn,
            retakeBtn,
            stopBtn,
            galleryBtn,
            statusText,
            container: containerElement,
            // Methods
            start: () => startBtn.click(),
            capture: () => captureBtn.click(),
            retake: () => retakeBtn.click(),
            stop: () => stopBtn.click(),
            // Cleanup method
            cleanup: () => {
                this.stopCamera();
                this.clearCapturedPhoto();
            }
        };
    }

    // Initialize camera with UI controls (legacy method - takes container ID)
    async initializeCameraUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container dengan ID '${containerId}' tidak ditemukan`);
        }

        // Use the new initCamera method
        return await this.initCamera(container, {
            allowGallery: true
        });
    }

    // Cleanup when component is destroyed
    cleanup() {
        this.stopCamera();
        this.clearCapturedPhoto();
    }
}

// Create global camera utils instance
const cameraUtils = new CameraUtils();

// Export for use in other modules
window.cameraUtils = cameraUtils; 