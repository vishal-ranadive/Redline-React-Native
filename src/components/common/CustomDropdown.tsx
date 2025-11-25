// src/components/common/CustomDropdown.tsx
import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';

interface DropdownOption {
  value: string;
  label: string;
  color?: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder: string;
  getLabel: (value: string) => string;
  style?: any;
  disabled?: boolean;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  selectedValue,
  onSelect,
  placeholder,
  getLabel,
  style,
  disabled = false,
}) => {
  const [visible, setVisible] = useState(false);
  const { colors } = useTheme();

  return (
    <View style={style}>
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          {
            backgroundColor: colors.surface,
            borderColor: colors.outline,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
        onPress={() => !disabled && setVisible(true)}
        disabled={disabled}
      >
        <Text
          style={[
            styles.dropdownButtonText,
            {
              color: selectedValue
                ? colors.onSurface
                : colors.onSurfaceVariant,
            },
          ]}
        >
          {selectedValue ? getLabel(selectedValue) : placeholder}
        </Text>
        <IconButton
          icon={visible ? 'menu-up' : 'menu-down'}
          size={20}
          iconColor={colors.onSurfaceVariant}
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={[styles.dropdownModal, { backgroundColor: colors.surface }]}>
            <ScrollView style={styles.dropdownScroll}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.dropdownOption,
                    {
                      backgroundColor:
                        selectedValue === option.value
                          ? colors.primaryContainer
                          : 'transparent',
                      borderBottomColor: colors.outline,
                    },
                  ]}
                  onPress={() => {
                    onSelect(option.value);
                    setVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      {
                        color:
                          selectedValue === option.value
                            ? colors.onPrimaryContainer
                            : colors.onSurface,
                      },
                    ]}
                  >
                    {getLabel(option.value)}
                  </Text>
                  {selectedValue === option.value && (
                    <IconButton
                      icon="check"
                      size={20}
                      iconColor={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 48,
  },
  dropdownButtonText: {
    fontSize: 14,
    flex: 1,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    width: '80%',
    maxHeight: '60%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 400,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownOptionText: {
    fontSize: 14,
    flex: 1,
  },
});