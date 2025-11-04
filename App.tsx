import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, adaptNavigationTheme, MD3LightTheme, MD3DarkTheme, MD3Theme } from 'react-native-paper';
import { useThemeStore } from './src/store/themeStore';
import AppNavigator from './src/navigation/AppNavigator'; // ✅ use only this
import Toast from 'react-native-toast-message'; // ✅ Import here


import {
  DefaultTheme as NavigationDefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from '@react-navigation/native';

const { LightTheme: NavLightTheme, DarkTheme: NavDarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

const CustomLightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...NavLightTheme.colors,
    primary: '#ef1313ff',
    background: '#F9F9F9',
    surface: '#FFFFFF',
    onSurface: '#222222',
    outline: '#CCCCCC',
  },
};

const CustomDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...NavDarkTheme.colors,
    primary: '#ef1313ff',
    background: '#121212',
    surface: '#1E1E1E',
    onSurface: '#FFFFFF',
    outline: '#444444',
  },
};

function App() {
  const theme = useThemeStore(state => state.theme);
  const paperTheme = theme === 'dark' ? CustomDarkTheme : CustomLightTheme;

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaProvider>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
        <NavigationContainer theme={paperTheme as any}>
          <AppNavigator /> {/* ✅ your single source of navigation */}
        </NavigationContainer>
        <Toast />
      </SafeAreaProvider>
    </PaperProvider>
  );
}

export default App;
