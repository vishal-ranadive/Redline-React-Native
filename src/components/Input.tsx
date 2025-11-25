import React, { forwardRef } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { TextInput, TextInputProps, useTheme } from 'react-native-paper';

import VoiceInputButton from './common/VoiceInputButton';

type Props = TextInputProps & {
  /**
   * Toggle microphone support for this input.
   */
  enableVoice?: boolean;
  /**
   * Control how the speech result updates the text input.
   */
  appendVoiceResults?: boolean;
  /**
   * Bubble up errors coming from the voice module.
   */
  onVoiceError?: (message: string) => void;
  /**
   * Optional container style around the input + mic button.
   */
  containerStyle?: StyleProp<ViewStyle>;
};

const Input = forwardRef<any, Props>(
  (
    {
      enableVoice = false,
      appendVoiceResults = true,
      onVoiceError,
      style,
      containerStyle,
      value,
      onChangeText,
      ...rest
    },
    ref,
  ) => {
    const { colors } = useTheme();
    const inputProps: TextInputProps = { mode: 'outlined', ...rest };
    const stringValue = typeof value === 'string' ? value : value ?? '';

    return (
      <View style={[styles.wrapper, containerStyle]}>
        <TextInput
          ref={ref as any}
          value={value}
          onChangeText={onChangeText}
          style={[styles.input, style]}
          {...inputProps}
        />

        {enableVoice && (
          <VoiceInputButton
            style={[styles.micButton, { borderColor: colors.outline }]}
            value={stringValue}
            onChangeText={onChangeText}
            appendResults={appendVoiceResults}
            onError={onVoiceError}
            disabled={!onChangeText}
          />
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
  },
  micButton: {
    marginLeft: 8,
  },
});

export default Input;
