// src/store/themeStore.ts
import { create } from 'zustand'; // ✅ use named import
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemePreference = 'light' | 'dark' | 'automatic';
type Theme = 'light' | 'dark';

interface ThemeState {
  themePreference: ThemePreference;
  theme: Theme; // The actual theme being used
  setThemePreference: (preference: ThemePreference) => Promise<void>;
  loadThemePreference: () => Promise<void>;
}

const THEME_STORAGE_KEY = '@app_theme_preference';

// Helper to get the actual theme based on preference
const getActualTheme = (preference: ThemePreference): Theme => {
  if (preference === 'automatic') {
    return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  }
  return preference;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  themePreference: 'automatic',
  theme: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
  
  setThemePreference: async (preference: ThemePreference) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
      const actualTheme = getActualTheme(preference);
      set({ themePreference: preference, theme: actualTheme });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  },
  
  loadThemePreference: async () => {
    try {
      const savedPreference = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedPreference && ['light', 'dark', 'automatic'].includes(savedPreference)) {
        const preference = savedPreference as ThemePreference;
        const actualTheme = getActualTheme(preference);
        set({ themePreference: preference, theme: actualTheme });
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  },
}));

// Listen to system theme changes when in automatic mode
Appearance.addChangeListener(({ colorScheme }) => {
  const state = useThemeStore.getState();
  if (state.themePreference === 'automatic') {
    useThemeStore.setState({ 
      theme: colorScheme === 'dark' ? 'dark' : 'light' 
    });
  }
});
