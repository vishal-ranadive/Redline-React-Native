// src/services/imageUploadApi.ts
import { axiosInstance } from './api';
import { Platform } from 'react-native';

export interface ImageUploadResponse {
  status: boolean;
  message: string;
  data?: {
    url: string;
    filename: string;
  };
  error?: string;
}

export interface ImageUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Reusable Image Upload API Service
 * Can be used anywhere in the application for uploading images
 * 
 * API Response Format:
 * {
 *   "status": true,
 *   "uploaded": [
 *     {
 *       "filename": "image.jpg",
 *       "public_image_url": "https://..."
 *     }
 *   ],
 *   "errors": []
 * }
 */
class ImageUploadApi {

  /**
   * Upload a single image for gear inspection
   * @param imageUri - Local file URI (file:// or content://)
   * @param gearId - ID of the gear
   * @param onProgress - Optional callback for upload progress
   * @returns Promise with upload response (normalized to { status, message, data: { url, filename } })
   */
  async uploadInspectionImage(
    imageUri: string,
    gearId: number,
    onProgress?: (progress: ImageUploadProgress) => void,
    retryCount: number = 0
  ): Promise<ImageUploadResponse> {
    const maxRetries = Platform.OS === 'ios' ? 3 : 2; // iOS gets 3 retries, Android gets 2
    const timeoutDuration = 2400000; // 40 minutes for both iOS and Android
    
    try {
      // Fix file URI handling - ensure proper format for FormData
      // Both iOS and Android require file:// prefix for FormData uploads
      let fileUri = imageUri;
      if (!fileUri.startsWith('file://') && !fileUri.startsWith('content://') && !fileUri.startsWith('http')) {
        fileUri = `file://${fileUri}`;
      }

      // Create FormData
      const formData = new FormData();
      
      // Add gearId
      formData.append('gearId', gearId.toString());

      // Add image file
      const filename = imageUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      // Verify file URI format
      console.log(`🔍 File details:`, {
        originalUri: imageUri,
        processedUri: fileUri,
        filename,
        type,
        extension: match ? match[1] : 'unknown'
      });

      formData.append('image', {
        uri: fileUri,
        name: filename,
        type: type,
      } as any);

      console.log(`📤 Uploading image (attempt ${retryCount + 1}/${maxRetries + 1}):`, {
        originalUri: imageUri,
        finalUri: fileUri,
        hasFilePrefix: fileUri.startsWith('file://'),
        isEditedImage: imageUri.includes('/tmp/ReactNative/'),
        gearId,
        filename,
        type,
        platform: Platform.OS,
        timeout: timeoutDuration
      });

      // Use axiosInstance for upload with progress tracking
      // Create a new config object to ensure timeout is properly set
      const uploadConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: timeoutDuration, // Platform-specific timeout
        // Don't transform the request - let FormData handle it
        transformRequest: (data: any) => data,
        onUploadProgress: (progressEvent: any) => {
          if (onProgress && progressEvent.total) {
            const progress: ImageUploadProgress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded / progressEvent.total) * 100)
            };
            onProgress(progress);
          }
        },
      };

      const response = await axiosInstance.post('/upload-inspection-image/', formData, uploadConfig);

      console.log('✅ Image uploaded successfully:', response.data);
      
      // Parse the response structure: { status, uploaded: [{ filename, public_image_url }], errors }
      const uploadedData = response.data.uploaded?.[0];
      
      if (response.data.status && uploadedData?.public_image_url) {
        return {
          status: true,
          message: 'Image uploaded successfully',
          data: {
            url: uploadedData.public_image_url,
            filename: uploadedData.filename
          }
        };
      } else if (response.data.errors?.length > 0) {
        // Handle server-side errors
        return {
          status: false,
          message: response.data.errors[0] || 'Upload failed',
          error: 'SERVER_ERROR'
        };
      } else {
        // Unexpected response format
        return {
          status: false,
          message: 'Unexpected response format from server',
          error: 'INVALID_RESPONSE'
        };
      }
    } catch (error: any) {
      console.error(`❌ Error uploading image (attempt ${retryCount + 1}/${maxRetries + 1}):`, {
        message: error.message,
        code: error.code,
        platform: Platform.OS,
        timeout: error.code === 'ECONNABORTED' || error.message?.includes('timeout'),
        hasResponse: !!error.response,
        responseStatus: error.response?.status,
      });
      
      // Check if it's a retryable error (timeout OR network error)
      const isTimeoutError = error.code === 'ECONNABORTED' || 
                            error.message?.includes('timeout') || 
                            error.message?.includes('TIMEOUT');
      const isNetworkError = error.code === 'ERR_NETWORK' || 
                            error.message?.includes('Network Error');
      const isRetryableError = isTimeoutError || isNetworkError;
      
      if (isRetryableError && retryCount < maxRetries) {
        const errorType = isTimeoutError ? 'timeout' : 'network error';
        const delayMs = (retryCount + 1) * 2000; // Exponential backoff: 2s, 4s, 6s
        console.log(`🔄 Retrying upload (attempt ${retryCount + 2}/${maxRetries + 1}) after ${errorType}...`);
        console.log(`⏳ Waiting ${delayMs}ms before retry...`);
        // Wait a bit before retrying (exponential backoff)
        await new Promise<void>(resolve => setTimeout(resolve, delayMs));
        return this.uploadInspectionImage(imageUri, gearId, onProgress, retryCount + 1);
      }

      console.error(`❌ All ${maxRetries + 1} upload attempts failed. Giving up.`);
      
      // Handle axios error
      if (error.response) {
        // Server responded with error status
        return {
          status: false,
          message: error.response.data?.message || `Upload failed with status ${error.response.status}`,
          error: 'UPLOAD_FAILED'
        };
      } else if (error.request) {
        // Request was made but no response (network error or timeout)
        const errorMessage = isTimeoutError 
          ? `Upload timeout on ${Platform.OS}. Please check your connection and try again.`
          : 'Network error during upload';
        return {
          status: false,
          message: errorMessage,
          error: isTimeoutError ? 'TIMEOUT_ERROR' : 'NETWORK_ERROR'
        };
      } else {
        // Something else happened
        return {
          status: false,
          message: error.message || 'Failed to upload image',
          error: 'UPLOAD_ERROR'
        };
      }
    }
  }

  /**
   * Upload multiple images in sequence
   * @param imageUris - Array of local file URIs
   * @param gearId - ID of the gear
   * @param onProgress - Optional callback for overall progress
   * @returns Promise with array of upload responses
   */
  async uploadMultipleImages(
    imageUris: string[],
    gearId: number,
    onProgress?: (current: number, total: number, currentProgress: ImageUploadProgress) => void
  ): Promise<ImageUploadResponse[]> {
    const results: ImageUploadResponse[] = [];
    
    for (let i = 0; i < imageUris.length; i++) {
      const imageUri = imageUris[i];
      
      // Skip if it's already a URL (already uploaded)
      if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
        console.log(`⏭️ Skipping already uploaded image: ${imageUri}`);
        results.push({
          status: true,
          message: 'Image already uploaded',
          data: { url: imageUri, filename: '' }
        });
        continue;
      }

      console.log(`📤 Uploading image ${i + 1} of ${imageUris.length}`);
      
      const result = await this.uploadInspectionImage(
        imageUri,
        gearId,
        (progress) => {
          if (onProgress) {
            onProgress(i + 1, imageUris.length, progress);
          }
        }
      );
      
      results.push(result);

      // If upload failed, you might want to stop or continue
      if (!result.status) {
        console.error(`❌ Failed to upload image ${i + 1}:`, result.message);
        // Continue uploading other images even if one fails
      }
    }

    return results;
  }
}

// Export singleton instance
export const imageUploadApi = new ImageUploadApi();

// Export class for custom instances
export default ImageUploadApi;

