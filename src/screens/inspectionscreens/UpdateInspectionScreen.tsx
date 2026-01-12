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
  Dimensions,
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
import ImageEditor from '../../components/common/ImageEditor';
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
import { INSPECTION_CONSTANTS, STATUS_COLOR_BY_ID } from '../../constants/inspection';
import { p } from "../../utils/responsive";
import { inspectionApi } from '../../services/inspectionApi';
import LoadPicker from '../../components/common/LoadPicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InspectionFormSkeleton from '../skeleton/InspectionFormSkeleton';
import { imageUploadApi } from '../../services/imageUploadApi';
import { LeadInfoBanner } from '../../components/common/LeadInfoBanner';
import { requestGalleryPermission, requestCameraPermission } from '../../utils/permissions';

const TAG_COLOR_STORAGE_KEY = '@firefighter_tag_color';

// COMMENTED OUT: Default images for inspection (fallback) - kept for potential future use
/*
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
*/

// COMMENTED OUT: Normalize gear type name for matching - kept for potential future use
/*
const normalizeGearType = (gearType: string): string => {
  if (!gearType) return 'default';
  
  const normalized = gearType.toLowerCase().trim();
  
  const variations: { [key: string]: string } = {
    'fire jacket': 'jacket',
    'jacket liner': 'jacket liner',
    'jacket linder': 'jacket liner',
    'jacketliner': 'jacket liner',
    'fire gloves': 'gloves',
    'fire boots': 'boots',
    'fire axe': 'axe',
    'fire hose': 'hose',
    'protective pants': 'pants',
    'pants liner': 'pants liner',
    'pantsliner': 'pants liner',
    'respirator': 'mask',
    'thermal imaging camera': 'default',
  };
  
  if (variations[normalized]) {
    return variations[normalized];
  }
  
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

const getDefaultImagesForGearType = (gearType: string | null | undefined): string[] => {
  if (!gearType) {
    return GEAR_TYPE_IMAGES['default'];
  }
  
  const normalized = normalizeGearType(gearType);
  return GEAR_TYPE_IMAGES[normalized] || GEAR_TYPE_IMAGES['default'];
};
*/

// Removed hardcoded HYDRO_TEST_GEAR_TYPES - now using API data

