// src/components/common/MultiSelectModal.tsx
import React from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Text, IconButton, Button, useTheme, Checkbox } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MultiSelectOption {
  value: any;
  label: string;
}

interface MultiSelectModalProps {
  visible: boolean;
  onClose: () => void;
  options: MultiSelectOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  title: string;
}

export const MultiSelectModal: React.FC<MultiSelectModalProps> = ({
  visible,
  onClose,
  options,
  selectedValues,
  onSelectionChange,
  title,
}) => {
  const { colors } = useTheme();

  const toggleSelection = (value: string) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onSelectionChange(newSelection);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.multiSelectContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.multiSelectHeader, { backgroundColor: colors.surface }]}>
          <Text style={[styles.multiSelectTitle, { color: colors.onSurface }]}>
            {title}
          </Text>
          <IconButton
            icon="close"
            size={24}
            onPress={onClose}
            iconColor={colors.onSurface}
          />
        </View>

        <ScrollView style={styles.multiSelectScroll}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.multiSelectOption,
                {
                  backgroundColor: selectedValues.includes(option.value)
                    ? colors.primaryContainer
                    : colors.surface,
                  borderBottomColor: colors.outline,
                },
              ]}
              onPress={() => toggleSelection(option.value)}
            >
              <Checkbox
                status={selectedValues.includes(option.value) ? 'checked' : 'unchecked'}
                onPress={() => toggleSelection(option.value)}
                color="#E53935"
                uncheckedColor="#E53935"
              />
              <Text
                style={[
                  styles.multiSelectOptionText,
                  {
                    color: selectedValues.includes(option.value)
                      ? colors.onPrimaryContainer
                      : colors.onSurface,
                  },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.multiSelectFooter, { backgroundColor: colors.surface }]}>
          <Button
            mode="contained"
            onPress={onClose}
            style={styles.multiSelectDoneButton}
          >
            Done
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  multiSelectContainer: {
    flex: 1,
  },
  multiSelectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  multiSelectTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  multiSelectScroll: {
    flex: 1,
  },
  multiSelectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  multiSelectOptionText: {
    fontSize: 14,
    flex: 1,
  },
  multiSelectFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  multiSelectDoneButton: {
    width: '100%',
  },
});