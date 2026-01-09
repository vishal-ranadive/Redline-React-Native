import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, FlatList, Image, Dimensions } from 'react-native';
import { Text, Card, Icon, useTheme, Chip, TextInput, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import Header from '../../components/common/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLeadStore } from '../../store/leadStore';
import { repairApi } from '../../services/repairApi';
import { gearApi } from '../../services/gearApi';
import { getColorHex } from '../../constants/colors';
import { GEAR_IMAGE_URLS, getGearIconImage } from '../../constants/gearImages';
import { getRepairStatusColor } from '../../constants/inspection';
import { p } from '../../utils/responsive';
import { useGearStore } from '../../store/gearStore';
import Pagination from '../../components/common/Pagination';
import useDebounce from '../../hooks/useDebounce';
import { LeadInfoBanner } from '../../components/common/LeadInfoBanner';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'RepairDetails'>;

export default function AllGearRepairScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { currentLead } = useLeadStore();
  const { gearTypes, fetchGearTypes } = useGearStore();

  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>({ page: 1, page_size: 10, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [repairStatusFilter, setRepairStatusFilter] = useState<'all' | 'complete' | 'incomplete'>('all');
  const [page, setPage] = useState(1);
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState(10);
  const numberOfItemsPerPageList = [10, 20, 30, 50];


  // Mobile detection
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isMobile = screenWidth < 600;
  const numColumns = isMobile ? 1 : 2;

  useEffect(() => {
    fetchAllRepairs();
  }, [currentLead, page, numberOfItemsPerPage, debouncedSearchQuery, repairStatusFilter]);

  useEffect(() => {
    fetchGearTypes();
  }, [fetchGearTypes]);

  // Reset to page 1 when page size, search query, or status filter changes
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [numberOfItemsPerPage, debouncedSearchQuery, repairStatusFilter]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription.remove();
  }, []);

  const fetchAllRepairs = async (skipLoader = false) => {
    if (!currentLead?.firestation?.id) {
      console.log('No firestation ID available');
      if (!skipLoader) setLoading(false);
      return;
    }

    try {
      if (!skipLoader) {
        setLoading(true);
      }
      setError(null);

      // Build params object - always include lead_id, only include optional params if they have values
      const params: {
        page: number;
        page_size: number;
        lead_id: number;
        repair_status?: 'complete' | 'incomplete';
        name?: string;
      } = {
        page: page,
        page_size: numberOfItemsPerPage,
        lead_id: currentLead.lead_id,
      };

      // Only include repair_status if it's not 'all'
      if (repairStatusFilter !== 'all') {
        params.repair_status = repairStatusFilter;
      }

      // Only include name if search query exists and is not empty
      if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
        params.name = debouncedSearchQuery.trim();
      }

      const response = await repairApi.getAllGearRepairs(currentLead.firestation.id, params);

      if (response?.status && response?.data) {
        // Handle paginated response
        setRepairs(response.data);
        setPagination(response.pagination || { page: 1, page_size: numberOfItemsPerPage, total: 0 });
      } else if (response && Array.isArray(response)) {
        // Handle direct array response (fallback)
        setRepairs(response);
        setPagination({ page: 1, page_size: numberOfItemsPerPage, total: response.length });
      } else {
        setRepairs([]);
        setPagination({ page: 1, page_size: numberOfItemsPerPage, total: 0 });
      }
    } catch (error: any) {
      console.error('Error fetching repairs:', error);
      setError(error?.message || 'Failed to fetch repairs');
      setRepairs([]);
      setPagination({ page: 1, page_size: numberOfItemsPerPage, total: 0 });
    } finally {
      if (!skipLoader) {
        setLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllRepairs(true);
    setRefreshing(false);
  };

  const handleGearPress = async (repair: any) => {
    try {
      // Navigate to RepairDetails page
      navigation.navigate('RepairDetails', {
        repairId: repair?.repair_id,
        gearId: repair?.gear?.gear_id,
        leadId: repair?.lead_id,
        leadData: currentLead,
      });
    } catch (error) {
      console.error('Error navigating to repair details:', error);
    }
  };

  /**
   * Format roster name from first_name, middle_name, last_name
   * Handles cases where roster might not exist, be null, or keys might not exist
   */
  const formatRosterName = (roster: any): string | null => {
    if (!roster) return null;
    
    const firstName = roster.first_name || '';
    const middleName = roster.middle_name || '';
    const lastName = roster.last_name || '';
    
    const nameParts = [firstName, middleName, lastName].filter(part => part && part.trim());
    
    if (nameParts.length === 0) return null;
    
    return nameParts.join(' ').trim();
  };

  /**
   * Render repair details section
   */
  const renderRepairDetails = (repair: any, isPrevious: boolean = false) => {
    if (!repair) return null;

    const sectionTitle = isPrevious ? 'Previous Repair' : 'Current Repair';
    const repairDate = repair.created_at ? new Date(repair.created_at).toLocaleDateString() : 'N/A';
    const repairCost = repair.total_repair_cost !== null && repair.total_repair_cost !== undefined
      ? `$${repair.total_repair_cost.toFixed(2)}`
      : 'N/A';
    const remarks = repair.remarks || 'N/A';
    const status = repair.repair_status || 'N/A';

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
          <Icon source="check-circle-outline" size={14} color={colors.primary} />
          <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Status:</Text>
          <Text style={[styles.detailValue, { color: colors.onSurface }]}>{status.toUpperCase()}</Text>
        </View>

        <View style={styles.detailRow}>
          <Icon source="note-text" size={14} color={colors.primary} />
          <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Remarks:</Text>
          <Text style={[styles.detailValue, styles.remarksText, { color: colors.onSurface }]} numberOfLines={2}>
            {remarks}
          </Text>
        </View>
      </View>
    );
  };

  // Use repairs directly since filtering is now done server-side
  const filteredRepairs = repairs;

  const renderGearCard = ({ item: repair }: { item: any }) => {
    try {
      const gearStatus = repair.repair_status || 'Unknown';
      const statusColor = getRepairStatusColor(gearStatus);
      const tagColor = ""; // No tag color info available in current API response
      const gearTypeName = repair.gear?.gear_name || repair.gear?.gear_type?.gear_type || 'Gear';

      // Use gear details from the nested gear object
      const serialNumber = repair.gear?.serial_number || 'N/A';
      const manufacturerName = repair.gear?.manufacturer?.manufacturer_name || 'Unknown Manufacturer';
      const gearSize = repair.gear?.gear_size || 'N/A';
      
      // Get roster name safely
      const rosterName = formatRosterName(repair.gear?.roster);

      // Current repair details
      const updatedAt = repair.updated_at ? new Date(repair.updated_at).toLocaleDateString() : 'N/A';
      const repairCost = repair.total_repair_cost !== null && repair.total_repair_cost !== undefined
        ? `$${repair.total_repair_cost.toFixed(2)}`
        : 'N/A';
      const remarks = repair.remarks || 'N/A';

      return (
        <View style={[styles.cardWrapper, { width: isMobile ? '100%' : '48%' }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleGearPress(repair)}
            style={[styles.gearCardNew, styles.shadow, { borderColor: colors.outline }]}
          >
            <View style={[styles.cardTagBadge, { backgroundColor: tagColor }]} />
            <Card style={{ backgroundColor: colors.surface }}>
              <Card.Content>
                {/* Card Header with Gear Status */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    {gearStatus && gearStatus !== 'Unknown' ? (
                      <Chip
                        mode="outlined"
                        textStyle={[styles.gearStatusChipText, { color: '#fff' }]}
                        style={[
                          styles.headerStatusChip,
                          { backgroundColor: statusColor, borderColor: statusColor },
                        ]}
                      >
                        {gearStatus.toUpperCase()}
                      </Chip>
                    ) : (
                      <Chip
                        mode="outlined"
                        textStyle={[styles.gearStatusChipText, { color: colors.onSurfaceVariant }]}
                        style={[
                          styles.headerStatusChip,
                          { backgroundColor: colors.surface, borderColor: colors.outline },
                        ]}
                      >
                        NO STATUS
                      </Chip>
                    )}
                  </View>
                </View>

                {/* Gear Image */}
                <View style={styles.gearImageContainer}>
                  <Image
                    source={getGearIconImage(repair.gear?.gear_type?.gear_type ?? repair.gear?.gear_name ?? null)}
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
                    <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Gear Name:</Text>
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

                  {/* Firefighter (Roster) - Only show if exists */}
                  {rosterName && (
                    <View style={styles.detailRow}>
                      <Icon source="account" size={14} color={colors.primary} />
                      <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Firefighter:</Text>
                      <Text style={[styles.detailValue, { color: colors.onSurface }]} numberOfLines={1}>
                        {rosterName}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Separator */}
                <View style={[styles.separator, { backgroundColor: colors.outline }]} />

                {/* Current Repair Section */}
                <View style={styles.currentRepairSection}>
                  <Text variant="labelLarge" style={[styles.sectionTitle, { color: colors.primary }]}>
                    Current Repair
                  </Text>

                  <View style={styles.detailRow}>
                    <Icon source="calendar-clock" size={14} color={colors.primary} />
                    <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Updated:</Text>
                    <Text style={[styles.detailValue, { color: colors.onSurface }]}>{updatedAt}</Text>
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
                    <Icon source="check-circle-outline" size={14} color={colors.primary} />
                    <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Status:</Text>
                    <Text style={[styles.detailValue, { color: colors.onSurface }]}>{gearStatus.toUpperCase()}</Text>
                  </View>
                </View>

                {/* Update Button */}
                <Button
                  mode="contained"
                  onPress={() => handleGearPress(repair)}
                  icon="clipboard-edit-outline"
                  style={styles.updateButton}
                  contentStyle={styles.updateButtonContent}
                  buttonColor={tagColor || colors.primary}
                >
                  View Repair
                </Button>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </View>
      );
    } catch (error) {
      console.error('Error rendering gear card:', error);
      return (
        <View style={[styles.cardWrapper, { width: isMobile ? '100%' : '48%' }]}>
          <Text style={{ color: 'red' }}>Error rendering card</Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LeadInfoBanner />
      <Header title="All Gear Repairs" showBackButton={true} />

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          mode="outlined"
          placeholder="Search by name"
          value={searchQuery}
          onChangeText={setSearchQuery}
          left={<TextInput.Icon icon="magnify" />}
          style={styles.searchInput}
          dense
        />
        
        {/* Status Filter Buttons */}
        <View style={styles.statusFilterContainer}>
          <TouchableOpacity
            onPress={() => setRepairStatusFilter('all')}
            style={[
              styles.statusFilterButton,
              repairStatusFilter === 'all' && styles.statusFilterButtonActive,
              { 
                backgroundColor: repairStatusFilter === 'all' ? colors.primary : colors.surface,
                borderColor: colors.outline 
              }
            ]}
          >
            <Text style={[
              styles.statusFilterButtonText,
              { color: repairStatusFilter === 'all' ? '#fff' : colors.onSurface }
            ]}>
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setRepairStatusFilter('complete')}
            style={[
              styles.statusFilterButton,
              repairStatusFilter === 'complete' && styles.statusFilterButtonActive,
              { 
                backgroundColor: repairStatusFilter === 'complete' ? colors.primary : colors.surface,
                borderColor: colors.outline 
              }
            ]}
          >
            <Text style={[
              styles.statusFilterButtonText,
              { color: repairStatusFilter === 'complete' ? '#fff' : colors.onSurface }
            ]}>
              Complete
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setRepairStatusFilter('incomplete')}
            style={[
              styles.statusFilterButton,
              repairStatusFilter === 'incomplete' && styles.statusFilterButtonActive,
              { 
                backgroundColor: repairStatusFilter === 'incomplete' ? colors.primary : colors.surface,
                borderColor: colors.outline 
              }
            ]}
          >
            <Text style={[
              styles.statusFilterButtonText,
              { color: repairStatusFilter === 'incomplete' ? '#fff' : colors.onSurface }
            ]}>
              Incomplete
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainerBelow}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.onSurfaceVariant }}>
            Loading repairs...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRepairs}
          renderItem={renderGearCard}
          keyExtractor={(item) => item.repair_id.toString()}
          numColumns={numColumns}
          contentContainerStyle={[styles.grid, isMobile ? styles.gridMobile : styles.gridTablet]}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon source="wrench" size={p(64)} color={colors.outline} />
              <Text variant="titleMedium" style={{ marginTop: p(16), color: colors.onSurfaceVariant }}>
                {searchQuery ? 'No Results Found' : 'No Repairs Found'}
              </Text>
              <Text style={{ marginTop: p(8), color: colors.onSurfaceVariant, textAlign: 'center' }}>
                {searchQuery
                  ? 'Try adjusting your search terms.'
                  : 'There are no gear repairs for this firestation yet.'
                }
              </Text>
            </View>
          }
        />
      )}

      {/* Pagination */}
      {!loading && pagination && pagination.total > 0 && (
        <Pagination
          page={pagination.page}
          total={pagination.total}
          itemsPerPage={pagination.page_size}
          itemsPerPageList={numberOfItemsPerPageList}
          onPageChange={setPage}
          onItemsPerPageChange={setNumberOfItemsPerPage}
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
    paddingHorizontal: p(10),
  },
  searchContainer: {
    paddingHorizontal: p(16),
    paddingTop: p(12),
    paddingBottom: p(8),
  },
  searchInput: {
    marginBottom: p(8),
  },
  statusText: {
    fontSize: p(12),
    fontStyle: 'italic',
    textAlign: 'center',
  },
  statusFilterContainer: {
    flexDirection: 'row',
    gap: p(8),
    marginTop: p(8),
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  statusFilterButton: {
    paddingHorizontal: p(16),
    paddingVertical: p(8),
    borderRadius: p(8),
    borderWidth: 1,
    minWidth: p(100),
    alignItems: 'center',
  },
  statusFilterButtonActive: {
    // Active state handled by backgroundColor in inline style
  },
  statusFilterButtonText: {
    fontSize: p(14),
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainerBelow: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: p(40),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: p(40),
  },
  errorText: {
    marginTop: p(16),
    textAlign: 'center',
    fontSize: p(16),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: p(40),
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
  headerStatusChip: {
    alignSelf: 'flex-start',
    marginRight: p(6),
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
  separator: {
    height: 1,
    marginVertical: p(2),
    opacity: 0.2,
  },
  currentRepairSection: {
    marginTop: p(4),
    marginBottom: p(8),
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
    marginInline:'auto',
    marginBottom:p(48), // Space for bottom bar on desktop
    zIndex: 10,
  },
  paginationContainerMobile: {
    marginBottom: p(45), // 65px (bottom bar) + 10px (spacing between pagination and bottom bar)
  },
});

