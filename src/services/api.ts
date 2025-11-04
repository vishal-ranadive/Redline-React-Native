// src\services\api.ts
import axios from 'axios';
import { Platform } from 'react-native';

// Create axios instance
const api = axios.create({
  baseURL: 'https://your-api-base-url.com/api', // Replace with your API URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Platform': Platform.OS,
  },
});

// Store reference to auth store functions
let authStore: any = null;

// Function to set auth store after it's created
export const setAuthStore = (store: any) => {
  authStore = store;
};

// Request interceptor to add auth token
api.interceptors.request.use(
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
api.interceptors.response.use(
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

    // Handle token refresh if needed
    if (error.response?.status === 401 && authStore) {
      // You can implement token refresh logic here
      authStore.getState().logout();
    }

    return Promise.reject(error);
  }
);

export default api;