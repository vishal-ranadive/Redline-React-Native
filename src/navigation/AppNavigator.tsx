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


import GearScanScreen from '../screens/gearscreens/GearScanScreen';
import GearDetailScreen from '../screens/gearscreens/GearDetailScreen';
import ViewGroupInspectionsScreen from '../screens/inspectionscreens/ViewGroupInspectionsScreen';
import ViewNestedInspectionScreen from '../screens/inspectionscreens/ViewNestedInspectionScreen';
import UpdateInspectionStatusScreen from '../screens/inspectionscreens/UpdateInspectionScreen';

export type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  LeadScreen: undefined;
  Settings: undefined;
  LeadDetail: { lead: any };
  GearScan: undefined;
  GearDetail: undefined
  GearSearch: undefined;
  GroupInspections: undefined;
  NestedInspections: { type?: string };
  UpadateInspection: undefined;

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
      <Stack.Screen name="GroupInspections" component={withMainLayout(ViewGroupInspectionsScreen)} />
      <Stack.Screen name="NestedInspections" component={withMainLayout(ViewNestedInspectionScreen)} />
      <Stack.Screen name="UpadateInspection" component={withMainLayout(UpdateInspectionStatusScreen)}/>

      {/* Detail Screen (no bottom nav) */}
      <Stack.Screen name="LeadDetail" component={withMainLayout(LeadDetailScreen)} />
      <Stack.Screen name="GearScan" component={withMainLayout(GearScanScreen)} options={{ headerShown: false }}/>
      <Stack.Screen name="GearDetail" component={withMainLayout(GearDetailScreen)} options={{ headerShown: false }}/>
    </Stack.Navigator>
  );
}
