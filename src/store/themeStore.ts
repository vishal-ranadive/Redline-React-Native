// src/store/themeStore.ts
import { create } from 'zustand'; // ✅ use named import
import { Appearance } from 'react-native';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setTheme: (theme) => set({ theme }),
}));
