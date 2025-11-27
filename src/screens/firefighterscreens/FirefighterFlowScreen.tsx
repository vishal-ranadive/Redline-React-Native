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
  Divider,
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
import { useLeadStore } from '../../store/leadStore';
import { useGearStore } from '../../store/gearStore';
import { ColorPickerModal } from '../../components/common';

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
  const { currentLead } = useLeadStore();
  const { gearTypes } = useGearStore();
    const route = useRoute<any>();

  const { firefighter} = route.params ?? {};
  console.log("Selected_firefighter", firefighter)
  const { 
    firefighterGears, 
    loading, 
    fetchFirefighterGears, 
    clearFirefighterGears 
  } = useInspectionStore();

  const [selectedFirefighter, setSelectedFirefighter] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [rosterModalVisible, setRosterModalVisible] = useState(false);
  const [addFirefighterModalVisible, setAddFirefighterModalVisible] = useState(false);
  const [rosterColor, setRosterColor] = useState<string >("");
  const [colorLocked, setColorLocked] = useState<boolean>(false);
  const [colorPickerVisible, setColorPickerVisible] = useState<boolean>(false);


useFocusEffect(
  React.useCallback(() => {
    console.log("🔥 Screen Focused – Re-loading firefighter:", firefighter);

    if (firefighter) {
      handleFirefighterSelect(firefighter);
    }

    return () => {
      // optional cleanup if needed
    };
  }, [firefighter])
);



  const handleFirefighterSelect = async (roster: any) => {
    if (!currentLead) {
      Alert.alert('Error', 'No lead selected');
      return;
    }

    setSelectedFirefighter(roster);
    setSelectedCategory(null);
    
    try {
      await fetchFirefighterGears(currentLead.lead_id, roster.roster_id);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch gears');
    }
  };

  // Clear gears when firefighter is deselected
  useEffect(() => {
    if (!selectedFirefighter) {
      clearFirefighterGears();
    }
  }, [selectedFirefighter]);

  // Clear gears when firefighter is deselected
  useEffect(() => {
    if (!selectedFirefighter) {
      clearFirefighterGears();
    }
  }, [selectedFirefighter]);

useEffect(() => {
  if (!firefighterGears) return;

  // Find first gear with current inspection & tag_color
  const found = firefighterGears.find(
    g => g?.current_inspection?.tag_color
  );

  if (found) {
    // Case 1: color exists → lock it
    setRosterColor(found.current_inspection.tag_color.toLowerCase());
    setColorLocked(true);
  } else {
    // Case 2: no inspection → allow selecting color
    setRosterColor(""); 
    setColorLocked(false);
  }
}, [firefighterGears]);


  console.log("foundsetRosterColor",rosterColor)

  // Filter gears by category
  const getGearsByCategory = (categoryId: string) => {
    const category = GEAR_CATEGORIES.find(cat => cat.id === categoryId);
    if (!category) return [];
    
    return firefighterGears.filter(gear => {
      // Find the gear type name from gearTypes store using gear_type_id
      const gearType = gearTypes.find(gt => gt.gear_type_id === gear.gear_type_id);
      const gearTypeName = gearType?.gear_type || gear.gear_name;
      
      return category.gearTypes.includes(gearTypeName.toUpperCase());
    });
  };

  // Get category inspection summary
const getCategoryInspectionSummary = (categoryId:string) => {
  const categoryGears = getGearsByCategory(categoryId);
  const category = GEAR_CATEGORIES.find(cat => cat.id === categoryId);

  if (!category || categoryGears.length === 0) {
    return [];
  }

  // Build summary for each gear
  const summary = categoryGears.map(gear => {
    const usage = gear.gear_usage || "PRIMARY";
    const name = gear.gear_name;

    const currentStatus = gear.current_inspection?.gear_status?.status || "No Current Inspection";
    const previousStatus = gear.previous_inspection?.gear_status?.status || "No Previous Inspection";

    return {
      gear_id: gear.gear_id,
      gear_name: name,
      gear_usage: usage,
      current_status: currentStatus,
      previous_status: previousStatus,
    };
  });

  return summary;
};



const normalizeStatus = (status: string) => {
  if (!status) return 'NOT_INSPECTED';

  return status
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
};

