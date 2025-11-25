// src/screens/inspectionscreens/components/RepairCostFields.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Chip, useTheme } from 'react-native-paper';

interface RepairCostFieldsProps {
  cost: string;
  repairNeeded: boolean;
  onCostChange: (cost: string) => void;
  onRepairNeededChange: (needed: boolean) => void;
}

export const RepairCostFields: React.FC<RepairCostFieldsProps> = ({
  cost,
  repairNeeded,
  onCostChange,
  onRepairNeededChange,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Repair & Cost</Text>

      <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Cost (USD)</Text>
      <TextInput
        mode="outlined"
        placeholder="$0.00"
        value={cost}
        keyboardType="numeric"
        onChangeText={onCostChange}
        style={styles.input}
        left={<TextInput.Affix text="$" />}
      />

      <View style={styles.rowSpace}>
        <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Redline Repair</Text>
        <View style={styles.rowWrap}>
          <Chip 
            selected={repairNeeded === true} 
            onPress={() => onRepairNeededChange(true)} 
            style={[
              styles.smallChoice,
              { 
                backgroundColor: repairNeeded === true ? '#EA4335' : colors.surfaceVariant 
              }
            ]}
            textStyle={{ 
              color: repairNeeded === true ? '#fff' : colors.onSurfaceVariant,
              fontSize: 12
            }}
          >
            Yes
          </Chip>
          <Chip 
            selected={repairNeeded === false} 
            onPress={() => onRepairNeededChange(false)} 
            style={[
              styles.smallChoice,
              { 
                backgroundColor: repairNeeded === false ? '#34A853' : colors.surfaceVariant 
              }
            ]}
            textStyle={{ 
              color: repairNeeded === false ? '#fff' : colors.onSurfaceVariant,
              fontSize: 12
            }}
          >
            No
          </Chip>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
  },
  rowSpace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  smallChoice: {
    marginRight: 6,
  },
});