import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TextInput } from 'react-native';
import { Button, useTheme } from 'react-native-paper';

const PhScale = ({
  initialValue = 7,
  onChange,
}: {
  initialValue?: number;
  onChange?: (value: number) => void;
}) => {
  const [ph, setPh] = useState(initialValue);
  const [expandedBase, setExpandedBase] = useState<number | null>(null);
  const { colors } = useTheme();

  const getPhLabel = (value: number) => {
    if (value < 7 - 0.05) return 'Acidic';
    if (value > 7 + 0.05) return 'Alkaline';
    return 'Neutral';
  };

  const updatePh = (newValue: number) => {
    const rounded = Math.min(10, Math.max(1, Math.round(newValue * 10) / 10));
    setPh(rounded);
    if (onChange) onChange(rounded);
    setExpandedBase(null); // hide decimals after selecting one
  };

  const handleInput = (text: string) => {
    const value = parseFloat(text);
    if (!isNaN(value)) setPh(value);
  };

  const handleSubmit = () => {
    if (ph < 1 || ph > 10) {
      Alert.alert('Invalid Value', 'Please enter a value between 1.0 and 10.0');
      return;
    }
    updatePh(ph);
  };

  const handleWholeClick = (num: number) => {
    // select the number and toggle decimals
    updatePh(num); // set pH to this whole number
    setExpandedBase(expandedBase === num ? null : num); // toggle
  };

  return (
    <View style={styles.container}>
      {/* Inline main control */}
      <View style={styles.inlineRow}>
        <Text style={[styles.inlineLabel, { color: colors.onSurface }]}>
          pH of Water:
        </Text>

        <Button mode="outlined" onPress={() => updatePh(ph - 0.1)} compact>
          −
        </Button>

        <TextInput
          value={ph.toFixed(1)}
          onChangeText={handleInput}
          onEndEditing={handleSubmit}
          keyboardType="numeric"
          style={[
            styles.input,
            { borderColor: colors.outline, color: colors.onSurface },
          ]}
          textAlign="center"
        />

        <Button mode="outlined" onPress={() => updatePh(ph + 0.1)} compact>
          +
        </Button>

        <Text style={[styles.phType, { color: colors.primary }]}>
          ({getPhLabel(ph)})
        </Text>
      </View>

      {/* Whole number buttons */}
      <View style={styles.wholeRow}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
          const isActive = Math.floor(ph) === num;
          return (
            <Button
              key={num}
              mode={isActive ? 'contained' : 'outlined'}
              onPress={() => handleWholeClick(num)}
              compact
              style={[
                styles.quickButton,
                isActive && { backgroundColor: colors.errorContainer },
              ]}
              labelStyle={{
                color: isActive ? colors.error : colors.onSurface,
                fontWeight: isActive ? 'bold' : 'normal',
              }}
            >
              {num}
            </Button>
          );
        })}
      </View>

      {/* Decimal buttons */}
      {expandedBase && (
        <View style={styles.decimalRow}>
          {Array.from({ length: 9 }, (_, j) => j + 1).map((dec) => {
            const value = parseFloat(`${expandedBase}.${dec}`);
            const isSelected = value === ph;
            return (
              <Button
                key={value}
                mode={isSelected ? 'contained' : 'text'}
                onPress={() => updatePh(value)}
                compact
                style={[
                  styles.subButton,
                  isSelected && { backgroundColor: colors.errorContainer },
                ]}
                labelStyle={{
                  fontSize: 12,
                  color: isSelected ? colors.error : colors.onSurface,
                }}
              >
                {value.toFixed(1)}
              </Button>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  inlineLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  phType: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 16,
    width: 60,
  },
  wholeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 6,
  },
  decimalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  quickButton: {
    minWidth: 40,
  },
  subButton: {
    paddingHorizontal: 4,
    minWidth: 40,
  },
});

export default PhScale;
