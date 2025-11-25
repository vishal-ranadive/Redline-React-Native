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
  color: string;
}

interface ColorPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedColor: string;
  onColorSelect: (color: string) => void;
  colorOptions?: ColorOption[];
}

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  visible,
  onClose,
  selectedColor,
  onColorSelect,
  colorOptions = [
    { value: 'RED', label: 'Red', color: '#FF4444' },
    { value: 'BLUE', label: 'Blue', color: '#4444FF' },
    { value: 'GREEN', label: 'Green', color: '#44FF44' },
    { value: 'YELLOW', label: 'Yellow', color: '#FFFF44' },
    { value: 'ORANGE', label: 'Orange', color: '#FF8844' },
    { value: 'PURPLE', label: 'Purple', color: '#8844FF' },
    { value: 'PINK', label: 'Pink', color: '#FF44FF' },
    { value: 'CYAN', label: 'Cyan', color: '#44FFFF' },
    { value: 'LIME', label: 'Lime', color: '#88FF44' },
    { value: 'TEAL', label: 'Teal', color: '#44FF88' },
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
            {colorOptions.map((colorOption) => (
              <TouchableOpacity
                key={colorOption.value}
                style={[
                  styles.colorCircle,
                  {
                    backgroundColor: colorOption.color,
                    borderColor: selectedColor === colorOption.value ? colors.primary : 'transparent',
                    borderWidth: 3,
                  },
                ]}
                onPress={() => {
                  onColorSelect(colorOption.value);
                  onClose();
                }}
              >
                {selectedColor === colorOption.value && (
                  <IconButton
                    icon="check"
                    size={16}
                    iconColor="#fff"
                    style={styles.colorCheckIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
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