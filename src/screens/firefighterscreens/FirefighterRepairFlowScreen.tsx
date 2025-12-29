// src/screens/firefighterscreens/FirefighterRepairFlowScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  FlatList,
  Dimensions,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  useTheme,
  IconButton,
  ActivityIndicator,
  Divider,
  Icon,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import Header from '../../components/common/Header';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import AddFirefighterModal from '../../components/common/Modal/AddFirefighterModal';
import RosterModal from '../../components/common/Modal/RosterModal';
import { useInspectionStore } from '../../store/inspectionStore';
import { useRepairStore } from '../../store/repairStore';
import { useLeadStore } from '../../store/leadStore';
import { useGearStore } from '../../store/gearStore';
import { ColorPickerModal } from '../../components/common';
import Pagination from '../../components/common/Pagination';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { inspectionApi } from '../../services/inspectionApi';
import { getColorHex } from '../../constants/colors';
import { GEAR_IMAGE_URLS, getGearIconImage } from '../../constants/gearImages';
import { gearApi } from '../../services/gearApi';
import { getStatusColor } from '../../constants/inspection';

const TAG_COLOR_STORAGE_KEY = '@firefighter_repair_tag_color';


// Gear categories with images and matching gear types
const GEAR_CATEGORIES = [
  {
    id: 'jackets',
    title: 'Jackets',
    image: GEAR_IMAGE_URLS.jacket,
    color: '#FF6B6B',
    gearTypes: ['JACKET LINER', 'JACKET SHELL'],
    fields: ['Primary Liner', 'Primary Shell', 'Moisture Barrier']
  },
  {
    id: 'pants',
    title: 'Pants',
    image: GEAR_IMAGE_URLS.pants,
    color: '#4ECDC4',
    gearTypes: ['PANT LINER', 'PANT SHELL', 'PANTS LINER', 'PANTS SHELL'],
    fields: ['Primary Shell', 'Primary Liner', 'Moisture Barrier']
  },
  {
    id: 'helmets',
    title: 'Helmets',
    image: GEAR_IMAGE_URLS.helmet,
    color: '#45B7D1',
    gearTypes: ['HELMET'],
    fields: ['Helmet', 'Face Shield', 'Suspension System']
  },
  {
    id: 'gloves',
    title: 'Gloves',
    image: GEAR_IMAGE_URLS.gloves,
    color: '#96CEB4',
    gearTypes: ['GLOVES'],
    fields: ['Gloves', 'Wristlets', 'Knit Wrist']
  },
  {
    id: 'boots',
    title: 'Boots',
    image: GEAR_IMAGE_URLS.boots,
    color: '#FFEAA7',
    gearTypes: ['BOOTS'],
    fields: ['Boots', 'Steel Toe', 'Outsole']
  },
  {
    id: 'others',
    title: 'Others',
    image: GEAR_IMAGE_URLS.other,
    color: '#DDA0DD',
    gearTypes: ['HOOD', 'SCBA'],
    fields: ['Jump Suit', 'Hood', 'SCBA Harness']
  },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GearScan' | 'RepairDetails'>;

const FirefighterRepairFlowScreen = () => {

  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { currentLead } = useLeadStore();
  const { gearTypes, fetchGearTypes } = useGearStore();
    const route = useRoute<any>();

  const { firefighter} = route.params ?? {};
  console.log("Selected_firefighter for repair", firefighter)
  const {
    firefighterGears: inspectionGears,
    fetchFirefighterGears,
    clearFirefighterGears
  } = useInspectionStore();

  const {
    firefighterRepairGears,
    loading,
    pagination,
    fetchFirefighterRepairGears,
    clearFirefighterRepairGears
  } = useRepairStore();

  const [selectedFirefighter, setSelectedFirefighter] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [rosterModalVisible, setRosterModalVisible] = useState(false);
  const [addFirefighterModalVisible, setAddFirefighterModalVisible] = useState(false);
  const [rosterColor, setRosterColor] = useState<string >("");
  const [colorLocked, setColorLocked] = useState<boolean>(false);
  const [colorPickerVisible, setColorPickerVisible] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [usedColors, setUsedColors] = useState<string[]>([]);
  const [loadingUsedColors, setLoadingUsedColors] = useState<boolean>(false);
  const [orientation, setOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>(
    Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT'
  );
  const [isTablet, setIsTablet] = useState<boolean>(
    Math.min(Dimensions.get('window').width, Dimensions.get('window').height) >= 600
  );
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState<number>(50); // Items per page
  const numberOfItemsPerPageList = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500]; // Page size options


useFocusEffect(
  React.useCallback(() => {
    console.log("🔧 Repair Screen Focused – Re-loading firefighter:", firefighter);

    if (firefighter) {
      handleFirefighterSelect(firefighter);
    } else if (selectedFirefighter && currentLead) {
      // Refresh repair gears when screen is focused and firefighter is already selected
      console.log("🔧 Repair Screen Focused – Refreshing repair gears for selected firefighter");
      fetchFirefighterRepairGears(currentLead.lead_id, selectedFirefighter.roster_id || selectedFirefighter.id, 1, numberOfItemsPerPage);
    }

    return () => {
      // optional cleanup if needed
    };
  }, [firefighter, selectedFirefighter, currentLead, fetchFirefighterRepairGears, numberOfItemsPerPage])
);

  // Effect for handling screen orientation changes
  useEffect(() => {
    const updateLayout = () => {
      const { width, height } = Dimensions.get('window');
      setOrientation(width > height ? 'LANDSCAPE' : 'PORTRAIT');
      setIsTablet(Math.min(width, height) >= 600);
    };

    const subscription = Dimensions.addEventListener('change', updateLayout);
    return () => subscription.remove();
  }, []);

  const isPortrait = orientation === 'PORTRAIT';

  // Fetch gear types on component mount
  useEffect(() => {
    fetchGearTypes();
  }, [fetchGearTypes]);

  const handleFirefighterSelect = async (roster: any) => {
    if (!currentLead) {
      Alert.alert('Error', 'No lead selected');
      return;
    }

    // Clear color state when changing firefighter - will be set again if gear has tag_color
    setRosterColor("");
    setColorLocked(false);
    setSelectedFirefighter(roster);
    setSelectedCategory(null);

    try {
      await fetchFirefighterRepairGears(currentLead.lead_id, roster.roster_id, 1, numberOfItemsPerPage);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch repair gears');
    }
  };

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    if (!selectedFirefighter || !currentLead) {
      setRefreshing(false);
      return;
    }

    setRefreshing(true);
    try {
      await fetchFirefighterRepairGears(currentLead.lead_id, selectedFirefighter.roster_id, 1, numberOfItemsPerPage);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh repair gears');
    } finally {
      setRefreshing(false);
    }
  }, [selectedFirefighter, currentLead, fetchFirefighterRepairGears, numberOfItemsPerPage]);

  // Clear repair gears when firefighter is deselected
  useEffect(() => {
    if (!selectedFirefighter) {
      clearFirefighterRepairGears();
      // Clear color state when firefighter is deselected
      setRosterColor("");
      setColorLocked(false);
      AsyncStorage.removeItem(TAG_COLOR_STORAGE_KEY);
    }
  }, [selectedFirefighter]);

