import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PermissionsAndroid,
  Platform,
  StyleProp,
  ViewStyle,
  View,
  Alert,
  Linking,
} from 'react-native';
import { IconButton, useTheme, Text } from 'react-native-paper';
import * as VoiceToText from '@ascendtis/react-native-voice-to-text';
import { check, request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';

// Singleton to track active voice input instance
class VoiceInputManager {
  private activeInstanceId: string | null = null;
  private listeners: Map<string, () => void> = new Map();

  setActive(instanceId: string, onDeactivate: () => void) {
    // Deactivate previous instance
    if (this.activeInstanceId && this.activeInstanceId !== instanceId) {
      const prevDeactivate = this.listeners.get(this.activeInstanceId);
      if (prevDeactivate) {
        prevDeactivate();
      }
    }
    
    this.activeInstanceId = instanceId;
    this.listeners.set(instanceId, onDeactivate);
  }

  isActive(instanceId: string): boolean {
    return this.activeInstanceId === instanceId;
  }

  deactivate(instanceId: string) {
    if (this.activeInstanceId === instanceId) {
      this.activeInstanceId = null;
      this.listeners.delete(instanceId);
    }
  }

  clear() {
    this.activeInstanceId = null;
    this.listeners.clear();
  }
}

const voiceInputManager = new VoiceInputManager();

type VoiceInputButtonProps = {
  /**
   * Current text value from the controlled TextInput.
   * Required when appendResults = true.
   */
  value?: string;
  /**
   * Callback that mirrors TextInput's onChangeText.
   * If present, the component will update the field automatically.
   */
  onChangeText?: (text: string) => void;
  /**
   * Optional callback fired with every speech-to-text result.
   */
  onSpeechResult?: (text: string) => void;
  /**
   * Append the recognized text to the existing value instead of replacing it.
   */
  appendResults?: boolean;
  /**
   * Disable the button when true.
   */
  disabled?: boolean;
  /**
   * Optional styles forwarded to IconButton.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * IconButton size override.
   */
  size?: number;
  /**
   * Optional callback to bubble up microphone errors.
   */
  onError?: (message: string) => void;
};

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  value,
  onChangeText,
  onSpeechResult,
  appendResults = true,
  disabled,
  style,
  size = 28,
  onError,
}) => {
  const { colors } = useTheme();
  const instanceId = useRef(`voice-input-${Date.now()}-${Math.random()}`).current;
  const [isListening, setIsListening] = useState(false);
  const blinkOpacity = useRef(new Animated.Value(1)).current;
  
  // Alexa-style pulsing wave animations
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;

  const computedAccessibilityLabel = useMemo(
    () => (isListening ? 'Stop voice input' : 'Start voice input'),
    [isListening],
  );

  const applyResultToInput = useCallback((text: string) => {
    if (!text.trim()) {
      return;
    }

    onSpeechResult?.(text);

    if (!onChangeText) {
      return;
    }

    if (appendResults && value) {
      const separator = value.trim().length === 0 ? '' : value.endsWith(' ') ? '' : ' ';
      onChangeText(`${value}${separator}${text}`.trimStart());
      return;
    }

    onChangeText(text);
  }, [appendResults, onChangeText, onSpeechResult, value]);

  // Alexa-style pulsing wave animation
  useEffect(() => {
    if (!isListening) {
      blinkOpacity.stopAnimation();
      blinkOpacity.setValue(1);
      wave1.stopAnimation();
      wave2.stopAnimation();
      wave3.stopAnimation();
      wave1.setValue(0);
      wave2.setValue(0);
      wave3.setValue(0);
      return;
    }

    // Button pulse animation
    const blinkAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkOpacity, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(blinkOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );

    // Wave animations (Alexa-style)
    const wave1Animation = Animated.loop(
      Animated.sequence([
        Animated.timing(wave1, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(wave1, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    const wave2Animation = Animated.loop(
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(wave2, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(wave2, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    const wave3Animation = Animated.loop(
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(wave3, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(wave3, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    blinkAnimation.start();
    wave1Animation.start();
    wave2Animation.start();
    wave3Animation.start();

    return () => {
      blinkAnimation.stop();
      wave1Animation.stop();
      wave2Animation.stop();
      wave3Animation.stop();
    };
  }, [blinkOpacity, wave1, wave2, wave3, isListening]);

  /**
   * Register voice-to-text event listeners once.
   * We:
   * - Update `isListening` based on START/END events
   * - Apply recognized text when RESULTS arrive, then stop listening
   * - Only update state if this instance is active
   */
  useEffect(() => {
    const resultsListener = VoiceToText.addEventListener(
      'onSpeechResults',
      (event: { value?: string }) => {
        console.log('Voice-to-text results received:', event);
        
        // Only process results if this instance is active
        if (!voiceInputManager.isActive(instanceId)) {
          console.log('Ignoring results - instance not active');
          return;
        }

        const text = event?.value ?? '';
        console.log('Processing speech text:', text);
        
        if (text && text.trim()) {
          applyResultToInput(text);
        } else {
          console.warn('Empty speech result received');
        }

        // Single-shot recognizer: stop after first result.
        try {
          const stopResult = VoiceToText.stopListening();
          if (stopResult && typeof stopResult.catch === 'function') {
            stopResult.catch((err: any) => {
              console.warn('Error stopping listening:', err);
            });
          }
        } catch (error) {
          console.warn('Error stopping listening:', error);
        }
      },
    );

    const startListener = VoiceToText.addEventListener(
      'onSpeechStart',
      () => {
        console.log('Speech recognition started');
        // Only update if this instance is active
        if (voiceInputManager.isActive(instanceId)) {
          setIsListening(true);
        }
      },
    );

    const endListener = VoiceToText.addEventListener(
      'onSpeechEnd',
      () => {
        console.log('Speech recognition ended');
        // Only update if this instance is active
        if (voiceInputManager.isActive(instanceId)) {
          setIsListening(false);
          voiceInputManager.deactivate(instanceId);
        }
      },
    );

    const errorListener = VoiceToText.addEventListener(
      'onSpeechError',
      (event: { message?: string; error?: any }) => {
        console.error('Speech recognition error:', event);
        // Only handle errors if this instance is active
        if (voiceInputManager.isActive(instanceId)) {
          const message = event?.message ?? event?.error?.message ?? 'Voice recognition error';
          console.error('Voice recognition error message:', message);
          onError?.(message);
          setIsListening(false);
          voiceInputManager.deactivate(instanceId);
          
          // Show user-friendly error on iOS
          if (Platform.OS === 'ios' && message) {
            Alert.alert('Voice Recognition Error', message, [{ text: 'OK' }]);
          }
        }
      },
    );

    return () => {
      resultsListener.remove();
      startListener.remove();
      endListener.remove();
      errorListener.remove();
      // Clean up on unmount
      if (voiceInputManager.isActive(instanceId)) {
        voiceInputManager.deactivate(instanceId);
      }
    };
  }, [applyResultToInput, onError, instanceId]);

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Redline needs access to your microphone to transcribe speech.',
            buttonPositive: 'Allow',
            buttonNegative: 'Cancel',
          },
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      } else if (Platform.OS === 'ios') {
        // Request both microphone and speech recognition permissions for iOS
        const micPermission: Permission = PERMISSIONS.IOS.MICROPHONE;
        const speechPermission: Permission = PERMISSIONS.IOS.SPEECH_RECOGNITION;
        
        // Check microphone permission
        let micStatus = await check(micPermission);
        console.log('iOS Microphone permission status:', micStatus);
        
        // Request microphone permission if needed
        if (micStatus === RESULTS.DENIED || micStatus === RESULTS.UNAVAILABLE) {
          micStatus = await request(micPermission);
          console.log('iOS Microphone permission request result:', micStatus);
        }
        
        if (micStatus !== RESULTS.GRANTED) {
          if (micStatus === RESULTS.BLOCKED) {
            Alert.alert(
              'Microphone Permission Required',
              'Please enable microphone access in Settings > Privacy & Security > Microphone',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Open Settings', 
                  onPress: () => Linking.openSettings(),
                  style: 'default'
                }
              ]
            );
          }
          return false;
        }
        
        // Check speech recognition permission
        let speechStatus = await check(speechPermission);
        console.log('iOS Speech Recognition permission status:', speechStatus);
        
        // Request speech recognition permission if needed
        if (speechStatus === RESULTS.DENIED || speechStatus === RESULTS.UNAVAILABLE) {
          speechStatus = await request(speechPermission);
          console.log('iOS Speech Recognition permission request result:', speechStatus);
        }
        
        if (speechStatus !== RESULTS.GRANTED) {
          if (speechStatus === RESULTS.BLOCKED) {
            Alert.alert(
              'Speech Recognition Permission Required',
              'Please enable speech recognition in Settings > Privacy & Security > Speech Recognition',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Open Settings', 
                  onPress: () => Linking.openSettings(),
                  style: 'default'
                }
              ]
            );
          }
          return false;
        }
        
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      return false;
    }
  };

  const toggleListening = async () => {
    try {
      if (isListening) {
        console.log('Stopping voice recognition...');
        try {
          await VoiceToText.stopListening();
        } catch (stopError) {
          console.warn('Error stopping listening:', stopError);
        }
        setIsListening(false);
        voiceInputManager.deactivate(instanceId);
        console.log('Voice recognition stopped');
        return;
      }

      console.log('Requesting microphone permission...');
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        const errorMsg = 'Microphone permission denied. Please enable it in Settings.';
        console.error(errorMsg);
        onError?.(errorMsg);
        if (Platform.OS === 'ios') {
          Alert.alert(
            'Permission Required', 
            errorMsg,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Open Settings', 
                onPress: () => Linking.openSettings(),
                style: 'default'
              }
            ]
          );
        }
        return;
      }

      console.log('Starting voice recognition...');
      // Set this instance as active before starting
      voiceInputManager.setActive(instanceId, () => {
        setIsListening(false);
      });

      // For iOS, we need to ensure the library is properly initialized
      try {
        await VoiceToText.startListening();
        console.log('Voice recognition started successfully');
        // Note: setIsListening will be set by the onSpeechStart event
        // But we set it here as well for immediate feedback
        setIsListening(true);
      } catch (startError) {
        console.error('Error starting voice recognition:', startError);
        const errorMsg = startError instanceof Error 
          ? startError.message 
          : 'Failed to start voice recognition. Please try again.';
        onError?.(errorMsg);
        voiceInputManager.deactivate(instanceId);
        setIsListening(false);
        
        if (Platform.OS === 'ios') {
          Alert.alert('Voice Recognition Error', errorMsg, [{ text: 'OK' }]);
        }
      }
    } catch (error) {
      console.error('Error in toggleListening:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to start microphone';
      onError?.(message);
      voiceInputManager.deactivate(instanceId);
      setIsListening(false);
      
      if (Platform.OS === 'ios') {
        Alert.alert('Error', message, [{ text: 'OK' }]);
      }
    }
  };

  // Calculate wave scale and opacity for Alexa-style effect
  const wave1Scale = wave1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });
  const wave1Opacity = wave1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0],
  });

  const wave2Scale = wave2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });
  const wave2Opacity = wave2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0],
  });

  const wave3Scale = wave3.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });
  const wave3Opacity = wave3.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0],
  });

  return (
    <View style={[style, { position: 'relative', alignItems: 'center', justifyContent: 'center' }]}>
      {/* Alexa-style pulsing waves */}
      {isListening && (
        <>
          <Animated.View
            style={{
              position: 'absolute',
              width: size + 20,
              height: size + 20,
              borderRadius: (size + 20) / 2,
              backgroundColor: '#ef1313ff',
              opacity: wave1Opacity,
              transform: [{ scale: wave1Scale }],
            }}
          />
          <Animated.View
            style={{
              position: 'absolute',
              width: size + 20,
              height: size + 20,
              borderRadius: (size + 20) / 2,
              backgroundColor: '#ef1313ff',
              opacity: wave2Opacity,
              transform: [{ scale: wave2Scale }],
            }}
          />
          <Animated.View
            style={{
              position: 'absolute',
              width: size + 20,
              height: size + 20,
              borderRadius: (size + 20) / 2,
              backgroundColor: '#ef1313ff',
              opacity: wave3Opacity,
              transform: [{ scale: wave3Scale }],
            }}
          />
        </>
      )}
      
      <Animated.View style={isListening && { opacity: blinkOpacity }}>
        <IconButton
          icon={isListening ? 'stop-circle' : 'microphone'}
          size={size}
          mode="contained"
          containerColor={isListening ? '#ef1313ff' : colors.secondaryContainer}
          iconColor={isListening ? '#ffffff' : colors.onSurface}
          onPress={toggleListening}
          accessibilityRole="button"
          accessibilityLabel={computedAccessibilityLabel}
          disabled={disabled}
          testID="voice-input-button"
        />
      </Animated.View>
      
      {/* Stop button label when listening */}
      {isListening && (
        <View style={{ marginTop: 4, alignItems: 'center' }}>
          <Text 
            style={{ 
              fontSize: 10, 
              color: '#ef1313ff', 
              fontWeight: '600' 
            }}
          >
            Tap to Stop
          </Text>
        </View>
      )}
    </View>
  );
};

export default VoiceInputButton;

