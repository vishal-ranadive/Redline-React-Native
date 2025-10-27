// src/screens/ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  IconButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { p } from '../../utils/responsive';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ForgotPassword'
>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const [email, setEmail] = useState('');

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
            style={{
              fontSize: p(24),
              color: theme.colors.onBackground,
              textAlign: 'center',
              flex: 1,
            }}
          >
            Forgot Password
          </Text>
        </View>

        {/* Info */}
        <Text
          variant="bodyMedium"
          style={{
            marginBottom: p(24),
            fontSize: p(16),
            color: theme.colors.onBackground,
            textAlign: 'center',
          }}
        >
          We will send you a reset link to your registered email
        </Text>

        {/* Input */}
        <TextInput
          label="Email"
          mode="outlined"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{ marginBottom: p(16) }}
          contentStyle={{ fontSize: p(16) }}
        />

        <Button
          mode="contained"
          onPress={() => navigation.navigate('ResetPassword')}
          style={styles.button}
          labelStyle={{ fontSize: p(18) }}
        >
          Send Reset Link
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: p(16),
  },
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
