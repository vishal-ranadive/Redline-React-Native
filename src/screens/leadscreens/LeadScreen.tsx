import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  useTheme,
  Menu,
  Divider,
  Icon,
  Badge 
} from 'react-native-paper';
import BottomNavBar from '../../navigation/BottomNavBar';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/AppNavigator'; // adjust path
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
// Type for the mock data structure
// interface LeadItem {
//   id: string;
//   name: string;
//   phone: string;
//   email: string;
//   station: string;
//   status: 'Ongoing' | 'Completed' | 'Canceled';
//   orderType: 'Repair' | 'Inspection';
// }


interface Technician {
  id: string;
  name: string;
}

type LeadStatus = 'Ongoing' | 'Completed' | 'Canceled' | 'Rescheduled' | 'Scheduled';
type LeadType = 'Repair' | 'Inspection';

interface LeadItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  station: string;
  status: LeadStatus;
  leadType: LeadType;
  technicianDetails: Technician[];
  department: string;
  appointmentDate: string;
}

// Placeholder for responsive utility
const p = (size: number): number => size; 

// Mock JSON Data (Typed)
// const leadsData: LeadItem[] = [
//   {
//     id: '123456',
//     name: 'Liam Carter',
//     phone: '555-123-4567',
//     email: 'liam.carter@gmail.com',
//     station: 'Fire Station 12',
//     status: 'Ongoing',
//     orderType: 'Repair',
//   },
//   {
//     id: '223456',
//     name: 'Liam Carter',
//     phone: '555-123-4567',
//     email: 'liam.carter@gmail.com',
//     station: 'Fire Station 12',
//     status: 'Completed',
//     orderType: 'Inspection',
//   },
//   {
//     id: '323456',
//     name: 'Liam Carter',
//     phone: '555-123-4567',
//     email: 'liam.carter@gmail.com',
//     station: 'Fire Station 12',
//     status: 'Canceled',
//     orderType: 'Repair',
//   },
//   {
//     id: '423456',
//     name: 'Liam Carter',
//     phone: '555-123-4567',
//     email: 'liam.carter@gmail.com',
//     station: 'Fire Station 12',
//     status: 'Ongoing',
//     orderType: 'Repair',
//   },
//   {
//     id: '523456',
//     name: 'Liam Carter',
//     phone: '555-123-4567',
//     email: 'liam.carter@gmail.com',
//     station: 'Fire Station 12',
//     status: 'Completed',
//     orderType: 'Inspection',
//   },
//   {
//     id: '524456',
//     name: 'Liam Carter',
//     phone: '555-123-4567',
//     email: 'liam.carter@gmail.com',
//     station: 'Fire Station 12',
//     status: 'Completed',
//     orderType: 'Inspection',
//   },
//   {
//     id: '623456',
//     name: 'Liam Carter',
//     phone: '555-123-4567',
//     email: 'liam.carter@gmail.com',
//     station: 'Fire Station 12',
//     status: 'Canceled',
//     orderType: 'Repair',
//   },
// ];

type LeadDetailNavProp = NativeStackNavigationProp<RootStackParamList, 'LeadDetail'>;

const leadsData: LeadItem[] = [
  {
    id: '123456',
    name: 'Liam Carter',
    phone: '555-123-4567',
    email: 'liam.carter@gmail.com',
    station: 'Fire Station 12',
    status: 'Ongoing',
    leadType: 'Repair',
    technicianDetails: [{ name: 'John Doe', id: 'T001' }],
    department: 'Station 12',
    appointmentDate: '10 Nov 2025',
  },
  {
    id: '223456',
    name: 'Sophia Turner',
    phone: '555-222-4567',
    email: 'sophia.turner@gmail.com',
    station: 'Fire Station 15',
    status: 'Completed',
    leadType: 'Inspection',
    technicianDetails: [{ name: 'Alex Kim', id: 'T002' }],
    department: 'Station 15',
    appointmentDate: '09 Nov 2025',
  },
  {
    id: '323456',
    name: 'Ethan Blake',
    phone: '555-333-4567',
    email: 'ethan.blake@gmail.com',
    station: 'Fire Station 7',
    status: 'Rescheduled',
    leadType: 'Repair',
    technicianDetails: [{ name: 'Sarah Lee', id: 'T003' }],
    department: 'Station 7',
    appointmentDate: '15 Nov 2025',
  },
  {
    id: '423456',
    name: 'Emma Scott',
    phone: '555-444-4567',
    email: 'emma.scott@gmail.com',
    station: 'Fire Station 9',
    status: 'Scheduled',
    leadType: 'Inspection',
    technicianDetails: [{ name: 'Mike Ross', id: 'T004' }],
    department: 'Station 9',
    appointmentDate: '12 Nov 2025',
  },

  {
    id: '423456',
    name: 'Sophia Turner',
    phone: '555-444-4567',
    email: 'sophia.turner@gmail.com',
    station: 'Fire Station 10',
    status: 'Canceled',
    leadType: 'Inspection',
    technicianDetails: [{ name: 'Mike Ross', id: 'T005' }],
    department: 'Station 9',
    appointmentDate: '12 Nov 2025',
  },
    {
    id: '423457',
    name: 'Denvar Scott',
    phone: '555-444-4567',
    email: 'denvar.scott@gmail.com',
    station: 'Fire Station 11',
    status: 'Scheduled',
    leadType: 'Inspection',
    technicianDetails: [{ name: 'Mike Ross', id: 'T006' }],
    department: 'Station 9',
    appointmentDate: '12 Nov 2025',
  },
];



