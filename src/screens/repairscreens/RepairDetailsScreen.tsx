// src/screens/repairscreens/RepairDetailsScreen.tsx
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
import { p } from "../../utils/responsive";
import { imageUploadApi } from '../../services/imageUploadApi';
import { repairApi } from '../../services/repairApi';
import { RepairHeader } from './components/RepairHeader';
import RepairPricingCalculator from './components/RepairPricingCalculator';

const RepairDetailsScreen = () => {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { currentLead } = useLeadStore();

  console.log("currentLead", currentLead);
  const { fetchGearById } = useGearStore();

  const { gearId, leadId, leadData, repairId } = route.params;
  console.log("repairId", repairId);

  // Mobile detection
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isMobile = screenWidth < 600;
  const isTablet = screenWidth >= 600 && screenWidth < 1024;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription.remove();
  }, []);

  // State for gear data
  const [gear, setGear] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for repair details
  const [formData, setFormData] = useState({
    spearGear: false,
    repairStatus: '',
    remarks: '',
  });

  // Repair pricing state
  const [repairItems, setRepairItems] = useState<any>({});
  const [repairTotal, setRepairTotal] = useState(0);
  const [isPricingCollapsed, setIsPricingCollapsed] = useState(false);

  // Image assignment state
  const [repairItemsArray, setRepairItemsArray] = useState<any[]>([]);

  // UI state
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isGearInfoCollapsed, setIsGearInfoCollapsed] = useState(true);

  // Images state - Now dynamic with upload support
  const [images, setImages] = useState<Array<{ id: string; uri: string }>>([]);
  const [deletedImages, setDeletedImages] = useState<Array<{ id: string; uri: string }>>([]);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [imageEditorVisible, setImageEditorVisible] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<string>('');

  // Image upload state
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);

  // Repair mode state
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [existingRepairData, setExistingRepairData] = useState<any>(null);

  // Image assignment tracking
  const [currentItemForImages, setCurrentItemForImages] = useState<{
    category: string;
    itemName: string;
  } | null>(null);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Fetch gear data
  useEffect(() => {
    const fetchGearData = async () => {
      if (!gearId) return;

      setLoading(true);
      setError(null);

      try {
        const gearResponse = await fetchGearById(gearId);
        printTable("RepairDetailsScreen - Fetched gear data", gearResponse);

        if (gearResponse) {
          setGear(gearResponse);
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

    fetchGearData();
  }, [gearId, fetchGearById]);

  // Check if we have a repairId and set update mode
  useEffect(() => {
    if (repairId) {
      setIsUpdateMode(true);
      console.log("RepairDetailsScreen - Update mode activated for repair_id:", repairId);
    } else {
      setIsUpdateMode(false);
    }
  }, [repairId]);

  // Fetch existing repair data if in update mode
  useEffect(() => {
    const fetchExistingRepairData = async () => {
      if (!isUpdateMode || !repairId) return;

      try {
        console.log("RepairDetailsScreen - Fetching repair data for repair_id:", repairId);

        const repairResponse = await repairApi.getGearRepair(repairId);

        if (repairResponse.status === true) {
          const repairData = repairResponse.data;
          console.log("RepairDetailsScreen - Fetched repair data:", repairData);

          // Pre-populate form with existing repair data
          setFormData({
            spearGear: repairData.spare_gear || false,
            repairStatus: repairData.repair_status || '',
            remarks: repairData.remarks || '',
          });

          // Set repair total if available
          if (repairData.total_repair_cost) {
            setRepairTotal(repairData.total_repair_cost);
          }

          let transformedRepairItems: any = {};

          // Transform repair_findings into repair_items format expected by RepairPricingCalculator
          if (repairData.repair_findings && Array.isArray(repairData.repair_findings)) {
            repairData.repair_findings.forEach((group: any) => {
              const { group_name, findings } = group;
              // Use the same key transformation as RepairPricingCalculator: lowercase with spaces replaced by dashes
              const categoryKey = group_name.toLowerCase().replace(/\s+/g, '-');
              transformedRepairItems[categoryKey] = {};

              findings.forEach((finding: any) => {
                transformedRepairItems[categoryKey][finding.repair_finding_name] = {
                  repair_finding_id: finding.repair_finding_id,
                  name: finding.repair_finding_name,
                  repair_quantity: finding.repair_quantity,
                  repair_cost: finding.repair_cost.toString(),
                  images: finding.images || []
                };
              });
            });

            setRepairItems(transformedRepairItems);
          }

          // Collect all images from repair findings
          if (repairData.repair_findings && Array.isArray(repairData.repair_findings)) {
            const allImages: Array<{ id: string; uri: string }> = [];

            repairData.repair_findings.forEach((group: any) => {
              group.findings.forEach((finding: any) => {
                if (finding.images && Array.isArray(finding.images)) {
                  finding.images.forEach((imageUrl: string) => {
                    allImages.push({
                      id: `existing-${Date.now()}-${Math.random()}`,
                      uri: imageUrl
                    });
                  });
                }
              });
            });

            console.log("RepairDetailsScreen - Collected images:", allImages);
            setImages(allImages);
          }

          // Add the transformed repair_items to existingRepairData for RepairPricingCalculator
          const repairDataWithItems = {
            ...repairData,
            repair_items: transformedRepairItems
          };

          setExistingRepairData(repairDataWithItems);
        } else {
          setError('Failed to load repair data');
        }
      } catch (error) {
        console.error('Error fetching existing repair data:', error);
        setError('Failed to load existing repair data');
      }
    };

    fetchExistingRepairData();
  }, [isUpdateMode, repairId]);

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

  // Handle form field changes
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle repair pricing changes
  const handleRepairTotalChange = useCallback((total: number, items: any[]) => {
    console.log('🔄 handleRepairTotalChange called with items:', items);
    setRepairTotal(total);
    // items is already the flattened array from RepairPricingCalculator
    setRepairItemsArray(items);
  }, []);

  // Handle repair items change from RepairPricingCalculator
  const handleRepairItemsChange = useCallback((repairItems: any) => {
    console.log('🔄 handleRepairItemsChange called with repairItems:', repairItems);
    setRepairItems(repairItems);
  }, []);

  // Assign image to specific repair item
  const assignImageToRepairItem = useCallback((imageUri: string, category: string, itemName: string) => {
    console.log('📸 Assigning image to repair item:', { imageUri, category, itemName });
    setRepairItems((prev: any) => {
      console.log('📸 Previous repairItems:', JSON.stringify(prev, null, 2));
      const newItems = { ...prev };

      // Ensure category exists
      if (!newItems[category]) {
        console.log('📸 Creating new category:', category);
        newItems[category] = {};
      }

      // Ensure item exists
      if (!newItems[category][itemName]) {
        console.log('📸 Creating new item:', itemName, 'in category:', category);
        newItems[category][itemName] = { images: [] };
      }

      // Ensure images array exists
      if (!newItems[category][itemName].images) {
        newItems[category][itemName].images = [];
      }

      // Add the image
      newItems[category][itemName].images.push(imageUri);
      console.log('📸 Updated repairItems:', JSON.stringify(newItems, null, 2));
      console.log('📸 Total categories after update:', Object.keys(newItems).length);
      Object.keys(newItems).forEach(cat => {
        console.log(`📸 Category ${cat} has ${Object.keys(newItems[cat]).length} items`);
      });

      return newItems;
    });
  }, []);

  // Handle image selection for specific repair items
  const handleImageSelectForItem = useCallback((category: string, itemName: string) => {
    // Track which item the images should be assigned to
    setCurrentItemForImages({ category, itemName });
    setShowImageSourceModal(true);
    console.log('Selecting images for:', category, itemName);
  }, []);

  // Remove image from specific repair item
  const handleRemoveImageFromItem = useCallback((category: string, itemName: string, imageUri: string) => {
    setRepairItems((prev: any) => {
      const newItems = { ...prev };
      if (newItems[category] && newItems[category][itemName] && newItems[category][itemName].images) {
        newItems[category][itemName].images = newItems[category][itemName].images.filter(
          (uri: string) => uri !== imageUri
        );
      }
      return newItems;
    });

    // Also remove from the main images array
    setImages(prev => prev.filter(img => img.uri !== imageUri));
    setDeletedImages(prev => [...prev, ...prev.filter(img => img.uri === imageUri)]);
  }, []);

  // Image handling functions
  const handleImagePress = (imageUri: string) => {
    setImageToEdit(imageUri);
    setImageEditorVisible(true);
  };

  const handleImageEditorSave = (editedImageUri: string) => {
    setImages((prev: Array<{ id: string; uri: string }>) => {
      const index = prev.findIndex(img => img.uri === imageToEdit);
      if (index !== -1) {
        const newImages = [...prev];
        newImages[index] = { ...newImages[index], uri: editedImageUri };
        return newImages;
      }
      return prev;
    });
    setImageEditorVisible(false);
    setImageToEdit('');
  };

  const addNewImage = () => {
    setShowImageSourceModal(true);
  };

  const handleCameraCaptured = (uri: string) => {
    const newImage = { id: `camera-${Date.now()}`, uri };
    setImages((prev: Array<{ id: string; uri: string }>) => [...prev, newImage]);

    // Assign image to current repair item if one is selected
    if (currentItemForImages) {
      assignImageToRepairItem(newImage.uri, currentItemForImages.category, currentItemForImages.itemName);
      setCurrentItemForImages(null);
    }
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
        const newImage = { id: `gallery-${Date.now()}`, uri };
        setImages((prev: Array<{ id: string; uri: string }>) => [...prev, newImage]);

        // Assign image to current repair item if one is selected
        if (currentItemForImages) {
          assignImageToRepairItem(newImage.uri, currentItemForImages.category, currentItemForImages.itemName);
          setCurrentItemForImages(null);
        }
      }
    } catch (error) {
      Alert.alert('Image picker error', 'Unable to select image from gallery.');
    }
  };

  // Remove image by ID (soft delete - move to deleted array)
  const handleRemoveImage = (imageId: string) => {
    const imageToRemove = images.find(img => img.id === imageId);
    if (imageToRemove) {
      setImages(prev => prev.filter(img => img.id !== imageId));
      setDeletedImages(prev => [...prev, imageToRemove]);

      // Also remove from repair items
      setRepairItems((prev: any) => {
        const newItems = { ...prev };
        Object.keys(newItems).forEach(category => {
          Object.keys(newItems[category]).forEach(itemName => {
            if (newItems[category][itemName].images) {
              newItems[category][itemName].images = newItems[category][itemName].images.filter(
                (uri: string) => uri !== imageToRemove.uri
              );
            }
          });
        });
        return newItems;
      });

      console.log('Image marked for deletion:', imageToRemove.uri);
    }
  };

  // Restore a deleted image by ID
  const handleRestoreImage = (imageId: string) => {
    const imageToRestore = deletedImages.find(img => img.id === imageId);
    if (imageToRestore) {
      setDeletedImages((prev: Array<{ id: string; uri: string }>) => prev.filter(img => img.id !== imageId));
      setImages((prev: Array<{ id: string; uri: string }>) => [...prev, imageToRestore]);
      console.log('Image restored:', imageToRestore.uri);
    }
  };

  // Save repair data (create or update)
  const handleSaveRepair = async () => {
    console.log('🔧 SAVE REPAIR TRIGGERED');
    console.log(`Mode: ${isUpdateMode ? 'UPDATE' : 'CREATE'}`);
    console.log(`Repair Total: $${repairTotal}`);
    console.log(`Repair Status: ${formData.repairStatus}`);
    console.log(`Current Images Count: ${images.length}`);

    if (repairTotal === 0) {
      Alert.alert('Error', 'Please add at least one repair item');
      return;
    }

    try {
      setUploadingImages(true);

      // Step 1: Upload new images (local file URIs) using repair-specific endpoint
      const localImages = images.filter(img =>
        img.uri.startsWith('file://') || img.uri.startsWith('content://')
      ).map(img => img.uri);

      const alreadyUploadedImages = images.filter(img =>
        img.uri.startsWith('http://') || img.uri.startsWith('https://')
      ).map(img => img.uri);

      let uploadedImageUrls: string[] = [...alreadyUploadedImages];

      if (localImages.length > 0) {
        console.log(`📤 Uploading ${localImages.length} repair images...`);

        // Upload images sequentially using repair upload endpoint
        for (let i = 0; i < localImages.length; i++) {
          const imageUri = localImages[i];
          const filename = imageUri.split('/').pop() || 'image.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';

          // Create FormData for each image
          const formData = new FormData();
          formData.append('image', {
            uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
            name: filename,
            type: type,
          } as any);
          formData.append('gear_id', gearId.toString());

          try {
            setUploadProgress({
              current: i + 1,
              total: localImages.length,
              percentage: Math.round(((i + 1) / localImages.length) * 100)
            });

            console.log(`📤 Uploading repair image ${i + 1}/${localImages.length}: ${filename}`);

            const uploadResult = await repairApi.uploadRepairImage(formData);

            // Handle different response formats from repair upload endpoint
            if (uploadResult.status && (uploadResult.data?.url || uploadResult.uploaded?.[0]?.public_image_url)) {
              const imageUrl = uploadResult.data?.url || uploadResult.uploaded?.[0]?.public_image_url;
              uploadedImageUrls.push(imageUrl);
              console.log(`✅ Repair image ${i + 1} uploaded:`, imageUrl);
            } else {
              const errorMessage = uploadResult.message || uploadResult.errors?.[0] || 'Upload failed';
              console.error(`❌ Failed to upload repair image ${i + 1}:`, errorMessage);
              Alert.alert('Upload Warning', `Failed to upload image ${i + 1}: ${errorMessage}`);
            }
          } catch (error: any) {
            console.error(`❌ Error uploading repair image ${i + 1}:`, error);
            Alert.alert('Upload Error', `Failed to upload image ${i + 1}: ${error.message || 'Network error'}`);
          }
        }
      }

      console.log('📷 Final repair image URLs:', uploadedImageUrls);

      // Update state with uploaded image URLs
      setUploadedImageUrls(uploadedImageUrls);
      setUploadingImages(false);

      // Step 2: Get current repair items array and distribute uploaded image URLs
      const currentRepairItemsArray = [...repairItemsArray];

      // Create mapping from local file URIs to uploaded URLs
      const imageUrlMap = new Map<string, string>();
      images.forEach((img, index) => {
        if (uploadedImageUrls[index]) {
          imageUrlMap.set(img.uri, uploadedImageUrls[index]);
        }
      });

      // Replace local file URIs with uploaded URLs in repair items
      currentRepairItemsArray.forEach(item => {
        if (item.images && item.images.length > 0) {
          item.images = item.images.map((imageUri: string) => {
            return imageUrlMap.get(imageUri) || imageUri; // Use uploaded URL if available, otherwise keep original
          });
        }
        // Remove the name field as it's not needed in the API payload
        delete item.name;
      });

      console.log('📋 Current Repair Items Array (after URL distribution):');
      currentRepairItemsArray.forEach((item, index) => {
        console.log(`  Item ${index + 1}: Finding ${item.repair_finding_id}, Qty: ${item.repair_quantity}, Images: ${item.images?.length || 0}`);
        if (item.images && item.images.length > 0) {
          item.images.forEach((imgUrl: string, imgIndex: number) => {
            console.log(`    Image ${imgIndex + 1}: ${imgUrl}`);
          });
        }
      });

      // Step 3: Prepare repair data
      const repairData = {
        lead_id: currentLead?.lead_id || leadId,
        firestation_id: currentLead?.firestation?.id || leadData?.firestation_id,
        gear_id: gearId,
        roster_id: gear?.roster?.roster_id || null,
        franchise_id: currentLead?.franchise?.id || leadData?.franchise_id,
        repair_status: formData.repairStatus as 'complete' | 'incomplete',
        repair_sub_total: repairTotal,
        repair_cost: repairTotal,
        remarks: formData.remarks,
        repair_items: currentRepairItemsArray,
        spare_gear: formData.spearGear,
      };

      // Enhanced logging for the payload
      console.log('🚀 FINAL REPAIR PAYLOAD BEING SENT:');
      console.log('='.repeat(50));
      console.log('📋 Basic Info:');
      console.log(`  Lead ID: ${repairData.lead_id}`);
      console.log(`  Firestation ID: ${repairData.firestation_id}`);
      console.log(`  Gear ID: ${repairData.gear_id}`);
      console.log(`  Roster ID: ${repairData.roster_id}`);
      console.log(`  Franchise ID: ${repairData.franchise_id}`);
      console.log(`  Status: ${repairData.repair_status}`);
      console.log(`  Total Cost: $${repairData.repair_cost}`);
      console.log(`  Remarks: ${repairData.remarks || 'None'}`);
      console.log(`  Spare Gear: ${repairData.spare_gear}`);

      console.log('\n📦 Repair Items:');
      repairData.repair_items.forEach((item, index) => {
        console.log(`  Item ${index + 1}:`);
        console.log(`    Finding ID: ${item.repair_finding_id}`);
        console.log(`    Quantity: ${item.repair_quantity}`);
        console.log(`    Cost: $${item.repair_cost}`);
        console.log(`    Images (${item.images?.length || 0}):`);
        if (item.images && item.images.length > 0) {
          item.images.forEach((imgUrl: string, imgIndex: number) => {
            console.log(`      ${imgIndex + 1}. ${imgUrl}`);
          });
        } else {
          console.log(`      No images assigned`);
        }
        console.log('');
      });

      console.log('='.repeat(50));
      console.log('Full Payload Object:', JSON.stringify(repairData, null, 2));

      // Step 3: Create or update repair via API
      let repairResponse;
      if (isUpdateMode && repairId) {
        // Update existing repair
        console.log(`🔄 UPDATING REPAIR - API Call: PUT /gear-repair/${repairId}/`);
        console.log('Repair ID:', repairId);
        repairResponse = await repairApi.updateGearRepair(repairId, repairData);
      } else {
        // Create new repair
        console.log('➕ CREATING NEW REPAIR - API Call: POST /gear-repair/');
        repairResponse = await repairApi.createGearRepair(repairData);
      }

      if (repairResponse.status === true) {
        const successMessage = isUpdateMode
          ? (repairResponse.message || 'Repair updated successfully!')
          : (repairResponse.message || 'Repair created successfully!');
        Alert.alert('Success', successMessage);
        // Navigate back
        // navigation.goBack();
      } else {
        // Handle specific error cases like duplicates
        const errorMsg = repairResponse.message || `Failed to ${isUpdateMode ? 'update' : 'create'} repair`;
        Alert.alert('Error', errorMsg);
        return; // Don't navigate back on error
      }
    } catch (error: any) {
      setUploadingImages(false);
      console.error(`❌ Error ${isUpdateMode ? 'updating' : 'creating'} repair:`, error);
      Alert.alert('Error', error.message || 'Network error');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title={'Repair Details'}
          showBackButton={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>Loading gear details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error && !gear) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title={'Repair Details'}
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
          title={'Repair Details'}
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
      {/* Repair Header with Collapsible Firefighter Information */}
      <RepairHeader
        gear={gear}
        roster={gear?.roster || null}
        isCollapsed={isGearInfoCollapsed}
        onToggleCollapse={() => setIsGearInfoCollapsed(!isGearInfoCollapsed)}
        scrollY={scrollY}
        onHistoryPress={() => {
          if (gear?.gear_id) {
            navigation.navigate('GearDetail', { gear_id: gear.gear_id });
          }
        }}
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

        {/* Repair Pricing Calculator */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>

          <RepairPricingCalculator
            onTotalChange={handleRepairTotalChange}
            initialData={existingRepairData}
            currentRepairItems={repairItems}
            onRepairItemsChange={handleRepairItemsChange}
            isCollapsed={isPricingCollapsed}
            onToggleCollapse={() => setIsPricingCollapsed(!isPricingCollapsed)}
            onImageSelectForItem={handleImageSelectForItem}
            onRemoveImageFromItem={handleRemoveImageFromItem}
          />
        </View>

        {/* Repair Settings - Spare Gear and Status */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.responsiveRow, isTablet && styles.tabletRow]}>
            {/* Spare Gear Toggle */}
            <View style={[styles.responsiveColumn, isTablet && styles.tabletColumn]}>
              <View style={styles.rowSpace}>
                <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Spare Gear</Text>
                <View style={styles.toggleContainer}>
                  <Switch
                    value={formData.spearGear}
                    onValueChange={(value) => handleFieldChange('spearGear', value)}
                  />
                </View>
              </View>
            </View>

            {/* Repair Status */}
            <View style={[styles.responsiveColumn, isTablet && { ...styles.tabletColumn, marginRight: 0 }]}>
              <View style={styles.rowSpace}>
                <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Status</Text>
                <View style={styles.rowWrap}>
                  <Chip
                    selected={formData.repairStatus === 'complete'}
                    onPress={() => handleFieldChange('repairStatus', 'complete')}
                    style={[
                      styles.smallChoice,
                      {
                        backgroundColor: formData.repairStatus === 'complete' ? '#34A853' : colors.surfaceVariant
                      }
                    ]}
                    textStyle={{
                      color: formData.repairStatus === 'complete' ? '#fff' : colors.onSurfaceVariant,
                      fontSize: 12
                    }}
                  >
                    Complete
                  </Chip>
                  <Chip
                    selected={formData.repairStatus === 'incomplete'}
                    onPress={() => handleFieldChange('repairStatus', 'incomplete')}
                    style={[
                      styles.smallChoice,
                      {
                        backgroundColor: formData.repairStatus === 'incomplete' ? '#EA4335' : colors.surfaceVariant
                      }
                    ]}
                    textStyle={{
                      color: formData.repairStatus === 'incomplete' ? '#fff' : colors.onSurfaceVariant,
                      fontSize: 12
                    }}
                  >
                    Incomplete
                  </Chip>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Remarks */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
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
            onPress={handleSaveRepair}
            loading={uploadingImages}
            disabled={uploadingImages || repairTotal === 0}
          >
            {uploadingImages
              ? (isUpdateMode ? 'Updating...' : 'Creating...')
              : (isUpdateMode ? 'Update Repair' : 'Create Repair')
            }
          </Button>
        </View>
      </ScrollView>

      {/* Modals */}
      <ImageSourcePickerModal
        visible={showImageSourceModal}
        onDismiss={() => {
          setShowImageSourceModal(false);
          setCurrentItemForImages(null);
        }}
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
        onClose={() => {
          setShowCameraModal(false);
          setCurrentItemForImages(null);
        }}
        onPhotoCaptured={handleCameraCaptured}
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
};

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
    fontSize: 16,
    fontWeight: '700',
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

  // Responsive layout styles
  responsiveRow: {
    flexDirection: 'column',
  },
  tabletRow: {
    flexDirection: 'row',
  },
  responsiveColumn: {
    marginBottom: 16,
  },
  tabletColumn: {
    flex: 1,
    marginBottom: 0,
    marginRight: 16,
  },

  // Toggle styles
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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

export default RepairDetailsScreen;
