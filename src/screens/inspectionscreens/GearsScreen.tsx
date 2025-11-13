import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, Button, Icon, useTheme, Chip, DataTable, TextInput } from 'react-native-paper';
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

type Bin = {
  id: string;
  name: string;
  gearType: string;
  status: string;
};

type Load = {
  id: string;
  name: string;
  status: string;
};

type RouteProps = {
  load: Load;
  bin: Bin;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'UpadateInspection'>;

// Mock data matching your API structure
const MOCK_GEARS: Gear[] = [
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
    gear_image_url: 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
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
    gear_name: 'Rescue Helmet X1',
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
    gear_type: 'Helmet',
    manufacturing_date: '2024-03-20',
    gear_size: 'Medium',
    active_status: true,
    is_deleted: false,
    gear_image_url: 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
    serial_number: 'SN-002-2025',
    created_at: '2025-11-08T10:20:30.123345Z',
    updated_at: '2025-11-12T21:30:15.394818Z',
    created_by: 'admin_user',
    updated_by: 'steve Schnepp',
    status: 'REPAIR',
    lastInspection: '2025-11-01',
    condition: 'Needs Repair',
    remarks: 'Cracked visor'
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
    gear_name: 'Tactical Helmet T2',
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
    gear_type: 'Helmet',
    manufacturing_date: '2023-12-10',
    gear_size: 'Small',
    active_status: true,
    is_deleted: false,
    gear_image_url: 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
    serial_number: 'SN-003-2025',
    created_at: '2025-11-09T14:15:45.123345Z',
    updated_at: '2025-11-12T22:15:30.394818Z',
    created_by: 'admin_user',
    updated_by: 'steve Schnepp',
    status: 'EXPIRED',
    lastInspection: '2025-10-15',
    condition: 'Expired',
    remarks: 'Certification expired'
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
    manufacturing_date: '2024-02-28',
    gear_size: 'Large',
    active_status: true,
    is_deleted: false,
    gear_image_url: 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
    serial_number: 'SN-004-2025',
    created_at: '2025-11-10T09:45:20.123345Z',
    updated_at: '2025-11-12T23:00:45.394818Z',
    created_by: 'admin_user',
    updated_by: 'steve Schnepp',
    status: 'RECOMMEND OOS',
    lastInspection: '2025-11-05',
    condition: 'Poor',
    remarks: 'Structural damage'
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
    gear_name: 'Rescue Helmet X1',
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
    gear_type: 'Helmet',
    manufacturing_date: '2024-04-15',
    gear_size: 'Medium',
    active_status: true,
    is_deleted: false,
    gear_image_url: 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
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
      roster_id: '5',
      first_name: 'David',
      middle_name: 'K',
      last_name: 'Brown',
      email: 'david.brown@fire.com',
      phone: '5551234571'
    },
    gear_name: 'Rescue Helmet X1',
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
    gear_type: 'Helmet',
    manufacturing_date: '2024-04-15',
    gear_size: 'Medium',
    active_status: true,
    is_deleted: false,
    gear_image_url: 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
    serial_number: 'SN-005-2025',
    created_at: '2025-11-11T11:30:10.123345Z',
    updated_at: '2025-11-13T08:20:15.394818Z',
    created_by: 'admin_user',
    updated_by: 'steve Schnepp',
    status: 'CORRECTIVE ACTION REQUIRED',
    lastInspection: '2025-11-02',
    condition: 'Good',
    remarks: 'Needs calibration'
  }
];

