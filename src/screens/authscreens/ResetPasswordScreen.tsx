// src/screens/ResetPasswordScreen.tsx
import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { TextInput, Button, Text, useTheme, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { p } from '../../utils/responsive';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
            Reset Password
          </Text>
        </View>

        {/* Inputs */}
        <TextInput
          label="New Password"
          mode="outlined"
          secureTextEntry={!showPassword}
          value={newPassword}
          onChangeText={setNewPassword}
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
          style={{ marginBottom: p(16) }}
          contentStyle={{ fontSize: p(16) }}
        />

        <TextInput
          label="Confirm Password"
          mode="outlined"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={{ marginBottom: p(16) }}
          contentStyle={{ fontSize: p(16) }}
        />

        <Button
          mode="contained"
          onPress={() => navigation.navigate('Login')}
          style={styles.button}
          labelStyle={{ fontSize: p(18) }}
        >
          Reset Password
        </Button>
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
