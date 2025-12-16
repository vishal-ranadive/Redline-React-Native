// src/screens/inspectionscreens/components/StatusSelection.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip, useTheme, Icon } from 'react-native-paper';

export interface StatusOption {
  value: string;
  label: string;
  color: string;
}

export interface StatusSelectionProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  statusOptions: StatusOption[];
}

export const StatusSelection: React.FC<StatusSelectionProps> = ({
  selectedStatus,
  onStatusChange,
  statusOptions,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Status</Text>
      <View style={styles.rowWrap}>
        {statusOptions.map((option) => (
          <Chip
            key={option.value}
            selected={selectedStatus === option.value}
            onPress={() => onStatusChange(option.value)}
            icon={selectedStatus === option.value ? () => <Icon source="check" size={16} color="#fff" /> : undefined}
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
    marginBottom: 8 ,
    fontSize: 16, 
    fontWeight: '700', 
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