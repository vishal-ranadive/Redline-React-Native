import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Modal } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Chip,
  Switch,
  Menu,
  Divider,
  useTheme,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { p } from '../../utils/responsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/common/Header';
import CommonDatePicker from '../../components/common/DatePicker';
import { useLeadStore } from '../../store/leadStore';
import { printTable } from '../../utils/printTable';

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

// Harness types
const HARNESS_TYPES = [
  { value: 'CLASS_2', label: 'Class 2 - Chest Harness' },
  { value: 'CLASS_3', label: 'Class 3 - Full Body Harness' },
  { value: 'CLASS_4', label: 'Class 4 - Suspension Harness' },
  { value: 'RESCUE', label: 'Rescue Harness' },
  { value: 'TACTICAL', label: 'Tactical Harness' },
];

// Size options
const SIZE_OPTIONS = [
  { value: 'XS', label: 'XS' },
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
  { value: 'XL', label: 'XL' },
  { value: 'XXL', label: 'XXL' },
  { value: 'ONE_SIZE', label: 'One Size' },
];

// Helmet Findings options
const HELMET_FINDINGS = [
  { value: 'SCRATCHED_VISOR', label: 'Scratched or fogged visor' },
  { value: 'CHIN_STRAP_DAMAGED', label: 'Chin strap frayed or damaged' },
  { value: 'REFLECTIVE_TRIM_MISSING', label: 'Reflective trim peeling or missing' },
  { value: 'HELMET_SHELL_DAMAGED', label: 'Helmet shell scratched or dented' },
  { value: 'PADDING_WORN', label: 'Interior padding worn or loose' },
  { value: 'NECK_PROTECTOR_DAMAGED', label: 'Neck protector torn or partially detached' },
];

