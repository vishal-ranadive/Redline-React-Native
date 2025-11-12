import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Button, Icon, useTheme, Chip, Portal, Dialog, TextInput, DataTable, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/common/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type FirefighterStatus = 'Active' | 'Inactive' | 'On-Duty' | 'Off-Duty';

type Firefighter = {
  id: string;
  name: string;
  station: string;
  status: FirefighterStatus;
  gearCount: number;
  pendingInspections: number;
  lastInspection: string;
  badgeNumber: string;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FirefighterGearsScreen'>;

// Mock API response - replace with actual API call
const MOCK_FIREFIGHTERS: Firefighter[] = [
  {
    id: 'FF1',
    name: 'John Doe',
    station: 'Central Fire Station',
    status: 'On-Duty',
    gearCount: 5,
    pendingInspections: 2,
    lastInspection: '2025-11-10',
    badgeNumber: 'FD-001'
  },
  {
    id: 'FF2',
    name: 'Jane Smith',
    station: 'North Station',
    status: 'Active',
    gearCount: 3,
    pendingInspections: 1,
    lastInspection: '2025-11-09',
    badgeNumber: 'FD-002'
  },
  {
    id: 'FF3',
    name: 'Michael Clark',
    station: 'Central Fire Station',
    status: 'Off-Duty',
    gearCount: 4,
    pendingInspections: 0,
    lastInspection: '2025-11-08',
    badgeNumber: 'FD-003'
  },
  {
    id: 'FF4',
    name: 'Sarah Johnson',
    station: 'South Station',
    status: 'On-Duty',
    gearCount: 6,
    pendingInspections: 3,
    lastInspection: '2025-11-07',
    badgeNumber: 'FD-004'
  }
];

// API Service function
const fetchFirefighters = async (page: number, limit: number): Promise<{ data: Firefighter[], total: number }> => {
  // Simulate API call
  return new Promise(resolve => {
    setTimeout(() => {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = MOCK_FIREFIGHTERS.slice(startIndex, endIndex);
      resolve({ data: paginatedData, total: MOCK_FIREFIGHTERS.length });
    }, 1000);
  });
};

export default function FirefighterListScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  
  const [firefighters, setFirefighters] = useState<Firefighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FirefighterStatus | 'All'>('All');
  const [stationFilter, setStationFilter] = useState<string>('All');

  // Pagination state
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [totalCount, setTotalCount] = useState(0);

  // Get unique stations for filter
  const stations = ['All', ...new Set(MOCK_FIREFIGHTERS.map(ff => ff.station))];

  // Fetch firefighters data
  const loadFirefighters = async (pageNum: number, refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetchFirefighters(pageNum, itemsPerPage);
      setFirefighters(response.data);
      setTotalCount(response.total);
    } catch (error) {
      console.error('Error fetching firefighters:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFirefighters(page);
  }, [page, itemsPerPage]);

  const getStatusColor = (status: FirefighterStatus) => {
    switch (status) {
      case 'On-Duty': return '#4CAF50';
      case 'Active': return '#2196F3';
      case 'Off-Duty': return '#FF9800';
      case 'Inactive': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: FirefighterStatus) => {
    switch (status) {
      case 'On-Duty': return 'shield-account';
      case 'Active': return 'account-check';
      case 'Off-Duty': return 'account-clock';
      case 'Inactive': return 'account-off';
      default: return 'account';
    }
  };

  // Filter firefighters based on search and filters
  const filteredFirefighters = firefighters.filter(ff => {
    const matchesSearch = 
      ff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ff.badgeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ff.station.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || ff.status === statusFilter;
    const matchesStation = stationFilter === 'All' || ff.station === stationFilter;

    return matchesSearch && matchesStatus && matchesStation;
  });

  const handleViewGears = (firefighter: Firefighter) => {
    navigation.navigate('FirefighterGearsScreen', { firefighter });
  };

  const handleRefresh = () => {
    setPage(1);
    loadFirefighters(1, true);
  };

  const renderFirefighterCard = (firefighter: Firefighter) => (
    <Card key={firefighter.id} style={[styles.firefighterCard, { backgroundColor: colors.surface }]}>
      <Card.Content>
        <View style={styles.firefighterHeader}>
          <View style={styles.firefighterInfo}>
            <Icon 
              source={getStatusIcon(firefighter.status)} 
              size={p(32)} 
              color={getStatusColor(firefighter.status)} 
            />
            <View style={styles.firefighterDetails}>
              <Text variant="titleMedium" style={{ fontWeight: '700', fontSize: p(16) }}>
                {firefighter.name}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, fontSize: p(12) }}>
                {firefighter.station} • {firefighter.badgeNumber}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, fontSize: p(12) }}>
                Last Inspection: {firefighter.lastInspection}
              </Text>
            </View>
          </View>
          <Chip 
            style={{ backgroundColor: getStatusColor(firefighter.status) }}
            textStyle={{ color: '#fff', fontWeight: '600', fontSize: p(10) }}
            icon={getStatusIcon(firefighter.status)}
          >
            {firefighter.status}
          </Chip>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Icon source="tools" size={p(20)} color={colors.primary} />
            <Text variant="titleSmall" style={{ fontWeight: '600', marginLeft: p(4) }}>
              {firefighter.gearCount}
            </Text>
            <Text variant="bodySmall" style={{ fontSize: p(10) }}>Total Gears</Text>
          </View>
          <View style={styles.statItem}>
            <Icon source="clipboard-alert" size={p(20)} color="#FF6B35" />
            <Text variant="titleSmall" style={{ fontWeight: '600', marginLeft: p(4) }}>
              {firefighter.pendingInspections}
            </Text>
            <Text variant="bodySmall" style={{ fontSize: p(10) }}>Pending</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            onPress={() => handleViewGears(firefighter)}
            icon="arrow-right"
            style={styles.viewButton}
            disabled={firefighter.gearCount === 0}
          >
            View Gears ({firefighter.gearCount})
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Firefighters" showBackButton={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="bodyMedium" style={{ marginTop: p(16) }}>Loading firefighters...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Firefighters" showBackButton={true} />

      {/* 🔍 Search & Filter Section */}
      <View style={[styles.searchFilterContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          mode="outlined"
          placeholder="Search by name, badge, or station"
          value={searchQuery}
          onChangeText={setSearchQuery}
          left={<TextInput.Icon icon="magnify" />}
          style={styles.searchInput}
          dense
        />
        
        <View style={styles.filterRow}>
          <View style={styles.filterChips}>
            {(['All', 'On-Duty', 'Active', 'Off-Duty', 'Inactive'] as (FirefighterStatus | 'All')[]).map(status => (
              <Chip
                key={status}
                selected={statusFilter === status}
                onPress={() => setStatusFilter(status)}
                style={[
                  styles.filterChip,
                  { 
                    backgroundColor: statusFilter === status ? getStatusColor(status as FirefighterStatus) : colors.surfaceVariant 
                  }
                ]}
                textStyle={{
                  color: statusFilter === status ? '#fff' : colors.onSurfaceVariant,
                  fontSize: p(10)
                }}
                compact
              >
                {status}
              </Chip>
            ))}
          </View>
        </View>

        <View style={styles.filterRow}>
          <Text variant="bodySmall" style={styles.filterLabel}>Station:</Text>
          <View style={styles.stationChips}>
            {stations.map(station => (
              <Chip
                key={station}
                selected={stationFilter === station}
                onPress={() => setStationFilter(station)}
                style={[
                  styles.stationChip,
                  { 
                    backgroundColor: stationFilter === station ? colors.primary : colors.surfaceVariant 
                  }
                ]}
                textStyle={{
                  color: stationFilter === station ? '#fff' : colors.onSurfaceVariant,
                  fontSize: p(10)
                }}
                compact
              >
                {station}
              </Chip>
            ))}
          </View>
        </View>
      </View>

      {/* Firefighters List */}
      <FlatList
        data={filteredFirefighters}
        renderItem={({ item }) => renderFirefighterCard(item)}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon source="account-search" size={p(48)} color={colors.onSurfaceVariant} />
            <Text variant="titleMedium" style={{ color: colors.onSurfaceVariant, marginTop: p(8) }}>
              No Firefighters Found
            </Text>
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center' }}>
              {searchQuery || statusFilter !== 'All' || stationFilter !== 'All' 
                ? 'Try adjusting your search or filters' 
                : 'No firefighters available'
              }
            </Text>
          </View>
        }
      />

      {/* Pagination */}
      <View style={styles.paginationContainer}>
        <DataTable.Pagination
          page={page - 1}
          numberOfPages={Math.ceil(totalCount / itemsPerPage)}
          onPageChange={newPage => setPage(newPage + 1)}
          label={`${((page - 1) * itemsPerPage) + 1}-${Math.min(page * itemsPerPage, totalCount)} of ${totalCount}`}
          showFastPaginationControls
          numberOfItemsPerPageList={[3, 6, 9]}
          numberOfItemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          selectPageDropdownLabel={'Firefighters per page'}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchFilterContainer: {
    paddingHorizontal: p(14),
    paddingTop: p(8),
    paddingBottom: p(8),
  },
  searchInput: {
    marginBottom: p(8),
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: p(6),
  },
  filterLabel: {
    marginRight: p(8),
    fontWeight: '600',
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: p(6),
    flex: 1,
  },
  stationChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: p(6),
    flex: 1,
  },
  filterChip: {
    marginRight: p(4),
    marginBottom: p(4),
  },
  stationChip: {
    marginRight: p(4),
    marginBottom: p(4),
  },
  listContainer: {
    padding: p(14),
    paddingBottom: p(120),
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: p(40),
  },
  firefighterCard: {
    marginBottom: p(16),
    borderRadius: p(12),
    elevation: 2,
    padding: p(8),
  },
  firefighterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: p(12),
  },
  firefighterInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  firefighterDetails: {
    marginLeft: p(12),
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: p(12),
    padding: p(12),
    backgroundColor: '#f8f9fa',
    borderRadius: p(8),
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  viewButton: {
    flex: 1,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});