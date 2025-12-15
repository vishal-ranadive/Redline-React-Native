import React, { useMemo, useState } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  FlatList,
} from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { p } from '../../utils/responsive';

type MonthYearPickerProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  startYear?: number;
  endYear?: number;
};

const DEFAULT_START_YEAR = 2000;

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select month & year',
  startYear = DEFAULT_START_YEAR,
  endYear = new Date().getFullYear(),
}) => {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<'year' | 'month'>('year');
  const [pendingYear, setPendingYear] = useState<number | null>(null);

  const parsedDate = useMemo(() => {
    if (!value) {
      return null;
    }
    const [year, month] = value.split('-').map(Number);
    if (!year || !month) {
      return null;
    }
    return { year, month: month - 1 };
  }, [value]);

  // Format the date in local timezone to avoid iOS timezone issues
  const formatMonthYear = (dateValue: string): string => {
    const [year, month] = dateValue.split('-').map(Number);
    // Using new Date(year, month, day) creates date in LOCAL timezone
    // This prevents iOS from interpreting it as UTC and shifting timezones
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      year: 'numeric',
    });
  };

  const years = useMemo(() => {
    const yearsArray: number[] = [];
    for (let year = endYear; year >= startYear; year -= 1) {
      yearsArray.push(year);
    }
    return yearsArray;
  }, [startYear, endYear]);

  const openModal = () => {
    setPendingYear(parsedDate?.year ?? endYear);
    setStep('year');
    setVisible(true);
  };

  const closeModal = () => {
    setVisible(false);
    setStep('year');
  };

  const handleYearSelect = (year: number) => {
    setPendingYear(year);
    setStep('month');
  };

  const handleMonthSelect = (monthIndex: number) => {
    if (pendingYear == null) {
      return;
    }
    const formatted = `${pendingYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    onChange(formatted);
    closeModal();
  };

  const renderYear = ({ item }: { item: number }) => {
    const isSelected = pendingYear === item;
    return (
      <TouchableOpacity
        style={[
          styles.gridButton,
          {
            backgroundColor: isSelected ? colors.primaryContainer : colors.surface,
            borderColor: colors.outline,
          },
        ]}
        onPress={() => handleYearSelect(item)}
      >
        <Text
          style={[
            styles.gridButtonText,
            { color: isSelected ? colors.onPrimaryContainer : colors.onSurface },
          ]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMonth = ({ item, index }: { item: string; index: number }) => {
    const isSelected =
      parsedDate?.month === index && parsedDate?.year === pendingYear;
    return (
      <TouchableOpacity
        style={[
          styles.gridButton,
          {
            backgroundColor: isSelected ? colors.primaryContainer : colors.surface,
            borderColor: colors.outline,
          },
        ]}
        onPress={() => handleMonthSelect(index)}
      >
        <Text
          style={[
            styles.gridButtonText,
            { color: isSelected ? colors.onPrimaryContainer : colors.onSurface },
          ]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.label, { color: colors.onSurface }]}>{label}</Text>
      ) : null}
      <Button
        mode="outlined"
        onPress={openModal}
        style={[
          styles.triggerButton,
          { borderColor: colors.outline, backgroundColor: colors.surface },
        ]}
        contentStyle={styles.triggerContent}
        labelStyle={[
          styles.triggerLabel,
          { color: value ? colors.onSurface : colors.onSurfaceVariant },
        ]}
        icon="calendar"
      >
        {value ? formatMonthYear(value) : placeholder}
      </Button>

      <Modal transparent visible={visible} animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
              {step === 'year' ? 'Select Year' : 'Select Month'}
            </Text>

            {step === 'year' ? (
              <FlatList
                key="year-grid"
                data={years}
                keyExtractor={(item) => item.toString()}
                numColumns={4}
                columnWrapperStyle={styles.gridRow}
                renderItem={renderYear}
                contentContainerStyle={styles.gridContent}
              />
            ) : (
              <FlatList
                key="month-grid"
                data={months}
                keyExtractor={(item) => item}
                numColumns={3}
                columnWrapperStyle={styles.gridRow}
                renderItem={renderMonth}
                contentContainerStyle={styles.gridContent}
              />
            )}

            <View style={styles.modalActions}>
              {step === 'month' && (
                <Button onPress={() => setStep('year')} mode="text">
                  Back
                </Button>
              )}
              <Button onPress={closeModal} mode="text" textColor={colors.error}>
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: p(12),
  },
  label: {
    fontSize: p(13),
    fontWeight: '600',
    marginBottom: p(4),
  },
  triggerButton: {
    borderWidth: 1,
    borderRadius: p(8),
  },
  triggerContent: {
    height: p(44),
    justifyContent: 'flex-start',
  },
  triggerLabel: {
    fontSize: p(14),
    textAlign: 'left',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: p(16),
  },
  modalContainer: {
    width: '100%',
    borderRadius: p(12),
    padding: p(16),
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: p(16),
    fontWeight: '700',
    marginBottom: p(12),
  },
  gridContent: {
    paddingBottom: p(12),
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: p(8),
  },
  gridButton: {
    flex: 1,
    marginHorizontal: p(4),
    paddingVertical: p(10),
    borderRadius: p(8),
    borderWidth: 1,
    alignItems: 'center',
  },
  gridButtonText: {
    fontSize: p(14),
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: p(8),
    marginTop: p(4),
  },
});

export default MonthYearPicker;


