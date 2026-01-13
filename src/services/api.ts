import axios from 'axios';
import { Platform } from 'react-native';
import { BASE_URL } from '@env';
import Toast from 'react-native-toast-message';
import { isTokenExpired } from '../utils/tokenUtils';

// Create axios instance
export const axiosInstance = axios.create({
  baseURL: `${BASE_URL}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Platform': Platform.OS,
  },
});

// Store reference to auth store functions
let authStore: any = null;
// Store reference to navigation
let navigationRef: any = null;
// Track if we're currently refreshing the token to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
// Queue of failed requests to retry after token refresh
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
  config: any;
}> = [];

// Function to set auth store after it's created
export const setAuthStore = (store: any) => {
  authStore = store;
};

// Function to set navigation ref
export const setNavigationRef = (ref: any) => {
  navigationRef = ref;
};

// Process the queue of failed requests after token refresh
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.config.headers.Authorization = `Bearer ${token}`;
      axiosInstance(prom.config).then(prom.resolve).catch(prom.reject);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    if (authStore) {
      const accessToken = authStore.getState().accessToken;
      
      // Add token to request if available
      // Note: We let the response interceptor handle token expiration
      // to allow for automatic token refresh
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    
    // CRITICAL FIX FOR iOS: Remove Content-Type header for FormData uploads
    // React Native MUST automatically set 'multipart/form-data' with boundary parameter
    // Manually setting it (or leaving default 'application/json') prevents boundary from being added
    // This causes "Network Error" on iOS before request even reaches server
    if (config.data instanceof FormData) {
      // Delete Content-Type header to let React Native handle it automatically
      delete config.headers['Content-Type'];
      console.log('🔧 Removed Content-Type header for FormData upload - React Native will set it with boundary');
    }
    
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.error('❌ API Response Error:', {
      url: originalRequest?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    // Check if this is a token expiration error
    const isTokenExpiredError = 
      error.response?.status === 401 ||
      error.response?.status === 403 ||
      (error.response?.data?.detail?.toLowerCase().includes('token') && 
       error.response?.data?.detail?.toLowerCase().includes('expired')) ||
      (error.response?.data?.message?.toLowerCase().includes('token') && 
       error.response?.data?.message?.toLowerCase().includes('expired')) ||
      error.message?.toLowerCase().includes('token is expired') ||
      error.message?.toLowerCase().includes('token has expired');

    // Don't attempt refresh if:
    // 1. This is the refresh token endpoint itself (would cause infinite loop)
    // 2. We don't have auth store
    // 3. We've already attempted a retry (prevent infinite loops)
    // 4. This is not a token expiration error
    const isRefreshEndpoint = originalRequest?.url?.includes('/token/refresh/');
    const shouldAttemptRefresh = 
      isTokenExpiredError &&
      authStore &&
      !isRefreshEndpoint &&
      !originalRequest._retry;

    if (shouldAttemptRefresh) {
      // If we're already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      // Mark that we're attempting a refresh
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 Access token expired, attempting to refresh...');
        
        // Attempt to refresh the token
        await authStore.getState().refreshTokens();
        
        // Get the new access token
        const newAccessToken = authStore.getState().accessToken;
        
        if (newAccessToken) {
          console.log('✅ Token refreshed successfully, retrying original request');
          
          // Update the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          
          // Process any queued requests
          processQueue(null, newAccessToken);
          isRefreshing = false;
          
          // Retry the original request
          return axiosInstance(originalRequest);
        } else {
          throw new Error('Failed to get new access token after refresh');
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        isRefreshing = false;
        
        // Process queue with error (this will reject all queued requests)
        processQueue(refreshError, null);
        
        // Logout the user
        authStore.getState().logout().catch((err: any) => {
          console.error('Error during logout:', err);
        });
        
        // Show toast message
        Toast.show({
          type: 'error',
          text1: 'Session Expired',
          text2: 'Your session has expired. Please login again.',
          visibilityTime: 4000,
        });

        // Navigate to login screen
        if (navigationRef) {
          navigationRef.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
        
        return Promise.reject(refreshError);
      }
    }

    // For other errors or if refresh was not attempted, reject normally
    return Promise.reject(error);
  }
);

// Export the axios instance as default as well for backward compatibility
export default axiosInstance;