import React, { useMemo, useState } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
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
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
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
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

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
    const start = Math.max(startYear, endYear - 24); // Show last 25 years max
    for (let year = endYear; year >= start; year -= 1) {
      yearsArray.push(year);
    }
    return yearsArray;
  }, [startYear, endYear]);

  const openModal = () => {
    setSelectedYear(parsedDate?.year ?? null);
    setSelectedMonth(parsedDate?.month ?? null);
    setVisible(true);
  };

  const closeModal = () => {
    setVisible(false);
    setSelectedYear(null);
    setSelectedMonth(null);
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
  };

  const handleMonthSelect = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
  };

  const handleDone = () => {
    if (selectedYear == null || selectedMonth == null) {
      return;
    }
    const formatted = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    onChange(formatted);
    closeModal();
  };

  const renderYear = (year: number) => {
    const isSelected = selectedYear === year;
    return (
      <TouchableOpacity
        style={[
          styles.gridButton,
          {
            backgroundColor: isSelected ? colors.primaryContainer : colors.surface,
            borderColor: colors.outline,
          },
        ]}
        onPress={() => handleYearSelect(year)}
      >
        <Text
          style={[
            styles.gridButtonText,
            { color: isSelected ? colors.onPrimaryContainer : colors.onSurface },
          ]}
        >
          {year}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMonth = (month: string, index: number) => {
    const isSelected = selectedMonth === index;
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
          {month}
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
              Select Month & Year
            </Text>

            <View style={styles.pickerContainer}>
              {/* Year Selection */}
              <View style={styles.pickerColumn}>
                <Text style={[styles.columnTitle, { color: colors.onSurface }]}>
                  Year
                </Text>
                <ScrollView
                  style={styles.scrollContainer}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.gridContent}
                >
                  <View style={styles.gridContainer}>
                    {years.map((year) => (
                      <View key={year} style={styles.gridItem}>
                        {renderYear(year)}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Separator */}
              <View style={[styles.separator, { borderLeftColor: colors.outline }]} />

              {/* Month Selection */}
              <View style={styles.pickerColumn}>
                <Text style={[styles.columnTitle, { color: colors.onSurface }]}>
                  Month
                </Text>
                <ScrollView
                  style={styles.scrollContainer}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.gridContent}
                >
                  <View style={styles.gridContainerMonths}>
                    {months.map((month, index) => (
                      <View key={month} style={styles.gridItemMonth}>
                        {renderMonth(month, index)}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button onPress={closeModal} mode="text" textColor={colors.error}>
                Cancel
              </Button>
              <Button
                onPress={handleDone}
                mode="contained"
                disabled={selectedYear == null || selectedMonth == null}
                buttonColor={colors.primary}
              >
                Done
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
    maxHeight: '104%', // Increased by 30% from 80%
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
  pickerContainer: {
    flexDirection: 'row',
    gap: p(8),
    marginBottom: p(8),
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  columnTitle: {
    fontSize: p(14),
    fontWeight: '600',
    marginBottom: p(8),
  },
  scrollContainer: {
    maxHeight: p(350),
    width: '100%',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%', // For 2 columns (years)
    marginBottom: p(8),
  },
  gridContainerMonths: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItemMonth: {
    width: '48%', // For 2 columns (months)
    marginBottom: p(8),
  },
  separator: {
    width: 1,
    height: '100%',
    borderLeftWidth: 2,
    borderLeftColor: 'transparent',
    borderStyle: 'dotted',
    opacity: 0.5,
  },
});

export default MonthYearPicker;


