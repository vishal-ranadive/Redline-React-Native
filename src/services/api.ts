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

// Function to set auth store after it's created
export const setAuthStore = (store: any) => {
  authStore = store;
};

// Function to set navigation ref
export const setNavigationRef = (ref: any) => {
  navigationRef = ref;
};

// Request interceptor to add auth token and check expiration
axiosInstance.interceptors.request.use(
  (config) => {
    if (authStore) {
      const accessToken = authStore.getState().accessToken;
      
      // Check if token is expired before making the request
      if (accessToken && isTokenExpired(accessToken)) {
        console.warn('⚠️ Token expired before request, logging out...');
        
        // Logout and clear all stores
        authStore.getState().logout().catch(err => {
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
        
        // Reject the request to prevent it from being made
        return Promise.reject(new Error('Token expired'));
      }
      
      // Add token to request if valid
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
    console.error('❌ API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    // Handle 401 unauthorized errors
    if (error.response?.status === 401 && authStore) {
      authStore.getState().logout().catch(err => {
        console.error('Error during logout:', err);
      });
      if (navigationRef) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    }

    // Handle 403 forbidden errors with expired token
    if (
      error.response?.status === 403 &&
      authStore &&
      (error.response?.data?.detail === 'Token has expired' ||
        error.response?.data?.message === 'Token has expired' ||
        error.message?.includes('Token has expired'))
    ) {
      // Logout the user
      authStore.getState().logout().catch(err => {
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
    }

    return Promise.reject(error);
  }
);

// Export the axios instance as default as well for backward compatibility
export default axiosInstance;