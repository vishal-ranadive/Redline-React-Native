// src/screens/inspectionscreens/components/ServiceTypeSelection.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { CustomDropdown } from '../../../components/common';
import { INSPECTION_CONSTANTS } from '../../../constants/inspection';

interface ServiceTypeSelectionProps {
  selectedServiceType: string;
  onServiceTypeChange: (type: string) => void;
}

export const ServiceTypeSelection: React.FC<ServiceTypeSelectionProps> = ({
  selectedServiceType,
  onServiceTypeChange,
}) => {
  const { colors } = useTheme();

  const getServiceTypeLabel = (serviceValue: string) => {
    const service = INSPECTION_CONSTANTS.SERVICE_TYPES.find(option => option.value === serviceValue);
    return service?.label || 'Select Service Type';
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Service Type</Text>
      <CustomDropdown
        options={INSPECTION_CONSTANTS.SERVICE_TYPES}
        selectedValue={selectedServiceType}
        onSelect={onServiceTypeChange}
        placeholder="Select Service Type"
        getLabel={getServiceTypeLabel}
        style={styles.dropdownContainer}
      />
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
  dropdownContainer: {
    marginBottom: 0,
  },
});