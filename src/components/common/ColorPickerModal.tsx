// src/components/common/ColorPickerModal.tsx
import React from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';

interface ColorOption {
  value: string;
  label: string;
}

interface ColorPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedColor: string;
  onColorSelect: (color: string) => void;
  colorOptions?: ColorOption[];
  usedColors?: string[]; // Colors already used by other rosters
}

import { COLOR_MAP } from '../../constants/colors';

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  visible,
  onClose,
  selectedColor,
  onColorSelect,
  colorOptions = [
    { value: 'red', label: 'Red' },
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' },
    { value: 'yellow', label: 'Yellow' },
    { value: 'orange', label: 'Orange' },
    { value: 'purple', label: 'Purple' },
    { value: 'pink', label: 'Pink' },
    { value: 'cyan', label: 'Cyan' },
    { value: 'lime', label: 'Lime' },
    { value: 'teal', label: 'Teal' },
  ],
  usedColors = [],
}) => {
  const { colors } = useTheme();

  // Normalize used colors to lowercase for comparison
  const normalizedUsedColors = usedColors.map((color) => color.toLowerCase().trim()).filter(Boolean);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape', 'portrait-upside-down', 'landscape-left', 'landscape-right']}
      statusBarTranslucent={true}
    >
      <TouchableOpacity
        style={styles.colorPickerOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View 
          style={[styles.colorPickerModal, { backgroundColor: colors.surface }]}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
        >
          <View style={styles.colorPickerHeader}>
            <Text style={[styles.colorPickerTitle, { color: colors.onSurface }]}>
              Select Color
            </Text>
            <IconButton
              icon="close"
              size={24}
              onPress={onClose}
              iconColor={colors.onSurface}
            />
          </View>

          <View style={styles.colorGrid}>
            {colorOptions.map((colorOption) => {
              const colorValue = colorOption.value.toLowerCase();
              const displayColor = COLOR_MAP[colorValue] || '#CCCCCC';
              const isSelected = selectedColor?.toLowerCase() === colorValue;
              // Color is locked if it's used by another roster AND not the selected color
              const isLocked = normalizedUsedColors.includes(colorValue) && !isSelected;
              
              return (
                <TouchableOpacity
                  key={colorOption.value}
                  style={[
                    styles.colorCircle,
                    {
                      backgroundColor: displayColor,
                      borderColor: isSelected ? colors.primary : 'transparent',
                      borderWidth: 3,
                      opacity: isLocked ? 0.6 : 1,
                    },
                  ]}
                  onPress={() => {
                    if (!isLocked) {
                      onColorSelect(colorOption.value);
                      onClose();
                    }
                  }}
                  disabled={isLocked}
                >
                  {isSelected && (
                    <IconButton
                      icon="check"
                      size={16}
                      iconColor="#fff"
                      style={styles.colorCheckIcon}
                    />
                  )}
                  {isLocked && !isSelected && (
                    <IconButton
                      icon="lock"
                      size={16}
                      iconColor="#fff"
                      style={styles.colorCheckIcon}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  colorPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  colorPickerModal: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    maxWidth: 400,
  },
  colorPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  colorPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  colorCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  colorCheckIcon: {
    margin: 0,
  },
});