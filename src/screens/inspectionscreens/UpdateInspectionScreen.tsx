// src/screens/inspectionscreens/UpdateInspectionScreen.tsx
import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  TouchableOpacity,
  Keyboard,
  Platform,
  Image,
  Modal,
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
import { p } from "../../utils/responsive";
import { inspectionApi } from '../../services/inspectionApi';

// Default images for inspection
const DEFAULT_IMAGES = [
  "https://example.com/images/inspection_1030.jpg",
  "https://example.com/images/inspection_1031.jpg",
  "https://example.com/images/inspection_1032.jpg"
];

  // "https://i.ebayimg.com/thumbs/images/g/wqIAAeSw1eRpI3v7/s-l1200.webp",
  // "https://i.ebayimg.com/thumbs/images/g/wqIAAeSw1eRpI3v7/s-l1200.webp",
  // "https://i.ebayimg.com/thumbs/images/g/wqIAAeSw1eRpI3v7/s-l1200.webp"

// Gear types that require hydro test
const HYDRO_TEST_GEAR_TYPES = ['JACKET LINER', 'PANT LINER'];

export default function UpdateInspectionScreen() {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { fetchGearById, fetchGearFindings, gearFindingsLoading, gearFindings,  gearStatus, gearStatusLoading, fetchGearStatus } = useGearStore();
  const { currentLead } = useLeadStore();

  const { gearId, inspectionId, mode, firefighter, tagColor, colorLocked } = route.params;

  console.log("handleGearPress=ParamsGot", { gearId, inspectionId, mode, firefighter, tagColor, colorLocked });
  
  // State for gear data
  const [gear, setGear] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    status: 'PASS',
    serviceType: 'INSPECTED_AND_CLEANED',
    harnessType: false, // Changed to boolean
    size: '', // Changed to text input
    selectedGearFindings: [] as string[],
    serialNumber: '',
    hydroPerformed: false, // Default to false
    hydroResult: undefined as string | undefined,
    hydroFailureReason: '',
    repairNeeded: false,
    cost: '0',
    remarks: '',
    selectedLoad: '1',
    selectedColor: tagColor || 'red', // Use passed color in lowercase
    specializedCleaningDetails: '',
  });

  // UI state
  const [isGearInfoCollapsed, setIsGearInfoCollapsed] = useState(false);
  const [gearFindingsModalVisible, setGearFindingsModalVisible] = useState(false);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isColorLocked, setIsColorLocked] = useState(colorLocked || false);
  
  // Images state
  const [images, setImages] = useState<string[]>(DEFAULT_IMAGES);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  const scrollY = useRef(new Animated.Value(0)).current;

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
            size: response.gear_size || '',
            serialNumber: response.serial_number || '',
            //@ts-ignore
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

  // Load gear findings and images
  useEffect(() => {
    const loadFindingsAndImage = async () => {
      if (!gear) return;

      await fetchGearFindings(gear.gear_type.gear_type_id);
      await fetchGearStatus()
     const  resutl = await inspectionApi.getGearInspectionByInspectionId(2017)
      console.log("getGearInspectionByInspectionId", resutl)
      // Use gear image if available, otherwise use default images
      if (gear.gear_image_url) {
        setImages([gear.gear_image_url, ...DEFAULT_IMAGES]);
      }
    };

    loadFindingsAndImage();
  }, [gear]);

  // Format gear findings for multi-select modal
  const formattedFindings = useMemo(() => {
    return gearFindings.map(f => ({
      label: f.findings,
      value: f.id.toString(), // Convert to string for multi-select
    }));
  }, [gearFindings]);

  // console.log("formattedFindings", formattedFindings);
  // console.log("🔥 Gear Findings Fetched:", gearFindings);
  console.log("🔥 Gear_gearStatus", gearStatus);

  // Check if gear requires hydro test
  const requiresHydroTest = useMemo(() => {
    return HYDRO_TEST_GEAR_TYPES.includes(gear?.gear_type?.gear_type?.toUpperCase());
  }, [gear]);

  // Track keyboard visibility
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

  // Helper functions
  const getLoadLabel = (loadValue: string) => {
    const load = INSPECTION_CONSTANTS.LOAD_OPTIONS.find(option => option.value === loadValue);
    return load?.label || 'Select Load';
  };

  const getSelectedGearFindingsLabels = () => {
    return formData.selectedGearFindings.map(findingId => {
      const found = gearFindings.find(f => f.id.toString() === findingId);
      return found?.findings || `Finding ${findingId}`;
    });
  };

  // Handle form field changes
  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Image handling functions
  const handleImagePress = (imageUri: string) => {
    setSelectedImage(imageUri);
    setImagePreviewVisible(true);
  };

  const addNewImage = () => {
    setShowImageSourceModal(true);
  };

  const handleCameraCaptured = (uri: string) => {
    setImages(prev => [...prev, uri]);
  };

  const handlePickFromGallery = async () => {
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        includeBase64: false,
      });

      if (response.didCancel) {
        return;
      }

      const uri = response.assets?.[0]?.uri;
      if (uri) {
        setImages(prev => [...prev, uri]);
      }
    } catch (error) {
      Alert.alert('Image picker error', 'Unable to select image from gallery.');
    }
  };

  // Save inspection data
  const saveChanges = async () => {
    if (!gear) {
      Alert.alert('Error', 'No gear data available');
      return;
    }

    console.log('Save', { 
      gearId: gear.gear_id,
      mode,
      ...formData
    });

    try {
      // Prepare gear findings as array of objects
      const gearFindingsData = formData.selectedGearFindings.map(findingId => {
        const finding = gearFindings.find(f => f.id.toString() === findingId);
        return {
          id: parseInt(findingId),
          findings: finding?.findings || ''
        };
      });

      const inspectionData = {
        lead_id: currentLead?.lead_id,
        mu_id: 1,
        firestation_id: gear.firestation?.id,
        franchise_id: gear.franchise?.id,
        gear_id: gear.gear_id,
        roster_id: firefighter?.roster_id,
        
        inspection_date: new Date().toISOString().split('T')[0],
        inspection_status: 'POST-INSPECTION',
        
        hydro_test_result: formData.hydroPerformed ? formData.hydroResult?.toUpperCase() : null,
        hydro_test_performed: formData.hydroPerformed,
        hydro_failure_reason: formData.hydroResult === 'Fail' ? formData.hydroFailureReason : null,
        // @mitesh
        gear_findings : JSON.stringify(gearFindingsData), //stringified
        finding_id: 1,
        
        // gear_findings: gearFindingsData, // Array of 

        // should_Be like this 
        // finding_ids:gearFindingsData.map(item => item.id), //[30, 31, 32, 33, 34]

        inspection_cost: formData.repairNeeded ? parseFloat(formData.cost) : 0,
        
        inspection_image_url: images,
        remarks: formData.remarks,
        
        load_number: parseInt(formData.selectedLoad),
        specialisedcleaning_remarks: formData.serviceType === 'SPECIALIZED_CLEANING' ? formData.specializedCleaningDetails : null,
        
        gear_status_id: mapStatusToId(formData.status),
        service_type_id: mapServiceTypeToId(formData.serviceType),
        tag_color: formData.selectedColor.toLowerCase(), // Ensure lowercase
        harness_type: formData.harnessType,
        gear_size: formData.size,
        
      };

      console.log('Inspection Data:', inspectionData);

      // TODO: Uncomment when API is ready
      let response;
      if (mode === 'create') {
        response = await inspectionApi.createGearInspection(inspectionData);
      } else {
        response = await inspectionApi.updateGearInspection(inspectionId, inspectionData);
      }

      if (response.status) {
        Alert.alert('Success', `Inspection ${mode === 'create' ? 'created' : 'updated'} successfully!`);
        navigation.navigate("FirefighterFlow", { firefighter });
      } else {
        Alert.alert('Error', response.message || 'Failed to save inspection');
      }

      console.log(`InspectionResponse ${mode === 'create' ? 'created' : 'updated'} successfully!`, response)
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Network error');
    }
  };

  // Helper functions to map status to IDs
  const mapStatusToId = (status: string) => {
    const statusMap: { [key: string]: number } = {
      'PASS': 1,
      'REPAIR':2,
      'CORRECTIVE_ACTION_REQUIRED': 5,
      'RECOMMENDED_OOS': 4,
      'EXPIRED': 3
    };
    return statusMap[status] || 1;
  };

  /*
  {
    "status": true,
    "message": "Gear status fetched successfully",
    "data": [
        {
            "id": 1,
            "status": "Pass"
        },
        {
            "id": 2,
            "status": "Repair"
        },
        {
            "id": 3,
            "status": "Expired"
        },
        {
            "id": 4,
            "status": "Recommended Out Of Service"
        },
        {
            "id": 5,
            "status": "Corrective Action Required"
        }
    ]
}
  
  */

  const mapServiceTypeToId = (serviceType: string) => {
    const serviceMap: { [key: string]: number } = {
      'CLEANED_ONLY': 1, 
      'INSPECTED_ONLY': 2,
      'INSPECTED_AND_CLEANED': 3,
      'SPECIALIZED_CLEANING': 4,
      'OTHER': 5
    };
    return serviceMap[serviceType] || 1;
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
          title={mode === 'create' ? 'Create Inspection' : 'Update Inspection'}
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
          title={mode === 'create' ? 'Create Inspection' : 'Update Inspection'}
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

  const saveButtonText = mode === 'create' ? 'Create Inspection' : 'Save Changes';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Sticky Gear Information */}
      <InspectionHeader
        gear={gear}
        roster={firefighter}
        isCollapsed={isGearInfoCollapsed}
        onToggleCollapse={() => setIsGearInfoCollapsed(!isGearInfoCollapsed)}
        scrollY={scrollY}
        tagColor={tagColor}
        isColorLocked={isColorLocked}
        onHistoryPress={() => {
          if (gear?.gear_id) {
            navigation.navigate('GearDetail', { gearId: gear.gear_id });
          }
        }}
        onColorPickerOpen={() => setColorPickerVisible(true)}
        mode={mode}
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
          {/* Left Column - Inspection Details */}
          <View style={[styles.col, { marginRight: 8 }]}>
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                Inspection Details
              </Text>

              <ServiceTypeSelection
                selectedServiceType={formData.serviceType}
                onServiceTypeChange={(type) => handleFieldChange('serviceType', type)}
              />

              {/* Specialized Cleaning Fields - Conditionally Rendered */}
              {formData.serviceType === 'SPECIALIZED_CLEANING' && (
                <SpecializedCleaningFields
                  specializedCleaningDetails={formData.specializedCleaningDetails}
                  onSpecializedCleaningChange={(text) => handleFieldChange('specializedCleaningDetails', text)}
                />
              )}

              {/* Harness Type as Toggle */}
              <View style={styles.rowSpace}>
                <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Harness Type</Text>
                <View style={styles.toggleContainer}>
                  {/* <Text style={[styles.toggleLabel, { color: colors.onSurfaceVariant }]}>
                    {formData.harnessType ? 'Class 3 - Full Body' : 'Class 2 - Chest'}
                  </Text> */}
                  <Switch 
                    value={formData.harnessType} 
                    onValueChange={(value) => handleFieldChange('harnessType', value)} 
                    />
                </View>
              </View>
                   



              {/* Size as Text Input */}




              {/* Load Selection */}
              <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Select Load</Text>
              <CustomDropdown
                options={INSPECTION_CONSTANTS.LOAD_OPTIONS}
                selectedValue={formData.selectedLoad}
                onSelect={(value) => handleFieldChange('selectedLoad', value)}
                placeholder="Select Load"
                getLabel={getLoadLabel}
                style={styles.dropdownContainer}
              />

              {/* Color Picker - Only show if not locked */}
              {/* {!isColorLocked && (
                <>
                  <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Color</Text>
                  <TouchableOpacity
                    style={[styles.colorPickerButton, { backgroundColor: colors.surface, borderColor: colors.outline }]}
                    onPress={() => setColorPickerVisible(true)}
                  >
                    <View style={styles.colorPickerButtonContent}>
                      <View style={[styles.selectedColorCircle, { 
                        backgroundColor: INSPECTION_CONSTANTS.COLOR_OPTIONS.find(c => c.value === formData.selectedColor)?.color 
                      }]} />
                      <Text style={[styles.colorPickerButtonText, { color: colors.onSurface }]}>
                        {formData.selectedColor.charAt(0).toUpperCase() + formData.selectedColor.slice(1)}
                      </Text>
                    </View>
                    <IconButton
                      icon="chevron-right"
                      size={20}
                      iconColor={colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                </>
              )} */}

              {/* Status Selection */}
              <StatusSelection
                selectedStatus={formData.status}
                onStatusChange={(status) => handleFieldChange('status', status)}
              />


               {/* Repair & Cost column - Only show when status is CORRECTIVE_ACTION_REQUIRED */}
            {formData.status === 'CORRECTIVE_ACTION_REQUIRED' && (
              <View style={[styles.card, { backgroundColor: colors.surface, marginTop: 12 }]}>
                <RepairCostFields
                  cost={formData.cost}
                  repairNeeded={formData.repairNeeded}
                  onCostChange={(cost) => handleFieldChange('cost', cost)}
                  onRepairNeededChange={(needed) => handleFieldChange('repairNeeded', needed)}
                />
              </View>
            )}
            </View>

            {/* Remarks */}
            <View style={[styles.card, { backgroundColor: colors.surface, marginTop: 12 }]}>
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Remarks</Text>
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
              />
            </View>
          </View>

          {/* Right Column - Images, Hydro Test, and Repair */}
          <View style={styles.col}>

                        {/* Hydro Test Section - Only for liners */}
            {requiresHydroTest && (
              <View style={[styles.card, { backgroundColor: colors.surface, marginTop: 12 }]}>
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Hydro Test</Text>
                
                <View style={styles.rowSpace}>
                  <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Hydro Test Performed</Text>
                  <Switch 
                    value={formData.hydroPerformed} 
                    onValueChange={(value) => handleFieldChange('hydroPerformed', value)} 
                  />
                </View>

                {formData.hydroPerformed && (
                  <>
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

                    {/* HYDRO TEST FAILURE REASON */}
                    {formData.hydroResult === 'Fail' && (
                      <View style={styles.hydroFailureSection}>
                        <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>
                          Why did the hydro test fail?
                        </Text>
                        <Input
                          placeholder="Describe the reason for hydro test failure..."
                          value={formData.hydroFailureReason}
                          onChangeText={(text) => handleFieldChange('hydroFailureReason', text)}
                          multiline
                          numberOfLines={3}
                          enableVoice
                          appendVoiceResults
                          style={{ minHeight: 80, fontSize: p(14) }}
                          containerStyle={{ alignItems: 'flex-start' }}
                        />
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
            {/* Gear Images */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>


                            <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Size</Text>
              <Input
                placeholder="Enter gear size (e.g., L, XL, 42)"
                value={formData.size}
                onChangeText={(text) => handleFieldChange('size', text)}
                style={styles.textInput}
              />
              

                            {/* Gear Findings */}
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

              {/* Show selected gear findings with better layout */}
              {formData.selectedGearFindings.length > 0 && (
                <View style={styles.selectedFindingsContainer}>
                  {getSelectedGearFindingsLabels().map((label, index) => (
                    <View key={index} style={styles.findingItem}>
                      <Chip
                        style={[styles.findingChip, { backgroundColor: colors.primaryContainer }]}
                        textStyle={{ color: colors.onPrimaryContainer, fontSize: 12 }}
                        onClose={() => {
                          const newFindings = [...formData.selectedGearFindings];
                          newFindings.splice(index, 1);
                          handleFieldChange('selectedGearFindings', newFindings);
                        }}
                      >
                        {label}
                      </Chip>
                    </View>
                  ))}
                </View>
              )}

              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Gear Images</Text>
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
            mode="outlined" 
            onPress={() => navigation.goBack()} 
            style={{ marginRight: 12 }}
          >
            Cancel
          </Button>
          <Button 
            mode="contained" 
            onPress={saveChanges}
          >
            {saveButtonText}
          </Button>
        </View>
      </ScrollView>

      {/* Modals */}
      <MultiSelectModal
        visible={gearFindingsModalVisible}
        onClose={() => setGearFindingsModalVisible(false)}
        options={formattedFindings}
        selectedValues={formData.selectedGearFindings}
        onSelectionChange={(values) => handleFieldChange("selectedGearFindings", values)}
        title="Gear Findings"
      />

      <ColorPickerModal
        visible={colorPickerVisible}
        onClose={() => setColorPickerVisible(false)}
        selectedColor={formData.selectedColor}
        onColorSelect={(color) => handleFieldChange('selectedColor', color)}
      />

      {/* Image Source Picker Modal */}
      <ImageSourcePickerModal
        visible={showImageSourceModal}
        onDismiss={() => setShowImageSourceModal(false)}
        onPickCamera={() => {
          setShowImageSourceModal(false);
          setShowCameraModal(true);
        }}
        onPickGallery={() => {
          setShowImageSourceModal(false);
          handlePickFromGallery();
        }}
      />

      {/* Camera Modal */}
      <CameraCaptureModal
        visible={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onPhotoCaptured={handleCameraCaptured}
      />

      {/* Image Preview Modal */}
      <Modal
        visible={imagePreviewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImagePreviewVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalBackground}
            onPress={() => setImagePreviewVisible(false)}
            activeOpacity={1}
          >
            <Image source={{ uri: selectedImage }} style={styles.enlargedImage} />
          </TouchableOpacity>
          <Button 
            mode="contained" 
            onPress={() => setImagePreviewVisible(false)}
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
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {},
  
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

  // Toggle styles
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
  },

  // Text input styles
  textInput: {
    marginBottom: 16,
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
    marginBottom: 16,
  },
  findingItem: {
    marginBottom: 8,
  },
  findingChip: {
    marginRight: 6,
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

  // Hydro Test Failure Section
  hydroFailureSection: {
    marginTop: 12,
    marginBottom: 16,
  },

  // Image styles
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageBox: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  addImageBox: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    backgroundColor: 'transparent',
  },
  addImageText: {
    fontSize: 20,
    color: '#666',
    marginBottom: 4,
  },
  addImageLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
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
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 18,
    marginTop: 12,
  },
});