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
  
  // Track lifecycle of a listening session
  const waitingForResults = useRef(false);
  const resultsTimeoutRef = useRef<number | null>(null);
  const lastError11Time = useRef<number>(0);
  
  // Alexa-style pulsing wave animations
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;

  const computedAccessibilityLabel = useMemo(
    () => (isListening ? 'Stop voice input' : 'Start voice input'),
    [isListening],
  );

  const applyResultToInput = useCallback((text: string) => {
    console.log('🔊 applyResultToInput called with text:', text);
    console.log('🔊 Current value:', value);
    console.log('🔊 onChangeText exists:', !!onChangeText);
    console.log('🔊 appendResults:', appendResults);
    
    if (!text.trim()) {
      console.warn('⚠️ Empty text received');
      return;
    }

    onSpeechResult?.(text);

    if (!onChangeText) {
      console.error('❌ onChangeText is not defined!');
      return;
    }

    let newText: string;
    if (appendResults && value) {
      const separator = value.trim().length === 0 ? '' : value.endsWith(' ') ? '' : ' ';
      newText = `${value}${separator}${text}`.trimStart();
    } else {
      newText = text;
    }
    
    console.log('🔊 Calling onChangeText with:', newText);
    onChangeText(newText);
    console.log('✅ onChangeText called successfully');
  }, [appendResults, onChangeText, onSpeechResult, value]);

  const cleanupListening = useCallback(() => {
    console.log('🧹 Cleaning up listening state');
    waitingForResults.current = false;
    setIsListening(false);
    voiceInputManager.deactivate(instanceId);

    if (resultsTimeoutRef.current) {
      clearTimeout(resultsTimeoutRef.current);
      resultsTimeoutRef.current = null;
    }
  }, [instanceId]);

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

        // Process results if we're waiting for them (even if instance was deactivated)
        // This handles cases where results arrive after timeout/cleanup
        if (!waitingForResults.current) {
          console.log('Ignoring results - not waiting for results');
          return;
        }

        const text = event?.value ?? '';
        console.log('Processing speech text:', text);
        
        if (text && text.trim()) {
          console.log('✅ Applying transcribed text to input');
          applyResultToInput(text);
        } else {
          console.warn('Empty speech result received');
        }

        // Clear timeout since we got results
        if (resultsTimeoutRef.current) {
          clearTimeout(resultsTimeoutRef.current);
          resultsTimeoutRef.current = null;
        }

        // Now we can safely deactivate after processing results
        cleanupListening();

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

          waitingForResults.current = true;
          // Safety timeout: if no results, clean up to avoid stuck active state
          // Increased to 12 seconds to handle delayed results
          resultsTimeoutRef.current = setTimeout(() => {
            console.warn('⚠️ No results received within 12s timeout, cleaning up');
            cleanupListening();
          }, 12000);
        }
      },
    );

    const endListener = VoiceToText.addEventListener(
      'onSpeechEnd',
      () => {
        console.log('Speech recognition ended');
        // Do NOT deactivate here; wait for results or timeout
        if (voiceInputManager.isActive(instanceId) || waitingForResults.current) {
          setIsListening(false);
          console.log('Waiting for results after end...');
          
          // Extend timeout when speech ends - give more time for results to arrive
          // Clear existing timeout and set a new one (5 more seconds)
          if (resultsTimeoutRef.current) {
            clearTimeout(resultsTimeoutRef.current);
          }
          resultsTimeoutRef.current = setTimeout(() => {
            console.warn('⚠️ No results received after speech end, cleaning up');
            cleanupListening();
          }, 5000); // 5 more seconds after speech ends
        }
      },
    );

    const errorListener = VoiceToText.addEventListener(
      'onSpeechError',
      (event: { message?: string; error?: any }) => {
        console.error('Speech recognition error:', event);
        const errorCode = (event as any)?.error?.code ?? (event as any)?.code ?? (event as any)?.error;
        const message = event?.message ?? event?.error?.message ?? 'Voice recognition error';
        
        // Error code 7 = "No speech match found" - not fatal, just keep waiting
        if (errorCode === 7 || errorCode === '7') {
          console.log('ℹ️ Error 7: No speech match found - continuing to wait for results');
          // Don't cleanup - keep waiting for results
          return;
        }
        
        // Error code 11 = "Recognizer busy" - stop and mark time
        if (errorCode === 11 || errorCode === '11') {
          console.warn('⚠️ Error 11: recognizer busy, stopping any active session');
          lastError11Time.current = Date.now();
          try {
            VoiceToText.stopListening().catch(() => {});
          } catch (e) {
            console.warn('Error stopping busy recognizer:', e);
          }
          // Clean up this instance
          if (voiceInputManager.isActive(instanceId) || waitingForResults.current) {
            cleanupListening();
          }
          return;
        }

        // For other errors, only handle if this instance is active or waiting
        if (voiceInputManager.isActive(instanceId) || waitingForResults.current) {
          console.error('Voice recognition error message:', message);
          onError?.(message);
          cleanupListening();
          
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
      cleanupListening();
    };
  }, [applyResultToInput, onError, instanceId, cleanupListening]);

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
        cleanupListening();
        console.log('Voice recognition stopped');
        return;
      }

      // Avoid starting if already active elsewhere
      if (voiceInputManager.isActive(instanceId) || waitingForResults.current) {
        console.warn('⚠️ Another voice session is active; ignoring start');
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

      // Check if we recently had error 11 - wait a bit before retrying
      const timeSinceError11 = Date.now() - lastError11Time.current;
      if (timeSinceError11 < 1000) {
        console.log('⏳ Waiting before retry after error 11...');
        await new Promise<void>(resolve => setTimeout(resolve, 1000 - timeSinceError11));
      }

      console.log('Starting voice recognition...');
      // Set this instance as active before starting
      voiceInputManager.setActive(instanceId, () => {
        cleanupListening();
      });

      // For iOS, we need to ensure the library is properly initialized
      try {
        await VoiceToText.startListening();
        console.log('Voice recognition started successfully');
        // Note: setIsListening will be set by the onSpeechStart event
        // But we set it here as well for immediate feedback
        setIsListening(true);
        waitingForResults.current = true;
      } catch (startError) {
        console.error('Error starting voice recognition:', startError);
        const errorMsg = startError instanceof Error 
          ? startError.message 
          : 'Failed to start voice recognition. Please try again.';
        onError?.(errorMsg);
        cleanupListening();
        
        if (Platform.OS === 'ios') {
          Alert.alert('Voice Recognition Error', errorMsg, [{ text: 'OK' }]);
        }
      }
    } catch (error) {
      console.error('Error in toggleListening:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to start microphone';
      onError?.(message);
      cleanupListening();
      
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
    <View style={[style, { alignItems: 'center', justifyContent: 'center' }]}>
      <View
        style={{
          width: size + 32,
          height: size + 32,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
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
      </View>
      
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

