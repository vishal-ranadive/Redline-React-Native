import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  PermissionsAndroid,
  PanResponder,
  GestureResponderEvent,
  Animated,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Chip,
  Switch,
  Menu,
  useTheme,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { p } from '../../utils/responsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/common/Header';
import { useLeadStore } from '../../store/leadStore';
import { printTable } from '../../utils/printTable';
import ImageSourcePickerModal from '../../components/common/Modal/ImageSourcePickerModal';
import CameraCaptureModal from '../../components/common/Modal/CameraCaptureModal';
import { launchImageLibrary } from 'react-native-image-picker';
import Svg, { Path } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import { useGearStore } from '../../store/gearStore';

// Updated STATUS_OPTIONS with correct colors and order
const STATUS_OPTIONS = [
  { value: 'PASS', label: 'PASS', color: '#34A853' },
  { value: 'CORRECTIVE_ACTION_REQUIRED', label: 'CORRECTIVE ACTION REQUIRED', color: '#F9A825' },
  { value: 'RECOMMENDED_OOS', label: 'RECOMMENDED OOS', color: '#ff4800ff' },
  { value: 'EXPIRED', label: 'EXPIRED', color: '#EA4335' },
];

// Service types - updated order
const SERVICE_TYPES = [
  { value: 'INSPECTED_AND_CLEANED', label: 'Inspected and Cleaned' },
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

// Load options - 25 loads with vibrant colors
const LOAD_OPTIONS = [
  { value: '1', label: 'Load 1' },
  { value: '2', label: 'Load 2' },
  { value: '3', label: 'Load 3' },
  { value: '4', label: 'Load 4' },
  { value: '5', label: 'Load 5' },
  { value: '6', label: 'Load 6' },
  { value: '7', label: 'Load 7' },
  { value: '8', label: 'Load 8' },
  { value: '9', label: 'Load 9' },
  { value: '10', label: 'Load 10' },
  { value: '11', label: 'Load 11' },
  { value: '12', label: 'Load 12' },
  { value: '13', label: 'Load 13' },
  { value: '14', label: 'Load 14' },
  { value: '15', label: 'Load 15' },
  { value: '16', label: 'Load 16' },
  { value: '17', label: 'Load 17' },
  { value: '18', label: 'Load 18' },
  { value: '19', label: 'Load 19' },
  { value: '20', label: 'Load 20' },
  { value: '21', label: 'Load 21' },
  { value: '22', label: 'Load 22' },
  { value: '23', label: 'Load 23' },
  { value: '24', label: 'Load 24' },
  { value: '25', label: 'Load 25' },
];

// Gear Findings options (renamed from Helmet Findings)
const GEAR_FINDINGS = [
  { value: 'MFR_LABEL_DAMAGED_LOOSE', label: 'Mfr. Info Label Damaged/Loose' },
  { value: 'MFR_LABEL_MISSING_UNREADABLE', label: 'Mfr. Info Label Missing/Unreadable (Critical Fail)' },
  { value: 'GEAR_SHELL_DAMAGED', label: 'Gear Shell Damaged' },
  { value: 'IMPACT_CAP_DAMAGED', label: 'Impact Cap Damaged' },
  { value: 'SUSPENSION_SYSTEM_DAMAGED', label: 'Suspension System Damaged' },
  { value: 'SUSPENSION_SYSTEM_MISSING', label: 'Suspension System Missing (Critical Fail)' },
  { value: 'RATCHETING_STRAP_DAMAGED', label: 'Ratcheting Strap Damaged' },
  { value: 'EAR_COVER_STAINING', label: 'Ear Cover/Shroud Staining' },
  { value: 'EAR_COVER_MISSING', label: 'Ear Cover/Shroud Missing' },
  { value: 'EAR_COVER_DAMAGED', label: 'Ear Cover/Shroud Damaged' },
  { value: 'EYE_PROTECTION_DAMAGED', label: 'Eye Protection Damaged' },
  { value: 'EYE_PROTECTION_MISSING', label: 'Eye Protection Missing (Critical Fail)' },
  { value: 'CHIN_STRAP_DAMAGED', label: 'Chin Strap Damaged' },
  { value: 'CHIN_STRAP_MISSING', label: 'Chin Strap Missing' },
  { value: 'REFLECTIVE_TRIM_DAMAGED_FADED', label: 'Reflective Trim Damaged/Faded' },
  { value: 'REFLECTIVE_TRIM_MISSING', label: 'Reflective Trim Missing' },
  { value: 'D_RING_MISSING_DAMAGED', label: 'D-Ring Missing/Damaged' },
  { value: 'OTHER', label: 'Other' }
];

// Color options with vibrant colors
const COLOR_OPTIONS = [
  { value: 'RED', label: 'Red', color: '#FF4444' },
  { value: 'BLUE', label: 'Blue', color: '#4444FF' },
  { value: 'GREEN', label: 'Green', color: '#44FF44' },
  { value: 'YELLOW', label: 'Yellow', color: '#FFFF44' },
  { value: 'ORANGE', label: 'Orange', color: '#FF8844' },
  { value: 'PURPLE', label: 'Purple', color: '#8844FF' },
  { value: 'PINK', label: 'Pink', color: '#FF44FF' },
  { value: 'CYAN', label: 'Cyan', color: '#44FFFF' },
  { value: 'LIME', label: 'Lime', color: '#88FF44' },
  { value: 'TEAL', label: 'Teal', color: '#44FF88' },
];

type Gear = {
  gear_id: number;
  gear_name: string;
  gear_type: {
    gear_type_id: number,
    gear_type: string
  };
  gear_size: string | null;
  active_status: boolean;
  serial_number: string;
  gear_image_url?: string;
  manufacturing_date: string | null;
  roster?: {
    roster_id: number;
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  firestation: {
    id: number;
    name: string;
  };
  franchise: {
    id: number;
    name: string;
  };
  manufacturer?: {
    manufacturer_id?: number;
    manufacturer_name?: string;
  };
  load?: {
    id: string;
    name: string;
  };
  bin?: {
    id: string;
    name: string;
  };
  remarks?: string;
  hydrotestResult?: string;
  condition?: string;
};

// Custom Dropdown Component
const CustomDropdown = ({ 
  options, 
  selectedValue, 
  onSelect, 
  placeholder, 
  getLabel, 
  style 
}: any) => {
  const [visible, setVisible] = useState(false);
  const { colors } = useTheme();

  return (
    <View style={style}>
      <TouchableOpacity
        style={[styles.dropdownButton, { backgroundColor: colors.surface, borderColor: colors.outline }]}
        onPress={() => setVisible(true)}
      >
        <Text style={[styles.dropdownButtonText, { color: colors.onSurface }]}>
          {selectedValue ? getLabel(selectedValue) : placeholder}
        </Text>
        <IconButton
          icon={visible ? "menu-up" : "menu-down"}
          size={20}
          iconColor={colors.onSurfaceVariant}
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity 
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={[styles.dropdownModal, { backgroundColor: colors.surface }]}>
            <ScrollView style={styles.dropdownScroll}>
              {options.map((option: any) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.dropdownOption,
                    { 
                      backgroundColor: selectedValue === option.value ? colors.primaryContainer : 'transparent',
                      borderBottomColor: colors.outline 
                    }
                  ]}
                  onPress={() => {
                    onSelect(option.value);
                    setVisible(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownOptionText, 
                    { 
                      color: selectedValue === option.value ? colors.onPrimaryContainer : colors.onSurface 
                    }
                  ]}>
                    {getLabel(option.value)}
                  </Text>
                  {selectedValue === option.value && (
                    <IconButton
                      icon="check"
                      size={20}
                      iconColor={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// MultiSelect Modal Component
const MultiSelectModal = ({ 
  visible, 
  onClose, 
  options, 
  selectedValues, 
  onSelectionChange, 
  title 
}: any) => {
  const { colors } = useTheme();

  const toggleSelection = (value: string) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter((v: string) => v !== value)
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
          {options.map((option: any) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.multiSelectOption,
                { 
                  backgroundColor: selectedValues.includes(option.value) 
                    ? colors.primaryContainer 
                    : colors.surface,
                  borderBottomColor: colors.outline
                }
              ]}
              onPress={() => toggleSelection(option.value)}
            >
              <Text style={[
                styles.multiSelectOptionText,
                { 
                  color: selectedValues.includes(option.value) 
                    ? colors.onPrimaryContainer 
                    : colors.onSurface 
                }
              ]}>
                {option.label}
              </Text>
              {selectedValues.includes(option.value) && (
                <IconButton
                  icon="check-circle"
                  size={20}
                  iconColor={colors.primary}
                />
              )}
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



// Color Picker Modal Component
const ColorPickerModal = ({ visible, onClose, selectedColor, onColorSelect }: any) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.colorPickerOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.colorPickerModal, { backgroundColor: colors.surface }]}>
          <View style={styles.colorPickerHeader}>
            <Text style={[styles.colorPickerTitle, { color: colors.onSurface }]}>
              Select Color
            </Text>
            <IconButton
              icon="close"
              size={24}
              onPress={onClose}
              iconColor={colors.onSurface}
            />
          </View>
          
          <View style={styles.colorGrid}>
            {COLOR_OPTIONS.map((colorOption) => (
              <TouchableOpacity
                key={colorOption.value}
                style={[
                  styles.colorCircle,
                  { 
                    backgroundColor: colorOption.color,
                    borderColor: selectedColor === colorOption.value ? colors.primary : 'transparent',
                    borderWidth: 3,
                  }
                ]}
                onPress={() => {
                  onColorSelect(colorOption.value);
                  onClose();
                }}
              >
                {selectedColor === colorOption.value && (
                  <IconButton
                    icon="check"
                    size={16}
                    iconColor="#fff"
                    style={styles.colorCheckIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default function UpdateInspectionScreen() {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { currentLead } = useLeadStore();
  const { fetchGearById } = useGearStore();
  
  // State for gear data
  const [gear, setGear] = useState<Gear | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get gear ID from route params
  const gearId = route.params?.gearId;
  
  // Fetch gear data when component mounts or gearId changes
  useEffect(() => {
    const fetchGear = async () => {
      if (!gearId) {
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const response = await fetchGearById(gearId);
        if (response) {
          printTable("responsefetchGearById", response);
          // @ts-ignore
          setGear(response);
        } else {
          setError('Failed to fetch gear data');
        }
      } catch (err) {
        setError('Error fetching gear data');
        console.error('Error fetching gear:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGear();
  }, [gearId]);

  // Local editable state
  const [status, setStatus] = useState('PASS');
  const [serviceType, setServiceType] = useState('INSPECTED_AND_CLEANED');
  const [harnessType, setHarnessType] = useState('CLASS_3');
  const [size, setSize] = useState(gear?.gear_size ?? 'L');
  const [selectedGearFindings, setSelectedGearFindings] = useState<string[]>([]);
  const [serialNumber, setSerial] = useState(gear?.serial_number ?? '');
  const [hydroPerformed, setHydroPerformed] = useState(false);
  const [hydroResult, setHydroResult] = useState<string | undefined>(undefined);
  const [repairNeeded, setRepairNeeded] = useState(false);
  const [cost, setCost] = useState<string>('0');
  const [remarks, setRemarks] = useState<string>(gear?.remarks ?? '');
  const [selectedLoad, setSelectedLoad] = useState('1');

  const [selectedColor, setSelectedColor] = useState('RED');
const [colorPickerVisible, setColorPickerVisible] = useState(false);
  
  // Modal states
  const [gearFindingsModalVisible, setGearFindingsModalVisible] = useState(false);
  const [isGearInfoCollapsed, setIsGearInfoCollapsed] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Multiple images state
  const [images, setImages] = useState<string[]>([]);

  // Update form fields when gear data loads
  useEffect(() => {
    if (gear) {
      setSize(gear.gear_size || 'L');
      setSerial(gear.serial_number || '');
      setRemarks(gear.remarks || '');
    }
  }, [gear]);

  // Update images when gear image URL is available
  useEffect(() => {
    if (gear?.gear_image_url) {
      setImages([gear.gear_image_url]);
    }
  }, [gear]);

  // Handle scroll for sticky header
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  const saveChanges = () => {
    if (!gear) {
      Alert.alert('Error', 'No gear data available');
      return;
    }

    console.log('Save', { 
      gearId: gear.gear_id,
      status, 
      serviceType, 
      harnessType, 
      size,
      selectedGearFindings,
      hydroPerformed, 
      hydroResult, 
      repairNeeded, 
      cost, 
      remarks,
      selectedLoad
    });
    
    // navigation.navigate('LeadDetail', { lead: currentLead });
    navigation.navigate('FirefighterFlow');
  };


const getColorLabel = (colorValue: string) => {
  const color = COLOR_OPTIONS.find(option => option.value === colorValue);
  return color?.label || 'Select Color';
};

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

  const getLoadLabel = (loadValue: string) => {
    const load = LOAD_OPTIONS.find(option => option.value === loadValue);
    return load?.label || 'Select Load';
  };

  const getSelectedGearFindingsLabels = () => {
    return selectedGearFindings.map(finding => {
      const found = GEAR_FINDINGS.find(option => option.value === finding);
      return found?.label || finding;
    });
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header 
          title="Update Gear Status"
          showBackButton={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading gear data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error && !gear) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header 
          title="Update Gear Status"
          showBackButton={true}
        />
        <View style={styles.errorContainer}>
          <IconButton
            icon="alert-circle-outline"
            size={48}
            iconColor={colors.error}
          />
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
          >
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Don't render main content if no gear data
  if (!gear) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header 
          title="Update Gear Status"
          showBackButton={true}
        />
        <View style={styles.errorContainer}>
          <IconButton
            icon="package-variant-closed"
            size={48}
            iconColor={colors.onSurfaceDisabled}
          />
          <Text style={styles.errorText}>No gear data available</Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
          >
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="Update Gear Status"
        showBackButton={true}
      />

      {/* Sticky Gear Information */}
      <Animated.View 
        style={[
          styles.stickyGearInfo,
          { 
            backgroundColor: colors.surface,
            transform: [{
              translateY: scrollY.interpolate({
                inputRange: [0, 100],
                outputRange: [0, -100],
                extrapolate: 'clamp'
              })
            }]
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.gearInfoHeader}
          onPress={() => setIsGearInfoCollapsed(!isGearInfoCollapsed)}
        >
          <View style={styles.gearInfoLeft}>
            <View style={styles.rosterAvatar}>
              <IconButton
                icon="account"
                size={24}
                iconColor={colors.primary}
              />
            </View>
            <View style={styles.gearInfoText}>
              <Text style={[styles.gearInfoName, { color: colors.onSurface }]}>
                {gear?.roster ? `${gear.roster.first_name} ${gear.roster.last_name}` : 'Unassigned'}
              </Text>
              <Text style={[styles.gearInfoDetail, { color: colors.onSurfaceVariant }]}>
                {gear.gear_type.gear_type} • {gear.serial_number}
              </Text>
            </View>
          </View>
          <IconButton
            icon={isGearInfoCollapsed ? "chevron-down" : "chevron-up"}
            size={20}
            iconColor={colors.onSurfaceVariant}
          />
        </TouchableOpacity>

        {!isGearInfoCollapsed && (
          <View style={styles.expandedGearInfo}>
            <View style={styles.gearInfoRow}>
              <View style={styles.gearInfoColumn}>
                <Text style={[styles.gearInfoLabel, { color: colors.onSurfaceVariant }]}>Firefighter</Text>
                <Text style={[styles.gearInfoValue, { color: colors.onSurface }]}>
                  {gear?.roster ? `${gear.roster.first_name} ${gear.roster.middle_name} ${gear.roster.last_name}` : 'Not assigned'}
                </Text>
                <Text style={[styles.gearInfoValue, { color: colors.onSurface }]}>
                  {gear?.roster?.email || '-'}
                </Text>
                <Text style={[styles.gearInfoValue, { color: colors.onSurface }]}>
                  {gear?.roster?.phone || '-'}
                </Text>
              </View>
              
              <View style={styles.gearInfoColumn}>
                <Text style={[styles.gearInfoLabel, { color: colors.onSurfaceVariant }]}>Gear Details</Text>
                <Text style={[styles.gearInfoValue, { color: colors.onSurface }]}>
                  Type: {gear.gear_type.gear_type}
                </Text>
                <Text style={[styles.gearInfoValue, { color: colors.onSurface }]}>
                  Serial: {gear.serial_number}
                </Text>
                <Text style={[styles.gearInfoValue, { color: colors.onSurface }]}>
                  Manufacturer: {gear.manufacturer?.manufacturer_name || '-'}
                </Text>
                <Text style={[styles.gearInfoValue, { color: colors.onSurface }]}>
                  Station: {gear.firestation.name}
                </Text>
              </View>
            </View>
          </View>
        )}
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Error banner */}
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.errorContainer }]}>
            <IconButton
              icon="alert-circle"
              size={20}
              iconColor={colors.error}
            />
            <Text style={[styles.errorBannerText, { color: colors.error }]}>
              {error}
            </Text>
          </View>
        )}

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
              <CustomDropdown
                options={SERVICE_TYPES}
                selectedValue={serviceType}
                onSelect={setServiceType}
                placeholder="Select Service Type"
                getLabel={getServiceTypeLabel}
                style={styles.dropdownContainer}
              />

              <Text style={styles.fieldLabel}>Harness Type</Text>
              <CustomDropdown
                options={HARNESS_TYPES}
                selectedValue={harnessType}
                onSelect={setHarnessType}
                placeholder="Select Harness Type"
                getLabel={getHarnessTypeLabel}
                style={styles.dropdownContainer}
              />

              <Text style={styles.fieldLabel}>Size</Text>
              <CustomDropdown
                options={SIZE_OPTIONS}
                selectedValue={size}
                onSelect={setSize}
                placeholder="Select Size"
                getLabel={getSizeLabel}
                style={styles.dropdownContainer}
              />

              <Text style={styles.fieldLabel}>Gear Findings</Text>
              <TouchableOpacity
                style={[styles.gearFindingsButton, { backgroundColor: colors.surface, borderColor: colors.outline }]}
                onPress={() => setGearFindingsModalVisible(true)}
              >
                <Text style={[styles.gearFindingsButtonText, { color: colors.onSurface }]}>
                  {selectedGearFindings.length > 0 
                    ? `${selectedGearFindings.length} findings selected` 
                    : 'Select Gear Findings'
                  }
                </Text>
                <IconButton
                  icon="chevron-right"
                  size={20}
                  iconColor={colors.onSurfaceVariant}
                />
              </TouchableOpacity>

              {/* Show selected gear findings */}
              {selectedGearFindings.length > 0 && (
                <View style={styles.selectedFindingsContainer}>
                  {getSelectedGearFindingsLabels().slice(0, 2).map((label, index) => (
                    <Chip
                      key={index}
                      style={[styles.findingChip, { backgroundColor: colors.primaryContainer }]}
                      textStyle={{ color: colors.onPrimaryContainer, fontSize: p(10) }}
                      onClose={() => {
                        const newFindings = [...selectedGearFindings];
                        newFindings.splice(index, 1);
                        setSelectedGearFindings(newFindings);
                      }}
                    >
                      {label.length > 30 ? label.substring(0, 30) + '...' : label}
                    </Chip>
                  ))}
                  {selectedGearFindings.length > 2 && (
                    <Chip
                      style={[styles.findingChip, { backgroundColor: colors.secondaryContainer }]}
                      textStyle={{ color: colors.onSecondaryContainer, fontSize: p(10) }}
                    >
                      +{selectedGearFindings.length - 2} more
                    </Chip>
                  )}
                </View>
              )}

              <View style={styles.rowSpace}>
                <Text style={styles.fieldLabel}>Hydro Test Performed</Text>
                <Switch value={hydroPerformed} onValueChange={setHydroPerformed} />
              </View>

              {hydroPerformed && (
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
              )}

              <Text style={styles.fieldLabel}>Select Load</Text>
              <CustomDropdown
                options={LOAD_OPTIONS}
                selectedValue={selectedLoad}
                onSelect={setSelectedLoad}
                placeholder="Select Load"
                getLabel={getLoadLabel}
                style={styles.dropdownContainer}
              />

              {/* Show selected load with color */}
              {/* {selectedLoad && (
                <View style={styles.selectedLoadContainer}>
                  <Text style={[styles.fieldLabel, { marginBottom: 4 }]}>Selected Load:</Text>
                  <View style={[styles.loadColorBox, { backgroundColor: "red"} ]}>
                    <Text style={styles.loadColorText}>{getLoadLabel(selectedLoad)}</Text>
                  </View>
                </View>
              )} */}
            </View>



            <View style={[styles.card, { backgroundColor: colors.surface, marginTop: 12 }]}>


              <Text style={styles.fieldLabel}>Color</Text>
<TouchableOpacity
  style={[styles.colorPickerButton, { backgroundColor: colors.surface, borderColor: colors.outline }]}
  onPress={() => setColorPickerVisible(true)}
>
  <View style={styles.colorPickerButtonContent}>
    <View style={[styles.selectedColorCircle, { backgroundColor: COLOR_OPTIONS.find(c => c.value === selectedColor)?.color }]} />
    <Text style={[styles.colorPickerButtonText, { color: colors.onSurface }]}>
      {getColorLabel(selectedColor)}
    </Text>
  </View>
  <IconButton
    icon="chevron-right"
    size={20}
    iconColor={colors.onSurfaceVariant}
  />
</TouchableOpacity>
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

          {/* Repair & Cost column - Only show when status is CORRECTIVE_ACTION_REQUIRED */}
          {status === 'CORRECTIVE_ACTION_REQUIRED' && (
            <View style={styles.col}>
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <Text style={styles.cardTitle}>Repair & Cost</Text>

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
              </View>
            </View>
          )}
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

      {/* Gear Findings MultiSelect Modal */}
      <MultiSelectModal
        visible={gearFindingsModalVisible}
        onClose={() => setGearFindingsModalVisible(false)}
        options={GEAR_FINDINGS}
        selectedValues={selectedGearFindings}
        onSelectionChange={setSelectedGearFindings}
        title="Gear Findings"
      />
<ColorPickerModal
  visible={colorPickerVisible}
  onClose={() => setColorPickerVisible(false)}
  selectedColor={selectedColor}
  onColorSelect={setSelectedColor}
/>

      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: p(40) },
  
  // Loading and error styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: p(16),
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: p(16),
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    marginTop: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginTop: 8,
    borderRadius: 8,
    padding: 12,
  },
  errorBannerText: {
    flex: 1,
    fontSize: p(12),
    marginLeft: 8,
  },

  // Sticky Gear Information
  stickyGearInfo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderBottomWidth: 1,
  },
  gearInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  gearInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rosterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gearInfoText: {
    flex: 1,
  },
  gearInfoName: {
    fontSize: p(16),
    fontWeight: '600',
    marginBottom: 2,
  },
  gearInfoDetail: {
    fontSize: p(12),
  },
  expandedGearInfo: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  gearInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gearInfoColumn: {
    flex: 1,
  },
  gearInfoLabel: {
    fontSize: p(12),
    fontWeight: '600',
    marginBottom: 4,
  },
  gearInfoValue: {
    fontSize: p(14),
    marginBottom: 2,
  },

  // Form styles
  row: { 
    flexDirection: 'row', 
    paddingHorizontal: 14, 
    marginTop: 120, // Space for sticky header
  },
  col: { flex: 1 },

  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { 
    fontSize: p(16), 
    fontWeight: '700', 
    marginBottom: 16 
  },

  fieldLabel: { 
    fontSize: p(14), 
    fontWeight: '600', 
    marginBottom: 8 
  },
  input: { marginBottom: 12 },
  rowSpace: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 16 
  },
  rowWrap: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8 
  },
  choiceChip: { 
    marginRight: 6, 
    marginBottom: 6 
  },
  smallChoice: { 
    marginRight: 6 
  },

  // Dropdown styles
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 48,
  },
  dropdownButtonText: {
    fontSize: p(14),
    flex: 1,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    width: '80%',
    maxHeight: '60%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 400,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownOptionText: {
    fontSize: p(14),
    flex: 1,
  },

  // Gear Findings styles
  gearFindingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
    marginBottom: 12,
  },
  gearFindingsButtonText: {
    fontSize: p(14),
    flex: 1,
  },
  selectedFindingsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  findingChip: {
    marginRight: 6,
    marginBottom: 6,
  },

  // Load styles
  selectedLoadContainer: {
    marginTop: 8,
  },
  loadColorBox: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  loadColorText: {
    fontSize: p(14),
    fontWeight: '600',
    color: '#fff',
  },

  // MultiSelect Modal styles
  multiSelectContainer: {
    flex: 1,
  },
  multiSelectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  multiSelectTitle: {
    fontSize: p(18),
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  multiSelectOptionText: {
    fontSize: p(14),
    flex: 1,
  },
  multiSelectFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  multiSelectDoneButton: {
    width: '100%',
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 18,
    marginTop: 12,
  },

  //

  // Color Picker Styles
colorPickerButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderWidth: 1,
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 12,
  minHeight: 48,
  marginBottom: 16,
},
colorPickerButtonContent: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
},
selectedColorCircle: {
  width: 24,
  height: 24,
  borderRadius: 12,
  marginRight: 12,
},
colorPickerButtonText: {
  fontSize: p(14),
  flex: 1,
},
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
},
colorPickerHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 16,
},
colorPickerTitle: {
  fontSize: p(18),
  fontWeight: '700',
  flex: 1,
},
colorGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: 12,
},
colorCircle: {
  width: 50,
  height: 50,
  borderRadius: 25,
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
},
colorCheckIcon: {
  margin: 0,
},
});