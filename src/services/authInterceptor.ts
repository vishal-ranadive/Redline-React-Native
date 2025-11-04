// src\services\authInterceptor.ts
import axios from 'axios';

export const setupAuthInterceptor = (authStore: any) => {
  // Request interceptor
  axios.interceptors.request.use(
    (config) => {
      const token = authStore.getState().accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error('❌ API Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  axios.interceptors.response.use(
    (response) => {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
      return response;
    },
    (error) => {
      console.error('❌ API Response Error:', error.response?.status, error.message);
      
      if (error.response?.status === 401) {
        authStore.getState().logout();
      }
      
      return Promise.reject(error);
    }
  );
};