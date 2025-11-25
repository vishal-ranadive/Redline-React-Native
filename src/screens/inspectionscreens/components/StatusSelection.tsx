// src/screens/inspectionscreens/components/StatusSelection.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip, useTheme } from 'react-native-paper';
import { INSPECTION_CONSTANTS } from '../../../constants/inspection';

interface StatusSelectionProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

export const StatusSelection: React.FC<StatusSelectionProps> = ({
  selectedStatus,
  onStatusChange,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Status</Text>
      <View style={styles.rowWrap}>
        {INSPECTION_CONSTANTS.STATUS_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            selected={selectedStatus === option.value}
            onPress={() => onStatusChange(option.value)}
            style={[
              styles.choiceChip,
              { 
                backgroundColor: selectedStatus === option.value 
                  ? option.color 
                  : colors.surfaceVariant 
              }
            ]}
            textStyle={{ 
              color: selectedStatus === option.value ? '#fff' : colors.onSurfaceVariant,
              fontSize: 12
            }}
          >
            {option.label}
          </Chip>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceChip: {
    marginRight: 6,
    marginBottom: 6,
  },
});