const LeadScreen = () => {
  const { colors } = useTheme();
  // State Hooks with explicit or inferred types
  const navigation = useNavigation<LeadDetailNavProp>();

  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | null>(null);
  const [orderTypeFilter, setOrderTypeFilter] = useState<LeadType | null>(null);
  const [statusMenuVisible, setStatusMenuVisible] = useState<boolean>(false);
  const [orientation, setOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>(
    Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT'
  );

  // Effect for handling orientation change
  useEffect(() => {
    const updateLayout = () => {
      const { width, height } = Dimensions.get('window');
      setOrientation(width > height ? 'LANDSCAPE' : 'PORTRAIT');
    };

    const subscription = Dimensions.addEventListener('change', updateLayout);
    // Cleanup function for the effect
    return () => subscription.remove();
  }, []);

  // Use memoization for column count
  const numColumns = useMemo(() => (orientation === 'LANDSCAPE' ? 3 : 2), [orientation]);

  // Typed filter logic
  const filtered: LeadItem[] = useMemo(() => {
    return leadsData.filter((lead) => {
      const matchSearch = lead.id.includes(search);
      const matchStatus = statusFilter ? lead.status === statusFilter : true;
      const matchType = orderTypeFilter ? lead.leadType === orderTypeFilter : true;
      return matchSearch && matchStatus && matchType;
    });
  }, [search, statusFilter, orderTypeFilter]);

  const clearFilters = useCallback(() => {
    setStatusFilter(null);
    setOrderTypeFilter(null);
  }, []);

  // Status Color Helper (Moved inside or defined outside with explicit types)
const getStatusColor = useCallback((status: LeadStatus): string => {
  switch (status) {
    case 'Ongoing': return '#FFC107';
    case 'Completed': return '#34A853';
    case 'Canceled': return '#EA4335';
    case 'Rescheduled': return '#1E88E5';
    case 'Scheduled': return '#FB8C00';
    default: return '#9E9E9E';
  }
}, []);





  // Typed Render Function for FlatList
  const renderLead = useCallback(({ item }: { item: LeadItem }) => (
    <>
        <TouchableOpacity
       activeOpacity={0.8}
       onPress={() => navigation.navigate('LeadDetail', { lead: item })} // ✅ navigate with full object
       style={[styles.card, styles.shadow,     {
      backgroundColor: colors.surface,   // theme-based background
      borderColor: colors.outline,       // subtle border
    },]}
     > 
    <Card >


      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
            Lead #{item.id}
          </Text>
          {/* Status Dot */}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: p(6) }}>
          <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
            {item.status}
          </Text>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          />
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems:"flex-end" }}>
          <View>
            <Text>{item.name}</Text>
            <Text>{item.phone} - {item.email}</Text>
            <Text>{item.station}</Text>            
          </View>
          <View>
                    {/* Order Type Pill */}
              <View
                style={[
                  styles.orderTypePill,
                  {
                    borderColor: colors.outline,
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <Icon
                  source={item.leadType === 'Repair' ? 'wrench' : 'magnify'}
                  color={colors.primary}
                  size={p(14)}
                />
                <Text style={{ marginLeft: p(4), color: colors.onSurface }}>
                  {item.leadType}
                </Text>
              </View>
          </View>


        </View>





      </Card.Content>
    </Card>
    </TouchableOpacity> 
    </>
  ), [colors, getStatusColor]); // Depend on colors and getStatusColor

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text
        variant="headlineMedium"
        style={[styles.header, { color: colors.primary }]}
      >
        Redline Gear
      </Text>

      {/* Search */}
      <TextInput
        mode="outlined"
        placeholder="Search by Lead ID"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
        left={<TextInput.Icon icon="magnify" />}
        activeOutlineColor={colors.primary}
      />

      {/* Filters */}
      <View style={styles.filterRow}>
        {/* Order Type Buttons */}
        <Button
          mode={orderTypeFilter === 'Repair' ? 'contained' : 'outlined'}
          onPress={() =>
            setOrderTypeFilter(orderTypeFilter === 'Repair' ? null : 'Repair')
          }
          style={styles.filterButton}
          labelStyle={styles.filterLabel}
          buttonColor={orderTypeFilter === 'Repair' ? colors.primary : colors.surface}
          textColor={orderTypeFilter === 'Repair' ? colors.onPrimary : colors.onSurface}
          rippleColor={colors.primaryContainer}
        >
          Repair
        </Button>

        <Button
          mode={orderTypeFilter === 'Inspection' ? 'contained' : 'outlined'}
          onPress={() =>
            setOrderTypeFilter(
              orderTypeFilter === 'Inspection' ? null : 'Inspection'
            )
          }
          style={styles.filterButton}
          labelStyle={styles.filterLabel}
          buttonColor={orderTypeFilter === 'Inspection' ? colors.primary : colors.surface}
          textColor={orderTypeFilter === 'Inspection' ? colors.onPrimary : colors.onSurface}
          rippleColor={colors.primaryContainer}
        >
          Inspection
        </Button>

        {/* Status Dropdown */}
        <Menu
          visible={statusMenuVisible}
          onDismiss={() => setStatusMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setStatusMenuVisible(true)}
              style={styles.filterButton}
              labelStyle={styles.filterLabel}
              textColor={statusFilter ? colors.primary : colors.onSurface}
              icon={statusFilter ? 'filter-check-outline' : 'filter-variant'}
            >
              {statusFilter || 'Status'}
            </Button>
          }
        >
        {[
            { status: 'Ongoing', icon: 'progress-clock' },
            { status: 'Completed', icon: 'check-circle' },
            { status: 'Canceled', icon: 'close-circle' },
            { status: 'Rescheduled', icon: 'calendar-refresh' },
            { status: 'Scheduled', icon: 'calendar-check' },
          ].map(({ status, icon }) => (
            <Menu.Item
              key={status}
              onPress={() => {
                setStatusFilter(status as LeadStatus);
                setStatusMenuVisible(false);
              }}
              title={status}
              leadingIcon={icon}
            />
          ))}
          <Divider />
          <Menu.Item
            onPress={() => {
              setStatusFilter(null);
              setStatusMenuVisible(false);
            }}
            title="Clear Status"
            leadingIcon="close"
          />
        </Menu>

        {/* <Button
          mode="text"
          onPress={clearFilters}
          textColor={colors.outline}
          style={styles.clearFilterButton}
          icon="filter-remove-outline"
        >
          Clear
        </Button> */}

        <View style={{ position: 'relative' }}>
          <Button
            mode="text"
            onPress={clearFilters}
            textColor={
              statusFilter || orderTypeFilter || search
                ? colors.primary
                : colors.outline
            }
            style={styles.clearFilterButton}
            icon="filter-remove-outline"
          >
            Clear
          </Button>

          {(statusFilter || orderTypeFilter || search) && (
            <Badge
              visible
              size={16}
              style={{
                position: 'absolute',
                top: -2,
                right: -6,
                backgroundColor: colors.error,
                color: colors.onError,
              }}
            >
              {[
                statusFilter ? 1 : 0,
                orderTypeFilter ? 1 : 0,
                search ? 1 : 0,
              ].reduce((a, b) => a + b, 0)}
            </Badge>
          )}
        </View>

      </View>

      {/* Grid of Leads */}
      <FlatList<LeadItem> // Explicitly typed FlatList
        key={numColumns.toString()}
        data={filtered}
        renderItem={renderLead}
        keyExtractor={(item) => item.id}
        numColumns={numColumns} // Responsive columns
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: p(10) },
  header: { textAlign: 'center', marginVertical: p(15), fontSize: 24 },
  search: { marginBottom: p(10), width: '40%' },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: p(10),
  },
  filterButton: {
    marginRight: p(8),
    borderRadius: p(16),
    borderWidth: 1,
    paddingHorizontal: p(4),
    marginVertical: p(4),
  },
  filterLabel: {
    fontSize: p(14),
  },
  clearFilterButton: {
    marginLeft: 'auto',
    marginVertical: p(4),
  },
  grid: {
    paddingBottom: p(100),
    paddingHorizontal: p(5),
    gap: p(10),
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  card: {
    flex: 1,
    margin: p(5),
    borderRadius: p(10),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: p(5),
  },
  statusDot: {
    width: p(8),
    height: p(8),
    borderRadius: 50,
  },
  orderTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: p(8),
    paddingHorizontal: p(8),
    paddingVertical: p(4),
    borderRadius: p(15),
    borderWidth: 1,
    alignSelf: 'flex-start',
  },


});

export default LeadScreen;