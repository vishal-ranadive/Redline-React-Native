// src/screens/firefighterscreens/FirefighterFlowScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  useTheme,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import Header from '../../components/common/Header';
import { useNavigation } from '@react-navigation/native';
import CustomDropdown from '../../components/common/CustomDropdown';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

// Dummy firefighter data
const FIREFIGHTERS = [
  {
    roster_id: 1,
    first_name: 'MICHEAL',
    middle_name: '',
    last_name: 'KERN',
    email: 'michealkeran@sarasota.com',
    phone: '555-0101',
    station: 'Sarasota County Fire Department'
  },
  {
    roster_id: 8,
    first_name: 'JANE',
    middle_name: 'M',
    last_name: 'DOE',
    email: 'jane.doe@fire.com',
    phone: '5551234567',
    station: 'Abington Fire Department'
  },
  {
    roster_id: 19,
    first_name: 'DEMO',
    middle_name: 'FIREFIGHTER',
    last_name: 'RR',
    email: 'demoff@gmail.com',
    phone: '+1-555-123-4888',
    station: 'Abington Fire Department'
  },
  {
    roster_id: 25,
    first_name: 'DEMOROSTER',
    middle_name: 'AA',
    last_name: 'AA',
    email: 'roster.AA@smsaexpress.com',
    phone: '5551234567',
    station: 'Central Fire Station'
  },
];

// Real gear data from your API response
const REAL_GEARS_DATA = [
  {
    gear_id: 15,
    roster_id: 1,
    gear_name: "Jacket Liner",
    gear_type: { gear_type_id: 4, gear_type: "JACKET LINER" },
    status: "PASS",
    last_inspection: "2024-01-15",
    inspection_details: {
      "Primary Liner": "PASS",
      "Primary Shell": "ACTION_REQUIRED"
    }
  },
  {
    gear_id: 18,
    roster_id: 25,
    gear_name: "Helmet",
    gear_type: { gear_type_id: 2, gear_type: "HELMET" },
    status: "ACTION_REQUIRED",
    last_inspection: "2024-01-10",
    inspection_details: {
      "Helmet": "ACTION_REQUIRED",
      "Face Shield": "PASS"
    }
  },
  {
    gear_id: 17,
    roster_id: 25,
    gear_name: "Gloves",
    gear_type: { gear_type_id: 2, gear_type: "HELMET" },
    status: "PASS",
    last_inspection: "2024-01-12",
    inspection_details: {
      "Gloves": "PASS",
      "Wristlets": "PASS"
    }
  },
  {
    gear_id: 21,
    roster_id: 19,
    gear_name: "Jacket Liner",
    gear_type: { gear_type_id: 1, gear_type: "GLOVES" },
    status: "FAIL",
    last_inspection: "2024-01-08",
    inspection_details: {
      "Primary Liner": "FAIL",
      "Primary Shell": "ACTION_REQUIRED"
    }
  },
  {
    gear_id: 22,
    roster_id: 8,
    gear_name: "Helmet",
    gear_type: { gear_type_id: 1, gear_type: "GLOVES" },
    status: "PASS",
    last_inspection: "2024-01-14",
    inspection_details: {
      "Helmet": "PASS",
      "Suspension System": "PASS"
    }
  },
  {
    gear_id: 23,
    roster_id: 8,
    gear_name: "Gloves",
    gear_type: { gear_type_id: 3, gear_type: "HOOD" },
    status: "ACTION_REQUIRED",
    last_inspection: "2024-01-11",
    inspection_details: {
      "Gloves": "ACTION_REQUIRED"
    }
  },
  {
    gear_id: 20,
    roster_id: 8,
    gear_name: "Boots",
    gear_type: { gear_type_id: 4, gear_type: "JACKET LINER" },
    status: "PASS",
    last_inspection: "2024-01-13",
    inspection_details: {
      "Boots": "PASS",
      "Steel Toe": "PASS"
    }
  },
  {
    gear_id: 19,
    roster_id: 19,
    gear_name: "Gloves",
    gear_type: { gear_type_id: 1, gear_type: "GLOVES" },
    status: "PASS",
    last_inspection: "2024-01-09",
    inspection_details: {
      "Gloves": "PASS"
    }
  },
  {
    gear_id: 24,
    roster_id: 8,
    gear_name: "Pant Shell",
    gear_type: { gear_type_id: 9, gear_type: "PANT SHELL" },
    status: "ACTION_REQUIRED",
    last_inspection: "2024-01-07",
    inspection_details: {
      "Primary Shell": "ACTION_REQUIRED",
      "Primary Liner": "PASS"
    }
  },
  {
    gear_id: 27,
    roster_id: 8,
    gear_name: "Boots",
    gear_type: { gear_type_id: 4, gear_type: "JACKET LINER" },
    status: "PASS",
    last_inspection: "2024-01-16",
    inspection_details: {
      "Boots": "PASS",
      "Outsole": "PASS"
    }
  }
];

