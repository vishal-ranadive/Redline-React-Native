import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Card, Button, Icon, useTheme, Chip, TextInput } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../../components/common/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { inspectionApi } from '../../services/inspectionApi';
import { useLeadStore } from '../../store/leadStore';

type GearStatus = 'Pass' | 'Expired' | 'Recommended OOS' | 'Corrective Action Required' | 'Repair' | 'Recommended Out Of Service' | 'Fail';

type GearInspection = {
  gear: {
    gear_id: number;
    gear_name: string;
    manufacturer: {
      manufacturer_id: number;
      manufacturer_name: string;
    };
    gear_type: {
      gear_type_id: number;
      gear_type: string;
    };
    manufacturing_date: string;
    gear_size: string;
    serial_number: string;
  };
  roster: {
    name: string; // firstName + MiddleName + LastName
    tag_color: string;
  };
  inspection_id: number;
  inspection_date: string;
  hydro_test_result: 'PASS' | 'FAIL' | null;
  hydro_test_performed: 'YES' | 'NO' | null;
  gear_findings: string | null;
  inspection_cost: number;
  remarks: string;
  gear_status: {
    id: number;
    status: GearStatus;
  };
    service_type: {
      id: number;
      status: string; // e.g., 'Cleaned and Inspected', 'Inspected Only', 'Specialised Cleaning', etc.
    };
};

type Load = {
  id: string;
  name: string;
  loadNumber: number;
};

