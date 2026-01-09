// src/components/common/ColorPickerModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Text, IconButton, useTheme, TextInput } from 'react-native-paper';

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
    { value: 'red', label: 'RED' },
    { value: 'orange', label: 'ORANGE' },
    { value: 'yellow', label: 'YELLOW' },
    { value: 'green', label: 'GREEN' },
    { value: 'blue', label: 'BLUE' },
    { value: 'purple', label: 'PURPLE' },
    { value: 'teal', label: 'TEAL' },
    { value: 'pink', label: 'PINK' },
    { value: 'grey', label: 'GREY' },
    { value: 'gold', label: 'GOLD' },
  ],
  usedColors: _usedColors = [],
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [otherColorValue, setOtherColorValue] = useState('');
  const [isOtherMode, setIsOtherMode] = useState(false);
  const isOtherSelected = isOtherMode || selectedColor?.toLowerCase() === 'other';

  // Normalize used colors to lowercase for comparison
  // const normalizedUsedColors = _usedColors.map((color) => color.toLowerCase().trim()).filter(Boolean);

  // Initialize isOtherMode when modal opens if Other is already selected
  useEffect(() => {
    if (visible && selectedColor?.toLowerCase() === 'other') {
      setIsOtherMode(true);
    }
  }, [visible, selectedColor]);

  // Reset other color value when modal closes
  useEffect(() => {
    if (!visible) {
      setOtherColorValue('');
      setSearchQuery('');
      setIsOtherMode(false);
    }
  }, [visible]);

  // Build the full color options list with NO TAG, colors, and Other
  const allOptions: (ColorOption & { type: 'no-tag' | 'color' | 'other' })[] = [
    { value: 'no-tag', label: 'NO TAG', type: 'no-tag' },
    ...colorOptions.map(opt => ({ ...opt, type: 'color' as const })),
    { value: 'other', label: 'Other', type: 'other' },
  ];

  // Filter options based on search query
  const filteredOptions = allOptions.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleColorSelect = (value: string) => {
    if (value === 'other') {
      // Set local state to show input field, don't close modal
      setIsOtherMode(true);
      // Don't call onColorSelect yet - wait for Done button
      // Don't close modal, show text input
    } else {
      // For NO TAG or regular colors
      // TODO: Don't change backend payload - just add comment
      // Backend expects color value as-is
      setIsOtherMode(false);
      onColorSelect(value);
      onClose();
    }
  };

  const handleDone = () => {
    if (isOtherMode && otherColorValue.trim()) {
      // TODO: Don't change backend payload - just add comment
      // Backend expects custom color value
      onColorSelect(otherColorValue.trim());
      setIsOtherMode(false);
    } else if (isOtherMode && !otherColorValue.trim()) {
      // If Other is selected but no value entered, just close without selecting
      setIsOtherMode(false);
    }
    onClose();
  };

  const getColorForOption = (option: typeof allOptions[0]): string | null => {
    if (option.type === 'no-tag') {
      return null; // NO TAG shows ban icon instead
    }
    if (option.type === 'other') {
      return null; // Other has no color strip
    }
    // Get color from COLOR_MAP, with fallback
    const colorKey = option.value.toLowerCase();
    const color = COLOR_MAP[colorKey];
    return color || '#CCCCCC'; // Return fallback color instead of null
  };


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
        >
          {/* Header with Cancel and Done */}
          <View style={styles.colorPickerHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.headerButton, { color: colors.primary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDone}>
              <Text style={[styles.headerButton, { color: colors.primary }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              mode="outlined"
              placeholder="Search"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              left={<TextInput.Icon icon="magnify" />}
            />
          </View>

          {/* Color List */}
          <ScrollView style={styles.colorList} showsVerticalScrollIndicator={false}>
            {filteredOptions.map((option) => {
              const colorValue = option.value.toLowerCase();
              const displayColor = getColorForOption(option);
              const isSelected = selectedColor?.toLowerCase() === colorValue;
              // const _isLocked = option.type === 'color' &&
              //   normalizedUsedColors.includes(colorValue) && !isSelected;
              // Commented out lock logic

              // const _isOther = option.type === 'other';

              return (
                <TouchableOpacity
                  key={option.value}
                  style={styles.colorRow}
                  onPress={() => handleColorSelect(option.value)}
                  // disabled={isLocked}
                  activeOpacity={0.7} // isLocked ? 1 : 0.7
                >
                  {/* Color Rectangle - Simple View with text and color box */}
                  <View 
                    style={[
                      styles.colorRowContainer,
                      {
                        backgroundColor: colors.surface,
                        // opacity: isLocked ? 0.5 : 1,
                      }
                    ]}
                  >
                    {/* Text container on the left */}
                    <View style={styles.colorTextContainer}>
                      <Text 
                        style={[
                          styles.colorLabel,
                          {
                            color: colors.onSurface, // isLocked ? colors.onSurface + '80' : colors.onSurface,
                            fontWeight: option.type === 'no-tag' ? 'bold' : 'normal',
                          }
                        ]}
                      >
                        {option.label}
                      </Text>
                      {isSelected && (
                        <IconButton
                          icon="check"
                          size={20}
                          iconColor={colors.primary}
                          style={styles.checkIcon}
                        />
                      )}
                      {/* {isLocked && (
                        <IconButton
                          icon="lock"
                          size={20}
                          iconColor={colors.onSurface + '80'}
                          style={styles.lockIcon}
                        />
                      )} */}
                    </View>
                    {/* Color box or ban icon on the right */}
                    {option.type === 'no-tag' ? (
                      <IconButton
                        icon="not-interested"
                        size={24}
                        iconColor={colors.onSurface}
                        style={styles.banIcon}
                      />
                    ) : option.type === 'color' && displayColor ? (
                      <View 
                        style={[
                          styles.colorStrip,
                          {
                            backgroundColor: displayColor,
                            // opacity: isLocked ? 0.5 : 1,
                          }
                        ]} 
                      />
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Other Color Input - shown when Other is selected */}
          {isOtherSelected && (
            <View style={styles.otherInputContainer}>
              <TextInput
                mode="outlined"
                label="Custom Color"
                placeholder="Tap to answer"
                value={otherColorValue}
                onChangeText={setOtherColorValue}
                style={styles.otherInput}
                autoFocus
              />
            </View>
          )}
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
    maxHeight: '90%',
  },
  colorPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: 'transparent',
  },
  colorList: {
    maxHeight: 500,
  },
  colorRow: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  colorRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  colorStrip: {
    width: 48, // Fixed width for color box
    height: 48, // Fixed height for color box
    borderRadius: 4,
  },
  colorTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 16,
  },
  colorLabel: {
    fontSize: 16,
    flex: 1,
  },
  checkIcon: {
    margin: 0,
  },
  lockIcon: {
    margin: 0,
  },
  banIcon: {
    margin: 0,
  },
  otherInputContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  otherInput: {
    backgroundColor: 'transparent',
  },
});