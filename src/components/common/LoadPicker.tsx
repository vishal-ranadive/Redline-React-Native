import React, { useState, useMemo } from 'react';
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
  const [visibleLoadCount, setVisibleLoadCount] = useState(10);

  const openModal = () => {
    // Reset to 10 when opening modal
    setVisibleLoadCount(10);
    setVisible(true);
  };
  const closeModal = () => setVisible(false);

  // Get visible loads based on visibleLoadCount
  const visibleOptions = useMemo(() => {
    return options.slice(0, visibleLoadCount);
  }, [options, visibleLoadCount]);

  // Calculate highest load number from visible options
  const highestLoadNumber = useMemo(() => {
    if (visibleOptions.length === 0) return 0;
    const loadNumbers = visibleOptions.map(opt => parseInt(opt.value, 10));
    return Math.max(...loadNumbers);
  }, [visibleOptions]);

  const handleAddMore = () => {
    setVisibleLoadCount(prev => Math.min(prev + 5, options.length));
  };

  const canAddMore = visibleLoadCount < options.length;

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

      <Modal 
        transparent 
        visible={visible} 
        animationType="fade" 
        onRequestClose={closeModal}
        supportedOrientations={['portrait', 'landscape', 'portrait-upside-down', 'landscape-left', 'landscape-right']}
        statusBarTranslucent={true}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <View 
            style={[styles.modalContainer, { backgroundColor: colors.surface }]}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
              Select Load {highestLoadNumber > 0 ? `(Up to Load ${highestLoadNumber})` : ''}
            </Text>

            <FlatList
              data={visibleOptions}
              keyExtractor={(item) => item.value}
              numColumns={4}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.gridContent}
              renderItem={renderItem}
            />

            {canAddMore && (
              <View style={styles.addMoreContainer}>
                <Button 
                  onPress={handleAddMore} 
                  mode="outlined"
                  style={[styles.addMoreButton, { borderColor: colors.primary }]}
                  textColor={colors.primary}
                >
                  Add 5 More Loads
                </Button>
              </View>
            )}

            <View style={styles.modalActions}>
              <Button onPress={closeModal} mode="text" textColor={colors.error}>
                Cancel
              </Button>
            </View>
          </View>
        </TouchableOpacity>
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
  addMoreContainer: {
    marginVertical: p(12),
    alignItems: 'center',
  },
  addMoreButton: {
    borderWidth: 1,
    borderRadius: p(8),
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: p(4),
  },
});

export default LoadPicker;
