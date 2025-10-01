import * as faceapi from 'face-api.js';

class FaceDetectionService {
  private isInitialized = false;
  private modelLoadPromise: Promise<void> | null = null;
  private lastDetectionResult: { timestamp: number; result: any } | null = null;
  private readonly CACHE_DURATION = 2000; // Cache for 2 seconds

  /**
   * Initialize face-api.js models (only load once)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.modelLoadPromise) {
      return this.modelLoadPromise;
    }

    this.modelLoadPromise = this.loadModelsWithTimeout();
    try {
      await this.modelLoadPromise;
      this.isInitialized = true;
    } catch (error) {
      this.modelLoadPromise = null; // Reset so it can be retried
      throw error;
    }
  }

  private async loadModelsWithTimeout(): Promise<void> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Face detection model loading timed out')), 10000);
    });
    
    return Promise.race([this.loadModels(), timeoutPromise]);
  }

  private async loadModels(): Promise<void> {
    try {
      console.log('🔍 Loading face detection models...');
      
      // Load only the essential models for face detection
      const MODEL_URL = '/models'; // Models will be served from public/models
      
      // Load only the minimal model needed for face detection
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      
      console.log('✅ Face detection models loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load face detection models:', error);
      throw new Error('Face detection initialization failed');
    }
  }

  /**
   * Detect faces in an image and return the count
   */
  async detectFaces(imageElement: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): Promise<{
    faceCount: number;
    isPrivacyCompliant: boolean;
    errorMessage?: string;
  }> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('🔍 Detecting faces in image (ultra-fast mode)...');
      
      // Create a very small canvas for maximum speed
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Ultra-aggressive resize to maximum 160px width for lightning speed
      const maxWidth = 160;
      let { width, height } = this.getImageDimensions(imageElement);
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Use lower quality but faster drawing
      if (ctx) {
        ctx.imageSmoothingEnabled = false; // Disable smoothing for speed
        ctx.drawImage(imageElement as any, 0, 0, width, height);
      }
      
      // Ultra-fast detection with minimal settings
      const detections = await faceapi
        .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions({
          inputSize: 128, // Minimal size for maximum speed
          scoreThreshold: 0.2 // Very low threshold for quick detection
        }));

      const faceCount = detections.length;
      const isPrivacyCompliant = faceCount === 1;

      console.log(`👥 Ultra-fast detection: ${faceCount} face(s) - Privacy compliant: ${isPrivacyCompliant}`);
      
      // Clean up canvas to free memory
      canvas.width = 0;
      canvas.height = 0;

      return {
        faceCount,
        isPrivacyCompliant,
        errorMessage: this.getPrivacyMessage(faceCount)
      };

    } catch (error) {
      console.error('❌ Face detection error:', error);
      return {
        faceCount: 0,
        isPrivacyCompliant: false,
        errorMessage: 'Face detection failed. Please try again.'
      };
    }
  }

  /**
   * Analyze a canvas image for face detection
   */
  async analyzeCanvas(canvas: HTMLCanvasElement): Promise<{
    faceCount: number;
    isPrivacyCompliant: boolean;
    errorMessage?: string;
  }> {
    return this.detectFaces(canvas);
  }

  /**
   * Get appropriate privacy message based on face count
   */
  private getPrivacyMessage(faceCount: number): string | undefined {
    if (faceCount === 0) {
      return 'No face detected. Please ensure you are clearly visible in the camera.';
    } else if (faceCount > 1) {
      return `Multiple people detected (${faceCount} faces). For voting privacy, only one person should be present.`;
    }
    return undefined; // Single face - all good
  }

  /**
   * Get image dimensions from various image element types (for optimization)
   */
  private getImageDimensions(imageElement: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): { width: number; height: number } {
    if (imageElement instanceof HTMLVideoElement) {
      return { width: imageElement.videoWidth || 640, height: imageElement.videoHeight || 480 };
    } else if (imageElement instanceof HTMLCanvasElement) {
      return { width: imageElement.width, height: imageElement.height };
    } else if (imageElement instanceof HTMLImageElement) {
      return { width: imageElement.naturalWidth || imageElement.width, height: imageElement.naturalHeight || imageElement.height };
    }
    return { width: 320, height: 240 }; // fallback
  }

  /**
   * Check if the service is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const faceDetectionService = new FaceDetectionService();
export default faceDetectionService;