// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useThemeStore } from '../../store/themeStore';
import { p } from '../../utils/responsive'; // scaling helper
import { IconButton } from 'react-native-paper';



const baseSizes = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 42, 44, 46, 48];

function ScalingPreviewScreen() {
  return (
    <ScrollView contentContainerStyle={styless.container}>
      <Text style={styless.header}>📏 Text Scaling Preview</Text>

      {baseSizes.map((size) => {
        const scaled = p(size).toFixed(2);
        return (
          <View key={size} style={styless.row}>
            <Text style={[styless.label, { fontSize: p(14) }]}>
              Base {size}px → Scaled {scaled}px
            </Text>
            <Text style={{ fontSize: p(size), color: '#ff5f1f' }}>
              The quick brown fox jumps over the lazy dog.
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styless = StyleSheet.create({
  container: {
    padding: p(16),
    backgroundColor: '#4a4d4dff',
  },
  header: {
    fontSize: p(24),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: p(20),
  },
  row: {
    marginBottom: p(16),
  },
  label: {
    color: '#666',
    marginBottom: p(6),
  },
});


const LoginScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Login'>>();
  const { theme, toggleTheme } = useThemeStore();
  const paperTheme = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: paperTheme.colors.background }]}
    >
      {/* Optional test scaling block */}
      {/* <ScalingPreviewScreen /> */}

          {/* 🔆 Theme Toggle Button - Top Right */}
    <View style={styles.topRightButton}>
      <IconButton
        icon={theme === 'dark' ? 'white-balance-sunny' : 'moon-waning-crescent'}
        size={p(22)}
        iconColor={paperTheme.colors.primary}
        onPress={toggleTheme}
      />
    </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          {/* App Title */}
          <Text
            style={[
              styles.title,
              { color: paperTheme.colors.primary },
            ]}
          >
            RedLine Gear
          </Text>

          <Text
            style={[
              styles.subtitle,
              { color: paperTheme.colors.onBackground },
            ]}
          >
            First Responder Gear Cleaning & Inspecting
          </Text>

          {/* Email Input */}
          <TextInput
            label={<Text style={{ fontSize: p(14) }}>Email</Text>}
            mode="outlined"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            theme={{
              fonts: {
                bodyLarge: { fontSize: p(14) },
              },
            }}
          />

          {/* Password Input */}
          <TextInput
            label={<Text style={{ fontSize: p(14) }}>Password</Text>}
            mode="outlined"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
            theme={{
              fonts: {
                bodyLarge: { fontSize: p(14) },
              },
            }}
          />

          {/* Login Button */}
          <Button
            mode="contained"
            onPress={() => navigation.navigate('LeadScreen')}
            style={styles.button}
            labelStyle={{ fontSize: p(16), fontWeight: '600' }}
          >
            Login
          </Button>

          {/* Forgot Password */}
            <Button
              onPress={() => navigation.navigate('ForgotPassword')}
              textColor={paperTheme.colors.primary}
              labelStyle={{ fontSize: p(17) }}
              
            >
              Forgot password?
            </Button>

          


          {/* Toggle Theme */}


          {/* Footer */}
          <Text style={[styles.footer, { color: paperTheme.colors.outline }]}>
            © 2025 RedLine Gear
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  topRightButton: {
    position: 'absolute',
    top: p(40),
    right: p(20),
    zIndex: 10,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: p(16),
  },
  formContainer: {
    width: '90%',
    maxWidth: p(500), // scale limit for tablets
  },
  title: {
    fontSize: p(32),
    marginBottom: p(8),
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: p(16),
    marginBottom: p(24),
    textAlign: 'center',
  },
  input: {
    marginBottom: p(16),
  },
  button: {
    marginBottom: p(12),
    paddingVertical: p(5),
    borderRadius: p(6),
  },
  footer: {
    fontSize: p(12),
    textAlign: 'center',
    marginTop: p(24),
  },
  testContainer: {
    alignItems: 'center',
    marginTop: p(10),
  },
  testText: {
    marginVertical: p(4),
  },
});

export default LoginScreen;
