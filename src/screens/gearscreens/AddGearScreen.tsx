// src/screens/gearscreens/AddGearScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  FlatList,
  TouchableOpacity,
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
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { p } from '../../utils/responsive';
import CommonDatePicker from '../../components/common/DatePicker';
import RosterModal from '../../components/common/Modal/RosterModal';
import ManufacturerModal from '../../components/common/Modal/ManufacturerModal';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddGear', 'GearSearch'>;

interface RosterItem {
  roster_id: number;
  roster_name: string;
  email: string;
  phone: string;
  firestation: { firestation_id: number; fire_station_name: string };
  active_status: boolean;
  is_deleted?: boolean;
  avatar?: string;
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

// Updated STATUS_OPTIONS as per requirement #7 - all caps
const STATUS_OPTIONS = [
  { value: 'PASS', label: 'PASS', color: '#34A853' },
  { value: 'EXPIRED', label: 'EXPIRED', color: '#F9A825' },
  { value: 'RECOMMENDED OOS', label: 'RECOMMENDED OOS', color: '#EA4335' },
  { value: 'CORRECTIVE ACTION REQUIRED', label: 'CORRECTIVE ACTION REQUIRED', color: '#9a25f9ff' },
];

// Service types as per requirement #6
const SERVICE_TYPES = [
  { value: 'CLEANED_AND_INSPECTED', label: 'Cleaned and Inspected' },
  { value: 'CLEANED_ONLY', label: 'Cleaned Only' },
  { value: 'INSPECTED_ONLY', label: 'Inspected Only' },
  { value: 'SPECIALIZED_CLEANING', label: 'Specialized Cleaning' },
  { value: 'OTHER', label: 'Other' },
];

const AddGearScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { lead: initialLead } = route.params as any;
  const { colors } = useTheme();

