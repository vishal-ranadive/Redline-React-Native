// src/screens/inspectionscreens/components/SpecializedCleaningFields.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';

interface SpecializedCleaningFieldsProps {
  why: string;
  how: string;
  onWhyChange: (text: string) => void;
  onHowChange: (text: string) => void;
}

export const SpecializedCleaningFields: React.FC<SpecializedCleaningFieldsProps> = ({
  why,
  how,
  onWhyChange,
  onHowChange,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
        Specialized Cleaning Details
      </Text>
      
      <TextInput
        mode="outlined"
        label="Why specialized cleaning is needed?"
        value={why}
        onChangeText={onWhyChange}
        placeholder="Describe why specialized cleaning is required..."
        multiline
        numberOfLines={3}
        style={styles.textInput}
      />
      
      <TextInput
        mode="outlined"
        label="How should it be cleaned?"
        value={how}
        onChangeText={onHowChange}
        placeholder="Describe the cleaning procedure..."
        multiline
        numberOfLines={3}
        style={styles.textInput}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  textInput: {
    minHeight: 90,
  },
});