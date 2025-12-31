import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { Text, Card, Button, Icon, useTheme, Chip, TextInput } from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Header from '../../components/common/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { inspectionApi } from '../../services/inspectionApi';
import { useLeadStore } from '../../store/leadStore';
import { getColorHex } from '../../constants/colors';
import { GEAR_IMAGE_URLS, getGearIconImage } from '../../constants/gearImages';
import GearCardSkeleton from '../skeleton/GearCardSkeleton';
import { getStatusColor } from '../../constants/inspection';

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
    roster_id?: number;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    rank?: string;
  };
  inspection_id: number;
  inspection_date: string;
  hydro_test_result: 'PASS' | 'FAIL' | null;
  hydro_test_performed: 'YES' | 'NO' | null;
  gear_findings: string | null | Array<{id: number; findings: string}>;
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
  tag_color: string;
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

// Status color mapping moved to global constants - use getStatusColor() instead

// Function to get appropriate emoji based on gear type
const getGearEmoji = (gearType: string | null) => {
  if (!gearType) return '📦';
  
  const type = gearType.toUpperCase();
  if (type.includes('JACKET')) return '🧥';
  if (type.includes('PANT')) return '👖';
  if (type.includes('HELMET')) return '⛑️';
  if (type.includes('GLOVE')) return '🧤';
  if (type.includes('BOOT')) return '👢';
  
  return '📦'; // Default for others
};

// Function to get appropriate image URL based on gear type
const getGearImageUrl = (gearType: string | null) => {
  if (!gearType) return GEAR_IMAGE_URLS.other;
  
  const type = gearType.toUpperCase();
  if (type.includes('JACKET') && type.includes('LINER')) return GEAR_IMAGE_URLS.jacket_liner;
  if (type.includes('JACKET')) return GEAR_IMAGE_URLS.jacket;
  if (type.includes('PANT') && type.includes('LINER')) return GEAR_IMAGE_URLS.pants_liner;
  if (type.includes('PANT')) return GEAR_IMAGE_URLS.pants;
  if (type.includes('HELMET')) return GEAR_IMAGE_URLS.helmet;
  if (type.includes('GLOVE')) return GEAR_IMAGE_URLS.gloves;
  if (type.includes('BOOT')) return GEAR_IMAGE_URLS.boots;
  if (type.includes('HOOD')) return GEAR_IMAGE_URLS.hood;
  
  return GEAR_IMAGE_URLS.other; // Default for others
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
  // If it's already a hex color, return it
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(trimmed)) {
    return trimmed;
  }
  // Otherwise, map color name to hex using COLOR_MAP
  return getColorHex(trimmed);
};

