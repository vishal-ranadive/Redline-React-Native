// src\services\authApi.ts
import axios from 'axios';
import { Platform } from 'react-native';
import { BASE_URL } from '@env';

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