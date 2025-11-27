import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PermissionsAndroid,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import * as VoiceToText from '@ascendtis/react-native-voice-to-text';


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
  const [isListening, setIsListening] = useState(false);
  const blinkOpacity = useRef(new Animated.Value(1)).current;

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

  useEffect(() => {
    if (!isListening) {
      blinkOpacity.stopAnimation();
      blinkOpacity.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkOpacity, {
          toValue: 0.3,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(blinkOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [blinkOpacity, isListening]);

  /**
   * Register voice-to-text event listeners once.
   * We:
   * - Update `isListening` based on START/END events
   * - Apply recognized text when RESULTS arrive, then stop listening
   */
  useEffect(() => {
    const resultsListener = VoiceToText.addEventListener(
      'onSpeechResults',
      (event: { value?: string }) => {
        const text = event?.value ?? '';
        applyResultToInput(text);

        // Single-shot recognizer: stop after first result.
        VoiceToText.stopListening().catch(() => {
          // swallow stop errors; not critical
        });
      },
    );

    const startListener = VoiceToText.addEventListener(
      'onSpeechStart',
      () => setIsListening(true),
    );

    const endListener = VoiceToText.addEventListener(
      'onSpeechEnd',
      () => setIsListening(false),
    );

    const errorListener = VoiceToText.addEventListener(
      'onSpeechError',
      (event: { message?: string }) => {
        const message = event?.message ?? 'Voice recognition error';
        onError?.(message);
      },
    );

    return () => {
      resultsListener.remove();
      startListener.remove();
      endListener.remove();
      errorListener.remove();
    };
  }, [applyResultToInput, onError]);

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
        return;
      }

      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        onError?.('Microphone permission denied');
        return;
      }

      await VoiceToText.startListening();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to start microphone';
      onError?.(message);
    }
  };

  return (
    <Animated.View style={[style, isListening && { opacity: blinkOpacity }]}>
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
  );
};

export default VoiceInputButton;

