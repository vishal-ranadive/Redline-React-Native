import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
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

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FirefighterGearsScreen'>;

type Firefighter = {
  id: number;
  name: string;
  email: string | null;
  total_gear_scan_count: number;
  tag_color: string | null;
};

type GearCard = {
  gear_id: number;
  gear_name: string;
  gear_status: string;
  roster_id: number;
  roster_name: string;
  tag_color: string | null;
};

type RosterGroup = {
  roster_id: number;
  roster_name: string;
  tag_color: string | null;
  email: string | null;
  gears: GearCard[];
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

  const [gearCards, setGearCards] = useState<GearCard[]>([]);
  const [rosters, setRosters] = useState<Firefighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const numberOfItemsPerPageList = [4, 8, 12, 16];

  // Detect if device is mobile (width < 600)
  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth < 600;
  const numColumns = isMobile ? 1 : 2;

  const currentLeadId = currentLead?.lead_id;
  const MANUAL_LEAD_ID = 101;
  const effectiveLeadId = currentLeadId ?? MANUAL_LEAD_ID;

  // Track if this is the first mount
  const isFirstMount = useRef(true);

  const fetchAllGears = useCallback(async (leadId: number, showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      // First, fetch all rosters
      const rostersResponse = await inspectionApi.getInspectionRosters(leadId);
      const rosters: Firefighter[] = Array.isArray(rostersResponse?.roster)
        ? rostersResponse.roster
        : [];

      if (rosters.length === 0) {
        setGearCards([]);
        setRosters([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Store rosters for later use
      setRosters(rosters);

      // Fetch gear inspection info for each roster
      const allGearCards: GearCard[] = [];
      
      await Promise.all(
        rosters.map(async (roster) => {
          try {
            const gearResponse = await inspectionApi.getFirefighterInspectionInfo(leadId, roster.id);
            const gears = Array.isArray(gearResponse?.gear) ? gearResponse.gear : [];

            // Filter only gears with current_inspection
            const gearsWithInspection = gears.filter(
              (gear: any) => gear.current_inspection !== null && gear.current_inspection !== undefined
            );

            // Create gear cards
            gearsWithInspection.forEach((gear: any) => {
              const gearStatus = gear.current_inspection?.gear_status?.status || 'No Status';
              const tagColor = gear.current_inspection?.tag_color || roster.tag_color;

              allGearCards.push({
                gear_id: gear.gear_id,
                gear_name: gear.gear_name || 'Unknown Gear',
                gear_status: gearStatus,
                roster_id: roster.id,
                roster_name: roster.name,
                tag_color: tagColor,
              });
            });
          } catch (err) {
            console.error(`Error fetching gears for roster ${roster.id}:`, err);
          }
        })
      );

      setGearCards(allGearCards);
    } catch (e: any) {
      console.error('Error fetching gears:', e);
      setError('Failed to load gears.');
      setGearCards([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    if (isFirstMount.current) {
      fetchAllGears(effectiveLeadId, true);
      isFirstMount.current = false;
    }
  }, [effectiveLeadId, fetchAllGears]);

  // Refresh on focus (but don't show loading spinner)
  useFocusEffect(
    useCallback(() => {
      if (!isFirstMount.current) {
        fetchAllGears(effectiveLeadId, false);
      }
    }, [effectiveLeadId, fetchAllGears]),
  );

  // Group gears by roster
  const rosterGroups = useMemo(() => {
    const grouped = new Map<number, RosterGroup>();
    
    gearCards.forEach((gear) => {
      if (!grouped.has(gear.roster_id)) {
        const rosterData = rosters.find(r => r.id === gear.roster_id);
        grouped.set(gear.roster_id, {
          roster_id: gear.roster_id,
          roster_name: gear.roster_name,
          tag_color: gear.tag_color || rosterData?.tag_color || null,
          email: rosterData?.email || null,
          gears: [],
        });
      }
      grouped.get(gear.roster_id)!.gears.push(gear);
    });
    
    return Array.from(grouped.values());
  }, [gearCards, rosters]);

  // Filter roster groups based on search
  const filteredRosterGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return rosterGroups;
    }
    const query = searchQuery.toLowerCase();
    return rosterGroups
      .map((group) => {
        const filteredGears = group.gears.filter((gear) => {
          const nameMatch = gear.gear_name?.toLowerCase().includes(query);
          const rosterMatch = gear.roster_name?.toLowerCase().includes(query);
          const statusMatch = gear.gear_status?.toLowerCase().includes(query);
          return nameMatch || rosterMatch || statusMatch;
        });
        return { ...group, gears: filteredGears };
      })
      .filter((group) => group.gears.length > 0);
  }, [rosterGroups, searchQuery]);

  const totalItems = filteredRosterGroups.reduce((sum, group) => sum + group.gears.length, 0);
  const totalPages = Math.max(1, Math.ceil(filteredRosterGroups.length / itemsPerPage) || 1);
  const from = page * itemsPerPage;
  const to = Math.min(from + itemsPerPage, filteredRosterGroups.length);
  const currentRosterGroups = filteredRosterGroups.slice(from, to);
  console.log("currentRosterGroups", currentRosterGroups);
  useEffect(() => {
    setPage(0);
  }, [itemsPerPage, searchQuery]);

  useEffect(() => {
    if (page >= totalPages && totalPages > 0) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllGears(effectiveLeadId, false);
  }, [effectiveLeadId]);

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
  const renderRosterGroup = ({ item }: { item: RosterGroup }) => {
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
          placeholder="Search by firefighter name, gear name, or status"
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

      {/* Roster Groups List - Responsive Columns */}
      {loading && !refreshing ? (
        <RosterCardSkeleton count={6} numColumns={numColumns} />
      ) : (
        <FlatList
          data={currentRosterGroups}
          renderItem={renderRosterGroup}
          keyExtractor={(item) => item.roster_id.toString()}
          numColumns={numColumns}
          contentContainerStyle={[styles.listContainer, isMobile && styles.listContainerMobile]}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
          showsVerticalScrollIndicator={true}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Icon source="account-search" size={64} color={colors.outline} />
                <Text variant="titleMedium" style={{ marginTop: 16, color: colors.outline }}>
                  {error ? 'No rosters available' : 'No Rosters Found'}
                </Text>
                <Text variant="bodyMedium" style={{ color: colors.outline, textAlign: 'center', marginTop: 8 }}>
                  {error ?? (searchQuery ? 'Try adjusting your search criteria' : 'No rosters with gear inspections available')}
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Pagination */}
      {/* <View style={[styles.paginationContainer, { backgroundColor: colors.surface, borderTopColor: colors.outline }]}>
        <DataTable.Pagination
          page={page}
          numberOfPages={totalPages}
          onPageChange={setPage}
          label={`${from + 1}-${to} of ${filteredRosterGroups.length}`}
          showFastPaginationControls
          numberOfItemsPerPageList={numberOfItemsPerPageList}
          numberOfItemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          selectPageDropdownLabel={'Rosters per page'}
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
  listContainer: {
    paddingBottom: p(100),
    paddingHorizontal: p(5),
    flexGrow: 1,
  },
  listContainerMobile: {
    paddingHorizontal: 0,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: p(9),
  },
  cardWrapper: {
    width: '48%',
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
    marginBottom: p(65),
    borderTopWidth: 1,
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