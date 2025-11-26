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
  last_name: string;
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
  'Mask': 'https://multimedia.3m.com/mws/media/1927020O/3m-scott-av-3000-ht-facepiece-600x600p.jpg',
  'Harness': 'https://www.uviraj.com/images/FBH-EN/U222FBH.jpg',
  'Axe': 'data:image/png;base64,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',
  'Hose': 'https://tirupatiplasto.in/wp-content/upiVBORw0KGgoAAAANSUhEUgAAARMAAAC3CAMAAAAGjUrGAAACRlBMVEXloads/2023/06/fh1.jpg',
  'default': 'https://media.gettyimages.com/id/72542196/photo/firemens-gear-at-firehouse.jpg?s=612x612&w=0&k=20&c=Hha2TRyDvyoN3CYK-Hjp_uWf-Jg1P4oJJVWtY6CP6eU='
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
                <Text style={styles.avatarText}>{getInitials(`${firefighter?.first_name} ${firefighter?.last_name}`)}</Text>
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