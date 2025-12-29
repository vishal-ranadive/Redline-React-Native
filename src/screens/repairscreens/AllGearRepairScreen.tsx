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
import { getStatusColor } from '../../constants/inspection';
import { p } from '../../utils/responsive';
import { useGearStore } from '../../store/gearStore';
import Pagination from '../../components/common/Pagination';

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
  const [page, setPage] = useState(1);
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState(10);
  const numberOfItemsPerPageList = [10, 20, 30, 50];


  // Mobile detection
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isMobile = screenWidth < 600;
  const numColumns = isMobile ? 1 : 2;

  useEffect(() => {
    fetchAllRepairs();
  }, [currentLead, page, numberOfItemsPerPage]);

  useEffect(() => {
    fetchGearTypes();
  }, [fetchGearTypes]);

  // Reset to page 1 when page size changes
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [numberOfItemsPerPage]);

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

      const response = await repairApi.getAllGearRepairs(currentLead.firestation.id, {
        page: page,
        page_size: numberOfItemsPerPage
      });

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
        repairId: repair.repair_id,
        gearId: repair.gear_id,
        leadId: repair.lead_id,
        leadData: currentLead,
      });
    } catch (error) {
      console.error('Error navigating to repair details:', error);
    }
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

  // Filter repairs by search query (client-side search on current page data)
  const filteredRepairs = repairs.filter(repair => {
    if (!searchQuery) return true; // If no search query, show all

    const gearId = repair.gear?.gear_id?.toString() || '';
    const repairId = repair.repair_id?.toString() || '';
    const repairStatus = repair.repair_status || '';
    const gearName = repair.gear?.gear_name || '';
    const serialNumber = repair.gear?.serial_number || '';
    const manufacturerName = repair.gear?.manufacturer?.manufacturer_name || '';

    return (
      gearId.includes(searchQuery) ||
      repairId.includes(searchQuery) ||
      repairStatus.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gearName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      manufacturerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const renderGearCard = ({ item: repair }: { item: any }) => {
    try {
      const gearStatus = repair.repair_status || 'Unknown';
      const statusColor = getStatusColor(null, gearStatus);
      const tagColor = ""; // No tag color info available in current API response
      const gearTypeName = repair.gear?.gear_name || repair.gear?.gear_type?.gear_type || 'Gear';

    // Use gear details from the nested gear object
    const gearId = repair.gear?.gear_id || 'N/A';
    const serialNumber = repair.gear?.serial_number || `ID: ${gearId}`;
    const manufacturerName = repair.gear?.manufacturer?.manufacturer_name || 'Unknown Manufacturer';
    const gearSize = repair.gear?.gear_size || 'N/A';

    // Calculate total quantity from repair findings
    const totalQuantity = repair.repair_findings?.reduce((total: number, group: any) => {
      return total + group.findings?.reduce((groupTotal: number, finding: any) => {
        return groupTotal + (finding.repair_quantity || 0);
      }, 0);
    }, 0) || 'N/A';

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
                <Icon source="wrench" size={p(60)} color={colors.primary} />
              </View>

              {/* Gear Details */}
              <View style={styles.gearDetails}>
                <View style={styles.detailRow}>
                  <Icon source="barcode" size={14} color={colors.primary} />
                  <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Gear ID:</Text>
                  <Text style={[styles.detailValue, { color: colors.onSurface }]}>{gearId}</Text>
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
                  <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Repair ID:</Text>
                  <Text style={[styles.detailValue, { color: colors.onSurface }]} numberOfLines={1}>
                    {repair.repair_id}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Icon source="calendar" size={14} color={colors.primary} />
                  <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Date:</Text>
                  <Text style={[styles.detailValue, { color: colors.onSurface }]}>
                    {repair.created_at ? new Date(repair.created_at).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Icon source="counter" size={14} color={colors.primary} />
                  <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Quantity:</Text>
                  <Text style={[styles.detailValue, { color: colors.onSurface }]}>{totalQuantity}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Icon source="currency-usd" size={14} color={colors.primary} />
                  <Text style={[styles.detailLabel, { color: colors.onSurface }]}>Cost:</Text>
                  <Text style={[styles.detailValue, { color: colors.onSurface }]}>${repair.total_repair_cost || '0'}</Text>
                </View>
              </View>

              {/* Current Repair Details */}
              {renderRepairDetails(repair, false)}

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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="All Gear Repairs" showBackButton={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.onSurfaceVariant }}>
            Loading repairs...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="All Gear Repairs" showBackButton={true} />

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          mode="outlined"
          placeholder="Search by gear name, serial, manufacturer, or repair ID"
          value={searchQuery}
          onChangeText={setSearchQuery}
          left={<TextInput.Icon icon="magnify" />}
          style={styles.searchInput}
          dense
        />
        <Text style={[styles.statusText, { color: colors.onSurfaceVariant }]}>
          Status will coming soon
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

