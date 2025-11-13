import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Button, Icon, useTheme, TextInput, DataTable, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/common/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Firefighter = {
  roster_id: string;
  franchise: {
    id: string;
    name: string;
  };
  firestation: {
    id: string;
    name: string;
  };
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  phone: string;
  active_status: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  roster_name: string;
  gearCount?: number;
  lastInspection?: string;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FirefighterGearsScreen'>;

// Mock API response - replace with actual API call
const MOCK_FIREFIGHTERS: Firefighter[] = [
  {
    roster_id: '1',
    franchise: {
      id: '19',
      name: 'Beta Motors Franchise - test'
    },
    firestation: {
      id: '10',
      name: 'Central Fire Station'
    },
    first_name: 'Jane',
    middle_name: 'M',
    last_name: 'Doe',
    email: 'jane.doe@fire.com',
    phone: '5551234567',
    active_status: false,
    is_deleted: true,
    created_at: '2025-10-30T21:26:25.282836Z',
    updated_at: '2025-11-13T13:18:49.282531Z',
    created_by: 'DummyScript',
    updated_by: 'steve Schnepp',
    roster_name: 'Jane M Doe',
    gearCount: 5,
    lastInspection: '2025-11-10'
  },
  {
    roster_id: '2',
    franchise: {
      id: '22',
      name: 'testing Franchise'
    },
    firestation: {
      id: '11',
      name: 'Department-2'
    },
    first_name: 'Michael',
    middle_name: null,
    last_name: 'Clark',
    email: 'michael.clark@fire.com',
    phone: '5559876543',
    active_status: false,
    is_deleted: true,
    created_at: '2025-10-30T21:26:25.282836Z',
    updated_at: '2025-11-13T13:19:00.448341Z',
    created_by: 'DummyScript',
    updated_by: 'steve Schnepp',
    roster_name: 'Michael Clark',
    gearCount: 3,
    lastInspection: '2025-11-09'
  },
  {
    roster_id: '8',
    franchise: {
      id: '19',
      name: 'Beta Motors Franchise - test'
    },
    firestation: {
      id: '13',
      name: 'Central Fire Station'
    },
    first_name: 'Jane',
    middle_name: 'M',
    last_name: 'Doe',
    email: 'jane.doe@fire.com',
    phone: '5551234567',
    active_status: true,
    is_deleted: false,
    created_at: '2025-11-07T19:43:33.125759Z',
    updated_at: '2025-11-07T19:43:33.125771Z',
    created_by: 'steve-update test',
    updated_by: 'steve-update test',
    roster_name: 'Jane M Doe',
    gearCount: 6,
    lastInspection: '2025-11-07'
  },
  {
    roster_id: '16',
    franchise: {
      id: '22',
      name: 'testing Franchise'
    },
    firestation: {
      id: '13',
      name: 'Central Fire Station'
    },
    first_name: 'JohnABC',
    middle_name: 'A',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '9876543210',
    active_status: true,
    is_deleted: false,
    created_at: '2025-11-12T17:16:34.314292Z',
    updated_at: '2025-11-13T13:20:41.936975Z',
    created_by: 'John Doe',
    updated_by: 'steve Schnepp',
    roster_name: 'JohnABC A Doe',
    gearCount: 4,
    lastInspection: '2025-11-08'
  },
  {
    roster_id: '17',
    franchise: {
      id: '1',
      name: 'Redline Gear Cleaning (Corporate)'
    },
    firestation: {
      id: '14',
      name: 'Central Fire Station'
    },
    first_name: 'Shahzad',
    middle_name: 'M',
    last_name: 'Iqbal',
    email: 'shahzadiqbal.may18@gmail.com',
    phone: '017636757799',
    active_status: true,
    is_deleted: false,
    created_at: '2025-11-12T17:19:11.473294Z',
    updated_at: '2025-11-12T17:19:11.473306Z',
    created_by: 'steve Schnepp',
    updated_by: 'steve Schnepp',
    roster_name: 'Shahzad M Iqbal',
    gearCount: 2,
    lastInspection: '2025-11-06'
  },
  {
    roster_id: '18',
    franchise: {
      id: '5',
      name: 'Redline - New Jersey'
    },
    firestation: {
      id: '11793',
      name: 'Atlantic City Fire Department'
    },
    first_name: 'demo',
    middle_name: 'DM',
    last_name: 'firefighter',
    email: 'demoff@gmail.com',
    phone: '+1-555-123-4888',
    active_status: true,
    is_deleted: false,
    created_at: '2025-11-13T11:11:01.839914Z',
    updated_at: '2025-11-13T11:11:01.839927Z',
    created_by: 'steve Schnepp',
    updated_by: 'steve Schnepp',
    roster_name: 'demo DM firefighter',
    gearCount: 7,
    lastInspection: '2025-11-05'
  }
];

// API Service function
const fetchFirefighters = async (page: number, limit: number, search?: string): Promise<{ data: Firefighter[], total: number }> => {
  // Simulate API call with search
  return new Promise(resolve => {
    setTimeout(() => {
      let filteredData = MOCK_FIREFIGHTERS;
      
      // Apply search filter if provided
      if (search) {
        filteredData = MOCK_FIREFIGHTERS.filter(ff => 
          ff.email.toLowerCase().includes(search.toLowerCase()) ||
          ff.roster_name.toLowerCase().includes(search.toLowerCase()) ||
          ff.first_name.toLowerCase().includes(search.toLowerCase()) ||
          ff.last_name.toLowerCase().includes(search.toLowerCase())
        );
      }

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      resolve({ data: paginatedData, total: filteredData.length });
    }, 1000);
  });
};

export default function FirefighterListScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  
  const [firefighters, setFirefighters] = useState<Firefighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch firefighters data
  const loadFirefighters = async (pageNum: number, refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetchFirefighters(pageNum, itemsPerPage, searchQuery);
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

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1);
      loadFirefighters(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleViewGears = (firefighter: Firefighter) => {
    console.log("firefighter_passed_toGear", firefighter)
    navigation.navigate('FirefighterGearsScreen', { firefighter });
  };

  const handleRefresh = () => {
    setPage(1);
    loadFirefighters(1, true);
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

  /**
   * Render individual firefighter row
   */
  const renderFirefighter = ({ item }: { item: Firefighter }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => handleViewGears(item)}
      style={[styles.firefighterRow, { backgroundColor: colors.surface }]}
    > 
      {/* Left: Profile Avatar and Name/Email */}
      <View style={styles.leftSection}>
        <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.roster_id) }]}>
          <Text style={styles.avatarText}>{getInitials(item.roster_name)}</Text>
        </View>
        <View style={styles.nameEmailContainer}>
          <Text variant="titleMedium" style={{ fontWeight: 'bold', fontSize: p(14) }}>
            {item.roster_name}
          </Text>
          <Text style={{ fontSize: p(12), color: '#666' }} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
      </View>

      {/* Right: Total Scanned Gears and Arrow */}
      <View style={styles.rightSection}>
        <View style={styles.gearCountContainer}>
          <Icon source="tools" size={p(16)} color={colors.primary} />
          <Text style={styles.gearCountText}>{item.gearCount || 0}</Text>
          <Text style={styles.gearLabel}>Total Scanned Gears</Text>
        </View>
        <Icon source="chevron-right" size={p(20)} color="#666" />
      </View>
    </TouchableOpacity> 
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

      {/* 🔍 Search Section */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          mode="outlined"
          placeholder="Search by email or name"
          value={searchQuery}
          onChangeText={setSearchQuery}
          left={<TextInput.Icon icon="magnify" />}
          style={styles.searchInput}
          dense
        />
      </View>

      {/* Firefighters List - Horizontal Rows */}
      <FlatList
        data={firefighters}
        renderItem={renderFirefighter}
        keyExtractor={(item) => item.roster_id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon source="account-search" size={64} color={colors.outline} />
            <Text variant="titleMedium" style={{ marginTop: 16, color: colors.outline }}>
              No Firefighters Found
            </Text>
            <Text variant="bodyMedium" style={{ color: colors.outline, textAlign: 'center', marginTop: 8 }}>
              {searchQuery
                ? 'Try adjusting your search criteria' 
                : 'No firefighters available'
              }
            </Text>
          </View>
        }
      />

      {/* Pagination */}
      <View style={[styles.paginationContainer, { backgroundColor: colors.surface, borderTopColor: colors.outline }]}>
        <DataTable.Pagination
          page={page - 1}
          numberOfPages={Math.ceil(totalCount / itemsPerPage)}
          onPageChange={newPage => setPage(newPage + 1)}
          label={`${((page - 1) * itemsPerPage) + 1}-${Math.min(page * itemsPerPage, totalCount)} of ${totalCount}`}
          showFastPaginationControls
          numberOfItemsPerPageList={[10, 20, 30]}
          numberOfItemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          selectPageDropdownLabel={'Firefighters per page'}
          theme={{
            colors: {
              primary: colors.primary,
              onSurface: colors.onSurface,
              surface: colors.surface,
            },
          }}
        />
      </View>
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
    flexGrow: 1,
  },
  firefighterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: p(12),
    marginHorizontal: p(14),
    marginBottom: p(8),
    borderRadius: p(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: p(8),
  },
  gearCountContainer: {
    alignItems: 'center',
    marginRight: p(8),
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