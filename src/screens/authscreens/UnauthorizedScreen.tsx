import React from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { Button, Text, useTheme, Icon } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { p } from '../../utils/responsive';

const UnauthorizedScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Unauthorized'>>();
  const { theme, toggleTheme } = useThemeStore();
  const paperTheme = useTheme();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: paperTheme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          {/* RedLine Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={{ 
                uri: theme === 'dark'
                  ? 'https://res.cloudinary.com/dwwykeft2/image/upload/v1765531884/RedLine/gdfwbzg3ejynlcu3kqk3.png'
                  : 'https://res.cloudinary.com/dwwykeft2/image/upload/v1765457898/RedLine/wqoaomsleu1egppnvjo6.png'
              }}
              style={styles.logo}
              resizeMode="cover"
            />
          </View>

          {/* 🟥 App Title */}
          <Text style={[styles.title, { color: paperTheme.colors.primary }]}>
            Access Denied
          </Text>

          {/* ⚠️ Error Message */}
          <Text style={[styles.message, { color: paperTheme.colors.onBackground }]}>
            You do not have permission to access this application.
          </Text>

          {/* Role Display */}
          {user?.role && (
            <View style={styles.roleContainer}>
              <Text style={[styles.roleLabel, { color: paperTheme.colors.outline }]}>
                Your Role:
              </Text>
              <Text style={[styles.roleValue, { color: paperTheme.colors.onBackground }]}>
                {user.role}
              </Text>
            </View>
          )}

          {/* Info Text */}
          <Text style={[styles.infoText, { color: paperTheme.colors.outline }]}>
            Only users with "Technician" or "Corporate_Technician" roles can access this application.
          </Text>

          {/* 🚪 Logout Button */}
          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.button}
            labelStyle={{ fontSize: p(16), fontWeight: '600' }}
          >
            Return to Login
          </Button>

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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: p(16),
  },
  formContainer: {
    width: '90%',
    maxWidth: p(500),
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: p(32),
  },
  logo: {
    width: p(200),
    height: p(60),
  },
  title: {
    fontSize: p(32),
    marginBottom: p(16),
    textAlign: 'center',
    fontWeight: 'bold',
  },
  message: {
    fontSize: p(18),
    marginBottom: p(24),
    textAlign: 'center',
    fontWeight: '500',
  },
  roleContainer: {
    marginBottom: p(24),
    padding: p(16),
    borderRadius: p(8),
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    width: '100%',
    alignItems: 'center',
  },
  roleLabel: {
    fontSize: p(14),
    marginBottom: p(8),
    textAlign: 'center',
  },
  roleValue: {
    fontSize: p(18),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoText: {
    fontSize: p(14),
    marginBottom: p(32),
    textAlign: 'center',
    lineHeight: p(20),
  },
  button: {
    marginBottom: p(12),
    paddingVertical: p(5),
    borderRadius: p(6),
    width: '100%',
  },
  footer: {
    fontSize: p(12),
    textAlign: 'center',
    marginTop: p(24),
  },
});

export default UnauthorizedScreen;

