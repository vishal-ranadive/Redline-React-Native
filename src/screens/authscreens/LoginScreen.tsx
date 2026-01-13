import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import { TextInput, Button, Text, useTheme, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { p } from '../../utils/responsive';
import Toast from 'react-native-toast-message';

const LoginScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Login'>>();
  const { theme, toggleTheme } = useThemeStore();
  const paperTheme = useTheme();
  const { login, isLoading, clearError, user, accessToken } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [ipadError, setIpadError] = useState('');

  // 🔁 Dynamic subtitles that cycle every 2 seconds
  const subtitles = [
    'First Responder Gear Cleaning & Inspecting',
    'Real-Time Gear Tracking — Anytime, Anywhere',
    'Before, After & In-Service Status at Your Fingertips',
    'Always Ready. Always Reliable. Always RedLine.',
  ];

  const [currentSubtitle, setCurrentSubtitle] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Switch text and fade in
        setCurrentSubtitle((prev) => (prev + 1) % subtitles.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [fadeAnim, subtitles.length]);

  // Clear error on unmount
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  // Prevent authenticated users from accessing login screen
  useEffect(() => {
    if (user && accessToken) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'LeadScreen' }],
      });
    }
  }, [user, accessToken, navigation]);

  // Disable back gesture on Login screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Prevent going back if user is authenticated
      if (user && accessToken) {
        e.preventDefault();
      }
    });

    return unsubscribe;
  }, [navigation, user, accessToken]);


  const handleLogin = async () => {
    console.log('🎯 Login button pressed');
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: 'Missing fields',
        text2: 'Please enter both email and password',
      });
      return;
    }

    try {
      await login(email, password);
      console.log('✅ Login successful, checking user role');
      
      // Check if user role is allowed
      const currentUser = useAuthStore.getState().user;
      const allowedRoles = ["Technician", "Corporate_Technician"];
      
      if (currentUser?.role && !allowedRoles.includes(currentUser.role)) {
        console.log('❌ Unauthorized role:', currentUser.role);
        Toast.show({
          type: 'error',
          text1: 'Access Denied',
          text2: 'Your role does not have access to this application',
        });
        navigation.navigate('Unauthorized');
        return;
      }
      
      console.log('✅ Login successful, navigating to LeadScreen');
      Toast.show({
        type: 'success',
        text1: 'Login successful 👏',
        text2: 'Welcome back to RedLine Gear',
      });
      // Reset navigation stack to prevent going back to Login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'LeadScreen' }],
      });
    } catch (loginError) {
      console.error('❌ Login error caught in component:', loginError);

      // Check if the error is specifically about unauthorized access for role on iPad
      let errorMessage = '';
      if (loginError && typeof loginError === 'object') {
        if ('response' in loginError && loginError.response && typeof loginError.response === 'object' &&
            'data' in loginError.response && loginError.response.data && typeof loginError.response.data === 'object') {
          // Check for both 'message' and 'error' properties in response data
          if ('message' in loginError.response.data && typeof loginError.response.data.message === 'string') {
            errorMessage = loginError.response.data.message;
          } else if ('error' in loginError.response.data && typeof loginError.response.data.error === 'string') {
            errorMessage = loginError.response.data.error;
          }
        }
        if (errorMessage === '' && 'message' in loginError && typeof loginError.message === 'string') {
          errorMessage = loginError.message;
        }
        if (errorMessage === '') {
          errorMessage = String(loginError);
        }
      } else {
        errorMessage = String(loginError);
      }
      const isUnauthorizedIPadError = errorMessage.includes('Unauthorized access for this role on iPad');

      if (isUnauthorizedIPadError) {
        setIpadError('RedLine Access Denied');
      }

      Toast.show({
        type: 'error',
        text1: isUnauthorizedIPadError ? 'Access Denied' : 'Login failed',
        text2: isUnauthorizedIPadError ? 'Unauthorized access for this role on iPad' : 'Invalid credentials or server issue',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: paperTheme.colors.background }]}
    >
      {/* 🌗 Theme Toggle */}
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

          {/* ✨ Animated Subtitle */}
          <Animated.Text
            style={[
              styles.subtitle,
              { color: paperTheme.colors.onBackground, opacity: fadeAnim },
            ]}
          >
            {subtitles[currentSubtitle]}
          </Animated.Text>

          {/* 📧 Email */}
          <TextInput
            label="Email"
            mode="outlined"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              clearError();
              setIpadError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            theme={{ fonts: { bodyLarge: { fontSize: p(14) } } }}
            disabled={isLoading}
          />

          {/* 🔒 Password */}
          <TextInput
            label="Password"
            mode="outlined"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearError();
              setIpadError('');
            }}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
            theme={{ fonts: { bodyLarge: { fontSize: p(14) } } }}
            disabled={isLoading}
          />

          {/* Error Message */}
          {ipadError ? (
            <Text style={[styles.errorText, { color: paperTheme.colors.error }]}>
              {ipadError}
            </Text>
          ) : null}

          {/* 🚪 Login Button */}
          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
            labelStyle={{ fontSize: p(16), fontWeight: '600' }}
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>

          {/* Forgot Password */}
          {/* <Button
            onPress={() => navigation.navigate('ForgotPassword')}
            textColor={paperTheme.colors.primary}
            labelStyle={{ fontSize: p(17) }}
            disabled={isLoading}
          >
            Forgot password?
          </Button> */}

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
    marginBottom: p(8),
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: p(16),
    marginBottom: p(24),
    textAlign: 'center',
    fontWeight: '500',
  },
  input: {
    marginBottom: p(16),
    width: '100%',
  },
  errorText: {
    fontSize: p(14),
    marginBottom: p(16),
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: 'rgba(244, 67, 54, 0.1)', // Light red background like highlighter
    paddingHorizontal: p(12),
    paddingVertical: p(4),
    borderRadius: p(4),
    overflow: 'hidden',
    width: '100%',
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

export default LoginScreen;
