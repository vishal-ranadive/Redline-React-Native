
// src/screens/inspectionscreens/UpdateInspectionScreen.tsx
import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  TouchableOpacity,

  Keyboard,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Chip,
  Switch,
  useTheme,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/common/Header';
import Input from '../../components/Input';
import { useLeadStore } from '../../store/leadStore';
import { printTable } from '../../utils/printTable';
import ImageSourcePickerModal from '../../components/common/Modal/ImageSourcePickerModal';
import CameraCaptureModal from '../../components/common/Modal/CameraCaptureModal';
import { launchImageLibrary } from 'react-native-image-picker';
import Svg, { Path } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import { useGearStore } from '../../store/gearStore';
import { 
  InspectionHeader,
  StatusSelection,
  ServiceTypeSelection,
  SpecializedCleaningFields,
  RepairCostFields,
} from './components';
import { CustomDropdown, MultiSelectModal, ColorPickerModal } from '../../components/common';
import { INSPECTION_CONSTANTS } from '../../constants/inspection';
import {p} from "../../utils/responsive"
// Gear Findings options
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

export default function UpdateInspectionScreen() {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { fetchGearById } = useGearStore();
  
  // State for gear data
  const [gear, setGear] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState(gear?.gear_size ?? 'L');
  const [serialNumber, setSerial] = useState(gear?.serial_number ?? '');
  const [remarks, setRemarks] = useState<string>(gear?.remarks ?? '');


  // Form state
  const [formData, setFormData] = useState({
    status: 'PASS',
    serviceType: 'INSPECTED_AND_CLEANED',
    harnessType: 'CLASS_3',
    size: 'L',
    selectedGearFindings: [] as string[],
    serialNumber: '',
    hydroPerformed: false,
    hydroResult: undefined as string | undefined,
    repairNeeded: false,
    cost: '0',
    remarks: '',
    selectedLoad: '1',
    selectedColor: 'RED',
    whySpecializedCleaning: '',
    howSpecializedCleaning: '',
  });

  // UI state
  // const [isGearInfoCollapsed, setIsGearInfoCollapsed] = useState(false);
  // const [gearFindingsModalVisible, setGearFindingsModalVisible] = useState(false);
  // const [colorPickerVisible, setColorPickerVisible] = useState(false);
  // const scrollY = useRef(new Animated.Value(0)).current;

  // Get gear ID from route params
  const gearId = route.params?.gearId;
  
  // Fetch gear data
  useEffect(() => {
    const fetchGear = async () => {
      if (!gearId) return;

      setLoading(true);
      setError(null);
      
      try {
        const response = await fetchGearById(gearId);
        if (response) {
          printTable("responsefetchGearById", response);
          setGear(response);
          // Initialize form with gear data
          setFormData(prev => ({
            ...prev,
            size: response.gear_size || 'L',
            serialNumber: response.serial_number || '',
            // @ts-ignore
            remarks: response.remarks || '',
          }));
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

  // Helper functions
  const getHarnessTypeLabel = (harnessValue: string) => {
    const harness = INSPECTION_CONSTANTS.HARNESS_TYPES.find(option => option.value === harnessValue);
    return harness?.label || 'Select Harness Type';
  };

  const getSizeLabel = (sizeValue: string) => {
    const sizeOption = INSPECTION_CONSTANTS.SIZE_OPTIONS.find(option => option.value === sizeValue);
    return sizeOption?.label || 'Select Size';
  };

  const getLoadLabel = (loadValue: string) => {
    const load = INSPECTION_CONSTANTS.LOAD_OPTIONS.find(option => option.value === loadValue);
    return load?.label || 'Select Load';
  };

  const getColorLabel = (colorValue: string) => {
    const color = INSPECTION_CONSTANTS.COLOR_OPTIONS.find(option => option.value === colorValue);
    return color?.label || 'Select Color';
  };

  const getSelectedGearFindingsLabels = () => {
    return formData.selectedGearFindings.map(finding => {
      const found = GEAR_FINDINGS.find(option => option.value === finding);
      return found?.label || finding;
    });
  };

  // Check if gear requires hydro test
  const requiresHydroTest = INSPECTION_CONSTANTS.HYDRO_TEST_GEAR_TYPES.includes(
    gear?.gear_type?.gear_type?.toUpperCase()
  );
  const [selectedColor, setSelectedColor] = useState('RED');
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
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

  // Handle form field changes
  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Update images when gear image URL is available
  useEffect(() => {
    if (gear?.gear_image_url) {
      setImages([gear.gear_image_url]);
    }
  }, [gear]);

  // Track keyboard visibility to adjust bottom padding
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showListener = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideListener = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

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
      ...formData
    });
    
    navigation.navigate('FirefighterFlow');
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* <Header 
          title="Update Gear Status"
          showBackButton={true}
        /> */}
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


      {/* Sticky Gear Information */}
      <InspectionHeader
        gear={gear}
        roster={gear.roster}
        isCollapsed={isGearInfoCollapsed}
        onToggleCollapse={() => setIsGearInfoCollapsed(!isGearInfoCollapsed)}
        scrollY={scrollY}
      />

      <ScrollView 
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: isKeyboardVisible ? p(260) : p(40) }
        ]}
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
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                Inspection Details
              </Text>

              <StatusSelection
                selectedStatus={formData.status}
                onStatusChange={(status) => handleFieldChange('status', status)}
              />

              <ServiceTypeSelection
                selectedServiceType={formData.serviceType}
                onServiceTypeChange={(type) => handleFieldChange('serviceType', type)}
              />

              {/* Specialized Cleaning Fields - Conditionally Rendered */}
              {formData.serviceType === 'SPECIALIZED_CLEANING' && (
                <SpecializedCleaningFields
                  why={formData.whySpecializedCleaning}
                  how={formData.howSpecializedCleaning}
                  onWhyChange={(text) => handleFieldChange('whySpecializedCleaning', text)}
                  onHowChange={(text) => handleFieldChange('howSpecializedCleaning', text)}
                />
              )}

              <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Harness Type</Text>
              <CustomDropdown
                options={INSPECTION_CONSTANTS.HARNESS_TYPES}
                selectedValue={formData.harnessType}
                onSelect={(value) => handleFieldChange('harnessType', value)}
                placeholder="Select Harness Type"
                getLabel={getHarnessTypeLabel}
                style={styles.dropdownContainer}
              />

              <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Size</Text>
              <CustomDropdown
                options={INSPECTION_CONSTANTS.SIZE_OPTIONS}
                selectedValue={formData.size}
                onSelect={(value) => handleFieldChange('size', value)}
                placeholder="Select Size"
                getLabel={getSizeLabel}
                style={styles.dropdownContainer}
              />

              <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Gear Findings</Text>
              <TouchableOpacity
                style={[styles.gearFindingsButton, { backgroundColor: colors.surface, borderColor: colors.outline }]}
                onPress={() => setGearFindingsModalVisible(true)}
              >
                <Text style={[styles.gearFindingsButtonText, { color: colors.onSurface }]}>
                  {formData.selectedGearFindings.length > 0 
                    ? `${formData.selectedGearFindings.length} findings selected` 
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
              {formData.selectedGearFindings.length > 0 && (
                <View style={styles.selectedFindingsContainer}>
                  {getSelectedGearFindingsLabels().slice(0, 2).map((label, index) => (
                    <Chip
                      key={index}
                      style={[styles.findingChip, { backgroundColor: colors.primaryContainer }]}
                      textStyle={{ color: colors.onPrimaryContainer, fontSize: 10 }}
                      onClose={() => {
                        const newFindings = [...formData.selectedGearFindings];
                        newFindings.splice(index, 1);
                        handleFieldChange('selectedGearFindings', newFindings);
                      }}
                    >
                      {label.length > 30 ? label.substring(0, 30) + '...' : label}
                    </Chip>
                  ))}
                  {formData.selectedGearFindings.length > 2 && (
                    <Chip
                      style={[styles.findingChip, { backgroundColor: colors.secondaryContainer }]}
                      textStyle={{ color: colors.onSecondaryContainer, fontSize: 10 }}
                    >
                      +{formData.selectedGearFindings.length - 2} more
                    </Chip>
                  )}
                </View>
              )}

              <View style={styles.rowSpace}>
                <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Hydro Test Performed</Text>
                <Switch 
                  value={formData.hydroPerformed} 
                  onValueChange={(value) => handleFieldChange('hydroPerformed', value)} 
                />
              </View>

              {formData.hydroPerformed && (
                <View style={styles.rowSpace}>
                  <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Hydro Test Result</Text>
                  <View style={styles.rowWrap}>
                    <Chip
                      selected={formData.hydroResult === 'Pass'}
                      onPress={() => handleFieldChange('hydroResult', 'Pass')}
                      style={[
                        styles.smallChoice,
                        { 
                          backgroundColor: formData.hydroResult === 'Pass' ? '#34A853' : colors.surfaceVariant 
                        }
                      ]}
                      textStyle={{ 
                        color: formData.hydroResult === 'Pass' ? '#fff' : colors.onSurfaceVariant,
                        fontSize: 12
                      }}
                    >
                      Pass
                    </Chip>
                    <Chip
                      selected={formData.hydroResult === 'Fail'}
                      onPress={() => handleFieldChange('hydroResult', 'Fail')}
                      style={[
                        styles.smallChoice,
                        { 
                          backgroundColor: formData.hydroResult === 'Fail' ? '#EA4335' : colors.surfaceVariant 
                        }
                      ]}
                      textStyle={{ 
                        color: formData.hydroResult === 'Fail' ? '#fff' : colors.onSurfaceVariant,
                        fontSize: 12
                      }}
                    >
                      Fail
                    </Chip>
                  </View>
                </View>
              )}

              <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Select Load</Text>
              <CustomDropdown
                options={INSPECTION_CONSTANTS.LOAD_OPTIONS}
                selectedValue={formData.selectedLoad}
                onSelect={(value) => handleFieldChange('selectedLoad', value)}
                placeholder="Select Load"
                getLabel={getLoadLabel}
                style={styles.dropdownContainer}
              />

              <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Color</Text>
              <TouchableOpacity
                style={[styles.colorPickerButton, { backgroundColor: colors.surface, borderColor: colors.outline }]}
                onPress={() => setColorPickerVisible(true)}
              >
                <View style={styles.colorPickerButtonContent}>
                  <View style={[styles.selectedColorCircle, { backgroundColor: INSPECTION_CONSTANTS.COLOR_OPTIONS.find(c => c.value === formData.selectedColor)?.color }]} />
                  <Text style={[styles.colorPickerButtonText, { color: colors.onSurface }]}>
                    {getColorLabel(formData.selectedColor)}
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
              <Input
                placeholder="Add notes or remarks..."
                value={formData.remarks}
                onChangeText={(text) => handleFieldChange('remarks', text)}
                multiline
                numberOfLines={4}
                enableVoice
                appendVoiceResults
                style={{ minHeight: 90, fontSize: p(14) }}
                containerStyle={{ alignItems: 'flex-start' }}
                onVoiceError={(message) => Alert.alert('Voice Input', message)}
              />
            </View>
          </View>

          {/* Repair & Cost column - Only show when status is CORRECTIVE_ACTION_REQUIRED */}
          {formData.status === 'CORRECTIVE_ACTION_REQUIRED' && (
            <View style={styles.col}>
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <RepairCostFields
                  cost={formData.cost}
                  repairNeeded={formData.repairNeeded}
                  onCostChange={(cost:any) => handleFieldChange('cost', cost)}
                  onRepairNeededChange={(needed:any) => handleFieldChange('repairNeeded', needed)}
                />
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
          >
            Cancel
          </Button>
          <Button 
            mode="contained" 
            onPress={saveChanges}
          >
            Save Changes
          </Button>
        </View>
      </ScrollView>

      {/* Modals */}
      <MultiSelectModal
        visible={gearFindingsModalVisible}
        onClose={() => setGearFindingsModalVisible(false)}
        options={GEAR_FINDINGS}
        selectedValues={formData.selectedGearFindings}
        onSelectionChange={(values) => handleFieldChange('selectedGearFindings', values)}
        title="Gear Findings"
      />

      <ColorPickerModal
        visible={colorPickerVisible}
        onClose={() => setColorPickerVisible(false)}
        selectedColor={formData.selectedColor}
        onColorSelect={(color) => handleFieldChange('selectedColor', color)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {},
  // scrollView: { flex: 1, marginTop:0, },
  // scrollContent: { paddingBottom: 40 },
  
  // Loading and error styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 12,
    marginLeft: 8,
  },

  // Form styles
  row: { 
    flexDirection: 'row', 
    paddingHorizontal: 14, 
    // marginTop: 80, // Space for sticky header
  },
  col: { flex: 1 },

  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    marginBottom: 16 
  },

  fieldLabel: { 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 8 
  },
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
  smallChoice: { 
    marginRight: 6 
  },

  // Dropdown styles
  dropdownContainer: {
    marginBottom: 16,
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
    fontSize: 14,
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
    fontSize: 14,
    flex: 1,
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 18,
    marginTop: 12,
  },
});