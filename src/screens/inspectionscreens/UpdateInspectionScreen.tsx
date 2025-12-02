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
  Divider,
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
import LoadPicker from '../../components/common/LoadPicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TAG_COLOR_STORAGE_KEY = '@firefighter_tag_color';

// Default images for inspection (fallback)
const DEFAULT_IMAGES = [
  "https://5.imimg.com/data5/SELLER/Default/2022/5/LR/RI/XM/85900029/firefighter-safety-jacket-1000x1000.jpg",
  "https://5.imimg.com/data5/UU/UU/GLADMIN-/firefighter-jacket-250x250.jpg",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQoNPxNoeS-CxmnYP81-KeCeqYfOH-4xIoLag&s"
];

// Gear type to default images mapping (3 images per type)
const GEAR_TYPE_IMAGES: { [key: string]: string[] } = {
  'helmet': [
    'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
    'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
    'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
  ],
  'gloves': [
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFDCux32MFLBioGWbYdOiDfJoCV4sko1-sSQ&s',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFDCux32MFLBioGWbYdOiDfJoCV4sko1-sSQ&s',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFDCux32MFLBioGWbYdOiDfJoCV4sko1-sSQ&s',

  ],
  'boots': [
    'https://www.hacsons.com/wp-content/uploads/2024/08/image-3-1.png',
    'https://www.hacsons.com/wp-content/uploads/2024/08/image-3-1.png',
    'https://www.hacsons.com/wp-content/uploads/2024/08/image-3-1.png'
  ],
  'jacket': [
    "https://5.imimg.com/data5/SELLER/Default/2022/5/LR/RI/XM/85900029/firefighter-safety-jacket-1000x1000.jpg",
    "https://5.imimg.com/data5/SELLER/Default/2022/5/LR/RI/XM/85900029/firefighter-safety-jacket-1000x1000.jpg",
    "https://5.imimg.com/data5/SELLER/Default/2022/5/LR/RI/XM/85900029/firefighter-safety-jacket-1000x1000.jpg"
  ],
  'jacket liner': [
    'https://img.firehouse.com/files/base/cygnus/fhc/image/2018/05/Heat_Releas_Liner_300.5aeb2301a163d.png?auto=format,compress&fit=fill&fill=blur&w=1200&h=630',
    'https://img.firehouse.com/files/base/cygnus/fhc/image/2018/05/Heat_Releas_Liner_300.5aeb2301a163d.png?auto=format,compress&fit=fill&fill=blur&w=1200&h=630',
    'https://img.firehouse.com/files/base/cygnus/fhc/image/2018/05/Heat_Releas_Liner_300.5aeb2301a163d.png?auto=format,compress&fit=fill&fill=blur&w=1200&h=630'
  ],
  'pants': [
    'https://s7d9.scene7.com/is/image/minesafetyappliances/GlobeATHLETIXPants_athletixPants?$Home%20Market%20Card$',
    'https://s7d9.scene7.com/is/image/minesafetyappliances/GlobeATHLETIXPants_athletixPants?$Home%20Market%20Card$',
    'https://s7d9.scene7.com/is/image/minesafetyappliances/GlobeATHLETIXPants_athletixPants?$Home%20Market%20Card$'
  ],
  'pants liner': [
    'https://i.ebayimg.com/images/g/GiwAAOSw2OJh5tzf/s-l1600.jpg',
    'https://i.ebayimg.com/images/g/GiwAAOSw2OJh5tzf/s-l1600.jpg',
    'https://i.ebayimg.com/images/g/GiwAAOSw2OJh5tzf/s-l1600.jpg',

  ],
  'mask': [
    'https://multimedia.3m.com/mws/media/1927020O/3m-scott-av-3000-ht-facepiece-600x600p.jpg',
    'https://5.imimg.com/data5/SELLER/Default/2022/5/LR/RI/XM/85900029/firefighter-safety-jacket-1000x1000.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQoNPxNoeS-CxmnYP81-KeCeqYfOH-4xIoLag&s'
  ],
  'harness': [
    'https://www.uviraj.com/images/FBH-EN/U222FBH.jpg',
    'https://5.imimg.com/data5/SELLER/Default/2022/5/LR/RI/XM/85900029/firefighter-safety-jacket-1000x1000.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQoNPxNoeS-CxmnYP81-KeCeqYfOH-4xIoLag&s'
  ],
  'axe': [
    'https://png.pngtree.com/element_our/20190528/ourmid/pngtree-a-metal-axe-image_1161001.jpg',
    'https://5.imimg.com/data5/SELLER/Default/2022/5/LR/RI/XM/85900029/firefighter-safety-jacket-1000x1000.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQoNPxNoeS-CxmnYP81-KeCeqYfOH-4xIoLag&s'
  ],
  'hose': [
    'https://tirupatiplasto.in/wp-content/uploads/2023/06/fh1.jpg',
    'https://5.imimg.com/data5/SELLER/Default/2022/5/LR/RI/XM/85900029/firefighter-safety-jacket-1000x1000.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQoNPxNoeS-CxmnYP81-KeCeqYfOH-4xIoLag&s'
  ],
  'default': [
    'https://media.gettyimages.com/id/72542196/photo/firemens-gear-at-firehouse.jpg?s=612x612&w=0&k=20&c=Hha2TRyDvyoN3CYK-Hjp_uWf-Jg1P4oJJVWtY6CP6eU=',
    'https://5.imimg.com/data5/SELLER/Default/2022/5/LR/RI/XM/85900029/firefighter-safety-jacket-1000x1000.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQoNPxNoeS-CxmnYP81-KeCeqYfOH-4xIoLag&s'
  ]
};

