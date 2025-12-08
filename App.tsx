import React, { useRef } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, adaptNavigationTheme, MD3LightTheme, MD3DarkTheme, MD3Theme } from 'react-native-paper';
import { useThemeStore } from './src/store/themeStore';
import AppNavigator from './src/navigation/AppNavigator'; // ✅ use only this
import Toast from 'react-native-toast-message'; // ✅ Import here
import { setNavigationRef } from './src/services/api';


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
    onPrimary: '#FFFFFF', 
    background: '#18181bff',
    surface: '#222425',
    surfaceVariant: '#2C2E30',
    onSurface: '#F2F2F2',
    outline: '#55585A',
    secondary: '#9E9E9E',

    // ✅ Required by MD3 to avoid TypeScript errors
    elevation: {
      level0: 'transparent',
      level1: '#242628',
      level2: '#2A2C2E',
      level3: '#2F3133',
      level4: '#343637',
      level5: '#383A3C',
    },
  },
};

function App() {
  const theme = useThemeStore(state => state.theme);
  const paperTheme = theme === 'dark' ? CustomDarkTheme : CustomLightTheme;
  const navigationRef = useRef<any>(null);

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaProvider>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
        <NavigationContainer 
          ref={(ref) => {
            navigationRef.current = ref;
            setNavigationRef(ref);
          }}
          theme={paperTheme as any}
        >
          <AppNavigator /> {/* ✅ your single source of navigation */}
        </NavigationContainer>
        <Toast />
      </SafeAreaProvider>
    </PaperProvider>
  );
}

export default App;
