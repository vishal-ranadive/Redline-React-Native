// src/store/useAuthStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {jwtDecode} from 'jwt-decode';
import axios from 'axios';
import { BASE_URL } from '@env';
import { getUserProfile, updateUserProfile } from '../services/authApi';
import { setAuthStore } from '../services/api';

/* ---------- User interface (internal normalized shape) ---------- */
interface User {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  contactPhone?: string;
  role?: string;
  roleId?: number;
  corporateId?: number | null;
  corporateName?: string;
  franchiseId?: number | null;
  franchiseName?: string;
  firestationId?: number | null;
  firestationName?: string | null;
  permissions: string[];
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  status?: boolean;
  lastLogin?: string;
}

/* ---------- State ---------- */
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshTokens: () => Promise<void>;
  fetchProfile: (id: string | number) => Promise<void>;
  updateProfile: (payload: any) => Promise<void>;
}

/* ---------- Normalizers ---------- */
const normalizeFromJWT = (decoded: any): User => ({
  id: decoded.user_id,
  firstName: decoded.first_name || decoded.firstName,
  lastName: decoded.last_name || decoded.lastName,
  email: decoded.email,
  contactPhone: decoded.contact_phone || decoded.contactPhone,
  role: decoded.role,
  roleId: decoded.role_id,
  corporateId: decoded.corporate_id,
  franchiseId: decoded.franchise_id,
  firestationId: decoded.firestation_id,
  permissions: decoded.permissions || [],
  address: decoded.address,
  city: decoded.city,
  state: decoded.state,
  zipCode: decoded.zip_code,
  status: decoded.status,
  lastLogin: decoded.last_login,
});

const normalizeFromApi = (apiUser: any): User => ({
  id: apiUser.user_id,
  firstName: apiUser.profile?.first_name,
  lastName: apiUser.profile?.last_name,
  email: apiUser.profile?.email,
  contactPhone: apiUser.profile?.contact_phone,
  role: apiUser.role?.role,
  roleId: apiUser.role?.role_id,
  corporateId: apiUser.corporate?.corporate_id ?? null,
  corporateName: apiUser.corporate?.corporate_name,
  franchiseId: apiUser.franchise?.franchise_id ?? null,
  franchiseName: apiUser.franchise?.franchise_name,
  firestationId: apiUser.firestation?.firestation_id ?? null,
  firestationName: apiUser.firestation?.fire_station_name,
  permissions: apiUser.role?.permissions?.map((p: any) => p.permission_name) || [],
  address: apiUser.profile?.address,
  city: apiUser.profile?.city,
  state: apiUser.profile?.state,
  zipCode: apiUser.profile?.zip_code,
  status: apiUser.active_status,
  lastLogin: apiUser.last_login,
});

/* ---------- Store ---------- */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      /* -------- LOGIN: decode, store tokens, fetch profile -------- */
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${BASE_URL}/login/`, { email, password });
          const { access_token, refresh_token } = response.data;

          // 1) set tokens immediately so axios interceptors can use them
          set({ accessToken: access_token, refreshToken: refresh_token });

          // 2) decode JWT to extract user_id (and a fallback user object)
          let decoded: any = {};
          try {
            decoded = jwtDecode(access_token);
          } catch (e) {
            console.warn('Failed to decode JWT', e);
          }

          // 3) attempt to fetch canonical user from API using the id from the token
          const userId = decoded?.user_id;
          if (userId !== undefined && userId !== null) {
            try {
              // fetchProfile normalizes and sets user in store
              await get().fetchProfile(userId);
            } catch (fetchErr) {
              console.warn('fetchProfile failed after login, falling back to JWT user', fetchErr);
              // fallback: use normalized JWT payload if API fails
              const fallback = normalizeFromJWT(decoded);
              set({ user: fallback });
            }
          } else {
            // If token doesn't include id, fallback to JWT-normalized user
            const fallback = normalizeFromJWT(decoded);
            set({ user: fallback });
          }

          set({ isLoading: false, error: null });
        } catch (err: any) {
          console.error('Login failed', err.response?.data || err.message || err);
          set({
            isLoading: false,
            error: err.response?.data?.message || 'Login failed. Please try again.',
          });
          throw err;
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          error: null,
        });
      },

      clearError: () => set({ error: null }),

      refreshTokens: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          get().logout();
          return;
        }
        try {
          const res = await axios.post(`${BASE_URL}/refresh/`, { refresh_token: refreshToken });
          const { access_token, refresh_token } = res.data;
          set({ accessToken: access_token, refreshToken: refresh_token });
        } catch (error) {
          console.error('Token refresh failed', error);
          get().logout();
          throw error;
        }
      },

      /* -------- FETCH PROFILE: call API, normalize & set user -------- */
      fetchProfile: async (id: string | number) => {
        try {
          const res = await getUserProfile(String(id)); // API expects string path param
          // API returns { status: true, message: "...", user: { ... } }
          const apiUser = res?.user ?? res; // handle if service returns raw user or wrapped
          const normalized = normalizeFromApi(apiUser);
          set({ user: normalized });
        } catch (error) {
          console.error('Failed to fetch user profile', error);
          throw error;
        }
      },

      /* -------- UPDATE PROFILE: call API and re-normalize result -------- */
      updateProfile: async (payload: any) => {
        const { user, fetchProfile } = get();
        if (!user?.id) throw new Error('No user to update');

        try {
          const res = await updateUserProfile(user.id, payload);
          console.log('✅ Profile updated:', res);

          // Re-fetch latest user data to normalize properly
          await fetchProfile(user.id);
        } catch (error) {
          console.error('❌ Failed to update profile', error);
          throw error;
        }
      },
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

/* ---------- register store with api helper so interceptors can pull tokens ---------- */
setAuthStore(useAuthStore);