useEffect(() => {
  if (!inspectionGears || inspectionGears.length === 0) {
    // No gears or empty array - clear color state
    setRosterColor("");
    setColorLocked(false);
    return;
  }

  // Find first gear with current inspection & tag_color
  const found = inspectionGears.find(
    g => g?.current_inspection?.tag_color
  );

  if (found) {
    // Case 1: color exists → lock it
    const color = found.current_inspection.tag_color.toLowerCase().trim();
    setRosterColor(color);
    setColorLocked(true);
    // Save to AsyncStorage
    AsyncStorage.setItem(TAG_COLOR_STORAGE_KEY, color);
  } else {
    // Case 2: no gear with tag_color → clear color and unlock
    setRosterColor("");
    setColorLocked(false);
    // Clear AsyncStorage to avoid using old color
    AsyncStorage.removeItem(TAG_COLOR_STORAGE_KEY);
  }
}, [inspectionGears]);

// Save tag color to AsyncStorage whenever rosterColor changes
useEffect(() => {
  if (rosterColor) {
    console.log("User_selected_roster_color_from_firefighter_repair_flow_screen:", rosterColor);
    AsyncStorage.setItem(TAG_COLOR_STORAGE_KEY, rosterColor);
  }
}, [rosterColor]);



  // Check if gear matches category (handles plural/singular and case variations)
  const gearMatchesCategory = (gearTypeName: string, categoryGearTypes: string[]): boolean => {
    if (!gearTypeName) return false;
    const normalized = gearTypeName.toUpperCase().trim();

    return categoryGearTypes.some(catType => {
      const normalizedCatType = catType.toUpperCase().trim();

      // Exact match
      if (normalized === normalizedCatType) return true;

      // Handle plural/singular variations for pants
      if ((normalized.includes('PANT') || normalized.includes('PANTS')) &&
          (normalizedCatType.includes('PANT') || normalizedCatType.includes('PANTS'))) {
        const hasShell = normalized.includes('SHELL') && normalizedCatType.includes('SHELL');
        const hasLiner = normalized.includes('LINER') && normalizedCatType.includes('LINER');
        if (hasShell || hasLiner) return true;
      }

      // Handle jacket variations
      if (normalized.includes('JACKET') && normalizedCatType.includes('JACKET')) {
        const hasShell = normalized.includes('SHELL') && normalizedCatType.includes('SHELL');
        const hasLiner = normalized.includes('LINER') && normalizedCatType.includes('LINER');
        if (hasShell || hasLiner) return true;
      }

      // For simple types (HELMET, GLOVES, BOOTS, HOOD, SCBA), check if contains
      if (normalized.includes(normalizedCatType) || normalizedCatType.includes(normalized)) {
        return true;
      }

      return false;
    });
  };

  // Filter gears by category
  const getGearsByCategory = (categoryId: string) => {
    const category = GEAR_CATEGORIES.find(cat => cat.id === categoryId);
    if (!category) return [];

    // Direct gear_type_id to category mapping (fallback for known types)
    const gearTypeIdToCategory: { [key: number]: string[] } = {
      8: ['others'], // Hood -> Others
    };

    return firefighterRepairGears
      .filter(gear => {
        // Check direct gear_type_id mapping first
        const mappedCategories = gearTypeIdToCategory[gear.gear?.gear_type?.gear_type_id];
        if (mappedCategories && mappedCategories.includes(categoryId)) {
          return true;
        }

        // Find the gear type name from gearTypes store using gear_type_id
        const gearType = gearTypes.find(gt => gt.gear_type_id === gear.gear?.gear_type?.gear_type_id);
        const gearTypeName = gearType?.gear_type || gear.gear?.gear_name;

        return gearMatchesCategory(gearTypeName, category.gearTypes);
      })
      .map(gear => {
        // Add fallback roster info for unrepaired gears
        if (!gear.current_repair?.roster && selectedFirefighter) {
          return {
            ...gear,
            current_repair: {
              ...gear.current_repair,
              roster: selectedFirefighter,
            }
          };
        }
        return gear;
      });
  };

  // Get category repair summary