export default function UpdateInspectionScreen() {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { fetchGearById, fetchGearFindings, gearFindingsLoading, gearFindings, gearStatus, gearStatusLoading, fetchGearStatus, gearTypes, fetchGearTypes } = useGearStore();
  const { currentLead } = useLeadStore();

  const { gearId, inspectionId, mode, firefighter, colorLocked } = route.params;

  // Mobile detection
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isMobile = screenWidth < 600;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription.remove();
  }, []);

  console.log("handleGearPress=ParamsGot", { gearId, inspectionId, mode, firefighter, colorLocked });
  
  // State for gear data
  const [gear, setGear] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedRosterId = useMemo(() => {
    // Priority 1: Use gear.roster from API (most reliable - single source of truth)
    if (gear?.roster?.roster_id) {
      return gear.roster.roster_id;
    }
    
    // Priority 2: Fallback to firefighter param (for backward compatibility)
    if (firefighter) {
      return (
        firefighter.roster_id ??
        firefighter.rosterId ??
        firefighter.id ??
        firefighter.roster?.id
      );
    }
    
    return undefined;
  }, [gear?.roster, firefighter]);

  // Form state
  const [formData, setFormData] = useState({
    status: '',
    serviceType: 'INSPECTED_AND_CLEANED', // Default: Inspected and Cleaned
    harnessType: false,
    size1: '',
    size2: '',
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
  const [usedColors, setUsedColors] = useState<string[]>([]);
  const [loadingUsedColors, setLoadingUsedColors] = useState<boolean>(false);
  
  // Images state - Now dynamic with upload support
  // Track images with unique IDs to handle duplicate URLs
  const [images, setImages] = useState<Array<{ id: string; uri: string }>>([]);
  const [deletedImages, setDeletedImages] = useState<Array<{ id: string; uri: string }>>([]);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [imageEditorVisible, setImageEditorVisible] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<string>('');
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  // Clear loading state when images change (e.g., when navigating back)
  useEffect(() => {
    // Clear all loading states when images array changes
    // This handles the case when user navigates back and images are already cached
    const timeout = setTimeout(() => {
      setLoadingImages(new Set());
    }, 1000); // Give images 1 second to load, then clear loading state

    return () => clearTimeout(timeout);
  }, [images]);
  
  // Image upload state
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, percentage: 0 });

  const scrollY = useRef(new Animated.Value(0)).current;

  // Helper function to check if gear is expired (10+ years old)
  const isGearExpired = (manufacturingDate: string | null | undefined): boolean => {
    if (!manufacturingDate) return false;
    
    try {
      const manufactureDate = new Date(manufacturingDate);
      if (isNaN(manufactureDate.getTime())) return false;
      
      const today = new Date();
      const yearsDiff = today.getFullYear() - manufactureDate.getFullYear();
      const monthsDiff = today.getMonth() - manufactureDate.getMonth();
      
      // Calculate exact age in years (considering months)
      const ageInYears = yearsDiff + (monthsDiff < 0 ? -1 : 0) + (today.getDate() < manufactureDate.getDate() ? -1/12 : 0);
      
      return ageInYears >= 10;
    } catch (error) {
      console.error('Error calculating gear expiry:', error);
      return false;
    }
  };

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
          
          // Check if gear is expired (10+ years old) and set status to EXPIRED for new inspections
          const isExpired = isGearExpired(gearResponse.manufacturing_date);
          const initialStatus = isExpired && !inspectionId ? 'EXPIRED' : '';
          
          // Initialize form with gear data
          setFormData(prev => ({
            ...prev,
            // size: gearResponse.gear_size || '',
            serialNumber: gearResponse.serial_number || '',
            // remarks: gearResponse.remarks || '',
            status: initialStatus || prev.status, // Only set if new inspection and expired
          }));
          
          if (isExpired && !inspectionId) {
            console.log("⚠️ Gear is expired (10+ years old), status set to EXPIRED");
          }
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

  // Check gear expiry status when gear data changes (for new inspections only)
  useEffect(() => {
    if (!gear || inspectionId) return; // Only check for new inspections
    
    const isExpired = isGearExpired(gear.manufacturing_date);
    if (isExpired) {
      setFormData(prev => {
        // Only set to EXPIRED if status is not already set
        if (!prev.status) {
          console.log("⚠️ Gear is expired (10+ years old), status set to EXPIRED");
          return { ...prev, status: 'EXPIRED' };
        }
        return prev;
      });
    }
  }, [gear, inspectionId]);

  // Load gear findings
  useEffect(() => {
    const loadFindings = async () => {
      if (!gear) return;

      await fetchGearFindings(gear.gear_type.gear_type_id);

      // For new inspections, initialize with empty images (user will add their own)
      // Or optionally use gear's image if available
      if (!inspectionId && gear.gear_image_url) {
        setImages([{ id: `gear-${Date.now()}`, uri: gear.gear_image_url }]);
        console.log('Initialized with gear image:', gear.gear_image_url);
      }
    };

    loadFindings();
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
          // Handle gear_findings (current API format), finding_ids, or finding (legacy formats)
          let gearFindings: string[] = [];
          if (inspectionData.gear_findings && Array.isArray(inspectionData.gear_findings)) {
            // Current API format: gear_findings is an array of objects with id and findings
            gearFindings = inspectionData.gear_findings.map((f: any) => f.id?.toString()).filter(Boolean);
          } else if (inspectionData.finding_ids && Array.isArray(inspectionData.finding_ids)) {
            // New API format: finding_ids is an array of IDs
            gearFindings = inspectionData.finding_ids.map((id: number) => id.toString()).filter(Boolean);
          } else if (Array.isArray(inspectionData.finding)) {
            // Legacy format: finding is an array of objects
            gearFindings = inspectionData.finding.map((f: any) => f.id?.toString()).filter(Boolean);
          } else if (inspectionData.finding?.id) {
            // Legacy format: finding is a single object
            gearFindings = [inspectionData.finding.id.toString()];
          }

          // Convert hydro_test_performed from "YES"/"NO" string to boolean
          const hydroPerformed = inspectionData.hydro_test_performed === "YES" || inspectionData.hydro_test_performed === "yes";
          
          // Convert hydro_test_result to proper case (capitalize first letter)
          let hydroResult = undefined;
          if (inspectionData.hydro_test_result) {
            const result = inspectionData.hydro_test_result.toLowerCase();
            hydroResult = result.charAt(0).toUpperCase() + result.slice(1); // "pass" -> "Pass", "fail" -> "Fail"
          }

          // Get gear_size from inspection data (directly on inspection) or fallback to gear.gear_size
          const gearSize = inspectionData.gear_size || '';
          
          // Split size into two parts if it contains a hyphen
          const sizeParts = gearSize.includes('-') ? gearSize.split('-') : ['', ''];
          const size1 = sizeParts[0]?.trim() || '';
          const size2 = sizeParts[1]?.trim() || '';

          // Get status from inspection, but check if gear is expired and override if needed
          let statusToSet = getStatusValue(inspectionData.gear_status?.status) || '';
          const gearData = inspectionData.gear || gear;
          if (gearData?.manufacturing_date) {
            const isExpired = isGearExpired(gearData.manufacturing_date);
            if (isExpired && !statusToSet) {
              // Only override if no status is set (shouldn't happen for existing inspections, but safety check)
              statusToSet = 'EXPIRED';
              console.log("⚠️ Gear is expired (10+ years old), status set to EXPIRED");
            }
          }

          setFormData(prev => ({
            ...prev,
            status: statusToSet,
            serviceType: getServiceTypeValue(inspectionData.service_type?.status) || 'INSPECTED_AND_CLEANED', // Default to Inspected and Cleaned if not found
            harnessType: inspectionData.is_harness === true || inspectionData.is_harness === "YES" || inspectionData.harness_type || false,
            size1: size1,
            size2: size2,
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
            setImages(inspectionData.inspection_images.map((uri: string, index: number) => ({
              id: `inspection-${inspectionId}-${index}`,
              uri: uri
            })));
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

    // Use global status color mapping from constants
    const statusColorMap = STATUS_COLOR_BY_ID;

    // Filter out "N/A" (id: 7), "OOS" (id: 8), "Fail" (id: 6), "Recommend OOS" (id: 9), and "Out of Date" (id: 10) statuses from UI (hidden but kept in code)
    const hiddenStatusIds = [6, 7, 8, 9, 10];
    return gearStatus
      .filter((status: any) => !hiddenStatusIds.includes(status.id))
      .map((status: any) => ({
        value: getStatusValue(status.status),
        label: status.status.toUpperCase(),
        color: statusColorMap[status.id] || '#666666'
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

  // Fetch used colors from other rosters
  const fetchUsedColors = useCallback(async () => {
    if (!currentLead?.lead_id) {
      setUsedColors([]);
      return;
    }

    try {
      setLoadingUsedColors(true);
      const response = await inspectionApi.getInspectionRosters(currentLead.lead_id);
      const rosters = Array.isArray(response?.roster) ? response.roster : [];
      
      // Extract tag colors from rosters, excluding current firefighter and null values
      const usedColorsList = rosters
        .filter((roster: any) => {
          // Exclude current firefighter's roster
          if (resolvedRosterId) {
            return roster.id !== resolvedRosterId && roster.tag_color;
          }
          return roster.tag_color;
        })
        .map((roster: any) => roster.tag_color.toLowerCase().trim())
        .filter((color: string) => color); // Remove empty strings

      // Remove duplicates
      const uniqueUsedColors: string[] = Array.from(new Set(usedColorsList)) as string[];
      setUsedColors(uniqueUsedColors);
    } catch (error) {
      console.error('Error fetching used colors:', error);
      setUsedColors([]);
    } finally {
      setLoadingUsedColors(false);
    }
  }, [currentLead?.lead_id, resolvedRosterId]);

  // Fetch used colors when color picker opens
  useEffect(() => {
    if (colorPickerVisible && !isColorLocked) {
      fetchUsedColors();
    }
  }, [colorPickerVisible, isColorLocked, fetchUsedColors]);

  // Image handling functions
  const handleImagePress = (imageUri: string) => {
    // Open image editor instead of just preview
    setImageToEdit(imageUri);
    setImageEditorVisible(true);
  };

  const handleImageEditorSave = (editedImageUri: string) => {
    console.log('💾 UpdateInspectionScreen: Image editor save called');
    console.log('📸 Original URI:', imageToEdit);
    console.log('📸 Edited URI:', editedImageUri);
    
    // Replace the original image with the edited one
    setImages(prev => {
      const index = prev.findIndex(img => img.uri === imageToEdit);
      if (index !== -1) {
        const newImages = [...prev];
        newImages[index] = { ...newImages[index], uri: editedImageUri };
        console.log('✅ UpdateInspectionScreen: Image replaced in array');
        console.log('📋 Updated images array:', newImages.map(img => ({
          id: img.id,
          uri: img.uri.substring(0, 50) + '...',
          isLocal: img.uri.startsWith('file://') || img.uri.startsWith('content://')
        })));
        return newImages;
      }
      console.warn('⚠️ UpdateInspectionScreen: Image not found in array');
      return prev;
    });
    setImageEditorVisible(false);
    setImageToEdit('');
  };

  const addNewImage = () => {
    setShowImageSourceModal(true);
  };

  const handleCameraCaptured = (uri: string) => {
    if (uri) {
      setImages(prev => [...prev, { id: `camera-${Date.now()}`, uri }]);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      // Request gallery permission first
      const hasPermission = await requestGalleryPermission(true);
      if (!hasPermission) {
        Alert.alert(
          'Permission Denied',
          'Gallery access is required to select images. Please grant permission in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      const response = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        includeBase64: false,
      });

      if (response.didCancel) {
        return;
      }

      if (response.errorMessage) {
        Alert.alert('Image picker error', response.errorMessage);
        return;
      }

      const uri = response.assets?.[0]?.uri;
      if (uri) {
        setImages(prev => [...prev, { id: `gallery-${Date.now()}`, uri }]);
      } else {
        Alert.alert('Error', 'No image was selected.');
      }
    } catch (error: any) {
      console.error('Gallery picker error:', error);
      Alert.alert('Image picker error', error.message || 'Unable to select image from gallery.');
    }
  };

  // Remove image by ID (soft delete - move to deleted array)
  const handleRemoveImage = (imageId: string) => {
    const imageToRemove = images.find(img => img.id === imageId);
    if (imageToRemove) {
      setImages(prev => prev.filter(img => img.id !== imageId));
      setDeletedImages(prev => [...prev, imageToRemove]);
      console.log('Image marked for deletion:', imageToRemove.uri);
    }
  };

  // Restore a deleted image by ID
  const handleRestoreImage = (imageId: string) => {
    const imageToRestore = deletedImages.find(img => img.id === imageId);
    if (imageToRestore) {
      setDeletedImages(prev => prev.filter(img => img.id !== imageId));
      setImages(prev => [...prev, imageToRestore]);
      console.log('Image restored:', imageToRestore.uri);
    }
  };

  // Save inspection data with image upload
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
      setUploadingImages(true);
      
      // Step 1: Upload new images (local file URIs)
      console.log('💾 UpdateInspectionScreen: Starting save process');
      console.log('📋 Total images:', images.length);
      console.log('📋 Images:', images.map(img => ({
        id: img.id,
        uri: img.uri.substring(0, 50) + '...',
        isLocal: img.uri.startsWith('file://') || img.uri.startsWith('content://')
      })));
      
      const localImages = images.filter(img => 
        img.uri.startsWith('file://') || img.uri.startsWith('content://')
      ).map(img => img.uri);
      
      const alreadyUploadedImages = images.filter(img => 
        img.uri.startsWith('http://') || img.uri.startsWith('https://')
      ).map(img => img.uri);

      console.log('📤 Local images to upload:', localImages.length);
      console.log('✅ Already uploaded images:', alreadyUploadedImages.length);

      let uploadedImageUrls: string[] = [...alreadyUploadedImages];

      if (localImages.length > 0) {
        console.log(`📤 Uploading ${localImages.length} new images...`);
        
        const uploadResults = await imageUploadApi.uploadMultipleImages(
          localImages,
          gear.gear_id,
          (current, total, progress) => {
            setUploadProgress({
              current,
              total,
              percentage: progress.percentage
            });
            console.log(`Uploading image ${current}/${total} - ${progress.percentage}%`);
          }
        );

        // Collect successfully uploaded image URLs
        uploadResults.forEach((result, index) => {
          const originalUri = localImages[index];
          console.log(`📊 Upload result ${index + 1}:`, {
            originalUri: originalUri.substring(0, 50) + '...',
            status: result.status,
            url: result.data?.url?.substring(0, 50) + '...',
            message: result.message,
            error: result.error
          });
          
          if (result.status && result.data?.url) {
            uploadedImageUrls.push(result.data.url);
            console.log(`✅ Image ${index + 1} uploaded successfully:`, result.data.url);
          } else {
            console.error(`❌ Failed to upload image ${index + 1}:`, result.message);
            console.error(`❌ Original URI was:`, originalUri);
            // Only show alert for non-timeout errors (timeout errors are handled by retry logic)
            if (result.error !== 'TIMEOUT_ERROR') {
              Alert.alert('Upload Warning', `Failed to upload image ${index + 1}: ${result.message}`);
            } else {
              console.log(`⏳ Timeout error for image ${index + 1}, retry logic handled it`);
            }
          }
        });

        if (uploadedImageUrls.length === 0) {
          Alert.alert(
            'Upload Error', 
            Platform.OS === 'ios' 
              ? 'No images were uploaded successfully. This may be due to network timeout. Please check your connection and try again.'
              : 'No images were uploaded successfully. Please try again.'
          );
          setUploadingImages(false);
          return;
        }
      }

      console.log('📷 Final image URLs to save:', uploadedImageUrls);
      
      setUploadingImages(false);

      // Step 2: Prepare inspection data
      // Get the correct status ID from API data
      const gearStatusId = mapStatusToId(formData.status);
      console.log("Using gear_status_id:", gearStatusId);

      // Auto-set repairNeeded and cost for repair-related statuses
      const isRepairStatus = formData.status === 'REPAIR' || formData.status === 'CORRECTIVE_ACTION_REQUIRED';
      const inspectionCost = isRepairStatus ? parseFloat(formData.cost) || 0 : 0;

      // Combine size1 and size2 with hyphen
      const combinedSize = formData.size1 && formData.size2 
        ? `${formData.size1.trim()}-${formData.size2.trim()}`
        : formData.size1.trim() || formData.size2.trim() || '';

      const inspectionData = {
        lead_id: currentLead?.lead_id,
        mu_id: 1,
        firestation_id: gear.firestation?.id,
        franchise_id: gear.franchise?.id,
        gear_id: gear.gear_id,
        roster_id: resolvedRosterId,
        
        inspection_date: new Date().toISOString().split('T')[0],
        inspection_status: !inspectionId ? 'PRE-INSPECTION' : 'ONGOING-INSPECTION',
        
        hydro_test_result: formData.hydroPerformed ? formData.hydroResult?.toUpperCase() : null,
        hydro_test_performed: formData.hydroPerformed ? "YES" : "NO",
        hydrotest_remarks: formData.hydroResult === 'Fail' ? formData.hydroFailureReason : null,
        
        finding_id: formData.selectedGearFindings.map(id => parseInt(id)),
        
        inspection_cost: inspectionCost,
        
        inspection_image_url: uploadedImageUrls,
        remarks: formData.remarks,
        
        load_number: parseInt(formData.selectedLoad),
        specialisedcleaning_remarks: formData.serviceType === 'SPECIALIZED_CLEANING' ? formData.specializedCleaningDetails : null,
        
        gear_status_id: gearStatusId,
        service_type_id: mapServiceTypeToId(formData.serviceType),
        tag_color: formData.selectedColor.toLowerCase().trim(),
        is_harness: formData.harnessType ? "YES" : "NO",
        gear_size: combinedSize,
      };

      console.log('Inspection Data:', inspectionData);

      // Step 3: Create or update inspection
      let response;
      if (!inspectionId) {
        response = await inspectionApi.createGearInspection(inspectionData);
      } else {
        response = await inspectionApi.updateGearInspection(inspectionId, inspectionData);
      }

      if (response.status) {
        Alert.alert('Success', `Inspection ${!inspectionId ? 'created' : 'updated'} successfully!`);
        // Go back to the previous screen (wherever we came from)
        navigation.goBack();
      } else {
        Alert.alert('Error', response.message || 'Failed to save inspection');
      }

      console.log(`InspectionResponse ${!inspectionId ? 'created' : 'updated'} successfully!`, response);
    } catch (error: any) {
      setUploadingImages(false);
      console.error('❌ Error saving inspection:', error);
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
    // Default to INSPECTED_AND_CLEANED (3) if serviceType is empty or not found
    return serviceMap[serviceType] || 3;
  };

  // Handle roster update from InspectionHeader - refreshes gear data after roster assignment/update
  const handleRosterUpdate = useCallback(async () => {
    if (!gearId) {
      console.error('Cannot refresh gear: gearId is missing');
      return;
    }

    try {
      console.log('🔄 Refreshing gear data after roster update...');
      const updatedGear = await fetchGearById(gearId);
      
      if (updatedGear) {
        setGear(updatedGear);
        console.log('✅ Gear data refreshed successfully');
        
        // Update form data if needed (e.g., serial number might have changed)
        setFormData(prev => ({
          ...prev,
          serialNumber: updatedGear.serial_number || prev.serialNumber,
        }));
      }
    } catch (error) {
      console.error('❌ Error refreshing gear data:', error);
      Alert.alert('Error', 'Failed to refresh gear data. Please try again.');
    }
  }, [gearId, fetchGearById]);

  // Show loading state with skeleton
  if (loading || gearStatusLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LeadInfoBanner />
        <Header 
          title={'Inspection Details'}
          showBackButton={true}
        />
        <InspectionFormSkeleton isMobile={isMobile} />
      </SafeAreaView>
    );
  }

  // Show error state
  if (error && !gear) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LeadInfoBanner />
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
        <LeadInfoBanner />
        <Header
          title={!inspectionId ? 'Create Inspection' : 'Update Inspection'}
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

  const saveButtonText = !inspectionId ? 'Create Inspection' : 'Save Changes';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LeadInfoBanner />
      {/* Sticky Gear Information */}
      <InspectionHeader
        gear={gear}
        roster={gear?.roster || firefighter}
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
        onColorPickerOpen={() => {
          if (!isColorLocked) {
            setColorPickerVisible(true);
          }
        }}
        mode={mode}
        onRosterUpdate={handleRosterUpdate}
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
        {isMobile ? (
          /* Mobile Layout - Single Column */
          <View style={styles.mobileContainer}>
            {/* Service Type */}
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
                value={formData.selectedLoad}
                onChange={(value) => handleFieldChange('selectedLoad', value)}
                placeholder="Select Load"
                options={INSPECTION_CONSTANTS.LOAD_OPTIONS}
              />
            </View>

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
                          style={{ minHeight: 80, fontSize: p(14) }}
                          containerStyle={{ alignItems: 'flex-start' }}
                          enableVoice={true}
                        />
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {/* Size and Gear Findings */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              {/* Size as Two Text Inputs */}
              <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Size</Text>
              <View style={styles.sizeInputContainer}>
                <Input
                  placeholder="First"
                  value={formData.size1}
                  onChangeText={(text) => handleFieldChange('size1', text)}
                  style={styles.sizeInput}
                  containerStyle={styles.sizeInputBox}
                />
                <Text style={[styles.sizeXText, { color: colors.onSurface }]}>X</Text>
                <Input
                  placeholder="Second"
                  value={formData.size2}
                  onChangeText={(text) => handleFieldChange('size2', text)}
                  style={styles.sizeInput}
                  containerStyle={styles.sizeInputBox}
                />
              </View>

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
            </View>

            {/* Gear Images */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Gear Images</Text>
              
              {/* Active Images */}
              <View style={styles.imagesContainer}>
                {images.map((image) => (
                  <View key={image.id} style={styles.imageWrapper}>
                    <TouchableOpacity 
                      style={styles.imageBox}
                      onPress={() => handleImagePress(image.uri)}
                    >
                      {loadingImages.has(image.id) && (
                        <View style={styles.imageLoadingOverlay}>
                          <ActivityIndicator size="small" color="#fff" />
                        </View>
                      )}
                      <Image 
                        source={{ uri: image.uri }} 
                        style={styles.previewImage}
                        resizeMode="cover"
                        onLoadStart={() => {
                          setLoadingImages(prev => new Set(prev).add(image.id));
                        }}
                        onLoad={() => {
                          setLoadingImages(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(image.id);
                            return newSet;
                          });
                        }}
                        onLoadEnd={() => {
                          // Fallback: Clear loading state even if onLoad didn't fire (cached images)
                          setLoadingImages(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(image.id);
                            return newSet;
                          });
                        }}
                        onError={(error) => {
                          console.error('Image load error:', error);
                          setLoadingImages(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(image.id);
                            return newSet;
                          });
                        }}
                      />
                    </TouchableOpacity>
                    {/* Remove Button */}
                    <TouchableOpacity
                      style={[styles.removeImageButton, { backgroundColor: colors.error }]}
                      onPress={() => handleRemoveImage(image.id)}
                    >
                      <IconButton
                        icon="close"
                        size={16}
                        iconColor="#fff"
                        style={styles.removeIcon}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity 
                  style={[styles.imageBox, styles.addImageBox]}
                  onPress={addNewImage}
                >
                  <Text style={styles.addImageText}>+</Text>
                  <Text style={styles.addImageLabel}>Add Image</Text>
                </TouchableOpacity>
              </View>

              {/* Deleted Images - Show with Restore Option */}
              {deletedImages.length > 0 && (
                <View style={styles.deletedImagesSection}>
                  <Divider style={{ marginVertical: 12 }} />
                  <Text style={[styles.deletedImagesTitle, { color: colors.onSurfaceVariant }]}>
                    Recently Deleted ({deletedImages.length})
                  </Text>
                  <View style={styles.imagesContainer}>
                    {deletedImages.map((image) => (
                      <View key={image.id} style={styles.imageWrapper}>
                        <View style={styles.imageBox}>
                          {loadingImages.has(image.id) && (
                            <View style={styles.imageLoadingOverlay}>
                              <ActivityIndicator size="small" color="#fff" />
                            </View>
                          )}
                          <Image 
                            source={{ uri: image.uri }} 
                            style={styles.previewImage}
                            resizeMode="cover"
                            onLoadStart={() => {
                              setLoadingImages(prev => new Set(prev).add(image.id));
                            }}
                            onLoad={() => {
                              setLoadingImages(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(image.id);
                                return newSet;
                              });
                            }}
                            onLoadEnd={() => {
                              // Fallback: Clear loading state even if onLoad didn't fire (cached images)
                              setLoadingImages(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(image.id);
                                return newSet;
                              });
                            }}
                            onError={(error) => {
                              console.error('Image load error:', error);
                              setLoadingImages(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(image.id);
                                return newSet;
                              });
                            }}
                          />
                        </View>
                        {/* Restore Button */}
                        <TouchableOpacity
                          style={[styles.restoreImageButton, { backgroundColor: colors.primary }]}
                          onPress={() => handleRestoreImage(image.id)}
                        >
                          <IconButton
                            icon="restore"
                            size={16}
                            iconColor="#fff"
                            style={styles.removeIcon}
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Status and Remarks - Combined Section */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              {/* Status Selection */}
              <StatusSelection
                selectedStatus={formData.status}
                onStatusChange={(status) => handleFieldChange('status', status)}
                {...({ statusOptions: formattedStatusOptions } as any)}
              />

              {/* Repair & Cost - Only show when status is CORRECTIVE_ACTION_REQUIRED or REPAIR */}
              {(formData.status === 'CORRECTIVE_ACTION_REQUIRED' || formData.status === 'REPAIR') && (
                <View style={{ marginTop: 16 }}>
                  <RepairCostFields
                    cost={formData.cost}
                    repairNeeded={formData.repairNeeded}
                    onCostChange={(cost) => handleFieldChange('cost', cost)}
                    onRepairNeededChange={(needed) => handleFieldChange('repairNeeded', needed)}
                  />
                </View>
              )}

              {/* Remarks */}
              <View style={{ marginTop: 16 }}>
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Remarks</Text>
                <Input
                  placeholder="Add notes or remarks..."
                  value={formData.remarks}
                  onChangeText={(text) => handleFieldChange('remarks', text)}
                  multiline
                  numberOfLines={4}
                  style={{ minHeight: 90, fontSize: p(14) }}
                  containerStyle={{ alignItems: 'flex-start' }}
                  enableVoice={true}
                />
              </View>
            </View>
          </View>
        ) : (
          /* Tablet/iPad Layout - Two Columns */
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
                  style={{ minHeight: 90, fontSize: p(14) }}
                  containerStyle={{ alignItems: 'flex-start' }}
                  enableVoice={true}
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
                {/* Size as Two Text Inputs */}
                <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Size</Text>
                <View style={styles.sizeInputContainer}>
                  <Input
                    placeholder="First"
                    value={formData.size1}
                    onChangeText={(text) => handleFieldChange('size1', text)}
                    style={styles.sizeInput}
                    containerStyle={styles.sizeInputBox}
                  />
                  <Text style={[styles.sizeXText, { color: colors.onSurface }]}>X</Text>
                  <Input
                    placeholder="Second"
                    value={formData.size2}
                    onChangeText={(text) => handleFieldChange('size2', text)}
                    style={styles.sizeInput}
                    containerStyle={styles.sizeInputBox}
                  />
                </View>

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
                
                {/* Active Images */}
                <View style={styles.imagesContainer}>
                  {images.map((image) => (
                    <View key={image.id} style={styles.imageWrapper}>
                      <TouchableOpacity 
                        style={styles.imageBox}
                        onPress={() => handleImagePress(image.uri)}
                      >
                        {loadingImages.has(image.id) && (
                          <View style={styles.imageLoadingOverlay}>
                            <ActivityIndicator size="small" color="#fff" />
                          </View>
                        )}
                        <Image 
                          source={{ uri: image.uri }} 
                          style={styles.previewImage}
                          resizeMode="cover"
                          onLoadStart={() => {
                            setLoadingImages(prev => new Set(prev).add(image.id));
                          }}
                          onLoad={() => {
                            setLoadingImages(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(image.id);
                              return newSet;
                            });
                          }}
                          onLoadEnd={() => {
                            // Fallback: Clear loading state even if onLoad didn't fire (cached images)
                            setLoadingImages(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(image.id);
                              return newSet;
                            });
                          }}
                          onError={(error) => {
                            console.error('Image load error:', error);
                            setLoadingImages(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(image.id);
                              return newSet;
                            });
                          }}
                        />
                      </TouchableOpacity>
                      {/* Remove Button */}
                      <TouchableOpacity
                        style={[styles.removeImageButton, { backgroundColor: colors.error }]}
                        onPress={() => handleRemoveImage(image.id)}
                      >
                        <IconButton
                          icon="close"
                          size={16}
                          iconColor="#fff"
                          style={styles.removeIcon}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity 
                    style={[styles.imageBox, styles.addImageBox]}
                    onPress={addNewImage}
                  >
                    <Text style={styles.addImageText}>+</Text>
                    <Text style={styles.addImageLabel}>Add Image</Text>
                  </TouchableOpacity>
                </View>

                {/* Deleted Images - Show with Restore Option */}
                {deletedImages.length > 0 && (
                  <View style={styles.deletedImagesSection}>
                    <Divider style={{ marginVertical: 12 }} />
                    <Text style={[styles.deletedImagesTitle, { color: colors.onSurfaceVariant }]}>
                      Recently Deleted ({deletedImages.length})
                    </Text>
                    <View style={styles.imagesContainer}>
                      {deletedImages.map((image) => (
                        <View key={image.id} style={styles.imageWrapper}>
                          <View style={styles.imageBox}>
                            {loadingImages.has(image.id) && (
                              <View style={styles.imageLoadingOverlay}>
                                <ActivityIndicator size="small" color="#fff" />
                              </View>
                            )}
                            <Image 
                              source={{ uri: image.uri }} 
                              style={styles.previewImage}
                              resizeMode="cover"
                              onLoadStart={() => {
                                setLoadingImages(prev => new Set(prev).add(image.id));
                              }}
                              onLoad={() => {
                                setLoadingImages(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(image.id);
                                  return newSet;
                                });
                              }}
                              onLoadEnd={() => {
                                // Fallback: Clear loading state even if onLoad didn't fire (cached images)
                                setLoadingImages(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(image.id);
                                  return newSet;
                                });
                              }}
                              onError={(error) => {
                                console.error('Image load error:', error);
                                setLoadingImages(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(image.id);
                                  return newSet;
                                });
                              }}
                            />
                          </View>
                          {/* Restore Button */}
                          <TouchableOpacity
                            style={[styles.restoreImageButton, { backgroundColor: colors.primary }]}
                            onPress={() => handleRestoreImage(image.id)}
                          >
                            <IconButton
                              icon="restore"
                              size={16}
                              iconColor="#fff"
                              style={styles.removeIcon}
                            />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Upload Progress Indicator */}
        {uploadingImages && (
          <View style={[styles.uploadProgressContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.uploadProgressText, { color: colors.onSurface }]}>
              Uploading Images {uploadProgress.current > 0 ? `(${uploadProgress.current}/${uploadProgress.total})` : '...'}
            </Text>
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
            {uploadProgress.percentage > 0 && (
              <Text style={[styles.uploadProgressPercentage, { color: colors.onSurfaceVariant }]}>
                {uploadProgress.percentage}%
              </Text>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button 
            mode="outlined" 
            onPress={() => navigation.goBack()} 
            style={{ marginRight: 12 }}
            disabled={uploadingImages}
          >
            Cancel
          </Button>
          <Button 
            mode="contained" 
            onPress={saveChanges}
            loading={uploadingImages}
            disabled={uploadingImages}
          >
            {uploadingImages ? 'Uploading...' : saveButtonText}
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
        onColorSelect={(color) => {
          const normalizedColor = color?.toLowerCase().trim() || '';
          handleFieldChange('selectedColor', normalizedColor);
          // Save to AsyncStorage immediately
          AsyncStorage.setItem(TAG_COLOR_STORAGE_KEY, normalizedColor);
          setColorPickerVisible(false);
        }}
        usedColors={usedColors}
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
        requestPermission={true}
      />

      {/* Image Editor Modal */}
      <ImageEditor
        visible={imageEditorVisible}
        imageUri={imageToEdit}
        onClose={() => {
          setImageEditorVisible(false);
          setImageToEdit('');
        }}
        onSave={handleImageEditorSave}
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
  mobileContainer: {
    paddingHorizontal: 14,
  },

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

  // Size input styles
  sizeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sizeInputBox: {
    flex: 1,
    marginBottom: 0,
  },
  sizeInput: {
    marginBottom: 0,
  },
  sizeXText: {
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 8,
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
  imageWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
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
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  removeIcon: {
    margin: 0,
    padding: 0,
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

  // Deleted Images styles
  deletedImagesSection: {
    marginTop: 16,
  },
  deletedImagesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  restoreImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  // Upload Progress styles
  uploadProgressContainer: {
    marginHorizontal: 14,
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadProgressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  uploadProgressPercentage: {
    fontSize: 12,
    marginTop: 4,
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