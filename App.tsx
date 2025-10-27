import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  MD3LightTheme,
  MD3DarkTheme,
  PaperProvider,
  adaptNavigationTheme,
  MD3Theme,
} from 'react-native-paper';
import { useThemeStore } from './src/store/themeStore';

import LoginScreen from './src/screens/authscreens/LoginScreen';
import ForgotPasswordScreen from './src/screens/authscreens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/authscreens/ResetPasswordScreen';

export type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  LeadScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ✅ Proper usage: provide both navigation themes explicitly
import {
  DefaultTheme as NavigationDefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from '@react-navigation/native';
import LeadScreen from './src/screens/leadscreens/LeadScreen';

// Adapt navigation themes for Paper integration
const { LightTheme: NavLightTheme, DarkTheme: NavDarkTheme } =
  adaptNavigationTheme({
    reactNavigationLight: NavigationDefaultTheme,
    reactNavigationDark: NavigationDarkTheme,
  });

// ✅ Merge only colors to avoid type mismatch
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
        <StatusBar
          barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        />
        {/* ⚠️ Casting only for NavigationContainer since it expects its own Theme type */}
        <NavigationContainer theme={paperTheme as any}>
          <AppContent />
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="LeadScreen" component={LeadScreen} />
      </Stack.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
