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
import CommonDatePicker from '../../components/common/DatePicker';
import { useLeadStore } from '../../store/leadStore';
import { printTable } from '../../utils/printTable';
import ImageSourcePickerModal from '../../components/common/Modal/ImageSourcePickerModal';
import CameraCaptureModal from '../../components/common/Modal/CameraCaptureModal';
import { launchImageLibrary } from 'react-native-image-picker';
import Svg, { Path } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import { useGearStore } from '../../store/gearStore';

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
  { value: 'MFR_LABEL_DAMAGED_LOOSE', label: 'Mfr. Info Label Damaged/Loose' },
  { value: 'MFR_LABEL_MISSING_UNREADABLE', label: 'Mfr. Info Label Missing/Unreadable (Critical Fail)' },

  { value: 'HELMET_SHELL_DAMAGED', label: 'Helmet Shell Damaged' },
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

// Dummy gear data as fallback
const dummyGear: Gear = {
  gear_id: 1,
  gear_name: 'Fire Helmet Pro',
  gear_type:  {
        "gear_type_id": 2,
        "gear_type": "HELMET"
    },
  gear_size: 'L',
  active_status: true,
  serial_number: 'SN-FH-001-2024',
  gear_image_url: 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
  manufacturing_date: '2024-01-01',
  roster: {
    roster_id: 1,
    first_name: 'John',
    middle_name: 'M',
    last_name: 'Doe',
    email: 'john.doe@firestation.com',
    phone: '555-123-4567'
  },
  firestation: {
    id: 10,
    name: 'Central Fire Station'
  },
  franchise: {
    id: 19,
    name: 'Beta Motors Franchise - test'
  },
  manufacturer: {
    manufacturer_id: 50,
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
  remarks: 'Minor scratches on visor',
  condition: 'Used - Good'
};

export default function UpdateInspectionScreen() {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { currentLead } = useLeadStore();
  const {fetchGearById} = useGearStore();
  
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
        // If no gear ID provided, use dummy data
        setGear(dummyGear);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Replace with your actual API call
        const response = await fetchGearById(gearId);
        if (response) {
          printTable("responsefetchGearById",response)
          const Gear = response; 
          // @ts-ignore
          setGear(Gear);
        } else {
          setError('Failed to fetch gear data');
          setGear(dummyGear); // Fallback to dummy data
        }
      } catch (err) {
        setError('Error fetching gear data');
        setGear(dummyGear); // Fallback to dummy data
        console.error('Error fetching gear:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGear();
  }, [gearId]);

  // // Mock API function - replace with your actual API call
  // const fetchGearById = async (id: number): Promise<Gear | null> => {
  //   try {
  //     // Simulate API call
  //     const mockResponse = {
  //       status: true,
  //       message: "Gear fetched successfully",
  //       gear: {
  //         gear_id: id,
  //         gear_name: 'Fire Helmet Pro',
  //         gear_type: 'Helmet',
  //         gear_size: 'L',
  //         active_status: true,
  //         serial_number: 'SN-001-2025',
  //         gear_image_url: 'https://example.com/images/helmet-pro.jpg',
  //         manufacturing_date: '2024-01-01',
  //         roster: {
  //           roster_id: 1,
  //           first_name: 'Jane',
  //           middle_name: 'M',
  //           last_name: 'Doe',
  //           email: 'jane.doe@fire.com',
  //           phone: '5551234567'
  //         },
  //         firestation: {
  //           id: 10,
  //           name: 'Central Fire Station'
  //         },
  //         franchise: {
  //           id: 19,
  //           name: 'Beta Motors Franchise - test'
  //         },
  //         manufacturer: {
  //           manufacturer_id: 50,
  //           manufacturer_name: 'Fire Safety Equipment Inc.'
  //         }
  //       }
  //     };
      
  //     // Simulate network delay
  //     await new Promise((resolve:any) => setTimeout(resolve, 1000));
      
  //     return mockResponse.gear;
  //   } catch (error) {
  //     console.error('API Error:', error);
  //     return null;
  //   }
  // };

  // Local editable state - initialize with gear data when available
  const [status, setStatus] = useState('PASS');
  const [serviceType, setServiceType] = useState('CLEANED_AND_INSPECTED');
  const [harnessType, setHarnessType] = useState('CLASS_3');
  const [size, setSize] = useState(gear?.gear_size ?? 'L');
  const [helmetFinding, setHelmetFinding] = useState('');
  const [serialNumber, setSerial] = useState(gear?.serial_number ?? '');
  
  const [hydroPerformed, setHydroPerformed] = useState(false);
  const [hydroResult, setHydroResult] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<string>('2025-11-15');
  const [endDate, setEndDate] = useState<string>('2025-11-20');
  const [condition, setCondition] = useState<string | undefined>(gear?.condition ?? 'Used - Good');
  const [repairNeeded, setRepairNeeded] = useState(false);
  const [cost, setCost] = useState<string>('125.00');
  const [remarks, setRemarks] = useState<string>(gear?.remarks ?? '');
  
  // Update form fields when gear data loads
  useEffect(() => {
    if (gear) {
      setSize(gear.gear_size || 'L');
      setSerial(gear.serial_number || '');
      setCondition(gear.condition || 'Used - Good');
      setRemarks(gear.remarks || '');
    }
  }, [gear]);

  // Multiple images state
  const [images, setImages] = useState<string[]>([]);

  // Update images when gear image URL is available
  useEffect(() => {
    if (gear?.gear_image_url) {
      setImages([gear.gear_image_url]);
    } else {
      setImages([
        'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
        'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
        'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
        'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg'
      ]);
    }
  }, [gear]);

  // Modal state for image preview
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const drawingViewRef = useRef<ViewShot | null>(null);

  // Menu states
  const [serviceMenuVisible, setServiceMenuVisible] = useState(false);
  const [harnessMenuVisible, setHarnessMenuVisible] = useState(false);
  const [sizeMenuVisible, setSizeMenuVisible] = useState(false);
  const [helmetFindingMenuVisible, setHelmetFindingMenuVisible] = useState(false);

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
    
    navigation.navigate('LeadDetail', { lead: currentLead });
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

  const getHelmetFindingLabel = (findingValue: string) => {
    const finding = HELMET_FINDINGS.find(option => option.value === findingValue);
    return finding?.label || 'Select Helmet Finding';
  };

  const handleImagePress = (imageUri: string, index: number) => {
    setSelectedImage(imageUri);
    setSelectedImageIndex(index);
    setModalVisible(true);
    setPaths([]);
    setCurrentPath('');
    setIsDrawingMode(false);
  };

  const addNewImage = () => {
    setShowImageSourceModal(true);
  };

  const handleCameraCaptured = (uri: string) => {
    setImages(prev => [...prev, uri]);
  };

  const requestGalleryPermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    const permission =
      Platform.Version >= 33
        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

    const result = await PermissionsAndroid.request(permission);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  };

  const handlePickFromGallery = async () => {
    const granted = await requestGalleryPermission();
    if (!granted) {
      Alert.alert('Permission required', 'Please allow gallery access to pick images.');
      return;
    }

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

  const handleCloseModal = () => {
    setModalVisible(false);
    setIsDrawingMode(false);
    setCurrentPath('');
    setSelectedImageIndex(null);
    setPaths([]);
  };

  const handleUndoDrawing = () => {
    setPaths(prev => prev.slice(0, -1));
  };

  const handleSaveDrawing = async () => {
    if (!drawingViewRef.current || selectedImageIndex === null) {
      handleCloseModal();
      return;
    }

    try {
      const uri = await drawingViewRef.current.capture?.();

      if (uri) {
        setImages(prev => {
          const updated = [...prev];
          updated[selectedImageIndex] = uri;
          return updated;
        });
      }
    } catch (error) {
      Alert.alert('Save error', 'Unable to save annotated image.');
    } finally {
      handleCloseModal();
    }
  };

  const startDrawing = useCallback(
    (event: GestureResponderEvent) => {
      if (!isDrawingMode) {
        return;
      }
      const { locationX, locationY } = event.nativeEvent;
      setCurrentPath(`M${locationX} ${locationY}`);
    },
    [isDrawingMode],
  );

  const moveDrawing = useCallback(
    (event: GestureResponderEvent) => {
      if (!isDrawingMode) {
        return;
      }
      const { locationX, locationY } = event.nativeEvent;
      setCurrentPath(prev => (prev ? `${prev} L${locationX} ${locationY}` : `M${locationX} ${locationY}`));
    },
    [isDrawingMode],
  );

  const endDrawing = useCallback(() => {
    if (!isDrawingMode) {
      return;
    }
    setCurrentPath(prev => {
      if (!prev) {
        return prev;
      }
      setPaths(pathList => [...pathList, prev]);
      return '';
    });
  }, [isDrawingMode]);

  const drawingResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => isDrawingMode,
        onMoveShouldSetPanResponder: () => isDrawingMode,
        onPanResponderGrant: startDrawing,
        onPanResponderMove: moveDrawing,
        onPanResponderRelease: endDrawing,
        onPanResponderTerminate: endDrawing,
      }),
    [isDrawingMode, startDrawing, moveDrawing, endDrawing],
  );

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
      <ScrollView>
        <Header 
          title="Update Gear Status"
          showBackButton={true}
        />

        {/* Error banner */}
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.errorContainer }]}>
            <IconButton
              icon="alert-circle"
              size={20}
              iconColor={colors.error}
            />
            <Text style={[styles.errorBannerText, { color: colors.error }]}>
              Using fallback data: {error}
            </Text>
          </View>
        )}

        {/* Top summary */}
        <View style={[styles.topCard, { backgroundColor: colors.surface }]}>
          <View style={styles.topLeft}>
            <Text style={styles.smallLabel}>Gear Information</Text>
            <Text style={styles.infoText}>Type: {gear.gear_type.gear_type || 'N/A'}</Text>
            <Text style={styles.infoText}>Serial: {serialNumber}</Text>
            <Text style={styles.infoText}>Manufacturer: {gear?.manufacturer?.manufacturer_name}</Text>
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
            <Text style={styles.infoText}>
              Load No: {gear.load?.name || 'L1'}
            </Text>
            <Text style={styles.infoText}>
              Bin No: {gear.bin?.name || 'B1'}
            </Text>
          </View>
        </View>

        {/* Roster Information */}
        <View style={[styles.rosterCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.cardTitle}>Firefighter Information</Text>
          <View style={styles.rosterInfo}>
            <View style={styles.rosterDetail}>
              <Text style={styles.fieldLabel}>Name</Text>
              <Text style={styles.infoText}>
                {gear.roster.first_name} {gear.roster.middle_name} {gear.roster.last_name}
              </Text>
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
                    onPress={() => handleImagePress(imageUri, index)}
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
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalToolbar}>
              <IconButton
                icon="undo"
                size={26}
                onPress={handleUndoDrawing}
                disabled={!paths.length}
                accessibilityLabel="Undo drawing"
              />
              <IconButton
                icon={isDrawingMode ? 'pencil' : 'pencil-outline'}
                size={26}
                onPress={() => setIsDrawingMode(prev => !prev)}
                accessibilityLabel="Toggle drawing"
              />
            </View>
            <ViewShot
              ref={drawingViewRef}
              style={styles.drawingWrapper}
              options={{ format: 'png', quality: 1, result: 'data-uri' }}
            >
              <View
                style={styles.drawingContent}
                {...(isDrawingMode ? drawingResponder.panHandlers : {})}
              >
                <Image source={{ uri: selectedImage }} style={styles.enlargedImage} />
                <Svg style={StyleSheet.absoluteFill}>
                  {paths.map((pathData, index) => (
                    <Path
                      key={`path-${index}`}
                      d={pathData}
                      stroke="red"
                      strokeWidth={4}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                  {currentPath ? (
                    <Path
                      d={currentPath}
                      stroke="red"
                      strokeWidth={4}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : null}
                </Svg>
              </View>
            </ViewShot>
            {isDrawingMode ? (
              <View style={styles.modalActions}>
                <Button
                  mode="contained"
                  buttonColor="#EA4335"
                  textColor="#fff"
                  onPress={handleCloseModal}
                  style={styles.modalActionButton}
                >
                  Close
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSaveDrawing}
                  disabled={!paths.length}
                  style={styles.modalActionButton}
                >
                  Save
                </Button>
              </View>
            ) : (
              <Button 
                mode="contained" 
                buttonColor="#EA4335"
                textColor="#fff"
                onPress={handleCloseModal}
                style={styles.closeButton}
              >
                Close
              </Button>
            )}
          </View>
        </View>
      </Modal>
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
      <CameraCaptureModal
        visible={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onPhotoCaptured={uri => {
          handleCameraCaptured(uri);
          setShowCameraModal(false);
        }}
      />
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
  modalContent: {
    width: '90%',
    alignItems: 'center',
  },
  modalToolbar: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    marginBottom: 12,
  },
  drawingWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawingContent: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enlargedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  closeButton: {
    marginTop: 16,
    alignSelf: 'stretch',
    width: '100%',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  modalActionButton: {
    flex: 1,
    marginHorizontal: 6,
  },
});