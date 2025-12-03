// src/screens/inspectionscreens/components/SpecializedCleaningFields.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Input from '../../../components/Input';

interface SpecializedCleaningFieldsProps {
  specializedCleaningDetails: string;
  onSpecializedCleaningChange: (text: string) => void;
}

export const SpecializedCleaningFields: React.FC<SpecializedCleaningFieldsProps> = ({
  specializedCleaningDetails,
  onSpecializedCleaningChange,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
        Specialized Cleaning Details
      </Text>
      
      <Input
        placeholder="Why specialized cleaning is needed and how should it be cleaned?"
        value={specializedCleaningDetails}
        onChangeText={onSpecializedCleaningChange}
        multiline
        numberOfLines={4}
        style={{ minHeight: 100, fontSize: 14 }}
        containerStyle={{ alignItems: 'flex-start' }}
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
});