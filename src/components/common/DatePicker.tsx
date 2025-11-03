import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import DatePicker from 'react-native-date-picker';
import { p } from '../../utils/responsive';

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
    
    if (mode === 'time') {
      return dateString;
    }
    
    const date = new Date(dateString);
    return mode === 'date' 
      ? date.toLocaleDateString()
      : date.toLocaleString();
  };

  return (
    <View style={styles.container}>
      {/* <Text style={[styles.label, { color: colors.onSurface }]}>{label}</Text> */}
      
      <Button
        mode="outlined"
        onPress={() => setVisible(true)}
        style={[styles.button, { borderColor: colors.outline }]}
        contentStyle={styles.buttonContent}
        labelStyle={[styles.buttonLabel, { 
          color: value ? colors.onSurface : colors.outline 
        }]}
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
        // theme={colors.mode === 'dark' ? 'dark' : 'light'}
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
    marginBottom: p(6),
  },
  button: {
    backgroundColor: 'white',
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