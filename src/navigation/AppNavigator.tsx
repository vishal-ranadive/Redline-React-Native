// src\navigation\AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/authscreens/LoginScreen';
import ForgotPasswordScreen from '../screens/authscreens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/authscreens/ResetPasswordScreen';
import SplashScreen from '../screens/authscreens/SplashScreen';
import LeadScreen from '../screens/leadscreens/LeadScreen';
import SettingsScreen from '../screens/settingsscreens/Settings';
import LeadDetailScreen from '../screens/leadscreens/LeadDetailScreen';
import { withMainLayout } from '../layout/withMainLayout';
import GearSearchScreen from '../screens/gearscreens/GearSearchScreen';
import GearScanScreen from '../screens/gearscreens/GearScanScreen';
import GearDetailScreen from '../screens/gearscreens/GearDetailScreen';
import UpdateInspectionStatusScreen from '../screens/inspectionscreens/UpdateInspectionScreen';
import AddGearScreen from '../screens/gearscreens/AddGearScreen';
import UpdateProfileScreen from '../screens/settingsscreens/UpdateProfileScreen';
import LoadsScreen from '../screens/inspectionscreens/LoadsScreen';
import GearsScreen from '../screens/inspectionscreens/GearsScreen';
import ProfileScreen from '../screens/settingsscreens/Profile';
import FirefighterListScreen from '../screens/inspectionscreens/FirefighterListScreen';
import ViewInspectionScreen from '../screens/inspectionscreens/ViewInspectionScreen';
import FirefighterGearsScreen from '../screens/inspectionscreens/FirefighterGearsScreen';
import FirefighterFlowScreen from '../screens/firefighterscreens/FirefighterFlowScreen';
import PPEReportPreviewScreen from '../screens/leadscreens/PPEReportPreviewScreen';
import { FirefighterRoster } from '../store/inspectionStore';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  LeadScreen: undefined;
  Settings: undefined;
  LeadDetail: { lead: any };

  GearScan: undefined;
  GearSearch: undefined;
  AddGear: { presetRoster?: any } | undefined;

  GearDetail: {gear_id:any};
    FirefighterFlow: {firefighter?:any};


  UpadateInspection:  { 
      gearId: number; 
      inspectionId?: number;
      mode: "create" | "update";
      firefighter?:any;
      colorLocked?:boolean;
      tagColor?: string;
   };

  //Profile
   UpdateProfile: undefined;
   Profile:undefined;

  //Load flow
  LoadsScreen:undefined;
  GearScreen:{load:any}

  //Fire Fighter Flow
  FirefighterGearsScreen:{roster: FirefighterRoster, leadId:any};
  FirefighterListScreen:any;
  ViewInspectionScreen:undefined;

  //PPE Report Preview
  PPEReportPreview: { leadId: number; leadData: any };


};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
      <Stack.Screen name="Splash" component={SplashScreen} />
      {/* Auth Screens */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

      {/* App Screens */}
      <Stack.Screen name="LeadScreen" component={withMainLayout(LeadScreen)} />
      <Stack.Screen name="Settings" component={withMainLayout(SettingsScreen)} />
      <Stack.Screen name="UpadateInspection" component={withMainLayout(UpdateInspectionStatusScreen)}/>

      {/* Detail Screen (no bottom nav) */}
      <Stack.Screen name="LeadDetail" component={withMainLayout(LeadDetailScreen)} />
      <Stack.Screen name="GearScan" component={withMainLayout(GearScanScreen)} options={{ headerShown: false }}/>
      <Stack.Screen name="GearSearch" component={withMainLayout(GearSearchScreen)} />
      <Stack.Screen name="AddGear" component={withMainLayout(AddGearScreen)} options={{ headerShown: false }}/>

      <Stack.Screen name="GearDetail" component={withMainLayout(GearDetailScreen)} options={{ headerShown: false }}/>
      <Stack.Screen name="FirefighterFlow" component={withMainLayout(FirefighterFlowScreen)} />


      {/* Profile Screen */}
      <Stack.Screen name="UpdateProfile" component={withMainLayout(UpdateProfileScreen)} />
      <Stack.Screen name="Profile" component={withMainLayout(ProfileScreen)} />

    {/* Load flow */}
      <Stack.Screen name="LoadsScreen" component={withMainLayout(LoadsScreen) } />
      <Stack.Screen name="GearScreen" component={withMainLayout(GearsScreen)} />

      {/*  Fire Fighter Flow*/}
      
      <Stack.Screen name="FirefighterGearsScreen" component={withMainLayout(FirefighterGearsScreen)} />
      <Stack.Screen name="FirefighterListScreen" component={withMainLayout(FirefighterListScreen)} />
      <Stack.Screen name="ViewInspectionScreen" component={withMainLayout(ViewInspectionScreen)} />
      
      {/* PPE Report Preview Screen */}
      <Stack.Screen name="PPEReportPreview" component={withMainLayout(PPEReportPreviewScreen)} />

    </Stack.Navigator>
  );
}