const getStatusColor = (status: string) => {
  console.log("ssssssssssssssss", status)

    const normalized = normalizeStatus(status);

  switch (normalized) {
    case 'PASS':
      return '#34A853'; // green
  
    case 'CORRECTIVE_ACTION_REQUIRED':
      return '#F9A825'; // yellow

    case 'RECOMMENDED_OOS':
      return '#f15719ff'; // orange

    case 'EXPIRED':
      return '#ff0303ff'; // red

    default:
      return '#666'; // fallback
  }
};




  // Get gear status from current inspection
  const getGearStatus = (gear: any) => {
    if (!gear.current_inspection) return 'Not Inspected';
    
    const gearStatus = gear.current_inspection.gear_status?.status;
    if (!gearStatus) return 'Not Inspected';
    
    // // Map API status to our status system
    // if (gearStatus.includes('Pass') || gearStatus.includes('PASS')) return 'PASS';
    // if (gearStatus.includes('Corrective Action') || gearStatus.includes('Action Required')) return 'ACTION_REQUIRED';
    // if (gearStatus.includes('Fail') || gearStatus.includes('FAIL')) return 'FAIL';
    
    // return 'Not Inspected';
    return gearStatus
  };

  const handleCategoryPress = (categoryId: string) => {
    if (!selectedFirefighter) {
      Alert.alert('Select Firefighter', 'Please select a firefighter first');
      return;
    }
    setSelectedCategory(categoryId);
  };