export default function GearsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { load } = route.params as RouteProps;
  const { currentLead } = useLeadStore();
  
  const [gearInspections, setGearInspections] = useState<GearInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<GearStatus | 'All'>('All');

  // Mobile detection
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isMobile = screenWidth < 600;
  const numColumns = isMobile ? 1 : 2;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription.remove();
  }, []);

  const fetchGearInspections = useCallback(async (options?: { skipLoader?: boolean }) => {
    const useLoader = !options?.skipLoader;

    if (!load?.loadNumber || !currentLead?.lead_id) {
      console.log('Missing loadId or leadId');
      if (useLoader) {
        setLoading(false);
      }
      return;
    }

    try {
      if (useLoader) {
        setLoading(true);
      }
      const response = await inspectionApi.getGearInspectionsLoadwise(load.loadNumber, currentLead.lead_id);
      console.log('Raw API response:', response);

      if (response?.gear_inspections) {
        console.log('First inspection roster data:', response.gear_inspections[0]?.roster);
        // Ensure roster names are properly constructed
        const processedInspections = response.gear_inspections.map((inspection: any) => ({
          ...inspection,
          roster: {
            ...inspection.roster,
            name: inspection.roster.name ||
                  [inspection.roster.first_name, inspection.roster.middle_name, inspection.roster.last_name]
                    .filter(Boolean)
                    .join(' ') ||
                  'Unknown Firefighter'
          }
        }));
        setGearInspections(processedInspections);
      } else {
        setGearInspections([]);
      }
    } catch (error) {
      console.error('Error fetching gear inspections:', error);
      setGearInspections([]);
    } finally {
      if (useLoader) {
        setLoading(false);
      }
    }
  }, [load?.loadNumber, currentLead?.lead_id]);

  // Fetch gear inspections on mount
  useEffect(() => {
    fetchGearInspections();
  }, [fetchGearInspections]);

  // Refresh gear inspections when screen comes into focus (e.g., returning from UpdateInspectionScreen)
  useFocusEffect(
    useCallback(() => {
      fetchGearInspections();
    }, [fetchGearInspections])
  );
  
  const filteredGearInspections = gearInspections.filter(inspection => {
    const matchesSearch =
      inspection.gear.gear_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inspection.gear.serial_number?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      inspection.roster.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || inspection.gear_status.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Status color function moved to global constants - use getStatusColor() instead

  const handleUpdateGear = async (inspection: GearInspection) => {
    console.log('handleUpdateGear called with inspection:', {
      inspection_id: inspection.inspection_id,
      gear_id: inspection.gear.gear_id,
      roster_name: inspection.roster.name,
      tag_color: inspection.tag_color,
      roster_data: inspection.roster,
      full_inspection: inspection
    });

    // Parse roster name to extract first, middle, and last name
    const nameParts = inspection.roster.name.trim().split(/\s+/).filter(part => part.length > 0);
    const firstName = nameParts[0] || '';
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : (nameParts.length === 2 ? '' : nameParts[1] || '');
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

    console.log('Parsed name parts:', { nameParts, firstName, middleName, lastName });

    // Try to fetch inspection data to get full roster information including roster_id
    let rosterId: number | undefined;
    try {
      console.log('Fetching inspection data for roster_id...');
      const inspectionResponse = await inspectionApi.getGearInspectionByInspectionId(inspection.inspection_id);
      console.log('Inspection API response:', inspectionResponse);

      if (inspectionResponse?.status && inspectionResponse?.data?.roster) {
        rosterId = inspectionResponse.data.roster.roster_id;
        console.log('Roster ID found:', rosterId);
      } else {
        console.log('No roster data found in response');
      }
    } catch (error) {
      console.log('Could not fetch inspection data for roster_id, using name only. Error:', error);
    }

    // Construct roster object from inspection data
    const roster = {
      name: inspection.roster.name,
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      roster_id: rosterId,
      id: rosterId,
      email: '',
      phone: '',
    };

    console.log('Constructed roster object:', roster);

    // Get tag color from inspection
    const tagColor = normalizeTagColor(inspection.tag_color);
    console.log('Normalized tag color:', tagColor);

    const navigationParams = {
      gearId: inspection.gear.gear_id,
      inspectionId: inspection.inspection_id,
      mode: 'update' as const,
      firefighter: roster,
      tagColor: tagColor || undefined,
      colorLocked: !!inspection.tag_color
    };

    console.log('Navigation params:', navigationParams);

    try {
      console.log('Attempting navigation to UpadateInspection...');
      navigation.navigate('UpadateInspection', navigationParams);
      console.log('Navigation call completed successfully');
    } catch (navError) {
      console.error('Navigation failed:', navError);
    }
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

      // Handle gear_findings - can be string, null, or array of objects
      let finding: string = 'N/A';
      if (inspection.gear_findings) {
        if (Array.isArray(inspection.gear_findings)) {
          finding = inspection.gear_findings.map(f => f.findings).join(', ');
        } else if (typeof inspection.gear_findings === 'string') {
          finding = inspection.gear_findings;
        }
      }

      return (
        <View style={[styles.inspectionSection, { borderTopColor: colors.outline }]}>
          <Text variant="labelLarge" style={[styles.sectionTitle, { color: colors.primary }]}>
            Inspection Details
          </Text>
          
          <View style={styles.detailRow}>
            <Icon source="calendar" size={14} color={colors.primary} />
            <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Date:</Text>
            <Text style={[styles.detailValue, { color: colors.onSurface }]}>{inspectionDate}</Text>
          </View>

          {hydroTestResult && (
            <>
              <View style={styles.detailRow}>
                <Icon source="water" size={14} color={colors.primary} />
                <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Hydro Test:</Text>
                <Text style={[styles.detailValue, { color: colors.onSurface }]}>{hydroTestResult}</Text>
              </View>

              <View style={styles.detailRow}>
                <Icon source="check-circle" size={14} color={colors.primary} />
                <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Hydro Performed:</Text>
                <Text style={[styles.detailValue, { color: colors.onSurface }]}>{hydroTestPerformed}</Text>
              </View>
            </>
          )}

          <View style={styles.detailRow}>
            <Icon source="currency-usd" size={14} color={colors.primary} />
            <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Cost:</Text>
            <Text style={[styles.detailValue, { color: colors.onSurface }]}>{inspectionCost}</Text>
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
            <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Service:</Text>
            <Text style={[styles.detailValue, { color: colors.onSurface }]}>{serviceType}</Text>
          </View>

          {finding !== 'N/A' && (
            <View style={styles.detailRow}>
              <Icon source="alert-circle" size={14} color={colors.primary} />
              <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Finding:</Text>
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

    const tagColor = normalizeTagColor(item.tag_color) || "";
    const statusColor = getStatusColor(item.gear_status.id, item.gear_status.status);
    const gearTypeName = item.gear.gear_type?.gear_type || item.gear.gear_name || 'Other';
    
    // Get inspection images
    const inspectionImages = (item as any).inspection_images || [];
    const hasImages = inspectionImages.length > 0;

    return (
      <View style={[styles.cardWrapper, { width: isMobile ? '100%' : '48%' }]}>
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

              {/* Gear Icon - Single Icon Based on Gear Type */}
              {/* Commented out: Gear Images - 3 Column Grid or Default Image */}
              {/*
              {hasImages ? (
                <View style={styles.inspectionImagesContainer}>
                  {inspectionImages.slice(0, 6).map((imageUri: string, index: number) => (
                    <View key={index} style={styles.inspectionImageBox}>
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.inspectionImage}
                        resizeMode="cover"
                      />
                    </View>
                  ))}
                  {inspectionImages.length > 6 && (
                    <View style={[styles.inspectionImageBox, styles.moreImagesBox]}>
                      <Text style={styles.moreImagesText}>+{inspectionImages.length - 6}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.gearImageContainer}>
                  <Image
                    source={{ uri: getGearImageUrl(gearTypeName) }}
                    style={styles.gearImage}
                    resizeMode="cover"
                  />
                </View>
              )}
              */}

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
                  <Text style={[styles.detailValue, { color: colors.onSurface }]}>{item.gear.serial_number || 'N/A'}</Text>
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
                    {item.gear.manufacturer.manufacturer_name}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Icon source="ruler" size={14} color={colors.primary} />
                  <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Size:</Text>
                  <Text style={[styles.detailValue, { color: colors.onSurface }]}>{(item as any).gear_size || item.gear.gear_size || 'N/A'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Icon source="account" size={14} color={colors.primary} />
                  <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Firefighter:</Text>
                  <Text style={[styles.detailValue, { color: colors.onSurface }]} numberOfLines={1}>
                    {item.roster.name}
                  </Text>
                </View>

                {item.tag_color && (
                  <View style={styles.detailRow}>
                    <View style={[styles.colorTag, { backgroundColor: tagColor }]} />
                    <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Tag:</Text>
                    <Text style={[styles.detailValue, { color: colors.onSurface }]}>{item.tag_color}</Text>
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
  }, [colors, navigation, renderInspectionDetails, isMobile]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchGearInspections({ skipLoader: true });
    } finally {
      setRefreshing(false);
    }
  };

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
            <Text variant="titleSmall" style={{ fontWeight: '600' }}>
              Load No {load.loadNumber}
            </Text>
            <Text variant="titleSmall" style={{ fontWeight: '600' }}>
              {gearInspections.length} Gear Inspections
            </Text>
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
                      ? status === 'All' ? colors.primary : getStatusColor(null, status as GearStatus)
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

      {/* Gears List - Single Column */}
      {loading ? (
        <GearCardSkeleton count={3} isMobile={isMobile} numColumns={numColumns} />
      ) : (
        <FlatList
          data={filteredGearInspections}
          renderItem={renderGear}
          keyExtractor={(item) => item.inspection_id.toString()}
          numColumns={numColumns}
          contentContainerStyle={[styles.grid, isMobile ? styles.gridMobile : styles.gridTablet]}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchFilterContainer: {
    // padding: p(2),
    padding: p(5),
    // paddingBottom: p(12),
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
  },
  gridMobile: {
    paddingHorizontal: p(10),
  },
  gridTablet: {
    paddingHorizontal: p(12),
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: p(10),
  },
  cardWrapper: {
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
    // height: p(26),
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
    width: p(100),
    height: p(100),
    borderRadius: p(8),
  },
  gearEmoji: {
    fontSize: p(64),
    textAlign: 'center',
  },
  inspectionImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: p(8),
    gap: p(4),
  },
  inspectionImageBox: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: p(6),
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  inspectionImage: {
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
  inspectionSection: {
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