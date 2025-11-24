// src/components/common/CustomDropdown.tsx
import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import {
  Text,
  IconButton,
  useTheme,
} from 'react-native-paper';
import { p } from '../../utils/responsive';

const CustomDropdown = ({
  options,
  selectedValue,
  onSelect,
  placeholder,
  getLabel,
  getOptionLabel = (option: any) => option.label || option.name,
  getOptionValue = (option: any) => option.value || option.id,
  style,
}: any) => {
  const [visible, setVisible] = useState(false);
  const { colors } = useTheme();

  return (
    <View style={style}>
      <TouchableOpacity
        style={[styles.dropdownButton, { backgroundColor: colors.surface, borderColor: colors.outline }]}
        onPress={() => setVisible(true)}
      >
        <Text style={[styles.dropdownButtonText, { color: colors.onSurface }]}>
          {selectedValue ? getLabel(selectedValue) : placeholder}
        </Text>
        <IconButton
          icon={visible ? "menu-up" : "menu-down"}
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
              {options.map((option: any) => (
                <TouchableOpacity
                  key={getOptionValue(option)}
                  style={[
                    styles.dropdownOption,
                    { 
                      backgroundColor: selectedValue === getOptionValue(option) ? colors.primaryContainer : 'transparent',
                      borderBottomColor: colors.outline 
                    }
                  ]}
                  onPress={() => {
                    onSelect(getOptionValue(option));
                    setVisible(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownOptionText, 
                    { 
                      color: selectedValue === getOptionValue(option) ? colors.onPrimaryContainer : colors.onSurface 
                    }
                  ]}>
                    {getOptionLabel(option)}
                  </Text>
                  {selectedValue === getOptionValue(option) && (
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

const styles = {
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
    fontSize: p(14),
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
    fontSize: p(14),
    flex: 1,
  },
};

export default CustomDropdown;