type RouteProps = {
  load: Load;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'UpadateInspection'>;

// Different gear images for different gear types
const GEAR_IMAGES = {
  'Helmet': 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
  'Gloves': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFDCux32MFLBioGWbYdOiDfJoCV4sko1-sSQ&s',
  'Boots': 'https://www.hacsons.com/wp-content/uploads/2024/08/image-3-1.png',
  'Jacket': 'https://images.unsplash.com/photo-1553062407-98cff3078e9a?w=400&h=400&fit=crop',
  'Mask': 'https://multimedia.3m.com/mws/media/1927020O/3m-scott-av-3000-ht-facepiece-600x600p.jpg',
  'Harness': 'https://www.uviraj.com/images/FBH-EN/U222FBH.jpg',
  'Axe': 'https://png.pngtree.com/element_our/20190528/ourmid/pngtree-a-metal-axe-image_1161001.jpg',
  'Hose': 'https://tirupatiplasto.in/wp-content/upiVBORw0KGgoAAAANSUhEUgAAARMAAAC3CAMAAAAGjUrGAAACRlBMVEXloads/2023/06/fh1.jpg',
  'default': 'https://media.gettyimages.com/id/72542196/photo/firemens-gear-at-firehouse.jpg?s=612x612&w=0&k=20&c=Hha2TRyDvyoN3CYK-Hjp_uWf-Jg1P4oJJVWtY6CP6eU='
};

const statusColorMap: { [key: string]: string } = {
  Pass: '#34A853',
  Repair: '#F9A825',
  Expired: '#ff0303ff',
  'Recommended Out Of Service': '#f15719ff',
  'Corrective Action Required': '#F9A825',
  Fail: '#8B4513',
};

// Function to get appropriate image based on gear type
const getGearImage = (gearType: string | null) => {
  if (!gearType) return GEAR_IMAGES.default;
  
  const type = gearType.toLowerCase();
  if (type.includes('helmet')) return GEAR_IMAGES.Helmet;
  if (type.includes('glove')) return GEAR_IMAGES.Gloves;
  if (type.includes('boot')) return GEAR_IMAGES.Boots;
  if (type.includes('jacket')) return GEAR_IMAGES.Jacket;
  if (type.includes('mask')) return GEAR_IMAGES.Mask;
  if (type.includes('harness')) return GEAR_IMAGES.Harness;
  if (type.includes('axe')) return GEAR_IMAGES.Axe;
  if (type.includes('hose')) return GEAR_IMAGES.Hose;
  
  return GEAR_IMAGES.default;
};

// Function to get appropriate icon for gear type
const getGearTypeIcon = (gearType: string | null) => {
  if (!gearType) return 'package-variant';
  
  const type = gearType.toLowerCase();
  if (type.includes('pant') || type.includes('pants')) return 'tshirt-v';
  if (type.includes('jacket')) return 'tshirt-crew';
  if (type.includes('liner')) return 'tshirt-crew';
  if (type.includes('helmet')) return 'hard-hat';
  if (type.includes('glove')) return 'hand-back-left';
  if (type.includes('boot')) return 'shoe-formal';
  if (type.includes('mask')) return 'gas-mask';
  if (type.includes('harness')) return 'seatbelt';
  if (type.includes('axe')) return 'axe';
  if (type.includes('hose')) return 'pipe';
  
  return 'package-variant';
};

const normalizeTagColor = (color?: string | null) => {
  if (!color) {
    return null;
  }
  const trimmed = color.trim();
  if (!trimmed) {
    return null;
  }
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed.toLowerCase();
};

export default function GearsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { load } = route.params as RouteProps;
  const { currentLead } = useLeadStore();
  
  const [gearInspections, setGearInspections] = useState<GearInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<GearStatus | 'All'>('All');

  // Fetch gear inspections on mount
  useEffect(() => {
    fetchGearInspections();
  }, [load, currentLead]);

  const fetchGearInspections = async () => {
    if (!load?.loadNumber || !currentLead?.lead_id) {
      console.log('Missing loadId or leadId');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await inspectionApi.getGearInspectionsLoadwise(load.loadNumber, currentLead.lead_id);
      
      if (response?.gear_inspections) {
        setGearInspections(response.gear_inspections);
      } else {
        setGearInspections([]);
      }
    } catch (error) {
      console.error('Error fetching gear inspections:', error);
      setGearInspections([]);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredGearInspections = gearInspections.filter(inspection => {
    const matchesSearch =
      inspection.gear.gear_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inspection.gear.serial_number?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      inspection.roster.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || inspection.gear_status.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getGearStatusColor = (status: string) => {
    return statusColorMap[status] || '#9E9E9E';
  };

  const handleUpdateGear = (inspection: GearInspection) => {
    navigation.navigate('UpadateInspection', {
      gearId: inspection.gear.gear_id,
      inspectionId: inspection.inspection_id,
      mode: 'update'
    });
  };

  /**
   * Render inspection details section
   */
  const renderInspectionDetails = useCallback(
    (inspection: GearInspection) => {
      if (!inspection) return null;

      const inspectionDate = inspection.inspection_date || 'N/A';
      const hydroTestResult = inspection.hydro_test_result;
      const hydroTestPerformed = inspection.hydro_test_performed !== null 
        ? (inspection.hydro_test_performed === 'YES' ? 'Yes' : 'No')
        : 'N/A';
      const inspectionCost = inspection.inspection_cost !== null && inspection.inspection_cost !== undefined
        ? `$${inspection.inspection_cost.toFixed(2)}`
        : 'N/A';
      const remarks = inspection.remarks || 'N/A';
      const serviceType = inspection.service_type?.status || 'N/A';
      const finding = inspection.gear_findings || 'N/A';

      return (
        <View style={styles.inspectionSection}>
          <Text variant="labelLarge" style={[styles.sectionTitle, { color: colors.primary }]}>
            Inspection Details
          </Text>
          
          <View style={styles.detailRow}>
            <Icon source="calendar" size={14} color="#666" />
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{inspectionDate}</Text>
          </View>

          {hydroTestResult && (
            <>
              <View style={styles.detailRow}>
                <Icon source="water" size={14} color="#666" />
                <Text style={styles.detailLabel}>Hydro Test:</Text>
                <Text style={styles.detailValue}>{hydroTestResult}</Text>
              </View>

              <View style={styles.detailRow}>
                <Icon source="check-circle" size={14} color="#666" />
                <Text style={styles.detailLabel}>Hydro Performed:</Text>
                <Text style={styles.detailValue}>{hydroTestPerformed}</Text>
              </View>
            </>
          )}

          <View style={styles.detailRow}>
            <Icon source="currency-usd" size={14} color="#666" />
            <Text style={styles.detailLabel}>Cost:</Text>
            <Text style={styles.detailValue}>{inspectionCost}</Text>
          </View>

          <View style={styles.detailRow}>
            <Icon source="note-text" size={14} color="#666" />
            <Text style={styles.detailLabel}>Remarks:</Text>
            <Text style={[styles.detailValue, styles.remarksText]} numberOfLines={2}>
              {remarks}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon source="wrench" size={14} color="#666" />
            <Text style={styles.detailLabel}>Service:</Text>
            <Text style={styles.detailValue}>{serviceType}</Text>
          </View>

          {finding !== 'N/A' && (
            <View style={styles.detailRow}>
              <Icon source="alert-circle" size={14} color="#666" />
              <Text style={styles.detailLabel}>Finding:</Text>
              <Text style={[styles.detailValue, styles.findingText]} numberOfLines={1}>
                {finding}
              </Text>
            </View>
          )}
        </View>
      );
    },
    [colors],
  );

  /**
   * Render individual gear inspection card
   */
  const renderGear = useCallback(({ item }: { item: GearInspection }) => {
    const tagColor = normalizeTagColor(item.roster.tag_color) || colors.primary;
    const statusColor = getGearStatusColor(item.gear_status.status);
    const gearTypeName = item.gear.gear_type?.gear_type || item.gear.gear_name || 'Other';

    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleUpdateGear(item)}
          style={[styles.card, styles.shadow, { borderColor: colors.outline }]}
        >
          <View style={[styles.cardTagBadge, { backgroundColor: tagColor }]} />
          <Card style={{ backgroundColor: colors.surface }}>
            <Card.Content>
              {/* Card Header with Gear Status */}
              <View style={styles.cardHeader}>
                {item.gear_status.status ? (
                  <Chip 
                    mode="outlined" 
                    textStyle={[styles.gearStatusText, { color: '#fff' }]}
                    style={[
                      styles.headerStatusChip,
                      { backgroundColor: statusColor, borderColor: statusColor },
                    ]}
                  >
                    {item.gear_status.status}
                  </Chip>
                ) : (
                  <Chip
                    mode="outlined"
                    textStyle={[styles.gearStatusText, { color: '#fff' }]}
                    style={[
                      styles.headerStatusChip,
                      { backgroundColor: statusColor, borderColor: statusColor },
                    ]}
                  >
                    No Status
                  </Chip>
                )}
              </View>

              {/* Gear Image */}
              <View style={styles.gearImageContainer}>
                <Image
                  source={{
                    uri: getGearImage(gearTypeName),
                  }}
                  style={styles.gearImage}
                  resizeMode="cover"
                />
              </View>

              {/* Gear Details */}
              <View style={styles.gearDetails}>
                <View style={styles.detailRow}>
                  <Icon source="barcode" size={14} color="#666" />
                  <Text style={styles.detailLabel}>Serial:</Text>
                  <Text style={styles.detailValue}>{item.gear.serial_number || 'N/A'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Icon source="tag-outline" size={14} color="#666" />
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={[styles.detailValue]} numberOfLines={1}>
                    {gearTypeName}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Icon source="factory" size={14} color="#666" />
                  <Text style={styles.detailLabel}>Manufacturer:</Text>
                  <Text style={[styles.detailValue]} numberOfLines={1}>
                    {item.gear.manufacturer.manufacturer_name}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Icon source="ruler" size={14} color="#666" />
                  <Text style={styles.detailLabel}>Size:</Text>
                  <Text style={styles.detailValue}>{item.gear.gear_size || 'N/A'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Icon source="account" size={14} color="#666" />
                  <Text style={styles.detailLabel}>Firefighter:</Text>
                  <Text style={[styles.detailValue]} numberOfLines={1}>
                    {item.roster.name}
                  </Text>
                </View>

                {item.roster.tag_color && (
                  <View style={styles.detailRow}>
                    <View style={[styles.colorTag, { backgroundColor: tagColor }]} />
                    <Text style={styles.detailLabel}>Tag:</Text>
                    <Text style={styles.detailValue}>{item.roster.tag_color}</Text>
                  </View>
                )}
              </View>

              {/* Inspection Details */}
              {renderInspectionDetails(item)}

              {/* Update Button */}
              <Button
                mode="contained"
                onPress={() => handleUpdateGear(item)}
                icon="clipboard-edit-outline"
                style={styles.updateButton}
                contentStyle={styles.updateButtonContent}
                buttonColor={tagColor}
              >
                Update
              </Button>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      </View>
    );
  }, [colors, navigation, renderInspectionDetails]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title={`Gears - ${load.name}`}
        showBackButton={true}
      />

      {/* Load Info Card */}
      <Card style={[styles.binInfoCard, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <View style={styles.binCompactRow}>
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall" style={{ fontWeight: '600' }}>
                {load.name || 'Load Name'}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginTop: p(2) }}>
                {gearInspections.length} Gear Inspections
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Search & Filter Section */}
      <View style={[styles.searchFilterContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          mode="outlined"
          placeholder="Search by serial, gear name, or firefighter"
          value={searchQuery}
          onChangeText={setSearchQuery}
          left={<TextInput.Icon icon="magnify" />}
          style={styles.searchInput}
          dense
        />

        <View style={styles.filterChips}>
          {(['All', 'Pass', 'Expired', 'Repair', 'Recommended Out Of Service', 'Corrective Action Required'] as (GearStatus | 'All')[]).map(status => (
            <Chip
              key={status}
              selected={statusFilter === status}
              onPress={() => setStatusFilter(status)}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    statusFilter === status
                      ? status === 'All' ? colors.primary : getGearStatusColor(status as GearStatus)
                      : colors.surfaceVariant,
                },
              ]}
              textStyle={{
                color: statusFilter === status ? '#fff' : colors.onSurfaceVariant,
                fontSize: p(10),
              }}
              compact
            >
              {status}
            </Chip>
          ))}
        </View>
      </View>

      {/* Gears Grid - Two Columns */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.onSurfaceVariant }}>Loading gear inspections...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGearInspections}
          renderItem={renderGear}
          keyExtractor={(item) => item.inspection_id.toString()}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon source="package-variant-closed" size={64} color={colors.outline} />
              <Text variant="titleMedium" style={{ marginTop: 16, color: colors.outline }}>
                No gears found
              </Text>
              <Text variant="bodyMedium" style={{ color: colors.outline, textAlign: 'center', marginTop: 8 }}>
                {searchQuery || statusFilter !== 'All' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'No gear inspections available for this load.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Pagination at Bottom */}
      {/* <View style={[styles.paginationContainer, { backgroundColor: colors.surface, borderTopColor: colors.outline }]}>
        <DataTable.Pagination
          page={page}
          numberOfPages={Math.ceil(filteredGears.length / numberOfItemsPerPage)}
          onPageChange={page => setPage(page)}
          label={`${from + 1}-${to} of ${filteredGears.length}`}
          showFastPaginationControls
          numberOfItemsPerPageList={numberOfItemsPerPageList}
          numberOfItemsPerPage={numberOfItemsPerPage}
          onItemsPerPageChange={setNumberOfItemsPerPage}
          selectPageDropdownLabel={'Gears per page'}
          theme={{
            colors: {
              primary: colors.primary,
              onSurface: colors.onSurface,
              surface: colors.surface,
            },
          }}
        />
      </View> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: p(10) 
  },
  binInfoCard: {
    margin: p(6),
    marginBottom: p(8),
    borderRadius: p(12),
    elevation: 2,
  },
  binCompactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  searchFilterContainer: {
    paddingHorizontal: p(14),
    paddingTop: p(8),
    paddingBottom: p(12),
    borderRadius: p(8),
    marginHorizontal: p(6),
    marginBottom: p(8),
    elevation: 1,
  },
  searchInput: {
    marginBottom: p(12),
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: p(6),
  },
  filterChip: {
    marginRight: p(4),
    marginBottom: p(4),
  },
  grid: {
    paddingBottom: p(100),
    paddingHorizontal: p(5),
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: p(9),
  },
  cardWrapper: {
    width: '48%',
    marginBottom: p(12),
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 1,
  },
  card: {
    marginHorizontal: 0,
    borderRadius: p(10),
    minHeight: p(400),
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: p(8),
    paddingRight: p(12),
  },
  headerStatusChip: {
    height: p(26),
    alignSelf: 'flex-start',
    marginRight: p(6),
  },
  gearStatusText: {
    fontSize: 11,
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
  gearImageContainer: {
    alignItems: 'center',
    marginBottom: p(8),
  },
  gearImage: {
    width: p(80),
    height: p(80),
    borderRadius: p(8),
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
    color: '#666',
    marginLeft: p(6),
    marginRight: p(4),
    fontWeight: '500',
  },
  detailValue: {
    fontSize: p(11),
    color: '#333',
    flex: 1,
    flexWrap: 'wrap',
  },
  remarksText: {
    fontSize: p(10),
    fontStyle: 'italic',
    color: '#555',
  },
  findingText: {
    color: '#d32f2f',
    fontWeight: '500',
  },
  inspectionSection: {
    marginTop: p(10),
    marginBottom: p(8),
    paddingTop: p(8),
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: p(12),
    fontWeight: 'bold',
    marginBottom: p(6),
  },
  updateButton: {
    borderRadius: p(8),
  },
  updateButtonContent: {
    paddingVertical: p(4),
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    marginBottom: p(65),
    borderTopWidth: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  colorTag: {
    width: p(16),
    height: p(16),
    borderRadius: p(8),
  },
});