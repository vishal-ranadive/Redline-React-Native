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
    onProgress?: (progress: ImageUploadProgress) => void
  ): Promise<ImageUploadResponse> {
    try {
      // Fix Android file URI handling - ensure proper format
      let fileUri = imageUri;
      if (Platform.OS === 'android') {
        // For Android, keep the file:// prefix as-is for FormData
        // FormData on Android expects file:// URIs
        if (!fileUri.startsWith('file://') && !fileUri.startsWith('content://')) {
          fileUri = `file://${fileUri}`;
        }
      } else {
        // For iOS, remove file:// prefix
        fileUri = imageUri.replace('file://', '');
      }

      // Create FormData
      const formData = new FormData();
      
      // Add gearId
      formData.append('gearId', gearId.toString());

      // Add image file
      const filename = imageUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri: fileUri,
        name: filename,
        type: type,
      } as any);

      console.log('📤 Uploading image:', { imageUri, fileUri, gearId, filename, type });

      // Use axiosInstance for upload with progress tracking
      const response = await axiosInstance.post('/upload-inspection-image/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 2400000, // 40 minutes - allow enough time for large images to upload
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress: ImageUploadProgress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded / progressEvent.total) * 100)
            };
            onProgress(progress);
          }
        },
      });

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
      console.error('❌ Error uploading image:', error);
      
      // Handle axios error
      if (error.response) {
        // Server responded with error status
        return {
          status: false,
          message: error.response.data?.message || `Upload failed with status ${error.response.status}`,
          error: 'UPLOAD_FAILED'
        };
      } else if (error.request) {
        // Request was made but no response
        return {
          status: false,
          message: 'Network error during upload',
          error: 'NETWORK_ERROR'
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

