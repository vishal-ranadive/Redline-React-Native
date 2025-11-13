import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Icon, useTheme, Chip, DataTable, TextInput, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../../components/common/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type GearStatus = 'PASS' | 'REPAIR' | 'EXPIRED' | 'RECOMMEND OOS' | 'CORRECTIVE ACTION REQUIRED';

type Gear = {
  gear_id: string;
  roster: {
    roster_id: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  gear_name: string;
  manufacturer: {
    manufacturer_id: string;
    manufacturer_name: string;
  };
  franchise: {
    id: string;
    name: string;
  };
  firestation: {
    id: string;
    name: string;
  };
  gear_type: string | null;
  manufacturing_date: string | null;
  gear_size: string | null;
  active_status: boolean;
  is_deleted: boolean;
  gear_image_url: string;
  serial_number: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  status?: GearStatus;
  lastInspection?: string;
  condition?: string;
  remarks?: string;
};

type Firefighter = {
  id: string;
  first_name: string;
  station: string;
  status: string;
  badgeNumber: string;
  email?: string;
};

type RouteProps = {
  firefighter: Firefighter;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'UpadateInspection'>;

// Different gear images for different gear types
const GEAR_IMAGES = {
  'Helmet': 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
  'Gloves': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFDCux32MFLBioGWbYdOiDfJoCV4sko1-sSQ&s',
  'Boots': 'https://www.hacsons.com/wp-content/uploads/2024/08/image-3-1.png',
  'Jacket': 'https://images.unsplash.com/photo-1553062407-98cff3078e9a?w=400&h=400&fit=crop',
  'Mask': 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=400&h=400&fit=crop',
  'Harness': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop',
  'Axe': 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=400&h=400&fit=crop',
  'Hose': 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
  'default': 'https://images.unsplash.com/photo-1581093458791-8a6b5d175e51?w=400&h=400&fit=crop'
};

// Mock API data for firefighter's gears with different gear types
const MOCK_FIREFIGHTER_GEARS: Gear[] = [
  {
    gear_id: '1',
    roster: {
      roster_id: '1',
      first_name: 'Jane',
      middle_name: 'M',
      last_name: 'Doe',
      email: 'jane.doe@fire.com',
      phone: '5551234567'
    },
    gear_name: 'Fire Helmet Pro',
    manufacturer: {
      manufacturer_id: '12',
      manufacturer_name: 'Fire Safety Equipment Inc.'
    },
    franchise: {
      id: '19',
      name: 'Beta Motors Franchise'
    },
    firestation: {
      id: '10',
      name: 'Central Fire Station'
    },
    gear_type: 'Helmet',
    manufacturing_date: '2024-01-15',
    gear_size: 'Large',
    active_status: true,
    is_deleted: false,
    gear_image_url: GEAR_IMAGES.Helmet,
    serial_number: 'SN-001-2025',
    created_at: '2025-11-07T19:16:15.123345Z',
    updated_at: '2025-11-12T20:47:24.394818Z',
    created_by: 'admin_user',
    updated_by: 'steve Schnepp',
    status: 'PASS',
    lastInspection: '2025-11-01',
    condition: 'Excellent',
    remarks: 'Minor scratches'
  },
  {
    gear_id: '2',
    roster: {
      roster_id: '2',
      first_name: 'John',
      middle_name: 'A',
      last_name: 'Smith',
      email: 'john.smith@fire.com',
      phone: '5551234568'
    },
    gear_name: 'Fire Resistant Gloves',
    manufacturer: {
      manufacturer_id: '13',
      manufacturer_name: 'Rescue Gear Co.'
    },
    franchise: {
      id: '19',
      name: 'Beta Motors Franchise'
    },
    firestation: {
      id: '10',
      name: 'Central Fire Station'
    },
    gear_type: 'Gloves',
    manufacturing_date: '2024-03-20',
    gear_size: 'Medium',
    active_status: true,
    is_deleted: false,
    gear_image_url: GEAR_IMAGES.Gloves,
    serial_number: 'SN-002-2025',
    created_at: '2025-11-08T10:20:30.123345Z',
    updated_at: '2025-11-12T21:30:15.394818Z',
    created_by: 'admin_user',
    updated_by: 'steve Schnepp',
    status: 'REPAIR',
    lastInspection: '2025-11-01',
    condition: 'Needs Repair',
    remarks: 'Small tear on left glove'
  },
  {
    gear_id: '3',
    roster: {
      roster_id: '3',
      first_name: 'Mike',
      middle_name: 'R',
      last_name: 'Johnson',
      email: 'mike.johnson@fire.com',
      phone: '5551234569'
    },
    gear_name: 'Firefighter Boots',
    manufacturer: {
      manufacturer_id: '14',
      manufacturer_name: 'Tactical Gear Ltd.'
    },
    franchise: {
      id: '19',
      name: 'Beta Motors Franchise'
    },
    firestation: {
      id: '10',
      name: 'Central Fire Station'
    },
    gear_type: 'Boots',
    manufacturing_date: '2023-12-10',
    gear_size: 'Small',
    active_status: true,
    is_deleted: false,
    gear_image_url: GEAR_IMAGES.Boots,
    serial_number: 'SN-003-2025',
    created_at: '2025-11-09T14:15:45.123345Z',
    updated_at: '2025-11-12T22:15:30.394818Z',
    created_by: 'admin_user',
    updated_by: 'steve Schnepp',
    status: 'EXPIRED',
    lastInspection: '2025-10-15',
    condition: 'Expired',
    remarks: 'Sole wear beyond limits'
  },
  {
    gear_id: '4',
    roster: {
      roster_id: '4',
      first_name: 'Sarah',
      middle_name: 'L',
      last_name: 'Wilson',
      email: 'sarah.wilson@fire.com',
      phone: '5551234570'
    },
    gear_name: 'Fire Jacket Elite',
    manufacturer: {
      manufacturer_id: '12',
      manufacturer_name: 'Fire Safety Equipment Inc.'
    },
    franchise: {
      id: '19',
      name: 'Beta Motors Franchise'
    },
    firestation: {
      id: '10',
      name: 'Central Fire Station'
    },
    gear_type: 'Jacket',
    manufacturing_date: '2024-02-28',
    gear_size: 'Large',
    active_status: true,
    is_deleted: false,
    gear_image_url: GEAR_IMAGES.Jacket,
    serial_number: 'SN-004-2025',
    created_at: '2025-11-10T09:45:20.123345Z',
    updated_at: '2025-11-12T23:00:45.394818Z',
    created_by: 'admin_user',
    updated_by: 'steve Schnepp',
    status: 'RECOMMEND OOS',
    lastInspection: '2025-11-05',
    condition: 'Poor',
    remarks: 'Thermal lining damaged'
  },
  {
    gear_id: '5',
    roster: {
      roster_id: '5',
      first_name: 'David',
      middle_name: 'K',
      last_name: 'Brown',
      email: 'david.brown@fire.com',
      phone: '5551234571'
    },
    gear_name: 'Rescue Mask',
    manufacturer: {
      manufacturer_id: '13',
      manufacturer_name: 'Rescue Gear Co.'
    },
    franchise: {
      id: '19',
      name: 'Beta Motors Franchise'
    },
    firestation: {
      id: '10',
      name: 'Central Fire Station'
    },
    gear_type: 'Mask',
    manufacturing_date: '2024-04-15',
    gear_size: 'Medium',
    active_status: true,
    is_deleted: false,
    gear_image_url: GEAR_IMAGES.Mask,
    serial_number: 'SN-005-2025',
    created_at: '2025-11-11T11:30:10.123345Z',
    updated_at: '2025-11-13T08:20:15.394818Z',
    created_by: 'admin_user',
    updated_by: 'steve Schnepp',
    status: 'CORRECTIVE ACTION REQUIRED',
    lastInspection: '2025-11-02',
    condition: 'Good',
    remarks: 'Needs calibration'
  },
  {
    gear_id: '6',
    roster: {
      roster_id: '6',
      first_name: 'Emma',
      middle_name: 'L',
      last_name: 'Davis',
      email: 'emma.davis@fire.com',
      phone: '5551234572'
    },
    gear_name: 'Safety Harness',
    manufacturer: {
      manufacturer_id: '15',
      manufacturer_name: 'Safety First Inc.'
    },
    franchise: {
      id: '19',
      name: 'Beta Motors Franchise'
    },
    firestation: {
      id: '10',
      name: 'Central Fire Station'
    },
    gear_type: 'Harness',
    manufacturing_date: '2024-05-10',
    gear_size: 'One Size',
    active_status: true,
    is_deleted: false,
    gear_image_url: GEAR_IMAGES.Harness,
    serial_number: 'SN-006-2025',
    created_at: '2025-11-12T14:20:30.123345Z',
    updated_at: '2025-11-13T09:15:20.394818Z',
    created_by: 'admin_user',
    updated_by: 'steve Schnepp',
    status: 'PASS',
    lastInspection: '2025-11-03',
    condition: 'Excellent',
    remarks: 'Like new condition'
  },
  {
    gear_id: '7',
    roster: {
      roster_id: '7',
      first_name: 'Robert',
      middle_name: 'T',
      last_name: 'Wilson',
      email: 'robert.wilson@fire.com',
      phone: '5551234573'
    },
    gear_name: 'Fire Axe',
    manufacturer: {
      manufacturer_id: '16',
      manufacturer_name: 'Tool Masters'
    },
    franchise: {
      id: '19',
      name: 'Beta Motors Franchise'
    },
    firestation: {
      id: '10',
      name: 'Central Fire Station'
    },
    gear_type: 'Axe',
    manufacturing_date: '2024-03-15',
    gear_size: 'Standard',
    active_status: true,
    is_deleted: false,
    gear_image_url: GEAR_IMAGES.Axe,
    serial_number: 'SN-007-2025',
    created_at: '2025-11-13T10:45:15.123345Z',
    updated_at: '2025-11-13T10:45:15.394818Z',
    created_by: 'admin_user',
    updated_by: 'steve Schnepp',
    status: 'REPAIR',
    lastInspection: '2025-11-04',
    condition: 'Needs Sharpening',
    remarks: 'Blade requires sharpening'
  },
  {
    gear_id: '8',
    roster: {
      roster_id: '8',
      first_name: 'Lisa',
      middle_name: 'M',
      last_name: 'Garcia',
      email: 'lisa.garcia@fire.com',
      phone: '5551234574'
    },
    gear_name: 'Fire Hose',
    manufacturer: {
      manufacturer_id: '17',
      manufacturer_name: 'Water Flow Systems'
    },
    franchise: {
      id: '19',
      name: 'Beta Motors Franchise'
    },
    firestation: {
      id: '10',
      name: 'Central Fire Station'
    },
    gear_type: 'Hose',
    manufacturing_date: '2024-02-10',
    gear_size: '50ft',
    active_status: true,
    is_deleted: false,
    gear_image_url: GEAR_IMAGES.Hose,
    serial_number: 'SN-008-2025',
    created_at: '2025-11-14T08:30:45.123345Z',
    updated_at: '2025-11-14T08:30:45.394818Z',
    created_by: 'admin_user',
    updated_by: 'steve Schnepp',
    status: 'PASS',
    lastInspection: '2025-11-05',
    condition: 'Good',
    remarks: 'No leaks detected'
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

// Function to get appropriate image based on gear type
const getGearImage = (gearType: string | null) => {
  if (!gearType) return GEAR_IMAGES.default;
  
  const type = gearType.toLowerCase();
  if (type.includes('helmet')) return GEAR_IMAGES.Helmet;
  if (type.includes('glove')) return GEAR_IMAGES.Gloves;
  if (type.includes('boot')) return GEAR_IMAGES.Boots;
  if (type.includes('jacket')) return GEAR_IMAGES.Jacket;
  if (type.includes('mask')) return GEAR_IMAGES.Mask;
  if (type.includes('harness')) return GEAR_IMAGES.Harness;
  if (type.includes('axe')) return GEAR_IMAGES.Axe;
  if (type.includes('hose')) return GEAR_IMAGES.Hose;
  
  return GEAR_IMAGES.default;
};

export default function FirefighterGearsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { firefighter } = route.params as RouteProps;
  
  const [gears, setGears] = useState<Gear[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [page, setPage] = useState(0);
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState(8);
  const numberOfItemsPerPageList = [4, 8, 12, 16];

  // Pagination calculations
  const from = page * numberOfItemsPerPage;
  const to = Math.min((page + 1) * numberOfItemsPerPage, gears.length);

  // Fetch gears data
  const loadGears = async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetchFirefighterGears(firefighter.id, page + 1, numberOfItemsPerPage);
      setGears(response.data);
    } catch (error) {
      console.error('Error fetching gears:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGears();
  }, [page, numberOfItemsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [numberOfItemsPerPage, searchQuery]);

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

  const handleUpdateGear = (gear: Gear) => {
    // navigation.navigate('UpadateInspection', { gear });
    navigation.navigate('UpadateInspection');
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

  // Filter gears based on search
  const filteredGears = gears.filter(gear => {
    const matchesSearch =
      gear.gear_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gear.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gear.gear_type?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const currentGears = filteredGears.slice(from, to);

  const handleRefresh = () => {
    setPage(0);
    loadGears(true);
  };

  /**
   * Render individual gear card
   */
  const renderGear = useCallback(({ item }: { item: Gear }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => handleUpdateGear(item)}
      style={[styles.card, styles.shadow, { borderColor: colors.outline }]}
    > 
      <Card style={{backgroundColor: colors.surface}}>
        <Card.Content>
          {/* Card Header with Gear ID and Status */}
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
              #{item.gear_id}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: p(6) }}>
              {/* Status indicator dot */}
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getGearStatusColor(item.status!) },
                ]}
              />
              <Text variant="titleMedium" style={{ fontWeight: 'bold', fontSize: 12 }}>
                {item.status}
              </Text>
            </View>
          </View>

          {/* Gear Image and Basic Info */}
          <View style={styles.gearImageContainer}>
            <Image 
              source={{ uri: getGearImage(item.gear_type) }} 
              style={styles.gearImage}
              resizeMode="cover"
            />
          </View>

          {/* Gear Details */}
          <View style={styles.gearDetails}>
            {/* Serial Number - Show First */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Icon source="barcode" size={16} color="#555" />
              <Text style={{ marginLeft: 6, fontSize: 14, fontWeight: '600' }}>{item.serial_number}</Text>
            </View>

            {/* Gear Name */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Icon source="hard-hat" size={16} color="#555" />
              <Text style={{ marginLeft: 6 }} numberOfLines={1}>{item.gear_name}</Text>
            </View>

            {/* Manufacturer */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Icon source="factory" size={16} color="#555" />
              <Text style={{ marginLeft: 6 }} numberOfLines={1}>
                {item.manufacturer.manufacturer_name}
              </Text>
            </View>

            {/* Gear Type */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Icon source="tag-outline" size={16} color="#555" />
              <Text style={{ marginLeft: 6 }}>{item.gear_type || 'Helmet'}</Text>
            </View>

            {/* Condition */}
            {item.condition && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Icon source="clipboard-check" size={16} color="#555" />
                <Text style={{ marginLeft: 6 }}>{item.condition}</Text>
              </View>
            )}
          </View>

          {/* Update Button */}
          <Button
            mode="contained"
            onPress={() => handleUpdateGear(item)}
            icon="clipboard-edit-outline"
            style={styles.updateButton}
            contentStyle={styles.updateButtonContent}
            buttonColor={getGearStatusColor(item.status!)}
          >
            Update
          </Button>
        </Card.Content>
      </Card>
    </TouchableOpacity> 
  ), [colors, navigation]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header 
          title={`${firefighter.first_name}'s Gears`}
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
        title={`${firefighter.first_name}'s Gears`}
        showBackButton={true}
      />

      {/* Firefighter Info Card */}
      <Card style={[styles.firefighterInfoCard, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <View style={styles.firefighterHeader}>
            {/* Left: Profile Avatar and Name/Email */}
            <View style={styles.leftSection}>
              <View style={[styles.avatar, { backgroundColor: getAvatarColor(firefighter.id) }]}>
                <Text style={styles.avatarText}>{getInitials(firefighter?.first_name)}</Text>
              </View>
              <View style={styles.nameEmailContainer}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold', fontSize: p(14) }}>
                  {firefighter.first_name}
                </Text>
                <Text style={{ fontSize: p(12), color: '#666' }} numberOfLines={1}>
                  {firefighter.email || 'firefighter@station.com'}
                </Text>
              </View>
            </View>

            {/* Right: Total Gears Count */}
            <View style={styles.rightSection}>
              <View style={styles.gearCountContainer}>
                <Icon source="tools" size={p(20)} color={colors.primary} />
                <Text style={styles.gearCountText}>{gears.length}</Text>
                <Text style={styles.gearLabel}>Total Gears</Text>
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

      {/* Gears Grid - Two Columns */}
      <FlatList
        data={currentGears}
        renderItem={renderGear}
        keyExtractor={(item) => item.gear_id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.columnWrapper}
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
                : 'No gears assigned to this firefighter'
              }
            </Text>
          </View>
        }
      />

      {/* Pagination */}
      <View style={[styles.paginationContainer, { backgroundColor: colors.surface, borderTopColor: colors.outline }]}>
        <DataTable.Pagination
          page={page}
          numberOfPages={Math.ceil(filteredGears.length / numberOfItemsPerPage)}
          onPageChange={newPage => setPage(newPage)}
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
  firefighterInfoCard: {
    margin: p(14),
    marginBottom: p(8),
    borderRadius: p(8),
    elevation: 1,
  },
  firefighterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    paddingHorizontal: p(5),
    gap: p(10),
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: p(10),
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 1,
  },
  card: {
    flex: 1,
    margin: p(1),
    borderRadius: p(10),
    minHeight: p(260),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusDot: {
    width: p(8),
    height: p(8),
    borderRadius: 50,
  },
  gearImageContainer: {
    alignItems: 'center',
  },
  gearImage: {
    width: p(80),
    height: p(80),
    borderRadius: p(8),
  },
  gearDetails: {
    marginBottom: p(12),
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
});