// In FirefighterFlowScreen.tsx - update handleGearPress
const handleGearPress = (gear: any) => {
  console.log("handleGearPress", gear);
  
  navigation.navigate("UpadateInspection", {
    gearId: gear.gear_id,
    inspectionId: gear.current_inspection?.inspection_id,
    mode: gear.current_inspection ? "update" : "create",
    firefighter: selectedFirefighter,
    tagColor: rosterColor, // ← Pass the selected color
    colorLocked: colorLocked // ← Pass whether color is locked
  });
};


  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  const handleScanGear = () => {
    navigation.navigate('GearScan' as never);
  };

  const handleManualAddGear = () => {
    navigation.navigate(
      'AddGear',
      selectedFirefighter ? { presetRoster: selectedFirefighter } : undefined,
    );
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

  const handleOpenRosterModal = () => {
    setRosterModalVisible(true);
  };

  const handleCloseRosterModal = () => {
    setRosterModalVisible(false);
  };

  const handleRosterSelect = (roster: any) => {
    handleFirefighterSelect(roster);
  };

  const handleAddRosterManual = () => {
    setAddFirefighterModalVisible(true);
  };

  const handleCloseAddFirefighterModal = () => {
    setAddFirefighterModalVisible(false);
  };

  const handleFirefighterAdded = () => {
    console.log('Firefighter added successfully');
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
          categoryGears.map((gear) => {
            const gearStatus = getGearStatus(gear);
            const gearType = gearTypes.find(gt => gt.gear_type_id === gear.gear_type_id);
            
            return (
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
                    {/* <Text style={[styles.gearType, { color: colors.onSurfaceVariant }]}>
                      Type: {gearType?.gear_type || 'Unknown'}
                    </Text> */}
                    {gear.current_inspection?.inspection_date && (
                      <Text style={[styles.gearType, { color: colors.onSurfaceVariant }]}>
                        Last Inspection: {gear.current_inspection.inspection_date}
                      </Text>
                    )}
                  </View>
                  <View style={styles.gearStatus}>
                    <View 
                      style={[
                        styles.gearStatusBadge, 
                        { backgroundColor: getStatusColor(gearStatus) }
                      ]}
                    >
                      <Text style={styles.gearStatusText}>
                        {gearStatus}
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
            );
          })
        )}
      </View>
    );
  };

  // Render main categories view - ALWAYS render categories even if empty
  const renderCategories = () => {
    if (selectedCategory) return null;

    return (
      <View style={styles.categoriesSection}>
        <View style={styles.gearsHeader}>
          <Divider style={styles.divider} />
          <Text style={[styles.gearsTitle, { color: colors.onSurfaceVariant, backgroundColor: colors.background }]}>
            Gears
          </Text>
          <Divider style={styles.divider} />
        </View>
        
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

        {/* Category Header */}
        <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
          <IconButton icon={category.icon} size={24} iconColor="#fff" />
        </View>

        <Text style={[styles.categoryTitle, { color: colors.onSurface }]}>
          {category.title}
        </Text>

        <Text style={[styles.gearCount, { color: colors.onSurfaceVariant }]}>
          {categoryGears.length} items
        </Text>

        {/* ------------------ INSPECTION SUMMARY LIST ------------------ */}
<View style={{ marginTop: 12 , width:"100%"}}>

  {/* ---------- CURRENT INSPECTION ---------- */}
  <Text style={[styles.sectionTitleInspection, {color: colors.onSurface,     fontSize: p(14), }]}>
    Current Inspection
  </Text>

  {inspectionSummary.some(i => i.current_status !== "No Current Inspection") ? (
    inspectionSummary.map(gear => (
      <View key={gear.gear_id} style={styles.rowItem}>
        <Text style={styles.rowLeft}>
          {gear.gear_usage} — {gear.gear_name}
        </Text>

        <Text 
          style={[
            styles.rowRight,
            { color: getStatusColor(gear.current_status) }
          ]}
        >
          {gear.current_status}
        </Text>
      </View>
    ))
  ) : (
    <Text style={{ color: colors.onSurfaceVariant }}>No current inspections</Text>
  )}

  {/* ---------- PREVIOUS INSPECTION ---------- */}
  <Text
    style={[
      styles.sectionTitleInspection,
      { color: colors.onSurface, marginTop: 16 }
    ]}
  >
    Previous Inspection
  </Text>

  {inspectionSummary.some(i => i.previous_status !== "No Previous Inspection") ? (
    inspectionSummary.map(gear => (
      <View key={gear.gear_id} style={styles.rowItem}>
        <Text style={styles.rowLeft}>
          {gear.gear_usage} — {gear.gear_name}
        </Text>

        <Text
          style={[
            styles.rowRight,
            { color: colors.onSurfaceVariant }
          ]}
        >
          {gear.previous_status}
        </Text>
      </View>
    ))
  ) : (
    <Text style={{ color: colors.onSurfaceVariant }}>No previous inspections</Text>
  )}

</View>

        {/* ---------------- END SUMMARY LIST ---------------- */}
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
        {/* Firefighter Selection Card */}
        {selectedFirefighter ? (
          <Card style={[styles.firefighterCard, { backgroundColor: colors.surface }]}>
            <Card.Content>
              <View style={styles.firefighterHeader}>
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
                      {selectedFirefighter.phone} • {selectedFirefighter.firestation?.name || selectedFirefighter.station || 'Unknown Station'}
                    </Text>
                  </View>
                </View>
<View style={{ gap: 10 }}>

  {/* 1️⃣ CHANGE FIREFIGHTER BUTTON (always visible) */}
  <Button
    mode="outlined"
    onPress={handleOpenRosterModal}
    style={styles.changeButton}       // same style as before
    labelStyle={styles.changeButtonLabel}
    icon="account-switch"
  >
    Change Firefighter
  </Button>

  {/* 2️⃣ TAG COLOR BUTTON */}
{/* TAG COLOR BUTTON */}
{rosterColor ? (
  <Button
    mode="outlined"
    icon="pencil"
    onPress={() => {
      if (!colorLocked) setColorPickerVisible(true);
    }}
    disabled={colorLocked} // disable if locked
    style={[styles.changeButton, { backgroundColor: rosterColor }]}
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
        color:"white"
      }}
    >
      {colorLocked ? "Color Locked" : "Change Color"}
    </Text>
  </Button>
) : (
  <Button
    mode="outlined"
    onPress={() => setColorPickerVisible(true)}
    icon="palette"
    style={styles.changeButton}
    labelStyle={styles.changeButtonLabel}
  >
    Select Color
  </Button>
)}


</View>




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

        {/* Three Action Buttons - Always visible */}
        <View style={styles.actionRow}>
          <Button
            mode="contained"
            onPress={handleScanGear}
            style={[styles.actionButton, 
              // { backgroundColor: colors.primary }
            ]}
            icon="barcode-scan"
            labelStyle={styles.actionButtonLabel}
            contentStyle={styles.actionButtonContent}
            disabled={!selectedFirefighter}
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
            disabled={!selectedFirefighter}
          >
            Add New Gear
          </Button>

          <Button
            mode="outlined"
            onPress={handleAddRosterManual}
            style={styles.actionButton}
            icon="account-plus"
            labelStyle={styles.actionButtonLabel}
            contentStyle={styles.actionButtonContent}
          >
            Add New Fire Fighter
          </Button>
        </View>

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
        {!selectedCategory && selectedFirefighter && (
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
            >
              Complete Inspection
            </Button>
          </View>
        )}

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
              setRosterColor(color?.toLocaleLowerCase());
              setColorPickerVisible(false);
            }}
          />

        <AddFirefighterModal
          visible={addFirefighterModalVisible}
          onClose={handleCloseAddFirefighterModal}
          onSuccess={handleFirefighterAdded}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

// ... keep all the existing styles the same ...
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
    gap: p(16),
  },
  // Firefighter Card Styles
  firefighterCard: {
    borderRadius: p(12),
    elevation: 2,
  },
  firefighterHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
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
  firefighterName: {
    fontSize: p(16),
    fontWeight: '600',
    marginBottom: p(4),
  },
  firefighterInfoText: {
    fontSize: p(12),
    marginBottom: p(2),
  },
  changeButton: {
    borderRadius: p(8),
    marginLeft: p(8),
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: p(8),
  },
  actionButton: {
    flex: 1,
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
  categoriesSection: {
    marginTop: p(8),
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

export default FirefighterFlowScreen;