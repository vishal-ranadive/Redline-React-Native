import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { p } from '../../utils/responsive';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;
const SPLASH_DURATION = 3000;

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const logoPulseRef = useRef<Animated.CompositeAnimation | null>(null);

  const { user, accessToken } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState<boolean>(
    useAuthStore.persist?.hasHydrated?.() ?? false,
  );

  useEffect(() => {
    const unsubHydrate = useAuthStore.persist?.onHydrate?.(() =>
      setIsHydrated(false),
    );
    const unsubFinish = useAuthStore.persist?.onFinishHydration?.(() =>
      setIsHydrated(true),
    );
    setIsHydrated(useAuthStore.persist?.hasHydrated?.() ?? false);
    return () => {
      unsubHydrate?.();
      unsubFinish?.();
    };
  }, []);

  const hasSession = useMemo(
    () => Boolean(user && accessToken),
    [accessToken, user],
  );

  useEffect(() => {
    const fadeInLogo = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        delay: 150,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]);

    const progressAnim = Animated.timing(progressWidth, {
      toValue: 100,
      duration: SPLASH_DURATION,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    });

    fadeInLogo.start(() => {
      progressAnim.start();
      logoPulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(logoScale, {
            toValue: 1.05,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 0.97,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      logoPulseRef.current.start();
    });

    return () => {
      logoOpacity.stopAnimation();
      logoScale.stopAnimation();
      progressWidth.stopAnimation();
      logoPulseRef.current?.stop();
    };
  }, [logoOpacity, logoScale, progressWidth]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    const timer = setTimeout(() => {
      if (hasSession) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'LeadScreen' }],
        });
      } else {
        navigation.replace('Login');
      }
    }, SPLASH_DURATION);

    return () => clearTimeout(timer);
  }, [hasSession, isHydrated, navigation]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <View style={styles.progressWrapper}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ef1313ff',
    padding: p(24),
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: p(320),
    height: p(320),
    tintColor: '#ffffff',
  },
  progressWrapper: {
    position: 'absolute',
    bottom: p(48),
    width: '70%',
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: p(6),
    borderRadius: p(3),
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: p(3),
    backgroundColor: '#ffffff',
  },
});

export default SplashScreen;
