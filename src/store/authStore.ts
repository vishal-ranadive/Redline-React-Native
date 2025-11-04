import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import api, { setAuthStore } from '../services/api';
import axios from 'axios';
import { BASE_URL } from '@env';


interface User {
  id: string;
  role: string;
  status: boolean;
  lastLogin: string;
  firstName: string;
  lastName: string;
  email: string;
  contactPhone: string;
  role_id: number;
  corporate_id: number;
  franchise_id: number;
  firestation_id: number | null;
  permissions: string[];
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshTokens: () => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        console.log('🔐 Attempting login for:', email);
        set({ isLoading: true, error: null });

        try {
          // Use axios directly to avoid circular dependency
          const response = await axios.post(`${BASE_URL}/login/`, {
            email,
            password,
          });

          console.log('✅ Login successful:', response.data);

          const { access_token, refresh_token, ...userData } = response.data;
          
          // Decode token to get user info
          const decodedToken: any = jwtDecode(access_token);
          console.log('🔓 Decoded token:', decodedToken);

          const user: User = {
            id: userData.id,
            role: userData.role,
            status: userData.status,
            lastLogin: userData.lastLogin,
            firstName: decodedToken.firstName,
            lastName: decodedToken.lastName,
            email: decodedToken.email,
            contactPhone: decodedToken.contactPhone,
            role_id: decodedToken.role_id,
            corporate_id: decodedToken.corporate_id,
            franchise_id: decodedToken.franchise_id,
            firestation_id: decodedToken.firestation_id,
            permissions: decodedToken.permissions,
          };

          set({
            user,
            accessToken: access_token,
            refreshToken: refresh_token,
            isLoading: false,
            error: null,
          });

          console.log('👤 User state updated:', user);

        } catch (error: any) {
          console.error('❌ Login failed:', error.response?.data || error.message);
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Login failed. Please try again.',
          });
          throw error;
        }
      },

      logout: () => {
        console.log('🚪 Logging out user');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      refreshTokens: async () => {
        console.log('🔄 Refreshing tokens');
        const { refreshToken } = get();
        
        if (!refreshToken) {
          console.error('❌ No refresh token available');
          get().logout();
          return;
        }

        try {
          const response = await axios.post('https://your-api-base-url.com/api/auth/refresh', {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token } = response.data;
          
          set({
            accessToken: access_token,
            refreshToken: refresh_token,
          });

          console.log('✅ Tokens refreshed successfully');
        } catch (error: any) {
          console.error('❌ Token refresh failed:', error);
          get().logout();
          throw error;
        }
      },

      updateProfile: async (profileData:any) => {
        // API call to update profile
        // Update user in state
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

// Set up the auth store reference for the API interceptor
setAuthStore(useAuthStore);