  const [orientation, setOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>(
    Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT'
  );

  // form state
  const [gearType, setGearType] = useState('');
  const [name, setName] = useState('');
  const [assignedRoster, setAssignedRoster] = useState<RosterItem | null>(null);
  const [barcode, setBarcode] = useState('');
  const [manufacturer, setManufacturer] = useState<ManufacturerItem | null>(null);
  const [dateOfManufacture, setDateOfManufacture] = useState('');
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  const [lastInspection, setLastInspection] = useState('');
  const [nextInspection, setNextInspection] = useState('');
  const [status, setStatus] = useState(STATUS_OPTIONS[0].value);
  const [condition, setCondition] = useState('Good');
  const [notes, setNotes] = useState('');
  const [serviceType, setServiceType] = useState('');

  // mock images
  const gearImages = [
    require('../../assets/jacket1.png'),
    require('../../assets/jacket2.png'),
    require('../../assets/jacket3.png'),
    require('../../assets/jacketScanning.png'),
  ];

  // menus + modals
  const [rosterModalVisible, setRosterModalVisible] = useState(false);
  const [manufacturerModalVisible, setManufacturerModalVisible] = useState(false);
  const [manufacturerMenuVisible, setManufacturerMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [rosterMenuVisible, setRosterMenuVisible] = useState(false);
  const [serviceTypeMenuVisible, setServiceTypeMenuVisible] = useState(false);

  useEffect(() => {
    const onChange = () => {
      const { width, height } = Dimensions.get('window');
      setOrientation(width > height ? 'LANDSCAPE' : 'PORTRAIT');
    };
    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);

  const isLandscape = orientation === 'LANDSCAPE';

  const handleSave = () => {
    const payload = {
      gearType,
      name,
      roster: assignedRoster?.roster_id ?? null,
      barcode,
      manufacturer: manufacturer?.manufacturer_id ?? null,
      dateOfManufacture, // Already in dd-mm-yyyy format from CommonDatePicker
      warrantyExpiry,
      lastInspection,
      nextInspection,
      status, // All caps as per requirement #7
      condition,
      notes,
      serviceType,
    };
    console.log('Save payload', payload);
    // TODO: API call

    navigation.navigate('GearDetail');
  };

  // helpers
  const getStatusColor = (val: string) => {
    const found = STATUS_OPTIONS.find(s => s.value === val);
    return found ? found.color : colors.primary;
  };

  const getServiceTypeLabel = (value: string) => {
    const found = SERVICE_TYPES.find(s => s.value === value);
    return found ? found.label : 'Select Service Type';
  };

  const onRosterSelect = (roster: RosterItem) => {
    setAssignedRoster(roster);
  };

  const onManufacturerSelect = (mfr: ManufacturerItem) => {
    setManufacturer(mfr);
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
              <Text style={[styles.selectedItemName, { color: colors.onSurface }]}>
                {assignedRoster.roster_name}
              </Text>
              <Text style={[styles.selectedItemSubtitle, { color: colors.onSurfaceVariant }]}>
                {assignedRoster.firestation.fire_station_name}
              </Text>
              <Text style={[styles.selectedItemSubtitle, { color: colors.onSurfaceVariant }]}>
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
                <Icon source="dots-vertical" size={p(20)} color={colors.onSurface} />
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
              <Text style={[styles.selectedItemName, { color: colors.onSurface }]}>
                {manufacturer.manufacturer_name}
              </Text>
              <Text style={[styles.selectedItemSubtitle, { color: colors.onSurfaceVariant }]}>
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
                <Icon source="dots-vertical" size={p(20)} color={colors.onSurface} />
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                setManufacturerMenuVisible(false);
                setManufacturerModalVisible(true);
              }}
              title="Update Manufacturer"
              leadingIcon="factory-edit"
            />

            <Menu.Item
              onPress={() => {
                setManufacturerMenuVisible(false);
                setManufacturer(null);
              }}
              title="Remove Manufacturer"
              leadingIcon="factory-remove"
            />
          </Menu>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* header */}
      <View style={[styles.header, { borderBottomColor: colors.outline }]}>
        <Button mode="text" compact onPress={() => navigation.goBack()} contentStyle={{ flexDirection: 'row' }} style={{ marginLeft: p(-8) }}>
          <Icon source="arrow-left" size={p(20)} color={colors.onSurface} />
        </Button>

        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Add Gear</Text>

        <View style={styles.headerActions}>
          <Button mode="text" compact onPress={() => navigation.goBack()} textColor={colors.onSurface}>Cancel</Button>
          <Button mode="contained" compact onPress={handleSave} buttonColor={colors.primary} style={styles.saveBtn} textColor={colors.surface}>Save</Button>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: p(28) }}>
        {/* Basic info */}
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Gear Information</Text>
            <Divider style={{ marginVertical: p(8) }} />

            <View style={styles.inputRow}>
              <View style={[styles.inputCol, { flex: 1 ,}]}>
                <Text style={[styles.label, { color: colors.onSurface }]}>Gear Type</Text>
                <TextInput
                  mode="outlined"
                  value={gearType}
                  onChangeText={setGearType}
                  placeholder="Select gear type"
                  right={<TextInput.Icon icon="magnify" />}
                  style={[styles.input,]}
                  outlineColor={colors.outline}
                  activeOutlineColor={colors.primary}
                  dense
                />
              </View>

              <View style={{ width: p(12) }} />

              <View style={[styles.inputCol, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.onSurface }]}>Name</Text>
                <TextInput
                  mode="outlined"
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter gear name"
                  style={styles.input}
                  outlineColor={colors.outline}
                  activeOutlineColor={colors.primary}
                  dense
                />
              </View>
            </View>

            {/* Fire Fighter & Manufacturer side-by-side in landscape, stacked in portrait */}
            <View style={[styles.inputRow, { marginTop: p(8), alignItems: 'flex-start', gap: p(6) }]}>
              <View style={[styles.inputCol, isLandscape ? { flex: 1 } : { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.onSurface }]}>Fire Fighter</Text>
                {renderSelectedRosterCard()}
                {!assignedRoster && (
                  <TextInput
                    mode="outlined"
                    value=""
                    placeholder="Search fire fighter..."
                    onFocus={() => setRosterModalVisible(true)}
                    style={[styles.input, { marginTop: p(6) }]}
                    right={<TextInput.Icon icon="magnify" />}
                    dense
                  />
                )}
              </View>

              <View style={{ width: isLandscape ? p(12) : 0, height: isLandscape ? undefined : p(12) }} />

              <View style={[styles.inputCol, isLandscape ? { flex: 1 } : { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.onSurface }]}>Manufacturer</Text>
                {renderSelectedManufacturerCard()}
                {!manufacturer && (
                  <TextInput
                    mode="outlined"
                    value=""
                    placeholder="Select manufacturer..."
                    onFocus={() => setManufacturerModalVisible(true)}
                    style={[styles.input, { marginTop: p(6) }]}
                    right={<TextInput.Icon icon="magnify" />}
                    dense
                  />
                )}
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: p(10) }}>
              {/* Barcode Input */}
              <View style={{ flex: 1 }}>
                <View style={{ marginTop: p(10) }}>
                  <Text style={[styles.label, { color: colors.onSurface }]}>Barcode</Text>
                  <TextInput
                    mode="outlined"
                    value={barcode}
                    onChangeText={setBarcode}
                    placeholder="Scan or enter barcode"
                    right={<TextInput.Icon icon="barcode-scan" />}
                    style={styles.input}
                    outlineColor={colors.outline}
                    activeOutlineColor={colors.primary}
                    dense
                  />
                </View>
              </View>


              <View style={{ flex: 1 }}>
                <View style={{ marginTop: p(10) }}>
                  <Text style={[styles.label, { color: colors.onSurface }]}>Date of Manufacture (dd-mm-yyyy)</Text>
                    <CommonDatePicker
                      value={dateOfManufacture}
                      onChange={setDateOfManufacture}
                      mode="date"
                      placeholder="Select manufacturing date"
                    />
                </View>
              </View>
            </View>


          </Card.Content>
        </Card>

        {/* Manufacturer / Dates & Status area */}
        <View style={isLandscape ? styles.landscapeContainer : undefined}>
          {/* Left column */}
          <View style={isLandscape ? styles.leftColumn : undefined}>
            {/* Manufacturing Date Card - Requirement #5 */}
            {/* <Card style={[styles.card, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Manufacturing Date</Text>
                <Divider style={{ marginVertical: p(8) }} />
                
                <Text style={[styles.label, { color: colors.onSurface, marginBottom: p(6) }]}>
                  Date of Manufacture (dd-mm-yyyy)
                </Text>
                <CommonDatePicker 
                  value={dateOfManufacture} 
                  onChange={setDateOfManufacture} 
                  mode="date" 
                  placeholder="Select manufacturing date"
                  // dateFormat="dd-mm-yyyy" // Ensure this format is used
                />
              </Card.Content>
            </Card> */}

            <Card style={[styles.card, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Gear Images</Text>
                <Divider style={{ marginVertical: p(8) }} />

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FlatList
                    horizontal
                    data={gearImages}
                    keyExtractor={(_, i) => i.toString()}
                    renderItem={({ item }) => (
                      <Image source={item} style={styles.thumb} />
                    )}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: p(12) }}
                  />

                  <Button
                    mode="outlined"
                    compact
                    icon="camera"
                    style={[styles.smallBtn, { marginLeft: p(8) }]}
                    onPress={() => { /* upload */ }}
                  >
                    Upload
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </View>


        </View>

            <View style={{ marginTop: p(12), marginBottom: p(22), marginInline:p(100) }}>
              <Button 
                mode="contained" 
                onPress={handleSave} 
                buttonColor={colors.primary} 
                contentStyle={{ paddingVertical: p(8) }}
                labelStyle={{
                  fontSize: p(16),
                  fontWeight: '600',
                  color: '#fff',
                }}
              >
                Save
              </Button>
            </View>
      </ScrollView>

      {/* Modals */}
      <RosterModal
        visible={rosterModalVisible}
        onClose={() => setRosterModalVisible(false)}
        onRosterSelect={(r: any) => { onRosterSelect(r as RosterItem); setRosterModalVisible(false); }}
        onAddRosterManual={() => { setRosterModalVisible(false); /* navigate to add fire fighter */ }}
      />

      <ManufacturerModal
        visible={manufacturerModalVisible}
        onClose={() => setManufacturerModalVisible(false)}
        onSelect={(mfr: any) => { onManufacturerSelect(mfr as ManufacturerItem); setManufacturerModalVisible(false); }}
      />
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
  headerTitle: { fontSize: p(18), fontWeight: '700', textAlign: 'center', flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  saveBtn: { borderRadius: p(8) },

  content: { flex: 1, padding: p(12) },
  card: { marginBottom: p(12), borderRadius: p(10) },

  cardTitle: { fontSize: p(16), fontWeight: '700' },

  inputRow: { flexDirection: 'row', alignItems: 'center' },
  inputCol: { flex: 1 },
  label: { fontSize: p(13), fontWeight: '600', marginBottom: p(4) },
  input: {  height: p(44) },
  smallBtn: { borderRadius: p(8) },

  selectedItemCard: { borderWidth: 1, borderRadius: p(8), backgroundColor: 'white' },
  selectedItemContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: p(8) },
  selectedItemInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  selectedItemText: { flex: 1, marginLeft: p(10) },
  selectedItemName: { fontSize: p(15), fontWeight: '600' },
  selectedItemSubtitle: { fontSize: p(13), color: '#666' },

  landscapeContainer: { flexDirection: 'row', gap: p(12) },
  leftColumn: { flex: 1, gap: p(12) },
  rightColumn: { flex: 1, gap: p(12) },

  thumb: {
    width: p(70),
    height: p(70),
    borderRadius: p(8),
    marginRight: p(8),
    resizeMode: 'cover',
  },
  smallRow: { flexDirection: 'row', alignItems: 'center' },
  smallCol: { flex: 1 },

  statusSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: p(10),
    height: p(44),
    borderRadius: p(8),
    backgroundColor: 'transparent',
  },
  serviceTypeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: p(10),
    height: p(44),
    borderRadius: p(8),
    backgroundColor: 'transparent',
  },
  statusBadge: { width: p(12), height: p(12), borderRadius: p(6) },
  menuDot: { width: p(10), height: p(10), borderRadius: p(5), marginRight: p(8) },
});

export default AddGearScreen;