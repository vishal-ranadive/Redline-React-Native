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
}

// Color mapping for display purposes
const COLOR_MAP: { [key: string]: string } = {
  red: '#FF4444',
  blue: '#4444FF',
  green: '#44FF44',
  yellow: '#FFFF44',
  orange: '#FF8844',
  purple: '#8844FF',
  pink: '#FF44FF',
  cyan: '#44FFFF',
  lime: '#88FF44',
  teal: '#44FF88',
};

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
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.colorPickerOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.colorPickerModal, { backgroundColor: colors.surface }]}>
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
              
              return (
                <TouchableOpacity
                  key={colorOption.value}
                  style={[
                    styles.colorCircle,
                    {
                      backgroundColor: displayColor,
                      borderColor: isSelected ? colors.primary : 'transparent',
                      borderWidth: 3,
                    },
                  ]}
                  onPress={() => {
                    onColorSelect(colorOption.value);
                    onClose();
                  }}
                >
                  {isSelected && (
                    <IconButton
                      icon="check"
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