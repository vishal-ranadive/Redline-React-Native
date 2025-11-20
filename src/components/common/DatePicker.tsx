import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { p } from '../../utils/responsive';
import { useThemeStore } from '../../store/themeStore';

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
  placeholder = 'Select date',
}) => {
  const { colors } = useTheme();
  const appTheme = useThemeStore(state => state.theme);

  const [visible, setVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    value ? new Date(value) : new Date()
  );

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return placeholder;
    const date = new Date(dateString);

    return mode === 'time'
      ? date.toLocaleTimeString()
      : mode === 'datetime'
      ? date.toLocaleString()
      : date.toLocaleDateString();
  };

  const handleConfirm = (date: Date) => {
    setSelectedDate(date);

    const formatted =
      mode === 'time'
        ? date.toTimeString()
        : date.toISOString().split('T')[0];

    onChange(formatted);
    setVisible(false);
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

      <DateTimePickerModal
        isVisible={visible}
        mode={mode}
        date={selectedDate}
        onConfirm={handleConfirm}
        onCancel={() => setVisible(false)}
        themeVariant={appTheme === 'dark' ? 'dark' : 'light'}
        display={Platform.OS === 'ios' ? 'inline' : 'calendar'} // 👈 TAP CALENDAR
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
