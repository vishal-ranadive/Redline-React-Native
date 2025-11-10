// src\services\authApi.ts
import axios from 'axios';
import { Platform } from 'react-native';
import { BASE_URL } from '@env';
import { axiosInstance } from './api';

export const authApi = {
  login: async (email: string, password: string) => {
    console.log('🔐 Making login request to:', `${BASE_URL}/login`);
    
    const response = await axios.post(`${BASE_URL}/login`, {
      email,
      password,
    });
    
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await axios.post(`${BASE_URL}/refresh`, {
      refresh_token: refreshToken,
    });
    
    return response.data;
  },
};


// Generic API function with auth token
export const apiCall = async (method: 'get' | 'post' | 'put' | 'delete' | 'patch', endpoint: string, data?: any, accessToken?: string) => {
  const headers: any = {
    'Content-Type': 'application/json',
    'X-Platform': Platform.OS,
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  console.log(`🔄 API ${method.toUpperCase()}: ${BASE_URL}${endpoint}`);

  const response = await axios({
    method,
    url: `${BASE_URL}${endpoint}`,
    data,
    headers,
    timeout: 10000,
  });

  console.log(`✅ API Response: ${response.status} ${endpoint}`);
  return response.data;
};



// ✅ Use axiosInstance (already has interceptors, token, etc.)
export const getUserProfile = async (userId: string) => {
  console.log(`📄 Fetching user profile for ID: ${userId}`);
  const response = await axiosInstance.get(`/users/${userId}/`);
  return response.data;
};

export const updateUserProfile = async (userId: number, payload: any) => {
  console.log(`✏️ Updating user profile for ID: ${userId}`, payload);
  const response = await axiosInstance.put(`/users/${userId}/`, payload);
  return response.data;
};