// Gear categories with icons and matching gear types
const GEAR_CATEGORIES = [
  {
    id: 'jackets',
    title: 'Jackets',
    icon: 'jacket',
    color: '#FF6B6B',
    gearTypes: ['JACKET LINER', 'JACKET SHELL'],
    fields: ['Primary Liner', 'Primary Shell', 'Moisture Barrier']
  },
  {
    id: 'pants',
    title: 'Pants',
    icon: 'tshirt-crew',
    color: '#4ECDC4',
    gearTypes: ['PANT LINER', 'PANT SHELL'],
    fields: ['Primary Shell', 'Primary Liner', 'Moisture Barrier']
  },
  {
    id: 'helmets',
    title: 'Helmets',
    icon: 'hard-hat',
    color: '#45B7D1',
    gearTypes: ['HELMET'],
    fields: ['Helmet', 'Face Shield', 'Suspension System']
  },
  {
    id: 'gloves',
    title: 'Gloves',
    icon: 'hand-back-left',
    color: '#96CEB4',
    gearTypes: ['GLOVES'],
    fields: ['Gloves', 'Wristlets', 'Knit Wrist']
  },
  {
    id: 'boots',
    title: 'Boots',
    icon: 'shoe-formal',
    color: '#FFEAA7',
    gearTypes: ['BOOTS'],
    fields: ['Boots', 'Steel Toe', 'Outsole']
  },
  {
    id: 'others',
    title: 'Others',
    icon: 'toolbox-outline',
    color: '#DDA0DD',
    gearTypes: ['HOOD', 'SCBA'],
    fields: ['Jump Suit', 'Hood', 'SCBA Harness']
  },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'UpadateInspection'>;

const FirefighterFlowScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [selectedFirefighter, setSelectedFirefighter] = useState<any>(null);
  const [gears, setGears] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const getFirefighterLabel = (rosterId: number) => {
    const firefighter = FIREFIGHTERS.find(f => f.roster_id === rosterId);
    return firefighter ? `${firefighter.first_name} ${firefighter.last_name}` : 'Select Firefighter';
  };

  const handleFirefighterSelect = async (rosterId: number) => {
    const firefighter = FIREFIGHTERS.find(f => f.roster_id === rosterId);
    setSelectedFirefighter(firefighter);
    setSelectedCategory(null);
    setLoading(true);
    
    try {
      // Simulate API call with real data
      setTimeout(() => {
        const filteredGears = REAL_GEARS_DATA.filter(gear => gear.roster_id === rosterId);
        setGears(filteredGears);
        setLoading(false);
      }, 1000);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch gears');
      setGears([]);
      setLoading(false);
    }
  };

  // Filter gears by category
  const getGearsByCategory = (categoryId: string) => {
    const category = GEAR_CATEGORIES.find(cat => cat.id === categoryId);
    if (!category) return [];
    
    return gears.filter(gear => 
      category.gearTypes.includes(gear.gear_type?.gear_type)
    );
  };

  // Get category inspection summary
  const getCategoryInspectionSummary = (categoryId: string) => {
    const categoryGears = getGearsByCategory(categoryId);
    const category = GEAR_CATEGORIES.find(cat => cat.id === categoryId);
    
    if (!category || categoryGears.length === 0) {
      return {
        previous: {},
        current: {}
      };
    }

    // For demo purposes, using the first gear's inspection details as previous inspection
    // and empty current inspection
    const previousInspection = categoryGears[0]?.inspection_details || {};
    const currentInspection = {}; // Empty for current inspection
    
    return {
      previous: previousInspection,
      current: currentInspection
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS': return '#34A853';
      case 'ACTION_REQUIRED': return '#F9A825';
      case 'FAIL': return '#EA4335';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PASS': return 'Pass';
      case 'ACTION_REQUIRED': return 'Action Required';
      case 'FAIL': return 'Fail';
      default: return 'Not Inspected';
    }
  };

  const handleCategoryPress = (categoryId: string) => {
    if (!selectedFirefighter) {
      Alert.alert('Select Firefighter', 'Please select a firefighter first');
      return;
    }
    setSelectedCategory(categoryId);
  };

  const handleGearPress = (gear: any) => {
    navigation.navigate('UpadateInspection', { gearId: gear.gear_id });
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  const handleScanGear = () => {
    if (!selectedFirefighter) {
      Alert.alert('Select Firefighter', 'Please select a firefighter first');
      return;
    }
    navigation.navigate('GearScan' as never);
  };

  const handleManualAddGear = () => {
    if (!selectedFirefighter) {
      Alert.alert('Select Firefighter', 'Please select a firefighter first');
      return;
    }
    navigation.navigate('AddGear');
  };

  const handleCompleteInspection = () => {
    if (!selectedFirefighter) {
      Alert.alert('Select Firefighter', 'Please select a firefighter first');
      return;
    }
    Alert.alert('Success', 'Inspection completed successfully!');
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  // Render category drill-down view
  const renderCategoryGears = () => {
    if (!selectedCategory) return null;

    const category = GEAR_CATEGORIES.find(cat => cat.id === selectedCategory);
    const categoryGears = getGearsByCategory(selectedCategory);

    if (!category) return null;

    return (
      <View style={styles.categoryDetailSection}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackToCategories}
        >
          <IconButton icon="arrow-left" size={24} />
          <Text style={[styles.backText, { color: colors.primary }]}>
            Back to Categories
          </Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
          {category.title} ({categoryGears.length})
        </Text>

        {categoryGears.length === 0 ? (
          <Card style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Card.Content style={styles.emptyContent}>
              <IconButton
                icon="package-variant"
                size={48}
                iconColor={colors.onSurfaceVariant}
              />
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                No {category.title.toLowerCase()} assigned to this firefighter
              </Text>
            </Card.Content>
          </Card>
        ) : (
          categoryGears.map((gear) => (
            <Card 
              key={gear.gear_id}
              style={[styles.gearCard, { backgroundColor: colors.surface }]}
              onPress={() => handleGearPress(gear)}
            >
              <Card.Content style={styles.gearContent}>
                <View style={styles.gearInfo}>
                  <Text style={[styles.gearName, { color: colors.onSurface }]}>
                    {gear.gear_name}
                  </Text>
                  <Text style={[styles.gearType, { color: colors.onSurfaceVariant }]}>
                    Serial: {gear.serial_number || 'N/A'}
                  </Text>
                  <Text style={[styles.gearType, { color: colors.onSurfaceVariant }]}>
                    Last Inspection: {gear.last_inspection}
                  </Text>
                </View>
                <View style={styles.gearStatus}>
                  <View 
                    style={[
                      styles.gearStatusBadge, 
                      { backgroundColor: getStatusColor(gear.status) }
                    ]}
                  >
                    <Text style={styles.gearStatusText}>
                      {getStatusText(gear.status)}
                    </Text>
                  </View>
                  <IconButton
                    icon="chevron-right"
                    size={20}
                    iconColor={colors.onSurfaceVariant}
                  />
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </View>
    );
  };

  // Render main categories view
  const renderCategories = () => {
    if (selectedCategory) return null;

    return (
      <View style={styles.categoriesSection}>
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
          Gear Categories
        </Text>
        
        <View style={styles.categoriesGrid}>
          {GEAR_CATEGORIES.map((category) => {
            const categoryGears = getGearsByCategory(category.id);
            const inspectionSummary = getCategoryInspectionSummary(category.id);
            
            return (
              <Card 
                key={category.id} 
                style={[styles.categoryCard, { backgroundColor: colors.surface }]}
                onPress={() => handleCategoryPress(category.id)}
              >
                <Card.Content style={styles.categoryContent}>
                  <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                    <IconButton
                      icon={category.icon}
                      size={24}
                      iconColor="#fff"
                    />
                  </View>
                  <Text style={[styles.categoryTitle, { color: colors.onSurface }]}>
                    {category.title}
                  </Text>
                  <Text style={[styles.gearCount, { color: colors.onSurfaceVariant }]}>
                    {categoryGears.length} items
                  </Text>
                  
                  {/* Previous Inspection */}
                  <View style={styles.inspectionSection}>
                    <Text style={[styles.inspectionLabel, { color: colors.onSurfaceVariant }]}>
                      Previous Inspection:
                    </Text>
                    {category.fields.map((field, index) => (
                      <View key={index} style={styles.inspectionRow}>
                        <Text style={[styles.fieldName, { color: colors.onSurface }]}>
                          {field}:
                        </Text>
                        <Text 
                          style={[
                            styles.fieldStatus,
                            { 
                              color: inspectionSummary.previous[field] 
                                ? getStatusColor(inspectionSummary.previous[field])
                                : colors.onSurfaceVariant 
                            }
                          ]}
                        >
                          {inspectionSummary.previous[field] 
                            ? getStatusText(inspectionSummary.previous[field])
                            : 'Not Inspected'
                          }
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Current Inspection */}
                  <View style={styles.inspectionSection}>
                    <Text style={[styles.inspectionLabel, { color: colors.onSurfaceVariant }]}>
                      Current Inspection:
                    </Text>
                    {category.fields.map((field, index) => (
                      <View key={index} style={styles.inspectionRow}>
                        <Text style={[styles.fieldName, { color: colors.onSurface }]}>
                          {field}:
                        </Text>
                        {/* <Text style={[styles.fieldStatus, { color: colors.onSurfaceVariant }]}>
                          {inspectionSummary.current[field] 
                            ? getStatusText(inspectionSummary.current[field])
                            : 'Pending'
                          }
                        </Text> */}
                      </View>
                    ))}
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
        title="Firefighter Inspection"
        showBackButton={true}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Top Row - Firefighter Selection */}
        <View style={styles.topRow}>
          <Text style={[styles.sectionLabel, { color: colors.onSurface }]}>
            Fire Fighters
          </Text>
          
          <View style={styles.dropdownContainer}>
            <CustomDropdown
              options={FIREFIGHTERS}
              selectedValue={selectedFirefighter?.roster_id}
              onSelect={handleFirefighterSelect}
              placeholder="Select Firefighter"
              getLabel={(id: number) => getFirefighterLabel(id)}
              getOptionLabel={(option: any) => `${option.first_name} ${option.last_name}`}
              getOptionValue={(option: any) => option.roster_id}
            />
          </View>

          <Button
            mode="contained"
            onPress={() => Alert.alert('Add Fire Fighter', 'Navigate to add firefighter form')}
            style={styles.addButton}
            labelStyle={styles.addButtonLabel}
          >
            Add Fire Fighter
          </Button>
        </View>

        {/* Middle Action Row */}
        {!selectedCategory && (
          <View style={styles.actionRow}>
            <Button
              mode="contained"
              onPress={handleScanGear}
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              icon="barcode-scan"
              labelStyle={styles.actionButtonLabel}
              contentStyle={styles.actionButtonContent}
            >
              Scan Gear
            </Button>

            <Button
              mode="outlined"
              onPress={handleManualAddGear}
              style={styles.actionButton}
              icon="plus-circle"
              labelStyle={styles.actionButtonLabel}
              contentStyle={styles.actionButtonContent}
            >
              Manual Add Gear
            </Button>
          </View>
        )}

        {/* Firefighter Info Card */}
        {selectedFirefighter && (
          <Card style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <Card.Content>
              <View style={styles.firefighterInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {selectedFirefighter.first_name[0]}{selectedFirefighter.last_name[0]}
                  </Text>
                </View>
                <View style={styles.firefighterDetails}>
                  <Text style={[styles.firefighterName, { color: colors.onSurface }]}>
                    {selectedFirefighter.first_name} {selectedFirefighter.middle_name} {selectedFirefighter.last_name}
                  </Text>
                  <Text style={[styles.firefighterInfoText, { color: colors.onSurfaceVariant }]}>
                    {selectedFirefighter.email}
                  </Text>
                  <Text style={[styles.firefighterInfoText, { color: colors.onSurfaceVariant }]}>
                    {selectedFirefighter.phone} • {selectedFirefighter.station}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
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

        {/* Render either categories or category detail view */}
        {renderCategories()}
        {renderCategoryGears()}

        {/* Bottom Action Buttons */}
        {!selectedCategory && (
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
              onPress={handleCompleteInspection}
              style={styles.completeButton}
              labelStyle={styles.bottomButtonLabel}
              disabled={!selectedFirefighter}
            >
              Complete Inspection
            </Button>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: p(16),
    paddingBottom: p(32),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: p(20),
  },
  sectionLabel: {
    fontSize: p(16),
    fontWeight: '600',
    flex: 1,
  },
  dropdownContainer: {
    flex: 2,
    marginHorizontal: p(12),
  },
  addButton: {
    borderRadius: p(8),
  },
  addButtonLabel: {
    fontSize: p(12),
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: p(20),
    gap: p(12),
  },
  actionButton: {
    flex: 1,
    borderRadius: p(12),
  },
  actionButtonContent: {
    height: p(50),
  },
  actionButtonLabel: {
    fontSize: p(14),
    fontWeight: '600',
  },
  infoCard: {
    borderRadius: p(12),
    marginBottom: p(20),
    elevation: 2,
  },
  firefighterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
  firefighterName: {
    fontSize: p(16),
    fontWeight: '600',
    marginBottom: p(4),
  },
  firefighterInfoText: {
    fontSize: p(12),
    marginBottom: p(2),
  },
  loadingContainer: {
    alignItems: 'center',
    padding: p(40),
  },
  loadingText: {
    marginTop: p(12),
    fontSize: p(14),
  },
  categoriesSection: {
    marginBottom: p(20),
  },
  categoryDetailSection: {
    marginBottom: p(20),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: p(16),
  },
  backText: {
    fontSize: p(16),
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: p(18),
    fontWeight: '700',
    marginBottom: p(16),
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: p(12),
  },
  categoryCard: {
    width: '48%',
    borderRadius: p(12),
    marginBottom: p(12),
    elevation: 2,
  },
  categoryContent: {
    alignItems: 'center',
  },
  categoryIcon: {
    width: p(50),
    height: p(50),
    borderRadius: p(25),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: p(8),
  },
  categoryTitle: {
    fontSize: p(14),
    fontWeight: '600',
    marginBottom: p(4),
    textAlign: 'center',
  },
  gearCount: {
    fontSize: p(12),
    marginBottom: p(8),
  },
  inspectionSection: {
    width: '100%',
    marginBottom: p(8),
  },
  inspectionLabel: {
    fontSize: p(10),
    fontWeight: '600',
    marginBottom: p(4),
  },
  inspectionRow: {
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
});

export default FirefighterFlowScreen;