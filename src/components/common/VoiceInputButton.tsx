import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PermissionsAndroid,
  Platform,
  StyleProp,
  ViewStyle,
  View,
} from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import * as VoiceToText from '@ascendtis/react-native-voice-to-text';

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
        // Only process results if this instance is active
        if (!voiceInputManager.isActive(instanceId)) {
          return;
        }

        const text = event?.value ?? '';
        applyResultToInput(text);

        // Single-shot recognizer: stop after first result.
        try {
          const stopResult = VoiceToText.stopListening();
          if (stopResult && typeof stopResult.catch === 'function') {
            stopResult.catch(() => {
              // swallow stop errors; not critical
            });
          }
        } catch (error) {
          // swallow stop errors; not critical
        }
      },
    );

    const startListener = VoiceToText.addEventListener(
      'onSpeechStart',
      () => {
        // Only update if this instance is active
        if (voiceInputManager.isActive(instanceId)) {
          setIsListening(true);
        }
      },
    );

    const endListener = VoiceToText.addEventListener(
      'onSpeechEnd',
      () => {
        // Only update if this instance is active
        if (voiceInputManager.isActive(instanceId)) {
          setIsListening(false);
          voiceInputManager.deactivate(instanceId);
        }
      },
    );

    const errorListener = VoiceToText.addEventListener(
      'onSpeechError',
      (event: { message?: string }) => {
        // Only handle errors if this instance is active
        if (voiceInputManager.isActive(instanceId)) {
          const message = event?.message ?? 'Voice recognition error';
          onError?.(message);
          setIsListening(false);
          voiceInputManager.deactivate(instanceId);
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

  const requestMicrophonePermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

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
  };

  const toggleListening = async () => {
    try {
      if (isListening) {
        await VoiceToText.stopListening();
        setIsListening(false);
        voiceInputManager.deactivate(instanceId);
        return;
      }

      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        onError?.('Microphone permission denied');
        return;
      }

      // Set this instance as active before starting
      voiceInputManager.setActive(instanceId, () => {
        setIsListening(false);
      });

      await VoiceToText.startListening();
      setIsListening(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to start microphone';
      onError?.(message);
      voiceInputManager.deactivate(instanceId);
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
          icon={isListening ? 'microphone-off' : 'microphone'}
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
  );
};

export default VoiceInputButton;

