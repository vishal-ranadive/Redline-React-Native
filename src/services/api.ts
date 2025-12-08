import axios from 'axios';
import { Platform } from 'react-native';
import { BASE_URL } from '@env';
import Toast from 'react-native-toast-message';

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

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    if (authStore && authStore.getState().accessToken) {
      config.headers.Authorization = `Bearer ${authStore.getState().accessToken}`;
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
      authStore.getState().logout();
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
      authStore.getState().logout();
      
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