const getCategoryRepairSummary = (categoryId:string) => {
  const categoryGears = getGearsByCategory(categoryId);
  const category = GEAR_CATEGORIES.find(cat => cat.id === categoryId);

  if (!category || categoryGears.length === 0) {
    return [];
  }

  // Build summary for each gear
  const summary = categoryGears.map(gear => {
    const usage = gear.gear_usage || "PRIMARY";
    const name = gear.gear?.gear_name;

    const currentStatus = gear.current_repair?.repair_status || "No Current Repair";
    const previousStatus = gear.previous_repair?.repair_status || "No Previous Repair";

    return {
      gear_id: gear.gear?.gear_id,
      gear_name: name,
      gear_usage: usage,
      current_status: currentStatus,
      previous_status: previousStatus,
    };
  });

  return summary;
};



// Local getStatusColor function removed - use global getStatusColor from inspection constants instead




  // Get gear repair status from current repair
  const getGearStatus = (gear: any) => {
    if (!gear.current_repair) return '';

    const repairStatus = gear.current_repair.repair_status;
    if (!repairStatus) return '';

    return repairStatus;
  };

  const handleCategoryPress = (categoryId: string) => {
    if (!selectedFirefighter) {
      Alert.alert('Select Firefighter', 'Please select a firefighter first');
      return;
    }
    // Toggle category - if same category clicked, deselect it
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };




  const handleGearPress = (gear: any) => {
  console.log("handleGearPress for repair",{ gear, selectedFirefighter});

  // Use roster from gear's current_repair if available AND valid, otherwise use selectedFirefighter
  const roster = gear.current_repair?.roster?.roster_id
    ? {
        roster_id: gear.current_repair.roster.roster_id,
        id: gear.current_repair.roster.roster_id,
        first_name: gear.current_repair.roster.first_name || '',
        middle_name: gear.current_repair.roster.middle_name || '',
        last_name: gear.current_repair.roster.last_name || '',
        email: gear.current_repair.roster.email || '',
        phone: gear.current_repair.roster.phone || '',
        name: `${gear.current_repair.roster.first_name || ''} ${gear.current_repair.roster.middle_name || ''} ${gear.current_repair.roster.last_name || ''}`.trim() || 'Unknown Firefighter',
      }
    : selectedFirefighter;

  console.log("handleGearPress_repair_passed_roster", roster);

  // Navigate to repair details screen - pass repair_id if it exists for updates
  const navigationParams: any = {
    gearId: gear.gear?.gear_id,
    leadId: currentLead?.lead_id,
    leadData: currentLead,
  };

  // If there's an existing repair, pass the repair_id for updating
  if (gear.current_repair?.repair_id) {
    navigationParams.repairId = gear.current_repair.repair_id;
  }

  navigation.navigate("RepairDetails", navigationParams);
};


  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  const handleScanGear = () => {
    navigation.navigate('GearScan', { source: 'REPAIR' });
  };

  const handleManualAddGear = () => {
    navigation.navigate(
      'AddGear',
      selectedFirefighter ? { presetRoster: selectedFirefighter } : undefined,
    );
  };

  const handleDeleteGear = (gear: any) => {
    const gearId = gear.gear?.gear_id;
    const gearName = gear.gear?.gear_name || 'this gear';

    Alert.alert(
      'Delete Gear',
      `Are you sure you want to delete ${gearName}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await gearApi.deleteGear(gearId);
              Alert.alert('Success', 'Gear deleted successfully');

              // Refresh the repair gear list
              if (selectedFirefighter && currentLead) {
                await fetchFirefighterRepairGears(currentLead.lead_id, selectedFirefighter.roster_id, pagination?.page || 1, numberOfItemsPerPage);
              }
            } catch (error: any) {
              console.error('Error deleting gear:', error);
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete gear');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleCompleteRepair = () => {
    if (!selectedFirefighter) {
      Alert.alert('Select Firefighter', 'Please select a firefighter first');
      return;
    }
    Alert.alert('Success', 'Repair completed successfully!');
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    if (!selectedFirefighter || !currentLead) return;
    fetchFirefighterRepairGears(currentLead.lead_id, selectedFirefighter.roster_id, page, numberOfItemsPerPage);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setNumberOfItemsPerPage(newItemsPerPage);
    if (!selectedFirefighter || !currentLead) return;
    fetchFirefighterRepairGears(currentLead.lead_id, selectedFirefighter.roster_id, 1, newItemsPerPage);
  };

  const handleOpenRosterModal = () => {
    setRosterModalVisible(true);
  };

  const handleCloseRosterModal = () => {
    setRosterModalVisible(false);
  };

  const handleRosterSelect = (roster: any) => {
    console.log("handleRosterSelect for repair", roster);
    handleFirefighterSelect(roster);
  };

  const handleAddRosterManual = () => {
    setAddFirefighterModalVisible(true);
  };

  const handleCloseAddFirefighterModal = () => {
    setAddFirefighterModalVisible(false);
  };

  const handleFirefighterAdded = (roster: any) => {
    console.log('Firefighter added successfully for repair', roster);
    if (roster) {
      // Automatically select the newly added firefighter
      handleFirefighterSelect(roster);
    }
  };

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
          if (selectedFirefighter?.roster_id || selectedFirefighter?.id) {
            const currentRosterId = selectedFirefighter.roster_id || selectedFirefighter.id;
            return roster.id !== currentRosterId && roster.tag_color;
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
  }, [currentLead?.lead_id, selectedFirefighter]);

  // Fetch used colors when color picker opens
  useEffect(() => {
    if (colorPickerVisible && !colorLocked) {
      fetchUsedColors();
    }
  }, [colorPickerVisible, colorLocked, fetchUsedColors]);

  /**
   * Render repair details section
   */
  const renderRepairDetails = useCallback(
    (repair: any, isPrevious: boolean = false) => {
      if (!repair) return null;

      const sectionTitle = isPrevious ? 'Previous Repair' : 'Current Repair';
      const repairDate = repair.created_at ? new Date(repair.created_at).toLocaleDateString() : 'N/A';
      const repairCost = repair.total_repair_cost !== null && repair.total_repair_cost !== undefined
        ? `$${repair.total_repair_cost.toFixed(2)}`
        : 'N/A';
      const remarks = repair.remarks || 'N/A';
      const repairStatus = repair.repair_status || 'N/A';

      return (
        <View style={[styles.repairSection, { borderTopColor: colors.outline }]}>
          <Text variant="labelLarge" style={[styles.sectionTitle, { color: colors.primary }]}>
            {sectionTitle}
          </Text>

          <View style={styles.detailRow}>
            <Icon source="calendar" size={14} color={colors.primary} />
            <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Date:</Text>
            <Text style={[styles.detailValue, { color: colors.onSurface }]}>{repairDate}</Text>
          </View>

          <View style={styles.detailRow}>
            <Icon source="currency-usd" size={14} color={colors.primary} />
            <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Cost:</Text>
            <Text style={[styles.detailValue, { color: colors.onSurface }]}>{repairCost}</Text>
          </View>

          <View style={styles.detailRow}>
            <Icon source="note-text" size={14} color={colors.primary} />
            <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Remarks:</Text>
            <Text style={[styles.detailValue, styles.remarksText, { color: colors.onSurface }]} numberOfLines={2}>
              {remarks}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon source="wrench" size={14} color={colors.primary} />
            <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Status:</Text>
            <Text style={[styles.detailValue, { color: colors.onSurface }]}>{repairStatus}</Text>
          </View>
        </View>
      );
    },
    [colors],
  );

  /**
   * Render individual gear card
   */
  const renderGearCard = useCallback(
    (gear: any) => {
      const gearStatus = getGearStatus(gear);
      const statusId = gear.current_repair?.repair_status?.id;
      const statusColor = getStatusColor(statusId, gearStatus);
      const gearTypeName = gearTypes.find(gt => gt.gear_type_id === gear.gear?.gear_type?.gear_type_id)?.gear_type || gear.gear?.gear_name || 'Other';

      // Get gear details from top-level gear object (now always available in API response)
      const gearDetail = gear.gear;
      const serialNumber = gearDetail?.serial_number || 'N/A';
      const manufacturerName = gearDetail?.manufacturer?.manufacturer_name || 'N/A';
      const gearSize = gear.current_repair?.gear_size || gearDetail?.gear_size || 'N/A';

      // Get repair images (array of objects with image_urls)
      const repairImages = gear.current_repair?.repair_images || [];
      const hasImages = repairImages.length > 0;

      return (
        <View style={[styles.cardWrapper, { width: isTablet ? '48%' : '100%' }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleGearPress(gear)}
              style={[styles.gearCardNew, styles.shadow, { borderColor: colors.outline }]}
            >
              <Card style={{ backgroundColor: colors.surface }}>
                <Card.Content>
                  {/* Card Header with Gear Status */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      {gearStatus && gearStatus !== 'Not Inspected' ? (
                        <Chip
                          mode="outlined"
                          textStyle={[styles.gearStatusChipText, { color: '#fff' }]}
                          style={[
                            styles.headerStatusChip,
                            { backgroundColor: statusColor, borderColor: statusColor },
                          ]}
                        >
                          {gearStatus}
                        </Chip>
                      ) : (

                      <Button
                        mode="contained"
                        onPress={() => handleDeleteGear(gear)}
                        icon="delete"
                        buttonColor="red"
                        textColor="#fff"
                        compact
                        style={styles.deleteButton}
                        labelStyle={{ fontSize: p(12), fontWeight: '600' }}
                        contentStyle={{ paddingHorizontal: p(4) }}
                      >
                        Delete
                      </Button>

                      )}
                    </View>


                  </View>

                <View style={styles.gearImageContainer}>
                  <Image
                    source={getGearIconImage(gearTypeName)}
                    style={styles.gearImage}
                    resizeMode="cover"
                  />
                </View>

                  {/* Gear Details */}
                  <View style={styles.gearDetails}>
                    <View style={styles.detailRow}>
                      <Icon source="barcode" size={14} color={colors.primary} />
                      <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Serial:</Text>
                      <Text style={[styles.detailValue, { color: colors.onSurface }]}>{serialNumber}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Icon source="tag-outline" size={14} color={colors.primary} />
                      <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Type:</Text>
                      <Text style={[styles.detailValue, { color: colors.onSurface }]} numberOfLines={1}>
                        {gearTypeName}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Icon source="factory" size={14} color={colors.primary} />
                      <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Manufacturer:</Text>
                      <Text style={[styles.detailValue, { color: colors.onSurface }]} numberOfLines={1}>
                        {manufacturerName}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Icon source="ruler" size={14} color={colors.primary} />
                      <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Size:</Text>
                      <Text style={[styles.detailValue, { color: colors.onSurface }]}>{gearSize}</Text>
                    </View>
                  </View>

                  {/* Current Repair Details */}
                  {renderRepairDetails(gear.current_repair, false)}

                  {/* Previous Repair Details */}
                  {/* {gear.previous_repair && renderRepairDetails(gear.previous_repair, true)} */}

                  {/* Update Button */}
                  <Button
                    mode="contained"
                    onPress={() => handleGearPress(gear)}
                    icon="clipboard-edit-outline"
                    style={styles.updateButton}
                    contentStyle={styles.updateButtonContent}
                  >
                    Repair
                  </Button>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          </View>
      );
    },
    [colors, navigation, renderRepairDetails, gearTypes, isTablet],
  );

  // Render category gears in 2-column grid
  const renderCategoryGears = () => {
    if (!selectedCategory) return null;

    const categoryGears = getGearsByCategory(selectedCategory);

    if (categoryGears.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon source="package-variant-closed" size={64} color={colors.outline} />
          <Text variant="titleMedium" style={{ marginTop: 16, color: colors.outline }}>
            No gears found
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.gearsGridContainer}>
        {categoryGears.map((gear) => (
          <React.Fragment key={gear.gear?.gear_id}>
            {renderGearCard(gear)}
          </React.Fragment>
        ))}
      </View>
    );
  };

  // Render main categories view
  const renderCategories = () => {
    // Hide categories when one is selected
    if (selectedCategory) return null;

    return (
      <View style={styles.categoriesSection}>
        <View style={styles.gearsHeader}>
          <Divider style={styles.divider} />
          <Text style={[styles.gearsTitle, { color: colors.onSurfaceVariant, backgroundColor: colors.background }]}>
            Gears Categories
          </Text>
          <Divider style={styles.divider} />
        </View>

        <View style={styles.categoriesGrid}>
          {GEAR_CATEGORIES.map((category) => {
            const categoryGears = getGearsByCategory(category.id);
            const repairSummary = getCategoryRepairSummary(category.id);
            const isSelected = selectedCategory === category.id;

            return (
              <Card
                key={category.id}
                style={[
                  styles.categoryCard,
                  { backgroundColor: colors.surface },
                  isSelected && { backgroundColor: colors.primaryContainer }
                ]}
                onPress={() => handleCategoryPress(category.id)}
              >
                <Card.Content style={styles.categoryContent}>
                  {/* Category Header with Image */}
                  <View style={styles.categoryHeader}>
                    <Image
                      source={{ uri: category.image }}
                      style={styles.categoryImage}
                      resizeMode="cover"
                    />
                    <View style={styles.categoryHeaderText}>
                      <Text style={[styles.categoryTitle, { color: colors.onSurface }]}>
                        {category.title}
                      </Text>
                      <Text style={[styles.gearCount, { color: colors.onSurfaceVariant }]}>
                        {categoryGears.length} items
                      </Text>
                    </View>
                  </View>

                  {/* Inspection Summary */}
                  <View style={{ marginTop: 12, width: "100%" }}>
                    {/* Current Inspection */}
                    <Text style={[styles.sectionTitleInspection, { color: colors.onSurface, fontSize: p(14) }]}>
                      Current Repair
                    </Text>

                    {repairSummary.some(i => i.current_status !== "No Current Repair") ? (
                      repairSummary.map(gear => (
                        <View key={gear.gear_id} style={styles.repairRowItem}>
                          {isPortrait ? (
                            // Portrait: Status below gear name with arrow
                            <View style={styles.gearNameStatusContainerPortrait}>
                              <Text style={[styles.gearNameText, { color: colors.onSurface }]}>
                                {gear.gear_usage ? `${gear.gear_usage} — ` : ''}{gear.gear_name}
                              </Text>
                              <View style={styles.statusRowPortrait}>
                                <Icon source="arrow-right" size={14} color={getStatusColor(null, gear.current_status)} />
                                <Text
                                  style={[
                                    styles.gearStatusTextCategory,
                                    { color: getStatusColor(null, gear.current_status), marginLeft: p(4) }
                                  ]}
                                >
                                  {gear.current_status}
                                </Text>
                              </View>
                            </View>
                          ) : (
                            // Landscape: Status next to gear name
                            <View style={styles.gearNameStatusContainerLandscape}>
                              <Text style={[styles.gearNameText, { color: colors.onSurface }]}>
                                {gear.gear_usage ? `${gear.gear_usage} — ` : ''}{gear.gear_name}
                              </Text>
                              <Text
                                style={[
                                  styles.gearStatusTextCategory,
                                  { color: getStatusColor(null, gear.current_status), marginLeft: p(8) }
                                ]}
                              >
                                {gear.current_status}
                              </Text>
                            </View>
                          )}
                        </View>
                      ))
                    ) : (
                      <Text style={{ color: colors.onSurface, fontSize: p(12), fontStyle: 'italic' }}>No current repairs</Text>
                    )}
                  </View>
                </Card.Content>
              </Card>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Firefighter Repair Flow"
        showBackButton={true}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Firefighter Selection Card */}
        {selectedFirefighter ? (
          <Card style={[styles.firefighterCard, { backgroundColor: colors.surface }]}>
            <Card.Content>
              {/* Row 1: Avatar and Firefighter Info */}
              <View style={styles.firefighterHeader}>
                <View style={styles.firefighterInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {selectedFirefighter?.first_name?.[0] || ''}{selectedFirefighter?.last_name?.[0] || ''}
                    </Text>
                  </View>
                  <View style={styles.firefighterDetails}>
                    <View style={styles.firefighterNameContainer}>
                      <Text style={[styles.firefighterName, { color: colors.onSurface }]}>
                        {[selectedFirefighter?.first_name, selectedFirefighter?.middle_name, selectedFirefighter?.last_name].filter(Boolean).join(' ') || 'Unknown Firefighter'}
                      </Text>
                      {/* Rank Pill */}
                      {selectedFirefighter?.rank && selectedFirefighter.rank.trim() && (
                        <View
                          style={[
                            styles.rankPill,
                            { backgroundColor: colors.primaryContainer, marginLeft: p(8) }
                          ]}
                        >
                          <Text
                            style={[
                              styles.rankPillText,
                              { color: colors.primary }
                            ]}
                          >
                            {selectedFirefighter.rank}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.firefighterInfoText, { color: colors.onSurfaceVariant }]}>
                      {selectedFirefighter?.email || 'No email'}
                    </Text>
                    <Text style={[styles.firefighterInfoText, { color: colors.onSurfaceVariant }]}>
                      {selectedFirefighter?.phone || 'No phone'} • {selectedFirefighter?.firestation?.name || selectedFirefighter?.station || 'Unknown Station'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Row 2: Change Firefighter and Select Color Buttons */}
              <View style={styles.firefighterButtonsRow}>
                <Button
                  mode="outlined"
                  onPress={handleOpenRosterModal}
                  style={[styles.changeButton, { flex: 1 }]}
                  labelStyle={styles.changeButtonLabel}
                  icon="account-switch"
                >
                  Change Firefighter
                </Button>

                {rosterColor ? (
                  <Button
                    mode="outlined"
                    icon="pencil"
                    // onPress={() => {
                    //   if (!colorLocked) setColorPickerVisible(true);
                    // }}
                    disabled={colorLocked}
                    style={[styles.changeButton, { flex: 1, backgroundColor: getColorHex(rosterColor) }]}
                    labelStyle={styles.changeButtonLabel}
                    contentStyle={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' }}
                  >
                    <Text
                      style={{
                        textShadowColor: 'rgba(0,0,0,0.3)',
                        textShadowOffset: { width: 1, height: 1 },
                        textShadowRadius: 2,
                        fontWeight: '600',
                        fontSize: 16,
                        color: "white"
                      }}
                    >
                      {colorLocked ? "Color Locked" : "Change Color"}
                    </Text>
                  </Button>
                ) : (
                  <Button
                    mode="outlined"
                    // onPress={() => setColorPickerVisible(true)}
                    icon="palette"
                    style={[styles.changeButton, { flex: 1 , opacity: 0 }]}
                    labelStyle={styles.changeButtonLabel}
                  >
                    Select Color
                  </Button>
                )}
              </View>
            </Card.Content>
          </Card>
        ) : (
          // Primary button when no firefighter is selected
          <View style={styles.selectFirefighterSection}>
            <Button
              mode="contained"
              onPress={handleOpenRosterModal}
              style={[styles.selectButton, { backgroundColor: colors.primary }]}
              labelStyle={styles.selectButtonLabel}
              icon="account-search"
              contentStyle={styles.selectButtonContent}
            >
              Select Firefighter
            </Button>
          </View>
        )}

        {/* Action Buttons - Responsive layout */}
        {isTablet ? (
          // Tablet: All three buttons in one row
          <View style={styles.actionRowTablet}>
            <Button
              mode="contained"
              onPress={handleScanGear}
              style={[styles.actionButton, { flex: 1 }]}
              icon="barcode-scan"
              labelStyle={styles.actionButtonLabel}
              contentStyle={styles.actionButtonContent}
            >
              Scan Gear
            </Button>

            <Button
              mode="outlined"
              onPress={handleManualAddGear}
              style={[styles.actionButton, { flex: 1 }]}
              icon="plus-circle"
              labelStyle={styles.actionButtonLabel}
              contentStyle={styles.actionButtonContent}
            >
              Add New Gear
            </Button>

            <Button
              mode="outlined"
              onPress={handleAddRosterManual}
              style={[styles.actionButton, { flex: 1 }]}
              icon="account-plus"
              labelStyle={styles.actionButtonLabel}
              contentStyle={styles.actionButtonContent}
            >
              Add New Fire Fighter
            </Button>
          </View>
        ) : (
          // Mobile: Scan Gear on one line, Add New Gear and Add New Firefighter on another line
          <>
            {/* Scan Gear - Full width */}
            <Button
              mode="contained"
              onPress={handleScanGear}
              style={styles.scanGearButton}
              icon="barcode-scan"
              labelStyle={styles.actionButtonLabel}
              contentStyle={styles.actionButtonContent}
            >
              Scan Gear
            </Button>

            {/* Add New Gear and Add New Firefighter - Side by side */}
            <View style={styles.addButtonsRow}>
              <Button
                mode="outlined"
                onPress={handleManualAddGear}
                style={[styles.actionButton, { flex: 1 }]}
                icon="plus-circle"
                labelStyle={styles.actionButtonLabel}
                contentStyle={styles.actionButtonContent}
              >
                Add New Gear
              </Button>

              <Button
                mode="outlined"
                onPress={handleAddRosterManual}
                style={[styles.actionButton, { flex: 1 }]}
                icon="account-plus"
                labelStyle={styles.actionButtonLabel}
                contentStyle={styles.actionButtonContent}
              >
                Add New Fire Fighter
              </Button>
            </View>
          </>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.onSurface }]}>
              Loading gears...
            </Text>
          </View>
        )}

        {/* Render categories and gears */}
        {selectedCategory ? (
          // When category selected, show gears in full width
          <View style={styles.gearsSectionFull}>
            <View style={styles.gearsHeader}>
              <Divider style={styles.divider} />
              <Text style={[styles.gearsTitle, { color: colors.onSurfaceVariant, backgroundColor: colors.background }]}>
                Gears
              </Text>
              <Divider style={styles.divider} />
            </View>
            <View style={styles.gearsContainer}>
              {renderCategoryGears()}
            </View>
          </View>
        ) : (
          // When no category selected, show categories in 2 columns
          renderCategories()
        )}

        {/* Pagination */}
        {pagination && selectedFirefighter && (
          <Pagination
            page={pagination.page}
            total={pagination.total}
            itemsPerPage={numberOfItemsPerPage}
            itemsPerPageList={numberOfItemsPerPageList}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}

        {/* Bottom Action Buttons */}
        {/* {selectedFirefighter && (
          <View style={styles.bottomActions}>
            <Button
              mode="outlined"
              onPress={handleCancel}
              style={styles.cancelButton}
              labelStyle={styles.bottomButtonLabel}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleCompleteRepair}
              style={styles.completeButton}
              labelStyle={styles.bottomButtonLabel}
            >
              Complete Repair
            </Button>
          </View>
        )} */}

        <RosterModal
          visible={rosterModalVisible}
          onClose={handleCloseRosterModal}
          onRosterSelect={handleRosterSelect}
          onAddRosterManual={handleAddRosterManual}
        />
        <ColorPickerModal
            visible={colorPickerVisible}
            selectedColor={rosterColor}
            onClose={() => setColorPickerVisible(false)}
            onColorSelect={(color) => {
              const normalizedColor = color?.toLowerCase().trim() || '';
              setRosterColor(normalizedColor);
              // Save to AsyncStorage immediately
              AsyncStorage.setItem(TAG_COLOR_STORAGE_KEY, normalizedColor);
              setColorPickerVisible(false);
            }}
            usedColors={usedColors}
          />

        <AddFirefighterModal
          visible={addFirefighterModalVisible}
          onClose={handleCloseAddFirefighterModal}
          onSuccess={handleFirefighterAdded}
        />
      </ScrollView>

      {/* Back to Categories Button - Fixed Bottom Right (Outside ScrollView) */}
      {selectedCategory && (
        <TouchableOpacity
          onPress={() => setSelectedCategory(null)}
          style={[styles.backButtonFixed, { backgroundColor: colors.primary }]}
        >
          <IconButton icon="arrow-left" size={24} iconColor="#fff" />
          <Text style={styles.backTextFixed}>
            Back to Categories
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

// ... keep all the existing styles the same ...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: p(16),
    paddingBottom: p(32),
    gap: p(16),
  },
  gearsContainer: {
    flex: 1,
  },
  // Firefighter Card Styles
  firefighterCard: {
    borderRadius: p(12),
    elevation: 2,
  },
  firefighterHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: p(12),
  },
  firefighterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: p(50),
    height: p(50),
    borderRadius: p(25),
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: p(12),
  },
  avatarText: {
    color: '#fff',
    fontSize: p(16),
    fontWeight: 'bold',
  },
  firefighterDetails: {
    flex: 1,
  },
  firefighterNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: p(4),
    flexWrap: 'wrap',
  },
  firefighterName: {
    fontSize: p(16),
    fontWeight: '600',
  },
  rankPill: {
    paddingHorizontal: p(10),
    paddingVertical: p(4),
    borderRadius: p(12),
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: p(24),
  },
  rankPillText: {
    fontSize: p(11),
    fontWeight: '600',
    lineHeight: p(16),
  },
  firefighterInfoText: {
    fontSize: p(12),
    marginBottom: p(2),
  },
  firefighterButtonsRow: {
    flexDirection: 'row',
    gap: p(8),
    marginTop: p(8),
  },
  changeButton: {
    borderRadius: p(8),
  },
  changeButtonLabel: {
    fontSize: p(12),
    fontWeight: '600',
  },
  // Select Firefighter Section
  selectFirefighterSection: {
    alignItems: 'center',
  },
  selectButton: {
    borderRadius: p(12),
    width: '100%',
  },
  selectButtonContent: {
    height: p(50),
  },
  selectButtonLabel: {
    fontSize: p(16),
    fontWeight: '600',
  },
  // Action Buttons
  scanGearButton: {
    borderRadius: p(8),
    width: '100%',
    marginBottom: p(8),
  },
  addButtonsRow: {
    flexDirection: 'row',
    gap: p(8),
  },
  actionRowTablet: {
    flexDirection: 'row',
    gap: p(8),
  },
  actionButton: {
    borderRadius: p(8),
  },
  actionButtonContent: {
    height: p(45),
  },
  actionButtonLabel: {
    fontSize: p(12),
    fontWeight: '600',
  },
  // Loading State
  loadingContainer: {
    alignItems: 'center',
    padding: p(40),
  },
  loadingText: {
    marginTop: p(12),
    fontSize: p(14),
  },
  // Categories Section
  mainContent: {
    flexDirection: 'row',
    gap: p(12),
    minHeight: 400,
  },
  categoriesSection: {
    // marginTop: p(8),
    flex: 1,
  },
  gearsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginVertical: p(16),
    marginBottom: p(4),
  },
  backButtonFixed: {
    position: 'absolute',
    bottom: p(60), // Increased to avoid bottom bar
    right: p(20),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: p(12),
    paddingVertical: p(0),
    borderRadius: p(25),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  backTextFixed: {
    fontSize: p(14),
    fontWeight: '600',
    color: '#fff',
    marginLeft: p(8),
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
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: p(12),
  },
  gearsSectionFull: {
    flex: 1,
    marginTop: p(8),
  },
  categoryCard: {
    width: '48%',
    borderRadius: p(12),
    marginBottom: p(12),
    elevation: 2,
  },
  categoryContent: {
    alignItems: 'flex-start',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: p(8),
    width: '100%',
  },
  categoryImage: {
    width: p(50),
    height: p(50),
    borderRadius: p(8),
    marginRight: p(12),
  },
  categoryHeaderText: {
    flex: 1,
  },
  repairRowItem: {
    marginBottom: p(6),
  },
  gearNameStatusContainer: {
    flexDirection: 'column',
  },
  gearNameStatusContainerPortrait: {
    flexDirection: 'column',
  },
  gearNameStatusContainerLandscape: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statusRowPortrait: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: p(2),
    marginLeft: p(8),
  },
  gearNameText: {
    fontSize: p(12),
    fontWeight: '500',
    marginBottom: p(2),
  },
  gearStatusTextCategory: {
    fontSize: p(11),
    fontWeight: '600',
  },
  gearsSection: {
    marginTop: p(8),
    flex: 0.65,
  },
  gearsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: p(5),
    paddingBottom: p(80), // Extra padding for fixed back button
    gap: p(8),
  },
  cardWrapper: {
    marginBottom: 0, // Remove margin since we use gap in container
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  gearCardNew: {
    marginHorizontal: 0,
    borderRadius: p(10),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  cardTagBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: p(30),
    height: p(24),
    borderTopRightRadius: p(10),
    borderBottomLeftRadius: p(10),
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: p(8),
    paddingRight: p(4),
  },
  cardHeaderLeft: {
    flex: 1,
  },
  deleteButton: {
    margin: 0,
    borderRadius: p(8),
    elevation: 2,
    position: 'absolute',
    top: p(0),
    left: p(0),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerStatusChip: {
    // height: p(26),
    alignSelf: 'flex-start',
    marginRight: p(6),
    // paddingHorizontal: p(10),
    // minWidth: p(85),
    paddingVertical: p(0),
  },
  gearStatusChipText: {
    fontSize: 11,
  },
  gearImageContainer: {
    alignItems: 'center',
    marginBottom: p(8),
  },
  gearImage: {
    width: p(100),
    height: p(100),
    borderRadius: p(8),
  },
  gearEmoji: {
    fontSize: p(64),
    textAlign: 'center',
  },
  repairImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: p(8),
    gap: p(4),
  },
  repairImageBox: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: p(6),
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  repairImage: {
    width: '100%',
    height: '100%',
  },
  moreImagesBox: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  moreImagesText: {
    color: '#fff',
    fontSize: p(18),
    fontWeight: 'bold',
  },
  gearDetails: {
    marginBottom: p(10),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: p(4),
    flexWrap: 'wrap',
  },
  detailLabel: {
    fontSize: p(11),
    marginLeft: p(6),
    marginRight: p(4),
    fontWeight: '600',
  },
  detailValue: {
    fontSize: p(11),
    flex: 1,
    flexWrap: 'wrap',
    fontWeight: '500',
  },
  remarksText: {
    fontSize: p(10),
    fontStyle: 'italic',
  },
  findingText: {
    color: '#d32f2f',
    fontWeight: '500',
  },
  repairSection: {
    marginTop: p(10),
    marginBottom: p(8),
    paddingTop: p(8),
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: p(12),
    fontWeight: 'bold',
    marginBottom: p(6),
  },
  updateButton: {
    borderRadius: p(8),
    marginTop: p(8),
  },
  updateButtonContent: {
    paddingVertical: p(4),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  categoryTitle: {
    fontSize: p(14),
    fontWeight: '600',
    marginBottom: p(4),
  },
  gearCount: {
    fontSize: p(12),
  },
  repairLabel: {
    fontSize: p(10),
    fontWeight: '600',
    marginBottom: p(4),
  },
  repairRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: p(2),
  },
  fieldName: {
    fontSize: p(9),
    flex: 1,
  },
  fieldStatus: {
    fontSize: p(9),
    fontWeight: '600',
  },
  gearCard: {
    borderRadius: p(12),
    marginBottom: p(8),
    elevation: 2,
  },
  gearContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gearInfo: {
    flex: 1,
  },
  gearName: {
    fontSize: p(14),
    fontWeight: '600',
    marginBottom: p(2),
  },
  gearType: {
    fontSize: p(12),
    marginBottom: p(2),
  },
  gearStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gearStatusBadge: {
    paddingHorizontal: p(8),
    paddingVertical: p(4),
    borderRadius: p(6),
    marginRight: p(8),
  },
  gearStatusText: {
    color: '#fff',
    fontSize: p(10),
    fontWeight: '600',
  },
  emptyCard: {
    borderRadius: p(12),
    marginBottom: p(20),
    elevation: 2,
  },
  emptyContent: {
    alignItems: 'center',
    padding: p(20),
  },
  emptyText: {
    fontSize: p(14),
    textAlign: 'center',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: p(12),
    marginTop: p(20),
  },
  cancelButton: {
    flex: 1,
    borderRadius: p(12),
  },
  completeButton: {
    flex: 1,
    borderRadius: p(12),
  },
  bottomButtonLabel: {
    fontSize: p(14),
    fontWeight: '600',
  },


  sectionTitleInspection: {
    fontSize: p(14),
    fontWeight: '700',
    // marginBottom: p(16),
  },
  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  rowLeft: {
    fontSize: 14,
    fontWeight: "500",
  },

  rowRight: {
    fontSize: 14,
    fontWeight: "600",
  },

});

export default FirefighterRepairFlowScreen;
