import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions, ScrollView, RefreshControl } from 'react-native';
import { Text, Icon, useTheme, TextInput, DataTable, ActivityIndicator, Card } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Header from '../../components/common/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLeadStore } from '../../store/leadStore';
import { inspectionApi } from '../../services/inspectionApi';
import { COLOR_MAP, getColorHex } from '../../constants/colors';
import RosterCardSkeleton from '../skeleton/RosterCardSkeleton';
import Pagination from '../../components/common/Pagination';
import useDebounce from '../../hooks/useDebounce';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FirefighterGearsScreen'>;

type Gear = {
  gear_id: number;
  gear_name: string;
  gear_status: string;
};

type Roster = {
  id: number;
  name: string;
  email: string | null;
  total_gear_scan_count: number;
  tag_color: string | null;
  gear: Gear[];
};

type RosterGroup = {
  roster_id: number;
  roster_name: string;
  tag_color: string | null;
  email: string | null;
  gears: Gear[];
};

type PaginationInfo = {
  page: number;
  page_size: number;
  total: number;
};

const statusColorMap: { [key: string]: string } = {
  Pass: '#34A853',
  Repair: '#F9A825',
  Expired: '#ff0303ff',
  'Recommended Out Of Service': '#f15719ff',
  'Corrective Action Required': '#F9A825',
  Fail: '#8B4513',
};

