// src/screens/ResetPasswordScreen.tsx
import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { TextInput, Button, Text, useTheme, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { p } from '../../utils/responsive';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();


  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.formContainer}>
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            iconColor={theme.colors.primary}
            size={p(28)}
            onPress={() => navigation.goBack()}
            style={{ position: 'absolute', left: 0 }}
          />
          <Text
            variant="headlineMedium"
            style={{ fontSize: p(24), color: theme.colors.onBackground, textAlign: 'center', flex: 1 }}
          >
            Settings
          </Text>
        </View>

        {/* Inputs */}

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center',alignItems: 'center',padding: p(16) },
  formContainer: { width: '90%', maxWidth: p(400) },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: p(24),
    justifyContent: 'center',
    position: 'relative',
  },
  button: {
    paddingVertical: p(10),
    borderRadius: p(6),
  },
});