/**
 * Normalize gear type name for matching
 * Handles variations like "JACKET LINER", "jacket linder", "Fire Jacket", etc.
 */
const normalizeGearType = (gearType: string): string => {
  if (!gearType) return 'default';
  
  // Convert to lowercase and trim
  const normalized = gearType.toLowerCase().trim();
  
  // Handle common variations
  const variations: { [key: string]: string } = {
    'fire jacket': 'jacket',
    'jacket liner': 'jacket liner',
    'jacket linder': 'jacket liner', // typo fix
    'jacketliner': 'jacket liner', // no space
    'fire gloves': 'gloves',
    'fire boots': 'boots',
    'fire axe': 'axe',
    'fire hose': 'hose',
    'protective pants': 'pants',
    'pants liner': 'pants liner',
    'pantsliner': 'pants liner', // no space
    'respirator': 'mask',
    'thermal imaging camera': 'default',
  };
  
  // Check for exact match in variations
  if (variations[normalized]) {
    return variations[normalized];
  }
  
  // Check if gear type contains key words
  if (normalized.includes('helmet')) return 'helmet';
  if (normalized.includes('glove')) return 'gloves';
  if (normalized.includes('boot')) return 'boots';
  if (normalized.includes('jacket') && normalized.includes('liner')) return 'jacket liner';
  if (normalized.includes('jacket')) return 'jacket';
  if (normalized.includes('pant') && normalized.includes('liner')) return 'pants liner';
  if (normalized.includes('pant')) return 'pants';
  if (normalized.includes('mask') || normalized.includes('respirator')) return 'mask';
  if (normalized.includes('harness')) return 'harness';
  if (normalized.includes('axe')) return 'axe';
  if (normalized.includes('hose')) return 'hose';
  
  return 'default';
};

/**
 * Get default images for a gear type
 */
const getDefaultImagesForGearType = (gearType: string | null | undefined): string[] => {
  if (!gearType) {
    return GEAR_TYPE_IMAGES['default'];
  }
  
  const normalized = normalizeGearType(gearType);
  return GEAR_TYPE_IMAGES[normalized] || GEAR_TYPE_IMAGES['default'];
};

// Removed hardcoded HYDRO_TEST_GEAR_TYPES - now using API data

