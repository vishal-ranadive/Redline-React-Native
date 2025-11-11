import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import DatePicker from 'react-native-date-picker';
import { p } from '../../utils/responsive';
import { useThemeStore } from '../../store/themeStore'; // ✅ If you're storing theme manually

interface CommonDatePickerProps {
  label?: string;
  value: string;
  onChange: (date: string) => void;
  mode?: 'date' | 'datetime' | 'time';
  placeholder?: string;
}

const CommonDatePicker: React.FC<CommonDatePickerProps> = ({
  label,
  value,
  onChange,
  mode = 'date',
  placeholder = 'Select date'
}) => {
  const { colors } = useTheme();
  const appTheme = useThemeStore(state => state.theme); // 'light' | 'dark'
  
  const [visible, setVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : new Date());

  const handleConfirm = (date: Date) => {
    setSelectedDate(date);
    const formattedDate = mode === 'time' 
      ? date.toTimeString()
      : date.toISOString().split('T')[0];
    onChange(formattedDate);
    setVisible(false);
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return placeholder;
    const date = new Date(dateString);
    return mode === 'time'
      ? date.toLocaleTimeString()
      : mode === 'datetime'
      ? date.toLocaleString()
      : date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      {label ? (
        <Button
          mode="text"
          disabled
          labelStyle={[styles.label, { color: colors.onSurface }]}
        >
          {label}
        </Button>
      ) : null}

      <Button
        mode="outlined"
        onPress={() => setVisible(true)}
        style={[
          styles.button,
          { backgroundColor: colors.surface, borderColor: colors.outline },
        ]}
        contentStyle={styles.buttonContent}
        labelStyle={[
          styles.buttonLabel,
          { color: value ? colors.onSurface : colors.outline },
        ]}
        icon="calendar"
      >
        {formatDisplayDate(value)}
      </Button>

      <DatePicker
        modal
        open={visible}
        date={selectedDate}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        mode={mode}
        theme={appTheme === 'dark' ? 'dark' : 'light'} // ✅ adds dark mode support
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: p(12),
  },
  label: {
    fontSize: p(14),
    fontWeight: '600',
  },
  button: {
    borderWidth: 1,
    borderRadius: p(8),
  },
  buttonContent: {
    height: p(44),
    justifyContent: 'flex-start',
  },
  buttonLabel: {
    fontSize: p(14),
    textAlign: 'left',
    flex: 1,
  },
});

export default CommonDatePicker;
