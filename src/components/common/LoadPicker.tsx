import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { p } from '../../utils/responsive';

type LoadPickerProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: { value: string; label: string }[];
};

const LoadPicker: React.FC<LoadPickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select Load',
  options,
}) => {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  const renderItem = ({ item }: { item: { value: string; label: string } }) => {
    const isSelected = value === item.value;

    return (
      <TouchableOpacity
        style={[
          styles.gridButton,
          {
            backgroundColor: isSelected ? colors.primaryContainer : colors.surface,
            borderColor: colors.outline,
          },
        ]}
        onPress={() => {
          onChange(item.value);
          closeModal();
        }}
      >
        <Text
          style={[
            styles.gridButtonText,
            { color: isSelected ? colors.onPrimaryContainer : colors.onSurface },
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.onSurface }]}>{label}</Text>}

      <Button
        mode="outlined"
        onPress={openModal}
        style={[styles.triggerButton, { borderColor: colors.outline }]}
        contentStyle={styles.triggerContent}
        labelStyle={[styles.triggerLabel, { color: value ? colors.onSurface : colors.onSurfaceVariant }]}
        icon="chevron-down"
      >
        {value ? `Load ${value}` : placeholder}
      </Button>

      <Modal transparent visible={visible} animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Select Load</Text>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              numColumns={4}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.gridContent}
              renderItem={renderItem}
            />

            <View style={styles.modalActions}>
              <Button onPress={closeModal} mode="text" textColor={colors.error}>
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: p(12),
  },
  label: {
    fontSize: p(13),
    fontWeight: '600',
    marginBottom: p(4),
  },
  triggerButton: {
    borderWidth: 1,
    borderRadius: p(8),
  },
  triggerContent: {
    height: p(44),
    justifyContent: 'flex-start',
  },
  triggerLabel: {
    fontSize: p(14),
    textAlign: 'left',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: p(16),
  },
  modalContainer: {
    width: '100%',
    borderRadius: p(12),
    padding: p(16),
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: p(16),
    fontWeight: '700',
    marginBottom: p(12),
  },
  gridContent: {
    paddingBottom: p(12),
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: p(8),
  },
  gridButton: {
    flex: 1,
    marginHorizontal: p(4),
    paddingVertical: p(10),
    borderRadius: p(8),
    borderWidth: 1,
    alignItems: 'center',
  },
  gridButtonText: {
    fontSize: p(14),
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: p(4),
  },
});

export default LoadPicker;