type Gear = {
  id: string;
  name: string;
  type: string;
  status: string;
  isHydrotestPerformed: boolean;
  roster: { 
    id: number; 
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  firestation: {
    id: string;
    name: string;
  };
  franchise: {
    id: string;
    name: string;
  };
  manufacturer: {
    manufacturer_id: string;
    manufacturer_name: string;
  };
  load: {
    id: string;
    name: string;
  };
  bin: {
    id: string;
    name: string;
  };
  gear_type: string;
  gear_size: string;
  remarks?: string;
  imageUrl?: string;
  serialNumber?: string;
  date?: string;
  hydrotestResult?: string;
  condition?: string;
};

export default function UpdateInspectionScreen() {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { currentLead } = useLeadStore()
  
  // Dummy gear data with all required information
  const gear: Gear = {
    id: 'G001',
    name: 'Fire Helmet Pro',
    type: 'Helmet',
    status: 'PASS',
    isHydrotestPerformed: false,
    roster: {
      id: 1,
      name: 'John M Doe',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@firestation.com',
      phone: '555-123-4567'
    },
    firestation: {
      id: 'FS001',
      name: 'Central Fire Station'
    },
    franchise: {
      id: 'FR001',
      name: 'Beta Motors Franchise - test'
    },
    manufacturer: {
      manufacturer_id: 'M001',
      manufacturer_name: 'Fire Safety Equipment Inc.'
    },
    load: {
      id: 'L001',
      name: 'Engine 1 - Primary Response'
    },
    bin: {
      id: 'B001',
      name: 'Helmet Storage Bin A'
    },
    gear_type: 'Helmet',
    gear_size: 'L',
    remarks: 'Minor scratches on visor',
    imageUrl: 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
    serialNumber: 'SN-FH-001-2024',
    date: '2025-11-15',
    condition: 'Used - Good'
  };

  // Local editable state
  const [status, setStatus] = useState(gear?.status ?? 'PASS');
  const [serviceType, setServiceType] = useState('CLEANED_AND_INSPECTED');
  const [harnessType, setHarnessType] = useState('CLASS_3');
  const [size, setSize] = useState(gear?.gear_size ?? 'L');
  const [helmetFinding, setHelmetFinding] = useState('');
  const [serialNumber, setSerial] = useState(gear?.serialNumber ?? 'SN-FH-001-2024');
  
  const [hydroPerformed, setHydroPerformed] = useState(!!gear?.isHydrotestPerformed);
  const [hydroResult, setHydroResult] = useState<string | undefined>(gear?.hydrotestResult);
  const [startDate, setStartDate] = useState<string>(gear?.date ?? '2025-11-15');
  const [endDate, setEndDate] = useState<string>('2025-11-20');
  const [condition, setCondition] = useState<string | undefined>(gear?.condition ?? 'Used - Good');
  const [repairNeeded, setRepairNeeded] = useState(false);
  const [cost, setCost] = useState<string>('125.00');
  const [remarks, setRemarks] = useState<string>(gear?.remarks ?? 'Minor scratches on visor');
  
  // Multiple images state
  const [images, setImages] = useState([
    'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
    'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
    'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
    'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg'
  ]);

  // Modal state for image preview
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  // Menu states
  const [serviceMenuVisible, setServiceMenuVisible] = useState(false);
  const [harnessMenuVisible, setHarnessMenuVisible] = useState(false);
  const [sizeMenuVisible, setSizeMenuVisible] = useState(false);
  const [helmetFindingMenuVisible, setHelmetFindingMenuVisible] = useState(false);

  const saveChanges = () => {
    // TODO: persist changes to backend / store
    console.log('Save', { 
      status, 
      serviceType, 
      harnessType, 
      size,
      helmetFinding,
      hydroPerformed, 
      hydroResult, 
      startDate, 
      endDate, 
      condition, 
      repairNeeded, 
      cost, 
      remarks 
    });
    
    let item = {        
      id: '423456',
      name: 'Emma Scott',
      phone: '555-444-4567',
      email: 'emma.scott@gmail.com',
      station: 'Community Volunteer Fire Department',
      status: 'Scheduled',
      leadType: 'Inspection',
      technicianDetails: [{ name: 'Mike Ross', id: 'T004' }],
      department: 'Community Volunteer Fire Department',
      appointmentDate: '12 Nov 2025',
    }
    
    
    navigation.navigate('LeadDetail', {lead : currentLead});
  };
  // printTable("currentLead-updateStatuspage",currentLead)

  const getStatusColor = (statusValue: string) => {
    const statusOption = STATUS_OPTIONS.find(option => option.value === statusValue);
    return statusOption?.color || '#666';
  };

  const getServiceTypeLabel = (serviceValue: string) => {
    const service = SERVICE_TYPES.find(option => option.value === serviceValue);
    return service?.label || 'Select Service Type';
  };

  const getHarnessTypeLabel = (harnessValue: string) => {
    const harness = HARNESS_TYPES.find(option => option.value === harnessValue);
    return harness?.label || 'Select Harness Type';
  };

  const getSizeLabel = (sizeValue: string) => {
    const sizeOption = SIZE_OPTIONS.find(option => option.value === sizeValue);
    return sizeOption?.label || 'Select Size';
  };

  const getHelmetFindingLabel = (findingValue: string) => {
    const finding = HELMET_FINDINGS.find(option => option.value === findingValue);
    return finding?.label || 'Select Helmet Finding';
  };

  const handleImagePress = (imageUri: string) => {
    setSelectedImage(imageUri);
    setModalVisible(true);
  };

  const addNewImage = () => {
    // In a real app, this would open the image picker
    const newImage = 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg';
    setImages(prev => [...prev, newImage]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        <Header 
          title="Update Gear Status"
          showBackButton={true}
        />

        {/* Top summary */}
        <View style={[styles.topCard, { backgroundColor: colors.surface }]}>
          <View style={styles.topLeft}>
            <Text style={styles.smallLabel}>Gear Information</Text>
            <Text style={styles.infoText}>Type: {gear.gear_type}</Text>
            <Text style={styles.infoText}>Serial: {serialNumber}</Text>
            <Text style={styles.infoText}>Manufacturer: {gear.manufacturer.manufacturer_name}</Text>
          </View>

          <View style={styles.topRight}>
            <Text style={styles.smallLabel}>Current Status</Text>
            <Chip 
              style={[styles.statusChip, { backgroundColor: getStatusColor(status) }]}
              textStyle={{ color: '#fff', fontSize: p(12) }}
            >
              {status}
            </Chip>

            <Text style={[styles.smallLabel, { marginTop: 8 }]}>Assignment</Text>
            <Text style={styles.infoText}>{gear.firestation.name}</Text>
            <Text style={styles.infoText}>Load No: L1</Text>
            <Text style={styles.infoText}>Bin No: B1</Text>
          </View>
        </View>

        {/* Roster Information */}
        <View style={[styles.rosterCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.cardTitle}>Firefighter Information</Text>
          <View style={styles.rosterInfo}>
            <View style={styles.rosterDetail}>
              <Text style={styles.fieldLabel}>Name</Text>
              <Text style={styles.infoText}>{gear.roster.name}</Text>
            </View>
            <View style={styles.rosterDetail}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.infoText}>{gear.roster.email}</Text>
            </View>
            <View style={styles.rosterDetail}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <Text style={styles.infoText}>{gear.roster.phone}</Text>
            </View>
            <View style={styles.rosterDetail}>
              <Text style={styles.fieldLabel}>Franchise</Text>
              <Text style={styles.infoText}>{gear.franchise.name}</Text>
            </View>
          </View>
        </View>

        {/* Main form grid */}
        <View style={styles.row}>
          {/* Details column */}
          <View style={[styles.col, { marginRight: 8 }]}>
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={styles.cardTitle}>Inspection Details</Text>

              <Text style={styles.fieldLabel}>Status</Text>
              <View style={styles.rowWrap}>
                {STATUS_OPTIONS.map((option) => (
                  <Chip
                    key={option.value}
                    selected={status === option.value}
                    onPress={() => setStatus(option.value)}
                    style={[
                      styles.choiceChip,
                      { backgroundColor: status === option.value ? option.color : colors.surfaceVariant }
                    ]}
                    textStyle={{ 
                      color: status === option.value ? '#fff' : colors.onSurfaceVariant,
                      fontSize: p(12)
                    }}
                  >
                    {option.label}
                  </Chip>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Service Type</Text>
              <Menu
                visible={serviceMenuVisible}
                onDismiss={() => setServiceMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setServiceMenuVisible(true)}
                    style={styles.menuButton}
                    contentStyle={styles.menuButtonContent}
                  >
                    {getServiceTypeLabel(serviceType)}
                  </Button>
                }
              >
                {SERVICE_TYPES.map((service) => (
                  <Menu.Item
                    key={service.value}
                    onPress={() => {
                      setServiceType(service.value);
                      setServiceMenuVisible(false);
                    }}
                    title={service.label}
                    titleStyle={{ fontSize: p(14) }}
                  />
                ))}
              </Menu>

              <Text style={styles.fieldLabel}>Harness Type</Text>
              <Menu
                visible={harnessMenuVisible}
                onDismiss={() => setHarnessMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setHarnessMenuVisible(true)}
                    style={styles.menuButton}
                    contentStyle={styles.menuButtonContent}
                  >
                    {getHarnessTypeLabel(harnessType)}
                  </Button>
                }
              >
                {HARNESS_TYPES.map((harness) => (
                  <Menu.Item
                    key={harness.value}
                    onPress={() => {
                      setHarnessType(harness.value);
                      setHarnessMenuVisible(false);
                    }}
                    title={harness.label}
                    titleStyle={{ fontSize: p(14) }}
                  />
                ))}
              </Menu>

              <Text style={styles.fieldLabel}>Size</Text>
              <Menu
                visible={sizeMenuVisible}
                onDismiss={() => setSizeMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setSizeMenuVisible(true)}
                    style={styles.menuButton}
                    contentStyle={styles.menuButtonContent}
                  >
                    {getSizeLabel(size)}
                  </Button>
                }
              >
                {SIZE_OPTIONS.map((sizeOption) => (
                  <Menu.Item
                    key={sizeOption.value}
                    onPress={() => {
                      setSize(sizeOption.value);
                      setSizeMenuVisible(false);
                    }}
                    title={sizeOption.label}
                    titleStyle={{ fontSize: p(14) }}
                  />
                ))}
              </Menu>

              <Text style={styles.fieldLabel}>Helmet Findings</Text>
              <Menu
                visible={helmetFindingMenuVisible}
                onDismiss={() => setHelmetFindingMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setHelmetFindingMenuVisible(true)}
                    style={styles.menuButton}
                    contentStyle={styles.menuButtonContent}
                  >
                    {getHelmetFindingLabel(helmetFinding)}
                  </Button>
                }
              >
                {HELMET_FINDINGS.map((finding) => (
                  <Menu.Item
                    key={finding.value}
                    onPress={() => {
                      setHelmetFinding(finding.value);
                      setHelmetFindingMenuVisible(false);
                    }}
                    title={finding.label}
                    titleStyle={{ fontSize: p(14) }}
                  />
                ))}
              </Menu>

              <View style={styles.rowSpace}>
                <Text style={styles.fieldLabel}>Hydro Test Performed</Text>
                <Switch value={hydroPerformed} onValueChange={setHydroPerformed} />
              </View>

                            <View style={styles.rowSpace}>
                <Text style={styles.fieldLabel}>Hydro Test Result</Text>
                <View style={styles.rowWrap}>
                  <Chip
                    selected={hydroResult === 'Pass'}
                    onPress={() => setHydroResult('Pass')}
                    style={[
                      styles.smallChoice,
                      { 
                        backgroundColor: hydroResult === 'Pass' ? '#34A853' : colors.surfaceVariant 
                      }
                    ]}
                    textStyle={{ 
                      color: hydroResult === 'Pass' ? '#fff' : colors.onSurfaceVariant,
                      fontSize: p(12)
                    }}
                  >
                    Pass
                  </Chip>
                  <Chip
                    selected={hydroResult === 'Fail'}
                    onPress={() => setHydroResult('Fail')}
                    style={[
                      styles.smallChoice,
                      { 
                        backgroundColor: hydroResult === 'Fail' ? '#EA4335' : colors.surfaceVariant 
                      }
                    ]}
                    textStyle={{ 
                      color: hydroResult === 'Fail' ? '#fff' : colors.onSurfaceVariant,
                      fontSize: p(12)
                    }}
                  >
                    Fail
                  </Chip>
                </View>
              </View>


              <View style={{ flex: 1 }}>
                <View style={{ marginTop: p(10) }}>
                  <Text style={styles.fieldLabel}>Start Date</Text>
                  <CommonDatePicker
                    value={startDate}
                    onChange={setStartDate}
                    mode="date"
                    placeholder="Select start date"
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ marginTop: p(10) }}>
                  <Text style={styles.fieldLabel}>End Date</Text>
                  <CommonDatePicker
                    value={endDate}
                    onChange={setEndDate}
                    mode="date"
                    placeholder="Select end date"
                  />
                </View>
              </View>
            </View>

            {/* Remarks */}
            <View style={[styles.card, { backgroundColor: colors.surface, marginTop: 12 }]}>
              <Text style={styles.cardTitle}>Remarks</Text>
              <TextInput
                mode="outlined"
                placeholder="Add notes or remarks..."
                value={remarks}
                onChangeText={setRemarks}
                multiline
                numberOfLines={4}
                style={{ minHeight: 90, fontSize: p(14) }}
              />
            </View>
          </View>

          {/* Condition & Repair column */}
          <View style={styles.col}>
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={styles.cardTitle}>Condition & Repair</Text>


              <Text style={styles.fieldLabel}>Cost (USD)</Text>
              <TextInput
                mode="outlined"
                placeholder="$0.00"
                value={cost}
                keyboardType="numeric"
                onChangeText={setCost}
                style={[styles.input, { fontSize: p(14) }]}
                left={<TextInput.Affix text="$" />}
              />

              <View style={[styles.rowSpace, { marginTop: 8 }]}>
                <Text style={styles.fieldLabel}>Redline Repair</Text>
                <View style={styles.rowWrap}>
                  <Chip 
                    selected={repairNeeded === true} 
                    onPress={() => setRepairNeeded(true)} 
                    style={[
                      styles.smallChoice,
                      { 
                        backgroundColor: repairNeeded === true ? '#EA4335' : colors.surfaceVariant 
                      }
                    ]}
                    textStyle={{ 
                      color: repairNeeded === true ? '#fff' : colors.onSurfaceVariant,
                      fontSize: p(12)
                    }}
                  >
                    Yes
                  </Chip>
                  <Chip 
                    selected={repairNeeded === false} 
                    onPress={() => setRepairNeeded(false)} 
                    style={[
                      styles.smallChoice,
                      { 
                        backgroundColor: repairNeeded === false ? '#34A853' : colors.surfaceVariant 
                      }
                    ]}
                    textStyle={{ 
                      color: repairNeeded === false ? '#fff' : colors.onSurfaceVariant,
                      fontSize: p(12)
                    }}
                  >
                    No
                  </Chip>
                </View>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Condition</Text>
              <TextInput
                mode="outlined"
                placeholder="Used / New / Damaged"
                value={condition}
                onChangeText={setCondition}
                style={[styles.input, { fontSize: p(14) }]}
              />

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Gear Images</Text>
              <View style={styles.imagesContainer}>
                {images.map((imageUri, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.imageBox}
                    onPress={() => handleImagePress(imageUri)}
                  >
                    <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity 
                  style={[styles.imageBox, styles.addImageBox]}
                  onPress={addNewImage}
                >
                  <Text style={styles.addImageText}>+</Text>
                  <Text style={styles.addImageLabel}>Add Image</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button 
            mode="text" 
            onPress={() => navigation.goBack()} 
            style={{ marginRight: 12 }}
            labelStyle={{ fontSize: p(14) }}
          >
            Cancel
          </Button>
          <Button 
            mode="contained" 
            onPress={saveChanges}
            labelStyle={{ fontSize: p(14) }}
          >
            Save Changes
          </Button>
        </View>
      </ScrollView>

      {/* Image Preview Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalBackground}
            onPress={() => setModalVisible(false)}
            activeOpacity={1}
          >
            <Image source={{ uri: selectedImage }} style={styles.enlargedImage} />
          </TouchableOpacity>
          <Button 
            mode="contained" 
            onPress={() => setModalVisible(false)}
            style={styles.closeButton}
          >
            Close
          </Button>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginBottom: p(40) },
  title: { fontSize: p(18), fontWeight: 'bold' },
  statusBadge: {
    alignSelf: 'center',
    fontSize: p(20),
    fontWeight: '700',
    paddingHorizontal: p(6),
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  topCard: {
    marginHorizontal: 14,
    marginTop: 8,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    elevation: 1,
  },
  rosterCard: {
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 8,
    padding: 12,
    elevation: 1,
  },
  rosterInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  rosterDetail: {
    width: '48%',
    marginBottom: 8,
  },
  topLeft: {},
  topRight: { alignItems: 'flex-end' },
  smallLabel: { fontSize: p(12), color: '#666', marginBottom: 4 },
  infoText: { fontSize: p(14), fontWeight: '600', marginBottom: 2 },
  statusChip: { marginTop: 4 },

  row: { flexDirection: 'row', paddingHorizontal: 14, marginTop: 12 },
  col: { flex: 1 },

  card: {
    borderRadius: 8,
    padding: 12,
  },
  cardTitle: { fontSize: p(16), fontWeight: '700', marginBottom: 12 },

  fieldLabel: { fontSize: p(14), fontWeight: '700', marginBottom: 6 },
  input: { marginBottom: 12 },
  menuButton: { marginBottom: 12 },
  menuButtonContent: { justifyContent: 'space-between' },
  rowSpace: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceChip: { marginRight: 6, marginBottom: 6 },
  smallChoice: { marginRight: 6 },

  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  imageBox: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  addImageBox: {
    backgroundColor: '#f6f6f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  addImageText: {
    fontSize: p(20),
    color: '#666',
    fontWeight: 'bold',
  },
  addImageLabel: {
    fontSize: p(10),
    color: '#666',
    marginTop: 4,
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 18,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enlargedImage: {
    width: '90%',
    height: '70%',
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
});