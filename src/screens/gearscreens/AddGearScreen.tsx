import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  FlatList,
  Pressable,
  Keyboard,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  useTheme,
  Icon,
  Menu,
  Divider,
  Snackbar,
} from 'react-native-paper';
import { Dropdown } from 'react-native-element-dropdown';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { p } from '../../utils/responsive';
import CommonDatePicker from '../../components/common/DatePicker';
import MonthYearPicker from '../../components/common/MonthYearPicker';
import RosterModal from '../../components/common/Modal/RosterModal';
import ManufacturerModal from '../../components/common/Modal/ManufacturerModal';
import { useLeadStore } from '../../store/leadStore';
import { useGearStore } from '../../store/gearStore';
import { useRosterStore } from '../../store/rosterStore';
import { useManufacturerStore } from '../../store/manufacturerStore';
import { GEAR_STATUSES, GearStatus } from '../../constants/gearTypes';
import { printTable } from '../../utils/printTable';

import dayjs from 'dayjs';
import Toast from 'react-native-toast-message';
import BarcodeScannerModal from '../../components/common/Modal/BarcodeScannerModal';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AddGear',
  'GearSearch'
>;

interface RosterItem {
  roster_id: number;
  franchise: {
    id: number;
    name: string;
  };
  firestation: {
    id: number;
    name: string;
  };
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  phone: string;
  active_status: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
  roster_name: string;
}

interface ManufacturerItem {
  manufacturer_id: number;
  manufacturer_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  active_status?: boolean;
  is_deleted?: boolean;
}

const DropdownTouchable = React.forwardRef<View, PressableProps>(
  ({ style, ...rest }, ref) => (
    <Pressable
      ref={ref}
      style={(state: PressableStateCallbackType) => {
        const resolvedStyle: StyleProp<ViewStyle> =
          typeof style === 'function' ? style(state) : style;
        return [resolvedStyle, state.pressed ? { opacity: 0.8 } : null];
      }}
      {...rest}
    />
  ),
);

type DropdownOption = {
  label: string;
  value: string;
};

const AddGearScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddGear'>>();
  const { currentLead } = useLeadStore();
  const { colors } = useTheme();

  // Stores
  const {
    gearTypes,
    loading: gearLoading,
    createGear,
    fetchGearTypes,
  } = useGearStore();
  const { fetchRosters } = useRosterStore();
  const { fetchManufacturers } = useManufacturerStore();

  const [orientation, setOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>(
    Dimensions.get('window').width > Dimensions.get('window').height
      ? 'LANDSCAPE'
      : 'PORTRAIT',
  );
  printTable('AddGears_screen - currentLead', currentLead);

  // Form state
  const [gearName, setGearName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [assignedRoster, setAssignedRoster] = useState<RosterItem | null>(null);
  const [manufacturer, setManufacturer] = useState<ManufacturerItem | null>(
    null,
  );
  const [selectedGearType, setSelectedGearType] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<GearStatus>('new');
  const [manufacturingDate, setManufacturingDate] = useState('');
  const [isGearNameEditable, setIsGearNameEditable] = useState(true);
  const [isCustomGearNameRequired, setIsCustomGearNameRequired] = useState(false);
  const [gearNameError, setGearNameError] = useState('');

  // UI states
  const [submitting, setSubmitting] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // NEW: Barcode scanner state
  const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [gearTypeDropdownFocus, setGearTypeDropdownFocus] = useState(false);

  // mock images
  const gearImages = [
    require('../../assets/jacket1.png'),
    require('../../assets/jacket2.png'),
    require('../../assets/jacket3.png'),
    require('../../assets/jacketScanning.png'),
  ];

  // menus + modals
  const [rosterModalVisible, setRosterModalVisible] = useState(false);
  const [manufacturerModalVisible, setManufacturerModalVisible] =
    useState(false);
  const [manufacturerMenuVisible, setManufacturerMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [rosterMenuVisible, setRosterMenuVisible] = useState(false);

  useEffect(() => {
    const onChange = () => {
      const { width, height } = Dimensions.get('window');
      setOrientation(width > height ? 'LANDSCAPE' : 'PORTRAIT');
    };
    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);

  const presetRoster = route.params?.presetRoster as RosterItem | undefined;

  useEffect(() => {
    if (presetRoster) {
      setAssignedRoster(presetRoster);
    }
  }, [presetRoster]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  // Fetch gear types on mount
  useEffect(() => {
    fetchGearTypes();
  }, []);

  const isLandscape = orientation === 'LANDSCAPE';

  // NEW: Handle barcode scan result
  const handleBarcodeScanned = (barcode: string) => {
    setSerialNumber(barcode);
    Toast.show({
      type: 'success',
      text1: 'Barcode scanned successfully!',
    });
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const validateForm = (): boolean => {
    if (isCustomGearNameRequired && !gearName.trim()) {
      setGearNameError('Gear name is required for Other type');
      showSnackbar('Please enter gear name');
      return false;
    }
    if (!selectedGearType) {
      showSnackbar('Please select gear type');
      return false;
    }
    if (!manufacturer) {
      showSnackbar('Please select manufacturer');
      return false;
    }
    if (!assignedRoster) {
      showSnackbar('Please select fire fighter');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    if (!currentLead) {
      showSnackbar('No current lead found');
      return;
    }

    setSubmitting(true);

    // Convert manufacturing date from dd-mm-yyyy to yyyy-mm-dd for API
    // Convert manufacturing date from dd-mm-yyyy to yyyy-mm-dd for API
    const formatDateForAPI = (dateString: string) => {
      if (!dateString) return '';
      const parts = dateString.split('-');
      if (parts.length === 3) {
        // Convert from dd-mm-yyyy to yyyy-mm-dd
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return dateString;
    };

    const payload = {
      gear_name: gearName.trim(),
      manufacturer_id: manufacturer?.manufacturer_id,
      roster_id: assignedRoster?.roster_id,
      serial_number: serialNumber.trim(),
      status: selectedStatus,
      active_status: true,
      firestation_id:
        currentLead?.firestation?.id || assignedRoster?.firestation.id,
      franchise_id: currentLead?.franchise?.id || assignedRoster?.franchise.id,
      // firestation_id :11,
      // franchise_id : 22,
      gear_type_id: selectedGearType?.gear_type_id,
      manufacturing_date: manufacturingDate
        ? dayjs(`${manufacturingDate}-01`).format('YYYY-MM-DD')
        : '',
    };

    console.log(
      'Save payload',
      payload,
      'manufacturingDate',
      manufacturingDate,
    );

    try {
      // const success:any = await createGear(payload);
      // console.log("success-Gear_added successfully",success)'
      const createdGear = await createGear(payload);
      console.log('success-Gear_added successfully', createdGear);
      if (createdGear) {
        Toast.show({
          type: 'success',
          text1: 'Gear added successfully!',
        });
        // Reset form and navigate back after success
        setTimeout(() => {
          resetForm();
          navigation.navigate('UpadateInspection', {
            gearId: Number(createdGear.gear_id),
            firefighter: assignedRoster, 
            mode:"create"
          });
        }, 500);
      } else {
        // showSnackbar('Failed to add gear. Please try again.');
        Toast.show({
          type: 'error',
          text1: 'Failed to Add New Gear',
        });
      }
    } catch (error) {
      console.error('Error adding gear:', error);
      showSnackbar('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setGearName('');
    setSerialNumber('');
    setAssignedRoster(null);
    setManufacturer(null);
    setSelectedGearType(null);
    setSelectedStatus('new');
    setManufacturingDate('');
  };

  const onRosterSelect = (roster: RosterItem) => {
    printTable('onRosterSelect', roster);
    setAssignedRoster(roster);
  };

  const onManufacturerSelect = (mfr: ManufacturerItem) => {
    printTable('mfr', mfr);
    setManufacturer(mfr);
  };

  const gearTypeOptions = useMemo<DropdownOption[]>(() => {
    return (gearTypes || []).map(gearType => ({
      label: gearType.gear_type,
      value: String(gearType.gear_type_id),
    }));
  }, [gearTypes]);

  const onGearTypeSelect = (gearTypeId?: string) => {
    const gearType = gearTypes?.find(
      type => String(type.gear_type_id) === gearTypeId,
    );
    setSelectedGearType(gearType || null);

    if (gearType) {
      const isOtherType =
        gearType.gear_type?.toLowerCase?.().includes('other') ?? false;

      setIsCustomGearNameRequired(isOtherType);

      if (isOtherType) {
        setGearName('');
        setGearNameError('');
        setIsGearNameEditable(true);
      } else {
        setGearName(gearType.gear_type || '');
        setGearNameError('');
        setIsGearNameEditable(false);
      }
    } else {
      setGearName('');
      setGearNameError('');
      setIsGearNameEditable(true);
      setIsCustomGearNameRequired(false);
    }
  };

  const getStatusLabel = (status: GearStatus) => {
    return GEAR_STATUSES.find(s => s.value === status)?.label || 'New';
  };

  const handleAddRosterManual = () => {
    showSnackbar('Add roster manual functionality to be implemented');
  };

  /* ---------- Render ---------- */
  const renderSelectedRosterCard = () => {
    if (!assignedRoster) {
      return (
        <View style={{ marginTop: p(4) }}>
          <Button
            mode="outlined"
            onPress={() => setRosterModalVisible(true)}
            compact
            icon="account-plus"
            style={[styles.smallBtn, { borderColor: colors.outline }]}
          >
            Assign Fire Fighter
          </Button>
        </View>
      );
    }

    return (
      <Card style={[styles.selectedItemCard, { borderColor: colors.primary }]}>
        <Card.Content style={styles.selectedItemContent}>
          <View style={styles.selectedItemInfo}>
            <Icon source="account" size={p(36)} color={colors.primary} />
            <View style={styles.selectedItemText}>
              <Text
                style={[styles.selectedItemName, { color: colors.onSurface }]}
              >
                {assignedRoster.roster_name}
              </Text>
              <Text
                style={[
                  styles.selectedItemSubtitle,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                {assignedRoster.firestation?.name || 'Unknown Station'}
              </Text>
              <Text
                style={[
                  styles.selectedItemSubtitle,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                {assignedRoster.email} • {assignedRoster.phone}
              </Text>
            </View>
          </View>

          {/* Fire Fighter Menu */}
          <Menu
            visible={rosterMenuVisible}
            onDismiss={() => setRosterMenuVisible(false)}
            anchor={
              <Button
                mode="text"
                onPress={() => setRosterMenuVisible(true)}
                compact
              >
                <Icon
                  source="dots-vertical"
                  size={p(20)}
                  color={colors.onSurface}
                />
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                setRosterMenuVisible(false);
                setRosterModalVisible(true);
              }}
              title="Update Fire Fighter"
              leadingIcon="account-edit"
            />

            <Menu.Item
              onPress={() => {
                setRosterMenuVisible(false);
                setAssignedRoster(null);
              }}
              title="Remove Fire Fighter"
              leadingIcon="account-remove"
            />
          </Menu>
        </Card.Content>
      </Card>
    );
  };

  const renderSelectedManufacturerCard = () => {
    if (!manufacturer) {
      return (
        <View style={{ marginTop: p(4) }}>
          <Button
            mode="outlined"
            onPress={() => setManufacturerModalVisible(true)}
            compact
            icon="factory"
            style={[styles.smallBtn, { borderColor: colors.outline }]}
          >
            Select Manufacturer
          </Button>
        </View>
      );
    }

    return (
      <Card style={[styles.selectedItemCard, { borderColor: colors.primary }]}>
        <Card.Content style={styles.selectedItemContent}>
          <View style={styles.selectedItemInfo}>
            <Icon source="factory" size={p(36)} color={colors.primary} />
            <View style={styles.selectedItemText}>
              <Text
                style={[styles.selectedItemName, { color: colors.onSurface }]}
              >
                {manufacturer.manufacturer_name}
              </Text>
              <Text
                style={[
                  styles.selectedItemSubtitle,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                {manufacturer.city}, {manufacturer.country}
              </Text>
            </View>
          </View>

          {/* Manufacturer Menu */}
          <Menu
            visible={manufacturerMenuVisible}
            onDismiss={() => setManufacturerMenuVisible(false)}
            anchor={
              <Button
                mode="text"
                onPress={() => setManufacturerMenuVisible(true)}
                compact
              >
                <Icon
                  source="dots-vertical"
                  size={p(20)}
                  color={colors.onSurface}
                />
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                setManufacturerMenuVisible(false);
                setManufacturerModalVisible(true);
              }}
              title="Update Manufacturer"
              leadingIcon="pen"
            />

            <Menu.Item
              onPress={() => {
                setManufacturerMenuVisible(false);
                setManufacturer(null);
              }}
              title="Remove Manufacturer"
              leadingIcon="delete"
            />
          </Menu>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingBottom: keyboardVisible ? p(250) : 0,
        },
      ]}
    >
        {/* header */}
        <View style={[styles.header, { borderBottomColor: colors.outline }]}>
          <Button
            mode="text"
            compact
            onPress={() => navigation.goBack()}
            contentStyle={{ flexDirection: 'row' }}
            style={{ marginLeft: p(-8) }}
          >
            <Icon source="arrow-left" size={p(20)} color={colors.onSurface} />
          </Button>

          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
            Add New Gear
          </Text>

          {/* <View style={styles.headerActions}>
            ...
          </View> */}
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: p(28) }}
          keyboardShouldPersistTaps="handled"
        >
          {currentLead && (
            <Card
              style={[styles.card, { backgroundColor: colors.surfaceVariant }]}
            >
              <Card.Content>
                <Text
                  style={[styles.cardTitle, { color: colors.onSurfaceVariant }]}
                >
                  Current Job Information
                </Text>
                <Divider style={{ marginVertical: p(8) }} />
                <Text
                  style={[styles.infoText, { color: colors.onSurfaceVariant }]}
                >
                  Department: {currentLead.firestation?.name}
                </Text>
                <Text
                  style={[styles.infoText, { color: colors.onSurfaceVariant }]}
                >
                  Franchise: {currentLead.franchise?.name}
                </Text>
              </Card.Content>
            </Card>
          )}

          {/* Basic info */}
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Content>
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                Gear Information
              </Text>
              <Divider style={{ marginVertical: p(8) }} />

              {/* Fire Fighter & Manufacturer side-by-side */}
              <View
                style={[
                  styles.inputRow,
                  { marginTop: p(8), alignItems: 'flex-start', gap: p(6) },
                ]}
              >
              <View
                style={[
                  styles.inputCol,
                  isLandscape ? { flex: 1 } : { flex: 1 },
                ]}
              >
                <Text style={[styles.label, { color: colors.onSurface }]}>
                  Fire Fighter *
                </Text>
                {renderSelectedRosterCard()}
              </View>

                <View
                  style={{
                    width: isLandscape ? p(12) : 0,
                    height: isLandscape ? undefined : p(12),
                  }}
                />

              <View
                style={[
                  styles.inputCol,
                  isLandscape ? { flex: 1 } : { flex: 1 },
                ]}
              >
                <Text style={[styles.label, { color: colors.onSurface }]}>
                  Manufacturer *
                </Text>
                {renderSelectedManufacturerCard()}
              </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputCol, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.onSurface }]}>
                    Serial Number
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={serialNumber}
                    onChangeText={setSerialNumber}
                    placeholder="Enter serial number"
                    style={styles.input}
                    outlineColor={colors.outline}
                    activeOutlineColor={colors.primary}
                    dense
                    right={
                      <TextInput.Icon
                        icon="barcode-scan"
                        onPress={() => setBarcodeScannerVisible(true)}
                        color={colors.primary}
                      />
                    }
                  />
                </View>

                <View style={{ width: p(12) }} />

                <View style={[styles.inputCol, { flex: 1 }]}>
                  <MonthYearPicker
                    label="Manufacturing Month & Year"
                    value={manufacturingDate}
                    onChange={setManufacturingDate}
                    placeholder="Select month & year"
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputCol, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.onSurface }]}>
                    Gear Type *
                  </Text>
                <Dropdown
                  style={[
                    styles.dropdown,
                    { borderColor: gearTypeDropdownFocus ? colors.primary : colors.outline },
                  ]}
                  selectedTextStyle={styles.dropdownSelectedText}
                  placeholderStyle={styles.dropdownPlaceholder}
                  containerStyle={{ borderRadius: p(8), paddingHorizontal: p(8) }}
                  itemTextStyle={{ color: colors.onSurface }}
                  activeColor={colors.surfaceVariant}
                  data={gearTypeOptions}
                  labelField="label"
                  valueField="value"
                  placeholder="Select gear type"
                  value={
                    selectedGearType
                      ? String(selectedGearType.gear_type_id)
                      : null
                  }
                  onFocus={() => setGearTypeDropdownFocus(true)}
                  onBlur={() => setGearTypeDropdownFocus(false)}
                  onChange={(item) => {
                    onGearTypeSelect(item.value);
                    setGearTypeDropdownFocus(false);
                  }}
                />
                </View>

                <View style={{ width: p(12) }} />

                <View style={[styles.inputCol, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.onSurface }]}>
                    Gear Name{isCustomGearNameRequired ? ' *' : ''}
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={gearName}
                    onChangeText={(text) => {
                      setGearName(text);
                      if (text.trim()) {
                        setGearNameError('');
                      }
                    }}
                    placeholder="Enter gear name"
                    style={styles.input}
                    outlineColor={colors.outline}
                    activeOutlineColor={colors.primary}
                    dense
                    editable={isGearNameEditable}
                    disabled={!isGearNameEditable}
                    error={!!gearNameError}
                  />
                  {!!gearNameError && (
                    <Text
                      style={{
                        color: colors.error,
                        marginTop: p(2),
                        fontSize: p(11),
                      }}
                    >
                      {gearNameError}
                    </Text>
                  )}
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Submit Button */}
          <View
            style={{
              marginTop: p(12),
              marginBottom: p(22),
              marginHorizontal: p(100),
            }}
          >
            <Button
              mode="contained"
              onPress={handleSave}
              loading={submitting}
              disabled={submitting}
              buttonColor={colors.primary}
              contentStyle={{ paddingVertical: p(8) }}
              labelStyle={{
                fontSize: p(16),
                fontWeight: '600',
                color: '#fff',
              }}
            >
              {submitting ? 'Adding Gear...' : 'Add New Gear'}
            </Button>
          </View>
      </ScrollView>

      {/* Modals */}
      <RosterModal
        visible={rosterModalVisible}
        onClose={() => setRosterModalVisible(false)}
        onRosterSelect={(r: any) => {
          onRosterSelect(r as RosterItem);
          setRosterModalVisible(false);
        }}
        onAddRosterManual={handleAddRosterManual}
      />

      <ManufacturerModal
        visible={manufacturerModalVisible}
        onClose={() => setManufacturerModalVisible(false)}
        onSelect={(mfr: any) => {
          onManufacturerSelect(mfr as ManufacturerItem);
          setManufacturerModalVisible(false);
        }}
      />

      {/* NEW: Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={barcodeScannerVisible}
        onClose={() => setBarcodeScannerVisible(false)}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: colors.surface }}
      >
        <Text style={{ color: colors.onSurface }}>{snackbarMessage}</Text>
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: p(16),
    paddingVertical: p(10),
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: p(18),
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  saveBtn: { borderRadius: p(8) },

  content: { flex: 1, padding: p(12) },
  card: { marginBottom: p(12), borderRadius: p(10) },

  cardTitle: { fontSize: p(16), fontWeight: '700' },

  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: p(4) },
  inputCol: { flex: 1 },
  label: { fontSize: p(13), fontWeight: '600', marginBottom: p(4) },
  input: { height: p(44) },
  smallBtn: { borderRadius: p(8) },
  dropdown: {
    height: p(44),
    borderWidth: 1,
    borderRadius: p(8),
    paddingHorizontal: p(12),
    justifyContent: 'center',
  },
  dropdownSelectedText: {
    fontSize: p(14),
  },
  dropdownPlaceholder: {
    fontSize: p(14),
    color: '#999',
  },

  selectedItemCard: {
    borderWidth: 1,
    borderRadius: p(8),
    backgroundColor: 'white',
  },
  selectedItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: p(8),
  },
  selectedItemInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  selectedItemText: { flex: 1, marginLeft: p(10) },
  selectedItemName: { fontSize: p(15), fontWeight: '600' },
  selectedItemSubtitle: { fontSize: p(13), color: '#666' },

  thumb: {
    width: p(70),
    height: p(70),
    borderRadius: p(8),
    marginRight: p(8),
    resizeMode: 'cover',
  },
  infoText: { fontSize: p(14), marginBottom: p(4) },
});

export default AddGearScreen;
