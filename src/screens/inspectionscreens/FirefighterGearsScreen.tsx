import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image } from 'react-native';
import { Text, Card, Button, Icon, useTheme, Chip, Portal, Dialog, TextInput, DataTable, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../../components/common/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type GearStatus = 'PASS' | 'REPAIR' | 'EXPIRED' | 'RECOMMEND OOS' | 'CORRECTIVE ACTION REQUIRED';

type Gear = {
  id: string;
  name: string;
  status: GearStatus;
  lastInspection: string;
  imageUrl: string;
  serialNumber: string;
  condition: string;
  remarks?: string;
  gearType: string;
  assignedDate: string;
};

type Firefighter = {
  id: string;
  name: string;
  station: string;
  status: string;
  badgeNumber: string;
};

type RouteProps = {
  firefighter: Firefighter;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'UpadateInspection'>;

// Mock API data for firefighter's gears
const MOCK_FIREFIGHTER_GEARS: Gear[] = [
  {
    id: 'G1',
    name: 'Fire Helmet Pro',
    status: 'PASS',
    lastInspection: '2025-11-01',
    imageUrl: 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
    serialNumber: 'SER-00121',
    condition: 'Excellent',
    remarks: 'Minor scratches on visor',
    gearType: 'Helmet',
    assignedDate: '2025-10-15'
  },
  {
    id: 'G2',
    name: 'Fire Gloves Max',
    status: 'REPAIR',
    lastInspection: '2025-11-01',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFDCux32MFLBioGWbYdOiDfJoCV4sko1-sSQ&s',
    serialNumber: 'SER-00122',
    condition: 'Needs Repair',
    remarks: 'Small tear on left glove',
    gearType: 'Gloves',
    assignedDate: '2025-10-20'
  },
  {
    id: 'G3',
    name: 'Fire Boots Pro',
    status: 'EXPIRED',
    lastInspection: '2025-10-15',
    imageUrl: 'https://www.hacsons.com/wp-content/uploads/2024/08/image-3-1.png',
    serialNumber: 'SER-00123',
    condition: 'Expired',
    remarks: 'Sole wear beyond limits',
    gearType: 'Boots',
    assignedDate: '2025-09-10'
  },
  {
    id: 'G4',
    name: 'Fire Jacket Elite',
    status: 'RECOMMEND OOS',
    lastInspection: '2025-11-05',
    imageUrl: 'https://example.com/jacket1.jpg',
    serialNumber: 'SER-00124',
    condition: 'Poor',
    remarks: 'Thermal lining damaged',
    gearType: 'Jacket',
    assignedDate: '2025-08-22'
  }
];

// API Service function
const fetchFirefighterGears = async (firefighterId: string, page: number, limit: number): Promise<{ data: Gear[], total: number }> => {
  // Simulate API call
  return new Promise(resolve => {
    setTimeout(() => {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = MOCK_FIREFIGHTER_GEARS.slice(startIndex, endIndex);
      resolve({ data: paginatedData, total: MOCK_FIREFIGHTER_GEARS.length });
    }, 800);
  });
};

export default function FirefighterGearsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { firefighter=  {
    id: 'FF4',
    name: 'Sarah Johnson',
    station: 'South Station',
    status: 'On-Duty',
    gearCount: 6,
    pendingInspections: 3,
    lastInspection: '2025-11-07',
    badgeNumber: 'FD-004'
  } } = route.params as RouteProps;
  
  const [gears, setGears] = useState<Gear[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<GearStatus | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  // Pagination state
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [totalCount, setTotalCount] = useState(0);

  // Get unique gear types for filter
  const gearTypes = ['All', ...new Set(MOCK_FIREFIGHTER_GEARS.map(gear => gear.gearType))];

  // Fetch gears data
  const loadGears = async (pageNum: number, refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetchFirefighterGears(firefighter.id, pageNum, itemsPerPage);
      setGears(response.data);
      setTotalCount(response.total);
    } catch (error) {
      console.error('Error fetching gears:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGears(page);
  }, [page, itemsPerPage]);

  const getGearStatusColor = (status: GearStatus) => {
    switch (status) {
      case 'PASS': return '#34A853';
      case 'REPAIR': return '#1E88E5';
      case 'EXPIRED': return '#E53935';
      case 'RECOMMEND OOS': return '#F9A825';
      case 'CORRECTIVE ACTION REQUIRED': return '#9C27B0';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: GearStatus) => {
    switch (status) {
      case 'PASS': return 'check-circle';
      case 'REPAIR': return 'wrench';
      case 'EXPIRED': return 'clock-alert';
      case 'RECOMMEND OOS': return 'alert-circle';
      case 'CORRECTIVE ACTION REQUIRED': return 'alert-triangle';
      default: return 'help-circle';
    }
  };

  // Filter gears based on search and filters
  const filteredGears = gears.filter(gear => {
    const matchesSearch = 
      gear.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gear.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || gear.status === statusFilter;
    const matchesType = typeFilter === 'All' || gear.gearType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleInspectGear = (gear: Gear) => {
    // navigation.navigate('UpadateInspection', { 
    //   gear,
    //   firefighter,
    //   source: 'firefighter' 
    // });
    navigation.navigate('UpadateInspection');
  };

  const handleViewGear = (gear: Gear) => {
    // navigation.navigate('GearDetail', { 
    //   gear,
    //   firefighter 
    // });
    navigation.navigate('GearDetail');
  };

  const handleRefresh = () => {
    setPage(1);
    loadGears(1, true);
  };

  const renderGearCard = (gear: Gear) => (
    <Card key={gear.id} style={[styles.gearCard, { backgroundColor: colors.surface }]}>
      <Card.Content>
        <View style={styles.gearHeader}>
          <View style={styles.gearImageContainer}>
            <Image 
              source={{ uri: gear.imageUrl }} 
              style={styles.gearImage}
              resizeMode="cover"
            />
            <Chip 
              style={[styles.statusChip, { backgroundColor: getGearStatusColor(gear.status) }]}
              textStyle={{ color: '#fff', fontSize: p(8), fontWeight: '600' }}
              compact
            >
              {gear.status}
            </Chip>
          </View>
          
          <View style={styles.gearInfo}>
            <Text variant="titleMedium" style={{ fontWeight: '700', fontSize: p(16), marginBottom: p(4) }}>
              {gear.name}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, fontSize: p(12), marginBottom: p(2) }}>
              Serial: {gear.serialNumber}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, fontSize: p(12), marginBottom: p(2) }}>
              Type: {gear.gearType}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, fontSize: p(12), marginBottom: p(2) }}>
              Last Inspected: {gear.lastInspection}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, fontSize: p(12) }}>
              Assigned: {gear.assignedDate}
            </Text>
            
            {gear.remarks && (
              <View style={styles.remarksContainer}>
                <Icon source="comment-text" size={p(12)} color={colors.onSurfaceVariant} />
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, fontSize: p(11), marginLeft: p(4), flex: 1 }}>
                  {gear.remarks}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.gearActions}>
          <Button
            mode="outlined"
            onPress={() => handleViewGear(gear)}
            icon="eye-outline"
            style={styles.actionButton}
            compact
          >
            View
          </Button>
          <Button
            mode="contained"
            onPress={() => handleInspectGear(gear)}
            icon="clipboard-check-outline"
            style={styles.actionButton}
            compact
          >
            Inspect
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header 
          title={`${firefighter.name}'s Gears`}
          showBackButton={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="bodyMedium" style={{ marginTop: p(16) }}>Loading gears...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title={`${firefighter.name}'s Gears`}
        showBackButton={true}
      />

      {/* Firefighter Info Card */}
      <Card style={[styles.firefighterInfoCard, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <View style={styles.firefighterCompactRow}>
            <View style={styles.firefighterBadge}>
              <Icon source="shield-account" size={p(20)} color={colors.primary} />
              <View style={styles.firefighterText}>
                <Text variant="titleSmall" style={{ fontWeight: '600' }}>
                  {firefighter.name}
                </Text>
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                  {firefighter.station} • {firefighter.badgeNumber}
                </Text>
              </View>
            </View>
            <Chip mode="outlined" compact>
              {gears.length} Gears
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* 🔍 Search & Filter Section */}
      <View style={[styles.searchFilterContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          mode="outlined"
          placeholder="Search by gear name or serial number"
          value={searchQuery}
          onChangeText={setSearchQuery}
          left={<TextInput.Icon icon="magnify" />}
          style={styles.searchInput}
          dense
        />

        <View style={styles.filterRow}>
          <Text variant="bodySmall" style={styles.filterLabel}>Status:</Text>
          <View style={styles.filterChips}>
            {(['All', 'PASS', 'REPAIR', 'EXPIRED', 'RECOMMEND OOS', 'CORRECTIVE ACTION REQUIRED'] as (GearStatus | 'All')[]).map(status => (
              <Chip
                key={status}
                selected={statusFilter === status}
                onPress={() => setStatusFilter(status)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: statusFilter === status ? getGearStatusColor(status as GearStatus) : colors.surfaceVariant
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
          <Text variant="bodySmall" style={styles.filterLabel}>Type:</Text>
          <View style={styles.typeChips}>
            {gearTypes.map(type => (
              <Chip
                key={type}
                selected={typeFilter === type}
                onPress={() => setTypeFilter(type)}
                style={[
                  styles.typeChip,
                  { 
                    backgroundColor: typeFilter === type ? colors.primary : colors.surfaceVariant 
                  }
                ]}
                textStyle={{
                  color: typeFilter === type ? '#fff' : colors.onSurfaceVariant,
                  fontSize: p(10)
                }}
                compact
              >
                {type}
              </Chip>
            ))}
          </View>
        </View>
      </View>

      {/* Gears List */}
      <FlatList
        data={filteredGears}
        renderItem={({ item }) => renderGearCard(item)}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon source="package-variant-closed" size={p(48)} color={colors.onSurfaceVariant} />
            <Text variant="titleMedium" style={{ color: colors.onSurfaceVariant, marginTop: p(8) }}>
              No Gears Found
            </Text>
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center' }}>
              {searchQuery || statusFilter !== 'All' || typeFilter !== 'All' 
                ? 'Try adjusting your search or filters' 
                : 'No gears assigned to this firefighter'
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
          numberOfItemsPerPageList={[4, 8, 12]}
          numberOfItemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          selectPageDropdownLabel={'Gears per page'}
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
  firefighterInfoCard: {
    margin: p(14),
    marginBottom: p(8),
    borderRadius: p(8),
    elevation: 1,
  },
  firefighterCompactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  firefighterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  firefighterText: {
    marginLeft: p(12),
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
    minWidth: p(50),
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: p(6),
    flex: 1,
  },
  typeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: p(6),
    flex: 1,
  },
  filterChip: {
    marginRight: p(4),
    marginBottom: p(4),
  },
  typeChip: {
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
  gearCard: {
    marginBottom: p(12),
    borderRadius: p(8),
    elevation: 1,
  },
  gearHeader: {
    flexDirection: 'row',
    marginBottom: p(12),
  },
  gearImageContainer: {
    position: 'relative',
    marginRight: p(12),
  },
  gearImage: {
    width: p(80),
    height: p(80),
    borderRadius: p(6),
  },
  statusChip: {
    position: 'absolute',
    top: p(4),
    right: p(4),
  },
  gearInfo: {
    flex: 1,
  },
  remarksContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: p(6),
    padding: p(6),
    backgroundColor: '#f5f5f5',
    borderRadius: p(4),
  },
  gearActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: p(2),
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