export default function FirefighterListScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const { currentLead } = useLeadStore();

  const [rosterGroups, setRosterGroups] = useState<RosterGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  // Pagination state (1-based for Pagination component)
  const [page, setPage] = useState<number>(1);
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState<number>(20);
  const numberOfItemsPerPageList = [10, 20, 30, 50];

  // Detect if device is mobile (width < 600)
  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth < 600;
  const numColumns = isMobile ? 1 : 2;

  const currentLeadId = currentLead?.lead_id;
  const MANUAL_LEAD_ID = 101;
  const effectiveLeadId = currentLeadId ?? MANUAL_LEAD_ID;

  // Track if this is the first mount
  const isFirstMount = useRef(true);

  const fetchAllGears = useCallback(async (leadId: number, showLoading: boolean = true, lastName?: string) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      // Fetch rosters with gears included
      const rostersResponse = await inspectionApi.getInspectionRosters(leadId, page, numberOfItemsPerPage, lastName);
      const rosters: Roster[] = Array.isArray(rostersResponse?.roster)
        ? rostersResponse.roster
        : [];

      // Store pagination info
      if (rostersResponse?.pagination) {
        setPagination({
          page: rostersResponse.pagination.page,
          page_size: rostersResponse.pagination.page_size,
          total: rostersResponse.pagination.total,
        });
      }

      if (rosters.length === 0) {
        setRosterGroups([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Transform rosters to roster groups with gears
      const groups: RosterGroup[] = rosters.map((roster) => ({
        roster_id: roster.id,
        roster_name: roster.name,
        tag_color: roster.tag_color,
        email: roster.email,
        gears: Array.isArray(roster.gear) ? roster.gear : [],
      }));

      setRosterGroups(groups);
    } catch (e: any) {
      console.error('Error fetching gears:', e);
      setError('Failed to load gears.');
      setRosterGroups([]);
      setPagination(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, numberOfItemsPerPage, debouncedSearchQuery]);

  // Initial load on mount
  useEffect(() => {
    if (isFirstMount.current) {
      fetchAllGears(effectiveLeadId, true, debouncedSearchQuery);
      isFirstMount.current = false;
    }
  }, [effectiveLeadId, fetchAllGears, debouncedSearchQuery]);

  // Fetch data when page, items per page, or search query changes (after initial mount)
  useEffect(() => {
    if (!isFirstMount.current) {
      fetchAllGears(effectiveLeadId, true, debouncedSearchQuery);
    }
  }, [page, numberOfItemsPerPage, effectiveLeadId, fetchAllGears, debouncedSearchQuery]);

  // Refresh on focus (but don't show loading spinner)
  useFocusEffect(
    useCallback(() => {
      if (!isFirstMount.current) {
        fetchAllGears(effectiveLeadId, false, debouncedSearchQuery);
      }
    }, [effectiveLeadId, fetchAllGears, debouncedSearchQuery]),
  );

  // Reset to page 1 when search query changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);


  // Calculate estimated height for a roster card based on gear count
  const getEstimatedHeight = (gearCount: number) => {
    const baseHeight = 100; // Base height for header and padding
    const gearRowHeight = 40; // Height per gear row
    return baseHeight + (gearCount * gearRowHeight);
  };

  // Distribute roster groups into columns for bento grid layout
  const distributedColumns = useMemo(() => {
    if (numColumns === 1) {
      return [rosterGroups];
    }

    const columns: RosterGroup[][] = Array(numColumns).fill(null).map(() => []);
    const columnHeights = Array(numColumns).fill(0);

    rosterGroups.forEach((group) => {
      const estimatedHeight = getEstimatedHeight(group.gears.length);
      // Find the column with the smallest height
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      columns[shortestColumnIndex].push(group);
      columnHeights[shortestColumnIndex] += estimatedHeight;
    });

    return columns;
  }, [rosterGroups, numColumns]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllGears(effectiveLeadId, false, debouncedSearchQuery);
  }, [effectiveLeadId, fetchAllGears, debouncedSearchQuery]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setNumberOfItemsPerPage(newItemsPerPage);
  }, []);

  const handleViewGears = (rosterGroup: RosterGroup) => {
    const roster = {
      id: rosterGroup.roster_id,
      name: rosterGroup.roster_name,
      email: rosterGroup.email ?? '', // Use actual email or empty string (handle null)
      total_scan_count: rosterGroup.gears.length,
      tag_color: rosterGroup.tag_color,
    };
    navigation.navigate('FirefighterGearsScreen', { 
      roster,
      leadId: currentLead?.lead_id || effectiveLeadId 
    });
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

  const getStatusColor = (status: string) => {
    return statusColorMap[status] || '#9E9E9E';
  };

  /**
   * Render roster group with gears
   */
  const renderRosterGroup = (item: RosterGroup) => {
    const tagColor = normalizeTagColor(item.tag_color);
    const scannedCount = item.gears.length;

    return (
      <View style={[styles.cardWrapper, isMobile && styles.cardWrapperMobile]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleViewGears(item)}
        >
          <Card style={[styles.rosterCard, { backgroundColor: colors.surface }]}>
            {tagColor && (
              <View style={[styles.rosterTagBadge, { backgroundColor: tagColor }]} />
            )}
            <Card.Content>
              {/* Roster Header */}
              <View style={styles.rosterHeader}>
                <Text variant="titleMedium" style={[styles.rosterName, { color: colors.onSurface }]} numberOfLines={1}>
                  {item.roster_name}
                </Text>
                <View style={styles.rosterInfo}>
                  <Icon source="tools" size={p(14)} color={colors.primary} />
                  <Text style={[styles.scannedCount, { color: colors.onSurface }]}>
                    {scannedCount}
                  </Text>
                </View>
              </View>

              {/* Gears List */}
              <View style={styles.gearsList}>
                {item.gears.map((gear) => {
                  const statusColor = getStatusColor(gear.gear_status);
                  return (
                    <View key={gear.gear_id} style={styles.gearRow}>
                      <Text style={[styles.gearName, { color: colors.onSurface }]} numberOfLines={1}>
                        {gear.gear_name}
                      </Text>
                      <Text style={[styles.gearStatus, { color: statusColor }]} numberOfLines={1}>
                        {gear.gear_status}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Firefighters" showBackButton={true} />

      {/* 🔍 Search Section */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          mode="outlined"
          placeholder="Search by firefighter's last name"
          value={searchQuery}
          onChangeText={setSearchQuery}
          left={<TextInput.Icon icon="magnify" />}
          style={styles.searchInput}
          dense
        />
      </View>

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: colors.errorContainer }]}>
          <Icon source="alert-circle" size={20} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        </View>
      )}

      {/* Roster Groups List - Bento Grid Layout */}
      {loading && !refreshing ? (
        <RosterCardSkeleton count={6} numColumns={numColumns} />
      ) : rosterGroups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon source="account-search" size={64} color={colors.outline} />
          <Text variant="titleMedium" style={{ marginTop: 16, color: colors.outline }}>
            {error ? 'No rosters available' : 'No Rosters Found'}
          </Text>
          <Text variant="bodyMedium" style={{ color: colors.outline, textAlign: 'center', marginTop: 8 }}>
            {error ?? (debouncedSearchQuery ? 'No firefighters found matching your search' : 'No rosters with gear inspections available')}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.listContainer, isMobile && styles.listContainerMobile]}
          showsVerticalScrollIndicator={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.bentoGrid}>
            {distributedColumns.map((column, columnIndex) => (
              <View
                key={`column-${columnIndex}`}
                style={[
                  styles.bentoColumn,
                  columnIndex < distributedColumns.length - 1 && styles.bentoColumnSpacing
                ]}
              >
                {column.map((group) => (
                  <View key={`roster-${group.roster_id}`}>
                    {renderRosterGroup(group)}
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.total > 0 && (
        <Pagination
          page={page}
          total={pagination.total}
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
  },
  searchContainer: {
    paddingHorizontal: p(14),
    paddingTop: p(8),
    paddingBottom: p(8),
  },
  searchInput: {
    marginBottom: p(8),
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: p(100),
    flexGrow: 1,
  },
  listContainerMobile: {
    paddingHorizontal: 0,
  },
  bentoGrid: {
    flexDirection: 'row',
    paddingHorizontal: p(5),
  },
  bentoColumn: {
    flex: 1,
  },
  bentoColumnSpacing: {
    marginRight: p(12),
  },
  cardWrapper: {
    width: '100%',
    marginBottom: p(12),
  },
  cardWrapperMobile: {
    width: '100%',
  },
  rosterCard: {
    borderRadius: p(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
    overflow: 'hidden',

    minHeight: p(150),
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
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: p(10),
    paddingRight: p(30),
    paddingTop: p(10),
  },
  rosterName: {
    fontSize: p(14),
    fontWeight: 'bold',
    flex: 1,
    marginRight: p(4),
  },
  rosterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: p(4),
  },
  scannedCount: {
    fontSize: p(11),
    fontWeight: '600',
  },
  gearsList: {
    gap: p(6),
  },
  gearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: p(4),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  gearName: {
    fontSize: p(12),
    flex: 1,
    marginRight: p(6),
  },
  gearStatus: {
    fontSize: p(12),
    fontWeight: '500',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    marginBottom: p(52),
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: p(14),
    marginBottom: p(8),
    borderRadius: p(8),
    paddingHorizontal: p(12),
    paddingVertical: p(8),
    gap: p(8),
  },
  errorText: {
    flex: 1,
    fontSize: p(12),
  },
});