export default function GearsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { load, bin } = route.params as RouteProps;
  
  const [gears, setGears] = useState<Gear[]>(MOCK_GEARS);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<GearStatus | 'All'>('All');

  // Pagination state
  const [page, setPage] = useState(0);
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState(8);
  const numberOfItemsPerPageList = [4, 8, 12, 16];

  // Pagination calculations
  const from = page * numberOfItemsPerPage;
  const to = Math.min((page + 1) * numberOfItemsPerPage, gears.length);
  
  const filteredGears = gears.filter(gear => {
    const matchesSearch =
      gear.gear_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gear.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${gear.roster.first_name} ${gear.roster.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || gear.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const currentGears = filteredGears.slice(from, to);

  useEffect(() => {
    setPage(0);
  }, [numberOfItemsPerPage, searchQuery, statusFilter]);

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

  const getRosterFullName = (roster: Gear['roster']) => {
    return `${roster.first_name} ${roster.middle_name ? roster.middle_name + ' ' : ''}${roster.last_name}`;
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
              source={{ uri: item.gear_image_url }} 
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

            {/* Firefighter Name */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Icon source="account" size={16} color="#555" />
              <Text style={{ marginLeft: 6 }} numberOfLines={1}>
                {getRosterFullName(item.roster)}
              </Text>
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title={`Gears - ${bin.name}`}
        showBackButton={true}
      />

      {/* Bin Info Card */}
      <Card style={[styles.binInfoCard, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <View style={styles.binCompactRow}>
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall" style={{ fontWeight: '600' }}>
                {load.name || 'Load Name'} / {bin.name}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginTop: p(2) }}>
                {bin.gearType} • {gears.length} Gears
              </Text>
            </View>
            <Chip
              mode="outlined"
              icon={getStatusIcon(bin.status as GearStatus)}
              style={{ marginLeft: p(8) }}
              compact
            >
              {bin.status}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Search & Filter Section */}
      <View style={[styles.searchFilterContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          mode="outlined"
          placeholder="Search by serial, gear name, or firefighter"
          value={searchQuery}
          onChangeText={setSearchQuery}
          left={<TextInput.Icon icon="magnify" />}
          style={styles.searchInput}
          dense
        />

        <View style={styles.filterChips}>
          {(['All', 'PASS', 'REPAIR', 'EXPIRED', 'RECOMMEND OOS', 'CORRECTIVE ACTION REQUIRED'] as (GearStatus | 'All')[]).map(status => (
            <Chip
              key={status}
              selected={statusFilter === status}
              onPress={() => setStatusFilter(status)}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    statusFilter === status
                      ? status === 'All' ? colors.primary : getGearStatusColor(status as GearStatus)
                      : colors.surfaceVariant,
                },
              ]}
              textStyle={{
                color: statusFilter === status ? '#fff' : colors.onSurfaceVariant,
                fontSize: p(10),
              }}
              compact
            >
              {status}
            </Chip>
          ))}
        </View>
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon source="package-variant-closed" size={64} color={colors.outline} />
            <Text variant="titleMedium" style={{ marginTop: 16, color: colors.outline }}>
              No gears found
            </Text>
            <Text variant="bodyMedium" style={{ color: colors.outline, textAlign: 'center', marginTop: 8 }}>
              {searchQuery || statusFilter !== 'All' 
                ? 'Try adjusting your search or filter criteria' 
                : 'No gears available in this bin.'}
            </Text>
          </View>
        }
      />

      {/* Pagination at Bottom */}
      {/* <View style={[styles.paginationContainer, { backgroundColor: colors.surface, borderTopColor: colors.outline }]}>
        <DataTable.Pagination
          page={page}
          numberOfPages={Math.ceil(filteredGears.length / numberOfItemsPerPage)}
          onPageChange={page => setPage(page)}
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
      </View> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: p(10) 
  },
  binInfoCard: {
    margin: p(6),
    marginBottom: p(8),
    borderRadius: p(12),
    elevation: 2,
  },
  binCompactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  searchFilterContainer: {
    paddingHorizontal: p(14),
    paddingTop: p(8),
    paddingBottom: p(12),
    borderRadius: p(8),
    marginHorizontal: p(6),
    marginBottom: p(8),
    elevation: 1,
  },
  searchInput: {
    marginBottom: p(12),
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: p(6),
  },
  filterChip: {
    marginRight: p(4),
    marginBottom: p(4),
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
    // marginBottom: p(10),
  },
  statusDot: {
    width: p(8),
    height: p(8),
    borderRadius: 50,
  },
  gearImageContainer: {
    alignItems: 'center',
    // marginBottom: p(10),
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