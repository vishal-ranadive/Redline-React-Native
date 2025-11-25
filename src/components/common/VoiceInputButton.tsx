import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PermissionsAndroid,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import { startSpeechToText } from 'react-native-voice-to-text';


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
    if (isListening) {
      return;
    }

    try {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        onError?.('Microphone permission denied');
        return;
      }

      setIsListening(true);
      const result = await startSpeechToText();
      const text =
        typeof result === 'string'
          ? result
          : (result as { value?: string; text?: string })?.value ??
            (result as { value?: string; text?: string })?.text ??
            '';
      applyResultToInput(text ?? '');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start microphone';
      onError?.(message);
    } finally {
      setIsListening(false);
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
      onPress={() => {
        if (!isListening) toggleListening(); // Prevent double start
      }}
      accessibilityRole="button"
      accessibilityLabel={computedAccessibilityLabel}
      disabled={disabled} // remove isListening from here
      testID="voice-input-button"
    />
  </Animated.View>
  );
};

export default VoiceInputButton;

