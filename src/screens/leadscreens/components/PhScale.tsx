import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from 'react-native-paper';

const PhScale = ({
  initialValue = 7,
  onChange,
}: {
  initialValue?: number;
  onChange?: (value: number) => void;
}) => {
  const [ph, setPh] = useState(initialValue); // confirmed pH
  const [tempPh, setTempPh] = useState(initialValue); // live sliding value
  const { colors } = useTheme();

  const thumbPosition = ((tempPh - 1) / 9) * 100; // maps 1–10 → 0–100%

  const getPhLabel = (value: number) => {
    if (value < 7) return 'Acidic';
    if (value === 7) return 'Neutral';
    return 'Alkaline';
  };

  const handleSlidingComplete = (value: number) => {
    if (value === ph) return; // no change
    Alert.alert('Confirm Change', `Change pH from ${ph} → ${value}?`, [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => setTempPh(ph), // revert if canceled
      },
      {
        text: 'Confirm',
        onPress: () => {
          setPh(value);
          setTempPh(value);
          if (onChange) onChange(value);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.onSurface }]}>
        pH of Water: {Math.round(tempPh)} ({getPhLabel(Math.round(tempPh))})
      </Text>

      <View style={styles.gradientWrapper}>
        <LinearGradient
        colors={[
            '#ff0000', // pH 1 - Red
            '#ff7f00', // pH 3 - Orange
            '#ffff00', // pH 5 - Yellow
            '#00ff00', // pH 7 - Green (Neutral)
            '#00bfff', // pH 8 - Blue
            '#8b00ff', // pH 10 - Violet
        ]}
        locations={[0, 0.25, 0.4, 0.55, 0.75, 1]} // adjusted so green centers around pH 7
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBar}
        />
        {/* Custom Thumb */}
        <View
          pointerEvents="none"
          style={[
            styles.thumbBar,
            {
              left: `${thumbPosition}%`,
            },
          ]}
        />
      </View>

      {/* Interactive Slider (above everything visually but transparent) */}
      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={tempPh}
        onValueChange={setTempPh}
        onSlidingComplete={handleSlidingComplete}
        minimumTrackTintColor="transparent"
        maximumTrackTintColor="transparent"
        thumbTintColor="transparent" // hide native thumb
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    alignItems: 'center',
    width: '100%',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  gradientWrapper: {
    width: '100%',
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  gradientBar: {
    ...StyleSheet.absoluteFillObject,
  },
  thumbBar: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    transform: [{ translateX: -11 }], // center the thumb on position
    top: -3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: -30, // ensures touch area overlaps gradient
  },
});

export default PhScale;
