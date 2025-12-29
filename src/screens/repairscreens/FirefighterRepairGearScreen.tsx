import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, Button, Icon, useTheme, Chip, DataTable, TextInput, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect, type RouteProp } from '@react-navigation/native';
import Header from '../../components/common/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { repairApi } from '../../services/repairApi';
import { getColorHex } from '../../constants/colors';
import { GEAR_IMAGE_URLS, getGearIconImage } from '../../constants/gearImages';
import GearCardSkeleton from '../skeleton/GearCardSkeleton';
import { getStatusColor } from '../../constants/inspection';
import Pagination from '../../components/common/Pagination';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'RepairDetails'>;

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
type ApiGearRepair = {
  gear: {
    gear_id: number;
    gear_name: string;
    gear_type: {
      gear_type_id: number;
      gear_type: string;
    };
    serial_number?: string;
    manufacturer?: {
      manufacturer_id: number;
      manufacturer_name: string;
    };
    gear_size?: string;
    [key: string]: any;
  };
  current_repair: any | null;
  previous_repair: any | null;
};

type GearCard = {
  gear: ApiGearRepair;
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

export default function FirefighterRepairGearScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'FirefighterRepairGearScreen'>>();
  const { roster, leadId } = route.params;

  const [gearCards, setGearCards] = useState<GearCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [buildingCards, setBuildingCards] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1); // 1-based for Pagination component
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState(10);
  const numberOfItemsPerPageList = [10, 20, 30, 40, 50];

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

  // Get tag color from the first gear's current repair
  const rosterTagColor = useMemo(() => {
    if (gearCards.length > 0 && gearCards[0].gear.current_repair) {
      return normalizeTagColor(gearCards[0].gear.current_repair.roster?.tag_color);
    }
    return null;
  }, [gearCards]);

  const [repairsData, setRepairsData] = useState<any[]>([]);
  const [totalRepairs, setTotalRepairs] = useState(0);

  const loadRepairs = useCallback(
    async (refresh = false, pageParam?: number, pageSizeParam?: number) => {
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
        const params: any = {
          lead_id: leadId,
          roster_id: roster.id,
        };

        // Add pagination parameters if provided
        if (pageParam !== undefined) {
          params.page = pageParam;
        }
        if (pageSizeParam !== undefined) {
          params.page_size = pageSizeParam;
        }

        const response = await repairApi.getFirefighterRepairInformationWithPagination(params);

        if (response.status === true) {
          setRepairsData(response.gear || []);
          setTotalRepairs(response.pagination?.total || 0);
        } else {
          setRepairsData([]);
          setTotalRepairs(0);
        }
      } catch (error) {
        console.error('Error fetching repairs:', error);
        setRepairsData([]);
        setTotalRepairs(0);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [leadId, roster?.id],
  );

  // Load repairs on mount
  useEffect(() => {
    loadRepairs(false, page, numberOfItemsPerPage);
  }, [loadRepairs, page, numberOfItemsPerPage]);

  // Refresh repairs when screen comes into focus (e.g., returning from RepairDetailsScreen)
  useFocusEffect(
    useCallback(() => {
      loadRepairs(true, page, numberOfItemsPerPage); // Pass true to indicate refresh
    }, [loadRepairs, page, numberOfItemsPerPage])
  );

  useEffect(() => {
    setPage(1); // Reset to page 1 when changing filters
  }, [numberOfItemsPerPage, searchQuery, roster?.id]);

  // Mock data transformation - in real implementation, this would come from the API
  useEffect(() => {
    if (!repairsData.length) {
      setGearCards([]);
      setBuildingCards(false);
      return;
    }

    setBuildingCards(true);

    try {
      const cards = repairsData.map((repairItem) => {
        let gearStatus = '';
        if (repairItem.current_repair?.repair_status) {
          gearStatus = repairItem.current_repair.repair_status;
        }

        let tagColor = null;
        if (repairItem.current_repair?.roster?.tag_color) {
          tagColor = normalizeTagColor(repairItem.current_repair.roster.tag_color);
        }

        return {
          gear: repairItem,
          color: tagColor,
          gearStatus,
        } as GearCard;
      });

      setGearCards(cards);
      setBuildingCards(false);
    } catch (err) {
      console.error('Error building repair cards:', err);
      setBuildingCards(false);
    }
  }, [repairsData]);

  // Filter gears with current repair
  const gearsWithRepair = useMemo(() => {
    return gearCards.filter(({ gear }) => gear.current_repair !== null);
  }, [gearCards]);

  const isLoading = (loading || buildingCards) && !refreshing;

  // Use client-side pagination for filtered results
  const filteredGears = useMemo(() => {
    // Apply search query if provided
    if (!searchQuery.trim()) {
      return gearCards;
    }
    const query = searchQuery.toLowerCase();
    return gearCards.filter(({ gear }) => {
      const name = (gear.gear?.gear_name ?? '').toLowerCase();
      const serial = (gear.gear?.serial_number ?? '').toLowerCase();
      const type = (
        gear.gear?.gear_type?.gear_type ??
        gear.gear?.gear_name ??
        ''
      ).toLowerCase();
      return name.includes(query) || serial.includes(query) || type.includes(query);
    });
  }, [gearCards, searchQuery]);

  const totalItems = filteredGears.length;
  const from = (page - 1) * numberOfItemsPerPage; // 0-based for slice
  const to = Math.min(page * numberOfItemsPerPage, totalItems);
  const currentGears = filteredGears.slice(from, to);

  const handleUpdateRepair = (card: GearCard) => {
    console.log('handleUpdateRepair called with card:', {
      gearId: card.gear.gear?.gear_id,
      repairId: card.gear.current_repair?.repair_id,
      gearName: card.gear.gear?.gear_name,
      repairStatus: card.gearStatus,
      tagColor: card.color
    });

    const gearId = card.gear.gear?.gear_id;
    const repairId = card.gear.current_repair?.repair_id;

    console.log('Extracted IDs:', { gearId, repairId });

    const navigationParams: any = {
      gearId,
      leadId,
      leadData: { lead_id: leadId },
    };

    // If there's an existing repair, pass the repair_id for updating
    if (repairId) {
      navigationParams.repairId = repairId;
    }

    console.log('Navigation params:', navigationParams);

    try {
      console.log('Attempting navigation to RepairDetails...');
      navigation.navigate('RepairDetails', navigationParams);
      console.log('Navigation call completed successfully');
    } catch (navError) {
      console.error('Navigation failed:', navError);
    }
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
    loadRepairs(true, page, numberOfItemsPerPage);
  }, [loadRepairs, page, numberOfItemsPerPage]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setNumberOfItemsPerPage(newItemsPerPage);
    setPage(1); // Reset to first page
  }, []);

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
  const renderGear = useCallback(
    ({ item }: { item: GearCard }) => {
      const gear = item.gear;
      const gearDetail = gear.gear;
      const tagColor = item.color ?? "";
      const gearId = gearDetail?.gear_id;
      const gearName = gearDetail?.gear_name ?? 'Gear';
      const serialNumber = gearDetail?.serial_number ?? 'N/A';
      const manufacturerName =
        gearDetail?.manufacturer?.manufacturer_name ?? 'Unknown manufacturer';
      const gearTypeName = gearDetail?.gear_type?.gear_type ?? gearDetail?.gear_name ?? 'Other';
      const isOtherType = gearTypeName.toLowerCase().trim() === 'other';
      const displayTypeOrName = isOtherType ? gearName : gearTypeName;
      const statusId = gear.current_repair?.repair_status?.id;
      const statusColor = getStatusColor(statusId, item.gearStatus);

      // Get repair images
      const repairImages = gear.current_repair?.repair_images || [];
      const hasImages = repairImages.length > 0;

      return (
        <View style={[styles.cardWrapper, { width: isMobile ? '100%' : '48%' }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              console.log('Gear card pressed for repair item:', {
                gearId: item.gear.gear?.gear_id,
                gearName: item.gear.gear?.gear_name,
                repairId: item.gear.current_repair?.repair_id,
                repairStatus: item.gearStatus,
                tagColor: item.color
              });
              handleUpdateRepair(item);
            }}
            style={[styles.card, styles.shadow, { borderColor: colors.outline }]}
          >
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

                <View style={styles.gearImageContainer}>
                  <Image
                    source={getGearIconImage(gearDetail?.gear_type?.gear_type ?? gearDetail?.gear_name ?? null)}
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
                      {displayTypeOrName}
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
                    <Text style={[styles.detailValue, { color: colors.onSurface }]}>{gear.current_repair?.gear_size || gearDetail?.gear_size || 'N/A'}</Text>
                  </View>
                </View>

                {/* Current Repair Details */}
                {renderRepairDetails(gear.current_repair, false)}

                {/* Previous Repair Details */}
                {gear.previous_repair && renderRepairDetails(gear.previous_repair, true)}

                {/* Update Button */}
                <Button
                  mode="contained"
                  onPress={() => {
                    console.log('Update repair button pressed for item:', {
                      gearId: item.gear.gear?.gear_id,
                      gearName: item.gear.gear?.gear_name,
                      repairId: item.gear.current_repair?.repair_id,
                      repairStatus: item.gearStatus,
                      tagColor: item.color
                    });
                    handleUpdateRepair(item);
                  }}
                  icon="clipboard-edit-outline"
                  style={styles.updateButton}
                  contentStyle={styles.updateButtonContent}
                >
                  {gear.current_repair?.repair_id ? 'Update Repair' : 'Create Repair'}
                </Button>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </View>
      );
    },
    [colors, navigation, renderRepairDetails, isMobile],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title={`${roster.name}'s Repairs`}
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
            {buildingCards ? 'Loading repair details...' : 'Loading repairs...'}
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
        title={`${roster.name}'s Repairs`}
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

            {/* Right: Total Repairs Count */}
            <View style={styles.rightSection}>
              <View style={styles.gearCountContainer}>
                <Text style={styles.gearCountText}>{gearsWithRepair.length}</Text>
                <Text style={styles.gearLabel}>Total Repairs</Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* 🔍 Search Section */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          mode="outlined"
          placeholder="Search by gear name, serial number"
          value={searchQuery}
          onChangeText={setSearchQuery}
          left={<TextInput.Icon icon="magnify" />}
          style={styles.searchInput}
          dense
        />
      </View>

      {/* Repairs List - Single Column */}
      {isLoading ? (
        <GearCardSkeleton count={3} isMobile={isMobile} numColumns={numColumns} />
      ) : (
        <FlatList
          data={currentGears}
          renderItem={renderGear}
          keyExtractor={(item) => item.gear.gear?.gear_id?.toString() ?? ''}
          numColumns={numColumns}
          contentContainerStyle={[styles.grid, isMobile ? styles.gridMobile : styles.gridTablet]}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon source="package-variant-closed" size={64} color={colors.outline} />
              <Text variant="titleMedium" style={{ marginTop: 16, color: colors.outline }}>
                No Repairs Found
              </Text>
              <Text variant="bodyMedium" style={{ color: colors.outline, textAlign: 'center', marginTop: 8 }}>
                {searchQuery
                  ? 'Try adjusting your search criteria'
                  : 'No repairs found for this firefighter'
                }
              </Text>
            </View>
          }
        />
      )}

      {/* Pagination */}
      {!isLoading && totalRepairs > numberOfItemsPerPage && (
        <Pagination
          page={page}
          total={totalRepairs}
          itemsPerPage={numberOfItemsPerPage}
          itemsPerPageList={numberOfItemsPerPageList}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          containerStyle={[
            styles.paginationContainer,
            isMobile && styles.paginationContainerMobile,
          ]}
        />
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
    alignSelf: 'flex-start',
    marginRight: p(6),
  },
  gearStatusText: {
    fontSize: 11,
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
    width: p(100),
    height: p(100),
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
  paginationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    marginBottom: p(65),
    borderTopWidth: 1,
  },
  paginationContainerMobile: {
    marginBottom: p(70),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
});
