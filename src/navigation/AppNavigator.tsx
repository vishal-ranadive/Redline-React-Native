import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/authscreens/LoginScreen';
import ForgotPasswordScreen from '../screens/authscreens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/authscreens/ResetPasswordScreen';
import LeadScreen from '../screens/leadscreens/LeadScreen';
import SettingsScreen from '../screens/settingsscreens/Settings';
import LeadDetailScreen from '../screens/leadscreens/LeadDetailScreen';
import { withMainLayout } from '../layout/withMainLayout';

import GearScanScreen from '../screens/gearscreens/GearScanScreen';
import GearDetailScreen from '../screens/gearscreens/GearDetailScreen';

export type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  LeadScreen: undefined;
  Settings: undefined;
  LeadDetail: { lead: any };
  GearScan: undefined;
  GearDetail: undefined
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
      {/* Auth Screens */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

      {/* App Screens */}
      <Stack.Screen name="LeadScreen" component={withMainLayout(LeadScreen)} />
      <Stack.Screen name="Settings" component={withMainLayout(SettingsScreen)} />

      {/* Detail Screen (no bottom nav) */}
      <Stack.Screen name="LeadDetail" component={withMainLayout(LeadDetailScreen)} />
      <Stack.Screen name="GearScan" component={withMainLayout(GearScanScreen)} options={{ headerShown: false }}/>
      <Stack.Screen name="GearDetail" component={withMainLayout(GearDetailScreen)} options={{ headerShown: false }}/>
    </Stack.Navigator>
  );
}
