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

  // Mobile detection
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isMobile = screenWidth < 600;

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
    repairTag: '',
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
            repairTag: repairData.repair_tag || '',
            spearGear: repairData.spare_gear || false,
            repairStatus: repairData.repair_status || '',
            remarks: repairData.remarks || '',
          });

          // Pre-populate repair items if they exist
          if (repairData.repair_items) {
            setRepairItems(repairData.repair_items);
          }

          // Pre-populate images if they exist
          if (repairData.repair_images && Array.isArray(repairData.repair_images)) {
            const existingImages = repairData.repair_images.map((img: any) => ({
              id: `existing-${img.image_id}`,
              uri: img.image_urls,
            }));
            setImages(existingImages);
          }

          setExistingRepairData(repairData);
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
    setRepairTotal(total);
    setRepairItems(items);

    // Update the flat array for image assignment display
    const flatArray = Object.values(items as any).reduce((allItems: any[], categoryItems: any) => {
      return allItems.concat(
        Object.values(categoryItems).map((item: any) => ({
          repair_finding_id: parseInt(item.repair_finding_id || item.id),
          repair_quantity: item.repair_quantity || item.quantity,
          repair_cost: item.repair_cost || item.price,
          name: item.name,
          images: item.images || []
        }))
      );
    }, []);
    setRepairItemsArray(flatArray);
  }, []);

  // Image handling functions
  const handleImagePress = (imageUri: string) => {
    setImageToEdit(imageUri);
    setImageEditorVisible(true);
  };

  const handleImageEditorSave = (editedImageUri: string) => {
    setImages(prev => {
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
    setImages(prev => [...prev, { id: `camera-${Date.now()}`, uri }]);
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
        setImages(prev => [...prev, { id: `gallery-${Date.now()}`, uri }]);
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

  // Save repair data (create or update)
  const handleSaveRepair = async () => {
    if (repairTotal === 0) {
      Alert.alert('Error', 'Please add at least one repair item');
      return;
    }

    if (!formData.repairTag.trim()) {
      Alert.alert('Error', 'Please fill in repair tag');
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

      // Step 2: Get current repair items array and distribute uploaded images
      const currentRepairItemsArray = [...repairItemsArray];

      // Distribute uploaded images across repair findings (for now, distribute evenly)
      // TODO: Add UI to allow users to assign images to specific repair findings
      if (uploadedImageUrls.length > 0 && currentRepairItemsArray.length > 0) {
        currentRepairItemsArray.forEach((item, index) => {
          // For now, assign images in round-robin fashion
          // This can be improved with proper image assignment UI
          const imagesForThisItem = [];
          for (let i = index; i < uploadedImageUrls.length; i += currentRepairItemsArray.length) {
            imagesForThisItem.push(uploadedImageUrls[i]);
          }
          item.images = imagesForThisItem;
        });
      }

      // Step 3: Prepare repair data
      const repairData = {
        lead_id: currentLead?.lead_id || leadId,
        firestation_id: currentLead?.firestation?.id || leadData?.firestation_id,
        gear_id: gearId,
        roster_id: gear?.roster?.roster_id || null,
        franchise_id: currentLead?.franchise?.id || leadData?.franchise_id,
        repair_status: formData.repairStatus as 'completed' | 'rejected',
        repair_sub_total: repairTotal,
        repair_cost: repairTotal,
        remarks: formData.remarks,
        repair_items: currentRepairItemsArray,
        spare_gear: formData.spearGear,
      };

      console.log('Repair Data:', repairData);

      // Step 3: Create or update repair via API
      let repairResponse;
      if (isUpdateMode && repairId) {
        // Update existing repair
        console.log('🔄 Updating existing repair with ID:', repairId);
        repairResponse = await repairApi.updateGearRepair(repairId, repairData);
      } else {
        // Create new repair
        console.log('➕ Creating new repair');
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
            isCollapsed={isPricingCollapsed}
            onToggleCollapse={() => setIsPricingCollapsed(!isPricingCollapsed)}
          />
        </View>

        {/* Basic Repair Details */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Repair Details</Text>

          {/* Repair Tag */}
          <Input
            label="Repair Tag *"
            value={formData.repairTag}
            onChangeText={(text) => handleFieldChange('repairTag', text)}
            placeholder="Enter repair tag"
            style={{ marginBottom: 16 }}
          />

          {/* Spear Gear Toggle */}
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

        {/* Repair Images */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Repair Images</Text>

          <View style={styles.imagesContainer}>
            {images.map((image) => (
              <View key={image.id} style={styles.imageWrapper}>
                <TouchableOpacity
                  style={styles.imageBox}
                  onPress={() => handleImagePress(image.uri)}
                >
                  <Image
                    source={{ uri: image.uri }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
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
        </View>

        {/* Image Assignment to Repair Findings */}
        {uploadedImageUrls.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Assign Images to Repair Findings</Text>
            <Text style={[styles.sectionDescription, { color: colors.onSurfaceVariant }]}>
              Images have been automatically distributed to repair findings. You can modify assignments as needed.
            </Text>

            {repairItemsArray.map((repairItem: any, index: number) => {
              const finding = repairItem;
              return (
                <View key={`finding-${finding.repair_finding_id}`} style={styles.findingImageSection}>
                  <Text style={[styles.findingTitle, { color: colors.onSurface }]}>
                    {finding.name || `Repair Finding ${finding.repair_finding_id}`}
                  </Text>
                  <Text style={[styles.findingSubtitle, { color: colors.onSurfaceVariant }]}>
                    Quantity: {finding.repair_quantity}, Cost: ${finding.repair_cost}
                  </Text>

                  <View style={styles.assignedImagesContainer}>
                    {finding.images && finding.images.map((imageUrl: string, imgIndex: number) => {
                      const originalImage = images.find(img => img.uri === imageUrl);
                      return (
                        <View key={`${finding.repair_finding_id}-img-${imgIndex}`} style={styles.assignedImageWrapper}>
                          <Image
                            source={{ uri: imageUrl }}
                            style={styles.assignedImage}
                            resizeMode="cover"
                          />
                        </View>
                      );
                    })}
                    {(!finding.images || finding.images.length === 0) && (
                      <Text style={[styles.noImagesText, { color: colors.onSurfaceVariant }]}>
                        No images assigned
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

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

        {/* Repair Status */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Repair Status</Text>

          <View style={styles.rowSpace}>
            <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Status</Text>
            <View style={styles.rowWrap}>
              <Chip
                selected={formData.repairStatus === 'completed'}
                onPress={() => handleFieldChange('repairStatus', 'completed')}
                style={[
                  styles.smallChoice,
                  {
                    backgroundColor: formData.repairStatus === 'completed' ? '#34A853' : colors.surfaceVariant
                  }
                ]}
                textStyle={{
                  color: formData.repairStatus === 'completed' ? '#fff' : colors.onSurfaceVariant,
                  fontSize: 12
                }}
              >
                Completed
              </Chip>
              <Chip
                selected={formData.repairStatus === 'rejected'}
                onPress={() => handleFieldChange('repairStatus', 'rejected')}
                style={[
                  styles.smallChoice,
                  {
                    backgroundColor: formData.repairStatus === 'rejected' ? '#EA4335' : colors.surfaceVariant
                  }
                ]}
                textStyle={{
                  color: formData.repairStatus === 'rejected' ? '#fff' : colors.onSurfaceVariant,
                  fontSize: 12
                }}
              >
                Rejected
              </Chip>
            </View>
          </View>
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
            disabled={uploadingImages || repairTotal === 0 || !formData.repairTag.trim()}
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

  // Image Assignment Styles
  sectionDescription: {
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 16,
  },
  findingImageSection: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  findingTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  findingSubtitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  assignedImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  assignedImageWrapper: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  assignedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noImagesText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
});

export default RepairDetailsScreen;
