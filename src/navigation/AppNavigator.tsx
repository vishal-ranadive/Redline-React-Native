import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/authscreens/LoginScreen';
import ForgotPasswordScreen from '../screens/authscreens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/authscreens/ResetPasswordScreen';
import LeadScreen from '../screens/leadscreens/LeadScreen';
import SettingsScreen from '../screens/settingsscreens/Settings';
import LeadDetailScreen from '../screens/leadscreens/LeadDetailScreen';
import { withMainLayout } from '../layout/withMainLayout';
import GearSearchScreen from '../screens/gearscreens/GearSearchScreen';
import ViewInspectionsScreen from '../screens/inspectionscreens/ViewInspectionsScreen';

export type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  LeadScreen: undefined;
  Settings: undefined;
  LeadDetail: { lead: any };
  GearSearch: undefined;
  Inspections: undefined;

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
      <Stack.Screen name="GearSearch" component={withMainLayout(GearSearchScreen)} />
      <Stack.Screen name="Inspections" component={withMainLayout(ViewInspectionsScreen)} />

      {/* Detail Screen (no bottom nav) */}
      <Stack.Screen name="LeadDetail" component={withMainLayout(LeadDetailScreen)} />
    </Stack.Navigator>
  );
}
