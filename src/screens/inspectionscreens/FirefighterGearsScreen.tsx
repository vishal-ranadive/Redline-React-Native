import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Icon, useTheme, Chip, DataTable, TextInput, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect, type RouteProp } from '@react-navigation/native';
import Header from '../../components/common/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGearStore, type Gear } from '../../store/gearStore';
import { useInspectionStore } from '../../store/inspectionStore';
import { getColorHex } from '../../constants/colors';
import GearCardSkeleton from '../skeleton/GearCardSkeleton';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'UpadateInspection'>;

const statusColorMap: { [key: string]: string } = {
  Pass: '#34A853',
  Repair: '#F9A825',
  Expired: '#ff0303ff',
  'Recommended Out Of Service': '#f15719ff',
  'Corrective Action Required': '#F9A825',
  Fail: '#8B4513',
};

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

// Function to get appropriate icon for gear type
const getGearTypeIcon = (gearType: string | null) => {
  if (!gearType) return 'package-variant';
  
  const type = gearType.toLowerCase();
  // Check for pants first (before generic liner check)
  if (type.includes('pant') || type.includes('pants')) return 'tshirt-v';
  // Check for jacket (including jacket liner)
  if (type.includes('jacket')) return 'tshirt-crew';
  // Check for other liners (pant liner already handled above)
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

// Types based on API response
type ApiGearInspection = {
  gear_id: number;
  gear_type_id: number;
  gear_usage: any;
  gear_name: string;
  current_inspection: any | null;
  previous_inspection: any | null;
};

type GearCard = {
  gear: ApiGearInspection;
  detail: Gear | null;
  color: string | null;
  gearStatus?: string;
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

export default function FirefighterGearsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'FirefighterGearsScreen'>>();
  const { roster, leadId } = route.params;
  const { fetchGearById } = useGearStore();
  const { fetchFirefighterGears, firefighterGears, loading: inspectionLoading, error } = useInspectionStore();

  const [gearCards, setGearCards] = useState<GearCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [buildingCards, setBuildingCards] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState(8);
  const numberOfItemsPerPageList = [4, 8, 12, 16];

  // Get tag color from the first gear's current inspection
  const rosterTagColor = useMemo(() => {
    if (firefighterGears.length > 0 && firefighterGears[0].current_inspection) {
      return normalizeTagColor(firefighterGears[0].current_inspection.tag_color);
    }
    return null;
  }, [firefighterGears]);

  console.log("!leadId || !roster?.id", {leadId ,roster : roster?.id}) 

  const loadGears = useCallback(
    async (refresh = false) => {
      if (!leadId || !roster?.id) {
        setGearCards([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        await fetchFirefighterGears(leadId, roster.id);
      } catch (error) {
        console.error('Error fetching gears:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchFirefighterGears, leadId, roster?.id],
  );

  // Load gears on mount
  useEffect(() => {
    loadGears();
  }, [loadGears]);

  // Refresh gears when screen comes into focus (e.g., returning from UpdateInspectionScreen)
  useFocusEffect(
    useCallback(() => {
      loadGears(true); // Pass true to indicate refresh
    }, [loadGears])
  );

  useEffect(() => {
    let isMounted = true;
    const buildCards = async () => {
      if (!firefighterGears.length) {
        if (isMounted) {
          setGearCards([]);
          setBuildingCards(false);
        }
        return;
      }

      if (isMounted) {
        setBuildingCards(true);
      }

      try {
        const cards = await Promise.all(
          firefighterGears.map(async (gear) => {
            const detail = await fetchGearById(gear.gear_id);

            let gearStatus = '';
            if (gear.current_inspection?.gear_status) {
              gearStatus = gear.current_inspection.gear_status.status;
            }

            let tagColor = null;
            if (gear.current_inspection?.tag_color) {
              tagColor = normalizeTagColor(gear.current_inspection.tag_color);
            }

            return {
              gear,
              detail,
              color: tagColor,
              gearStatus,
            } as GearCard;
          }),
        );

        if (isMounted) {
          setGearCards(cards);
          setBuildingCards(false);
        }
      } catch (err) {
        console.error('Error building gear cards:', err);
        if (isMounted) {
          setBuildingCards(false);
        }
      }
    };

    buildCards();

    return () => {
      isMounted = false;
    };
  }, [firefighterGears, fetchGearById]);

  useEffect(() => {
    setPage(0);
  }, [numberOfItemsPerPage, searchQuery, roster?.id]);

  // Filter gears with current inspection
  const gearsWithInspection = useMemo(() => {
    return gearCards.filter(({ gear }) => gear.current_inspection !== null);
  }, [gearCards]);

  const filteredGears = useMemo(() => {
    // Apply search query if provided
    if (!searchQuery.trim()) {
      return gearsWithInspection;
    }
    const query = searchQuery.toLowerCase();
    return gearsWithInspection.filter(({ detail, gear }) => {
      const name = (detail?.gear_name ?? gear.gear_name ?? '').toLowerCase();
      const serial = (detail?.serial_number ?? '').toLowerCase();
      const type = (
        detail?.gear_type?.gear_type ??
        gear.gear_name ??
        ''
      ).toLowerCase();
      return name.includes(query) || serial.includes(query) || type.includes(query);
    });
  }, [gearsWithInspection, searchQuery]);

  // Dummy card data for testing when backend is not responding
  const dummyGearCard: GearCard = useMemo(() => ({
    gear: {
      gear_id: 999,
      gear_type_id: 1,
      gear_usage: null,
      gear_name: 'Firefighter Jacket',
      current_inspection: {
        inspection_id: 999,
        inspection_date: '2024-01-15',
        hydro_test_result: 'PASS',
        hydro_test_performed: true,
        inspection_cost: 150.00,
        remarks: 'All checks passed. Gear is in excellent condition.',
        service_type: { status: 'Cleaned and Inspected' },
        gear_status: { status: 'Pass' },
        tag_color: '#FF0000',
        gear_size: 'Large',
        hydrotest_remarks: null,
        specialisedcleaning_remarks: null,
      },
      previous_inspection: null,
    },
    detail: {
      gear_id: 999,
      gear_name: 'Firefighter Jacket',
      serial_number: 'FFJ-2024-001',
      gear_size: 'Large',
      manufacturer: { manufacturer_id: 1, manufacturer_name: 'FireGear Pro' },
      gear_type: { gear_type_id: 1, gear_type: 'Jacket' },
    } as Gear,
    color: '#FF0000',
    gearStatus: 'Pass',
  }), []);

  const isLoading = (loading || inspectionLoading || buildingCards) && !refreshing;

  // Add dummy card if no gears are available (for testing)
  const gearsToDisplay = useMemo(() => {
    if (filteredGears.length === 0 && !isLoading) {
      return [dummyGearCard];
    }
    return filteredGears;
  }, [filteredGears, isLoading, dummyGearCard]);

  const totalItems = gearsToDisplay.length;
  const from = page * numberOfItemsPerPage;
  const to = Math.min(from + numberOfItemsPerPage, totalItems);
  const currentGears = gearsToDisplay.slice(from, to);

  const handleUpdateGear = (card: GearCard) => {
    const gearId = card.detail?.gear_id ?? card.gear.gear_id;
    const inspectionId = card.gear.current_inspection?.inspection_id;
    
    navigation.navigate('UpadateInspection', {
      gearId,
      inspectionId,
      mode: 'update',
      firefighter: roster,
      tagColor: card.color ?? undefined,
      colorLocked: true,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (id: string) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
    ];
    const index = parseInt(id) % colors.length;
    return colors[index];
  };

  const handleRefresh = useCallback(() => {
    setPage(0);
    loadGears(true);
  }, [loadGears]);

  /**
   * Render inspection details section
   */
  const renderInspectionDetails = useCallback(
    (inspection: any, isPrevious: boolean = false) => {
      if (!inspection) return null;

      const sectionTitle = isPrevious ? 'Previous Inspection' : 'Current Inspection';
      const inspectionDate = inspection.inspection_date || 'N/A';
      const hydroTestResult = inspection.hydro_test_result || 'N/A';
      const hydroTestPerformed = inspection.hydro_test_performed !== null 
        ? (inspection.hydro_test_performed ? 'Yes' : 'No')
        : 'N/A';
      const inspectionCost = inspection.inspection_cost !== null && inspection.inspection_cost !== undefined
        ? `$${inspection.inspection_cost.toFixed(2)}`
        : 'N/A';
      const remarks = inspection.remarks || 'N/A';
      const serviceType = inspection.service_type?.status || 'N/A';
      const hydrotestRemarks = inspection.hydrotest_remarks || null;
      const specialisedCleaningRemarks = inspection.specialisedcleaning_remarks || null;

      return (
        <View style={styles.inspectionSection}>
          <Text variant="labelLarge" style={[styles.sectionTitle, { color: colors.primary }]}>
            {sectionTitle}
          </Text>
          
          <View style={styles.detailRow}>
            <Icon source="calendar" size={14} color="#666" />
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{inspectionDate}</Text>
          </View>

          <View style={styles.detailRow}>
            <Icon source="water" size={14} color="#666" />
            <Text style={styles.detailLabel}>Hydro Test:</Text>
            <Text style={styles.detailValue}>{hydroTestResult}</Text>
          </View>

          {hydroTestResult !== 'N/A' && (
            <View style={styles.detailRow}>
              <Icon source="check-circle" size={14} color="#666" />
              <Text style={styles.detailLabel}>Hydro Performed:</Text>
              <Text style={styles.detailValue}>{hydroTestPerformed}</Text>
            </View>
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

          {hydrotestRemarks && (
            <View style={styles.detailRow}>
              <Icon source="water" size={14} color="#666" />
              <Text style={styles.detailLabel}>Hydro Remarks:</Text>
              <Text style={[styles.detailValue, styles.remarksText]} numberOfLines={2}>
                {hydrotestRemarks}
              </Text>
            </View>
          )}

          {specialisedCleaningRemarks && (
            <View style={styles.detailRow}>
              <Icon source="brush" size={14} color="#666" />
              <Text style={styles.detailLabel}>Cleaning Remarks:</Text>
              <Text style={[styles.detailValue, styles.remarksText]} numberOfLines={2}>
                {specialisedCleaningRemarks}
              </Text>
            </View>
          )}
        </View>
      );
    },
    [colors],
  );

  /**
   * Render individual gear card
   */
  const renderGear = useCallback(
    ({ item }: { item: GearCard }) => {
      const detail = item.detail;
      const gear = item.gear;
      const tagColor = item.color ?? colors.primary;
      const gearId = detail?.gear_id ?? gear.gear_id;
      const gearName = detail?.gear_name ?? gear.gear_name ?? 'Gear';
      const serialNumber = detail?.serial_number ?? 'N/A';
      const manufacturerName =
        detail?.manufacturer?.manufacturer_name ?? 'Unknown manufacturer';
      const gearTypeName = detail?.gear_type?.gear_type ?? gear.gear_name ?? 'Other';
      const isOtherType = gearTypeName.toLowerCase().trim() === 'other';
      const displayTypeOrName = isOtherType ? gearName : gearTypeName;
      const statusColor = item.gearStatus
        ? statusColorMap[item.gearStatus] ?? tagColor
        : '#9E9E9E';

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
                  {item.gearStatus ? (
                    <Chip 
                      mode="outlined" 
                      textStyle={[styles.gearStatusText, { color: '#fff' }]}
                      style={[
                        styles.headerStatusChip,
                        { backgroundColor: statusColor, borderColor: statusColor },
                      ]}
                    >
                      {item.gearStatus}
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

                {/* Gear Emoji */}
                <View style={styles.gearImageContainer}>
                  <Text style={styles.gearEmoji}>
                    {getGearEmoji(detail?.gear_type?.gear_type ?? gear.gear_name ?? null)}
                  </Text>
                </View>

                {/* Gear Details */}
                <View style={styles.gearDetails}>
                  <View style={styles.detailRow}>
                    <Icon source="barcode" size={14} color="#666" />
                    <Text style={styles.detailLabel}>Serial:</Text>
                    <Text style={styles.detailValue}>{serialNumber}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Icon source="tag-outline" size={14} color="#666" />
                    <Text style={styles.detailLabel}>Type:</Text>
                    <Text style={[styles.detailValue]} numberOfLines={1}>
                      {displayTypeOrName}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Icon source="factory" size={14} color="#666" />
                    <Text style={styles.detailLabel}>Manufacturer:</Text>
                    <Text style={[styles.detailValue]} numberOfLines={1}>
                      {manufacturerName}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Icon source="ruler" size={14} color="#666" />
                    <Text style={styles.detailLabel}>Size:</Text>
                    <Text style={styles.detailValue}>{gear.current_inspection?.gear_size || detail?.gear_size || 'N/A'}</Text>
                  </View>
                </View>

                {/* Current Inspection Details */}
                {renderInspectionDetails(gear.current_inspection, false)}

                {/* Previous Inspection Details */}
                {gear.previous_inspection && renderInspectionDetails(gear.previous_inspection, true)}

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
    },
    [colors, navigation, renderInspectionDetails],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header 
          title={`${roster.name}'s Gears`}
          showBackButton={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="large" 
            color={colors.primary} 
            animating={true}
          />
          <Text 
            variant="bodyLarge" 
            style={[styles.loadingText, { color: colors.onSurface, marginTop: p(16) }]}
          >
            {buildingCards ? 'Loading gear details...' : 'Loading gears...'}
          </Text>
          <Text 
            variant="bodySmall" 
            style={[styles.loadingSubtext, { color: colors.onSurfaceVariant, marginTop: p(8) }]}
          >
            Please wait
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title={`${roster.name}'s Gears`}
        showBackButton={true}
      />

      {/* Firefighter Info Card */}
      <Card style={[styles.firefighterInfoCard, { backgroundColor: colors.surface }]}>
        {rosterTagColor && (
          <View style={[styles.rosterTagBadge, { backgroundColor: rosterTagColor }]} />
        )}
        <Card.Content>
          <View style={styles.firefighterHeader}>
            {/* Left: Profile Avatar and Name/Email */}
            <View style={styles.leftSection}>
              <View style={[styles.avatar, { backgroundColor: getAvatarColor(String(roster.id)) }]}>
                <Text style={styles.avatarText}>{getInitials(roster.name)}</Text>
              </View>
              <View style={styles.nameEmailContainer}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold', fontSize: p(14) }}>
                  {roster.name}
                </Text>
                <Text style={{ fontSize: p(12), color: '#666' }} numberOfLines={1}>
                  {roster.email || 'firefighter@station.com'}
                </Text>
              </View>
            </View>

            {/* Right: Total Gears Count */}
            <View style={styles.rightSection}>
              <View style={styles.gearCountContainer}>
                {/* <Icon source="tools" size={p(20)} color={colors.primary} /> */}
                <Text style={styles.gearCountText}>{gearsToDisplay.length}</Text>
                <Text style={styles.gearLabel}>Total Scanned Gears</Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* 🔍 Search Section */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          mode="outlined"
          placeholder="Search by gear name, serial number, or type"
          value={searchQuery}
          onChangeText={setSearchQuery}
          left={<TextInput.Icon icon="magnify" />}
          style={styles.searchInput}
          dense
        />
      </View>

      {/* Gears List - Single Column */}
      {isLoading ? (
        <GearCardSkeleton count={3} />
      ) : (
        <FlatList
          data={currentGears}
          renderItem={renderGear}
          keyExtractor={(item) => item.gear.gear_id.toString()}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon source="package-variant-closed" size={64} color={colors.outline} />
              <Text variant="titleMedium" style={{ marginTop: 16, color: colors.outline }}>
                No Gears Found
              </Text>
              <Text variant="bodyMedium" style={{ color: colors.outline, textAlign: 'center', marginTop: 8 }}>
                {searchQuery
                  ? 'Try adjusting your search criteria' 
                  : 'No gears assigned to this roster'
                }
              </Text>
            </View>
          }
        />
      )}

      {/* Pagination */}
      {!isLoading && gearsToDisplay.length > 0 && (
        <View style={[styles.paginationContainer, { backgroundColor: colors.surface, borderTopColor: colors.outline }]}>
          <DataTable.Pagination
            page={page}
            numberOfPages={Math.ceil(gearsToDisplay.length / numberOfItemsPerPage)}
            onPageChange={newPage => setPage(newPage)}
            label={`${from + 1}-${to} of ${gearsToDisplay.length}`}
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
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: p(10) 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: p(20),
  },
  loadingText: {
    fontSize: p(16),
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: p(12),
    textAlign: 'center',
    opacity: 0.7,
  },
  firefighterInfoCard: {
    margin: p(14),
    marginBottom: p(8),
    borderRadius: p(8),
    elevation: 1,
    overflow: 'hidden',
  },
  firefighterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: p(6),
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: p(40),
    height: p(40),
    borderRadius: p(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: p(12),
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: p(14),
  },
  nameEmailContainer: {
    flex: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  gearCountContainer: {
    alignItems: 'center',
  },
  gearCountText: {
    fontSize: p(16),
    fontWeight: 'bold',
    marginTop: p(2),
  },
  gearLabel: {
    fontSize: p(10),
    color: '#666',
    marginTop: p(2),
  },
  searchContainer: {
    paddingHorizontal: p(14),
    paddingTop: p(8),
    paddingBottom: p(8),
  },
  searchInput: {
    marginBottom: p(8),
  },
  grid: {
    paddingBottom: p(100),
    paddingHorizontal: p(10),
  },
  cardWrapper: {
    width: '100%',
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
  cardTypeText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#555',
    textAlign: 'left',
    paddingRight: p(6),
    maxWidth: '75%',
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
  rosterTagBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: p(30),
    height: p(24),
    borderTopRightRadius: p(8),
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
  gearEmoji: {
    fontSize: p(64),
    textAlign: 'center',
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
  imagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: p(4),
  },
  imagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: p(4),
  },
  imageCount: {
    fontSize: p(10),
    color: '#666',
    marginLeft: p(2),
  },
  updateButton: {
    borderRadius: p(8),
    marginTop: p(8),
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
});