export default function UpdateInspectionScreen() {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { fetchGearById, fetchGearFindings, gearFindingsLoading, gearFindings, gearStatus, gearStatusLoading, fetchGearStatus, gearTypes, fetchGearTypes } = useGearStore();
  const { currentLead } = useLeadStore();

  const { gearId, inspectionId, mode, firefighter, colorLocked } = route.params;

  const resolvedRosterId = useMemo(() => {
    if (!firefighter) {
      return undefined;
    }
    return (
      firefighter.roster_id ??
      firefighter.rosterId ??
      firefighter.id ??
      firefighter.roster?.id
    );
  }, [firefighter]);

  console.log("handleGearPress=ParamsGot", { gearId, inspectionId, mode, firefighter, resolvedRosterId, colorLocked });
  
  // State for gear data
  const [gear, setGear] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    status: '',
    serviceType: '',
    harnessType: false,
    size: '',
    selectedGearFindings: [] as string[],
    serialNumber: '',
    hydroPerformed: false,
    hydroResult: undefined as string | undefined,
    hydroFailureReason: '',
    repairNeeded: false,
    cost: '0',
    remarks: '',
    selectedLoad: '1',
    selectedColor: '',
    specializedCleaningDetails: '',
  });

  // Load tag color from AsyncStorage on mount (only if no inspectionId - for new inspections)
  useEffect(() => {
    const loadTagColor = async () => {
      // Only load from AsyncStorage for new inspections (no inspectionId)
      if (inspectionId) {
        console.log("UpdateInspectionScreen: Existing inspection, will use tag_color from inspection data");
        return;
      }

      try {
        const storedColor = await AsyncStorage.getItem(TAG_COLOR_STORAGE_KEY);
        if (storedColor) {
          console.log("UpdateInspectionScreen: tagColor from AsyncStorage:", storedColor);
          setFormData(prev => ({
            ...prev,
            selectedColor: storedColor.toLowerCase().trim()
          }));
        } else {
          console.log("UpdateInspectionScreen: No tag color found in AsyncStorage");
        }
      } catch (error) {
        console.error("Error loading tag color from AsyncStorage:", error);
      }
    };

    loadTagColor();
  }, [inspectionId]);

  // UI state
  const [isGearInfoCollapsed, setIsGearInfoCollapsed] = useState(true);
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

  // Fetch gear types on mount
  useEffect(() => {
    fetchGearTypes();
  }, []);

  // Fetch gear data and status
  useEffect(() => {
    const fetchGearAndStatus = async () => {
      if (!gearId) return;

      setLoading(true);
      setError(null);
      
      try {
        // Fetch gear data, gear status, and gear types in parallel
        const [gearResponse] = await Promise.all([
          fetchGearById(gearId),
          fetchGearStatus(), // Fetch gear status from API
          fetchGearTypes() // Fetch gear types from API
        ]);

        if (gearResponse) {
          printTable("responsefetchGearById", gearResponse);
          setGear(gearResponse);
          // Initialize form with gear data
          setFormData(prev => ({
            ...prev,
            size: gearResponse.gear_size || '',
            serialNumber: gearResponse.serial_number || '',
            remarks: gearResponse.remarks || '',
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

    fetchGearAndStatus();
  }, [gearId]);

  // Load gear findings and images
  useEffect(() => {
    const loadFindingsAndImage = async () => {
      if (!gear) return;

      await fetchGearFindings(gear.gear_type.gear_type_id);

      // For new inspections (no inspectionId), set gear-type-specific default images
      if (!inspectionId) {
        const gearTypeName = gear.gear_type?.gear_type || gear.gear_name || '';
        const defaultImages = getDefaultImagesForGearType(gearTypeName);
        
        // If gear has a custom image URL, use it as the first image, otherwise use all defaults
        if (gear.gear_image_url) {
          setImages([gear.gear_image_url, ...defaultImages.slice(0, 2)]);
        } else {
          setImages(defaultImages);
        }
        
        console.log(`Initialized images for gear type: "${gearTypeName}"`, defaultImages);
      }
    };

    loadFindingsAndImage();
  }, [gear, inspectionId]);

  // Fetch inspection data when inspectionId is available
  useEffect(() => {
    const fetchInspectionData = async () => {
      if (!inspectionId) return;

      setLoading(true);
      setError(null);
      
      try {
        const response = await inspectionApi.getGearInspectionByInspectionId(inspectionId);
        if (response.status && response.data) {
          const inspectionData = response.data;
          console.log("🔥 Fetched Inspection Data:", inspectionData);

          // Get tag color from inspection or fallback to AsyncStorage
          let tagColor = inspectionData.tag_color?.toLowerCase().trim();
          if (!tagColor) {
            try {
              const storedColor = await AsyncStorage.getItem(TAG_COLOR_STORAGE_KEY);
              if (storedColor) {
                tagColor = storedColor.toLowerCase().trim();
                console.log("UpdateInspectionScreen: Using tag color from AsyncStorage as fallback:", tagColor);
              }
            } catch (error) {
              console.error("Error loading tag color from AsyncStorage:", error);
            }
          }

          // Populate form data with inspection data
          // Handle finding as array or single object
          const gearFindings = Array.isArray(inspectionData.finding)
            ? inspectionData.finding.map((f: any) => f.id?.toString()).filter(Boolean)
            : inspectionData.finding?.id
            ? [inspectionData.finding.id.toString()]
            : [];

          // Convert hydro_test_performed from "YES"/"NO" string to boolean
          const hydroPerformed = inspectionData.hydro_test_performed === "YES" || inspectionData.hydro_test_performed === "yes";
          
          // Convert hydro_test_result to proper case (capitalize first letter)
          let hydroResult = undefined;
          if (inspectionData.hydro_test_result) {
            const result = inspectionData.hydro_test_result.toLowerCase();
            hydroResult = result.charAt(0).toUpperCase() + result.slice(1); // "pass" -> "Pass", "fail" -> "Fail"
          }

          setFormData(prev => ({
            ...prev,
            status: getStatusValue(inspectionData.gear_status?.status) || '',
            serviceType: getServiceTypeValue(inspectionData.service_type?.status) || '',
            harnessType: inspectionData.harness_type || false,
            size: inspectionData.gear?.gear_size || '',
            selectedGearFindings: gearFindings,
            serialNumber: inspectionData.gear?.serial_number || '',
            hydroPerformed: hydroPerformed,
            hydroResult: hydroResult,
            hydroFailureReason: inspectionData.hydrotest_remarks || '',
            repairNeeded: inspectionData.inspection_cost > 0,
            cost: inspectionData.inspection_cost?.toString() || '0',
            remarks: inspectionData.remarks || '',
            selectedLoad: inspectionData.load_number?.toString() || '1',
            selectedColor: tagColor || prev.selectedColor,
            specializedCleaningDetails: inspectionData.specialisedcleaning_remarks || '',
          }));

          // Set images from inspection data
          if (inspectionData.inspection_images && inspectionData.inspection_images.length > 0) {
            setImages(inspectionData.inspection_images);
          }

          // Set gear data if not already set
          if (!gear && inspectionData.gear) {
            setGear(inspectionData.gear);
          }

          console.log("✅ Form data populated from inspection:", inspectionData.inspection_id);
        } else {
          setError('Failed to fetch inspection data');
        }
      } catch (err) {
        setError('Error fetching inspection data');
        console.error('Error fetching inspection:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInspectionData();
  }, [inspectionId]);

  // Helper functions to map API values to form values
  const getStatusValue = (status: string) => {
    if (!status) return '';
    
    // Map API status to form status values
    const statusMap: { [key: string]: string } = {
      'Pass': 'PASS',
      'Repair': 'REPAIR', 
      'Expired': 'EXPIRED',
      'Recommended Out Of Service': 'RECOMMENDED_OOS',
      'Corrective Action Required': 'CORRECTIVE_ACTION_REQUIRED',
      'Fail': 'FAIL'
    };
    
    return statusMap[status] || status.toUpperCase();
  };

const getServiceTypeValue = (serviceType: string) => {
  if (!serviceType) return ''; // Return empty instead of default
  
  const serviceMap: { [key: string]: string } = {
    'Cleaned Only': 'CLEANED_ONLY',
    'Inspected Only': 'INSPECTED_ONLY', 
    'Inspected and Cleaned': 'INSPECTED_AND_CLEANED',
    'Specialised Cleaning': 'SPECIALIZED_CLEANING',
    'Other': 'OTHER'
  };
  return serviceMap[serviceType] || '';
};

  // Map status to ID using the gearStatus from API
  const mapStatusToId = (status: string) => {
    console.log("Mapping status to ID:", status);
    console.log("Available gearStatus:", gearStatus);

    if (gearStatus && gearStatus.length > 0) {
      // Find the matching status in gearStatus array
      const foundStatus = gearStatus.find((gs: any) => {
        const apiStatus = gs.status;
        const formStatus = status;
        
        // Direct match for simple statuses
        if (apiStatus.toUpperCase() === formStatus.toUpperCase()) return true;
        
        // Handle special cases with spaces
        if (formStatus === 'CORRECTIVE_ACTION_REQUIRED' && apiStatus === 'Corrective Action Required') return true;
        if (formStatus === 'RECOMMENDED_OOS' && apiStatus === 'Recommended Out Of Service') return true;
        
        return false;
      });
      
      console.log("Found status:", foundStatus);
      // @ts-ignore
      return foundStatus?.id || 1;
    }
    
    // Fallback mapping if gearStatus is not loaded
    console.warn("gearStatus not loaded, using fallback mapping");
    const statusMap: { [key: string]: number } = {
      'PASS': 1,
      'REPAIR': 2,
      'EXPIRED': 3,
      'RECOMMENDED_OOS': 4,
      'CORRECTIVE_ACTION_REQUIRED': 5,
      'FAIL': 6
    };
    return statusMap[status] || 1;
  };

  // Format gear findings for multi-select modal
  const formattedFindings = useMemo(() => {
    return gearFindings.map(f => ({
      label: f.findings,
      value: f.id.toString(),
    }));
  }, [gearFindings]);

  // Format status options from API for the StatusSelection component
  const formattedStatusOptions = useMemo(() => {
    if (!gearStatus || gearStatus.length === 0) {
      // Return default options if gearStatus is not loaded
      return INSPECTION_CONSTANTS.STATUS_OPTIONS;
    }

    // Map API status to UI options with colors
    const statusColorMap: { [key: string]: string } = {
      'Pass': '#34A853',
      'Repair': '#F9A825', 
      'Expired': '#ff0303ff',
      'Recommended Out Of Service': '#f15719ff',
      'Corrective Action Required': '#F9A825',
      'Fail': '#8B4513' // Brown for Fail
    };

    return gearStatus.map((status: any) => ({
      value: getStatusValue(status.status),
      label: status.status.toUpperCase(),
      color: statusColorMap[status.status] || '#666666'
    }));
  }, [gearStatus]);

  console.log("Formatted status options:", formattedStatusOptions);
  console.log("Current gearStatus from API:", gearStatus);
  
  // Get current gear type from gearTypes array
  const currentGearType = useMemo(() => {
    if (!gear?.gear_type?.gear_type_id || !gearTypes.length) return null;
    return gearTypes.find(gt => gt.gear_type_id === gear.gear_type.gear_type_id);
  }, [gear, gearTypes]);

  // Check if gear requires hydro test based on API data
  const requiresHydroTest = useMemo(() => {
    return currentGearType?.is_hydrotest || false;
  }, [currentGearType]);

  // Check if gear has harness field based on API data
  const requiresHarness = useMemo(() => {
    return currentGearType?.is_harness || false;
  }, [currentGearType]);
  
  console.log("Current gear type:", currentGearType);
  console.log("requiresHydroTest:", requiresHydroTest, "requiresHarness:", requiresHarness);
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
// Handle form field changes
const handleFieldChange = useCallback((field: string, value: any) => {
  setFormData(prev => {
    const updatedFormData = {
      ...prev,
      [field]: value
    };
    
    // Automatically set repairNeeded to true when status is REPAIR or CORRECTIVE_ACTION_REQUIRED
    if (field === 'status' && (value === 'REPAIR' || value === 'CORRECTIVE_ACTION_REQUIRED')) {
      updatedFormData.repairNeeded = true;
    }
    
    // If status changes away from REPAIR/CORRECTIVE_ACTION_REQUIRED, set repairNeeded to false
    if (field === 'status' && !(value === 'REPAIR' || value === 'CORRECTIVE_ACTION_REQUIRED')) {
      updatedFormData.repairNeeded = false;
      updatedFormData.cost = '0';
    }
    
    return updatedFormData;
  });
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
      // Get the correct status ID from API data
      const gearStatusId = mapStatusToId(formData.status);
      console.log("Using gear_status_id:", gearStatusId);

      // Auto-set repairNeeded and cost for repair-related statuses
      const isRepairStatus = formData.status === 'REPAIR' || formData.status === 'CORRECTIVE_ACTION_REQUIRED';
      const inspectionCost = isRepairStatus ? parseFloat(formData.cost) || 0 : 0;

      // Determine which images to use
      // If images array is empty or only has default placeholders, use gear-type-specific defaults
      let imagesToSave = images;
      
      // Check if we need to populate default images
      // If images array is empty, or if all images are from DEFAULT_IMAGES (old placeholders)
      const isEmpty = images.length === 0;
      
      // Check if all images are from the old DEFAULT_IMAGES array (placeholders)
      // Valid images would be: local file:// URIs (from camera/gallery) or custom URLs
      const onlyHasDefaults = images.length > 0 && images.every(img => {
        if (!img || img.trim() === '') return true;
        // If it's a local file, it's valid (user added it)
        if (img.startsWith('file://') || img.startsWith('content://')) return false;
        // If it's in DEFAULT_IMAGES, it's a placeholder
        if (DEFAULT_IMAGES.includes(img)) return true;
        // Otherwise, assume it's a valid custom image
        return false;
      });

      // If no valid images, populate with gear-type-specific defaults
      if (isEmpty || onlyHasDefaults) {
        const gearTypeName = gear?.gear_type?.gear_type || gear?.gear_name || '';
        const defaultImages = getDefaultImagesForGearType(gearTypeName);
        imagesToSave = defaultImages;
        console.log(`Using default images for gear type: "${gearTypeName}"`, defaultImages);
      } else {
        console.log('Using provided images:', images);
      }

      const inspectionData = {
        lead_id: currentLead?.lead_id,
        mu_id: 1,
        firestation_id: gear.firestation?.id,
        franchise_id: gear.franchise?.id,
        gear_id: gear.gear_id,
        roster_id: resolvedRosterId,
        
        inspection_date: new Date().toISOString().split('T')[0],
        inspection_status: mode === 'create' ? 'PRE-INSPECTION' : 'ONGOING-INSPECTION',
        
        hydro_test_result: formData.hydroPerformed ? formData.hydroResult?.toUpperCase() : null,
        hydro_test_performed: formData.hydroPerformed ? "YES" : "NO",
        hydrotest_remarks: formData.hydroResult === 'Fail' ? formData.hydroFailureReason : null,
        
        finding_id: formData.selectedGearFindings.map(id => parseInt(id)),
        
        inspection_cost: inspectionCost,
        
        inspection_image_url: imagesToSave,
        remarks: formData.remarks,
        
        load_number: parseInt(formData.selectedLoad),
        specialisedcleaning_remarks: formData.serviceType === 'SPECIALIZED_CLEANING' ? formData.specializedCleaningDetails : null,
        
        gear_status_id: gearStatusId,
        service_type_id: mapServiceTypeToId(formData.serviceType),
        tag_color: formData.selectedColor.toLowerCase().trim(),
        is_harness: formData.harnessType ? "YES" : "NO",
        gear_size: formData.size,
      };

      console.log('Inspection Data:', inspectionData);

      if(true){
              let response;
          if (mode === 'create') {
            response = await inspectionApi.createGearInspection(inspectionData);
          } else {
            response = await inspectionApi.updateGearInspection(inspectionId, inspectionData);
          }

          if (response.status) {
            Alert.alert('Success', `Inspection ${mode === 'create' ? 'created' : 'updated'} successfully!`);
            // Go back to the previous screen (wherever we came from)
            navigation.goBack();
          } else {
            Alert.alert('Error', response.message || 'Failed to save inspection');
          }

          console.log(`InspectionResponse ${mode === 'create' ? 'created' : 'updated'} successfully!`, response);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Network error');
    }
  };

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
  if (loading || gearStatusLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {gearStatusLoading ? 'Loading status options...' : 'Loading gear data...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error && !gear) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header 
          // title={mode === 'create' ? 'Create Inspection' : 'Update Inspection'}
          title={'Inspection Details'}
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
        tagColor={formData.selectedColor}
        isColorLocked={isColorLocked}
        onHistoryPress={() => {
          if (gear?.gear_id) {
            console.log("handleHistoryPress-gearId", gear.gear_id);
            navigation.navigate('GearDetail', { gear_id: gear.gear_id });
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



        {/* <View style={styles.gearsHeader}>
          <Divider style={styles.divider} />
          <Text style={[styles.gearsTitle, { color: colors.onSurfaceVariant, backgroundColor: colors.background }]}>
            Inspection Details
          </Text>
          <Divider style={styles.divider} />
        </View> */}

        {/* Main form grid */}
        <View style={styles.row}>
          {/* Left Column - Inspection Details */}
          <View style={[styles.col, { marginRight: 8 }]}>
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
             

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

              {/* Harness Type as Toggle - Conditionally Rendered based on gear type */}
              {requiresHarness && (
                <View style={styles.rowSpace}>
                  <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Harness </Text>
                  <View style={styles.toggleContainer}>
                    <Switch 
                      value={formData.harnessType} 
                      onValueChange={(value) => handleFieldChange('harnessType', value)} 
                    />
                  </View>
                </View>
              )}


              {/* Load Selection */}
              <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Select Load</Text>
              <LoadPicker
                // label="Load"
                value={formData.selectedLoad}
                onChange={(value) => handleFieldChange('selectedLoad', value)}
                placeholder="Select Load"
                options={INSPECTION_CONSTANTS.LOAD_OPTIONS}
              />

              {/* Status Selection - Now using API data */}
              <StatusSelection
                selectedStatus={formData.status}
                onStatusChange={(status) => handleFieldChange('status', status)}
                {...({ statusOptions: formattedStatusOptions } as any)}
              />

              {/* Repair & Cost column - Only show when status is CORRECTIVE_ACTION_REQUIRED */}
              {(formData.status === 'CORRECTIVE_ACTION_REQUIRED' || formData.status === 'REPAIR') && (
                <View style={[styles.card, { backgroundColor: colors.surface, marginTop: 0 }]}>
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
            <View style={[styles.card, { backgroundColor: colors.surface, }]}>
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
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
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

            {/* Gear Findings and Images */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>

              {/* Size as Text Input */}
              <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Size</Text>
              <Input
                placeholder="Enter gear size"
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
                    <Image 
                      source={{ uri: imageUri }} 
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
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

    marginBottom: 8 ,
    fontSize: 16, 
    fontWeight: '700', 
  
  },

    gearsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: p(16),
  },


    divider: {
    flex: 1,
    height: 1,
  },

    gearsTitle: {
    paddingHorizontal: p(16),
    fontSize: p(16),
    fontWeight: '600',
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
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    fontSize: 28,
    color: '#666',
    fontWeight: 'bold',
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