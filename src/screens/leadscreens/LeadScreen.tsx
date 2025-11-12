import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  useTheme,
  Menu,
  Divider,
  Icon,
  Badge,
  ActivityIndicator,
  DataTable
} from 'react-native-paper';

import LinearGradient from 'react-native-linear-gradient';

import BottomNavBar from '../../navigation/BottomNavBar';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLeadStore } from '../../store/leadStore';
import LeadCardSkeleton from '../skeleton/LeadSkeleton';
import useFormattedDate from '../../hooks/useFormattedDate';

interface Technician {
  id: string;
  name: string;
}

type LeadStatus = 'Ongoing' | 'Completed' | 'Canceled' | 'Rescheduled' | 'Scheduled';
type LeadType = 'Repair' | 'Inspection';

interface LeadItem {
  lead_id: string;
  name: string;
  phone: string;
  email: string;
  station: string;
  status: LeadStatus;
  leadType: LeadType;
  technicianDetails: Technician[];
  department: string;
  appointmentDate: string;
  scheduledDate: string;
}

// Placeholder for responsive utility
const p = (size: number): number => size; 

type LeadDetailNavProp = NativeStackNavigationProp<RootStackParamList, 'LeadDetail'>;

const LeadScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<LeadDetailNavProp>();
  
  // Zustand store
  const { leads, loading, error, pagination, fetchLeads } = useLeadStore();
  
  // State Hooks
  const [search, setSearch] = useState<string>('');
  const [orderTypeFilter, setOrderTypeFilter] = useState<LeadType | null>(null);
  const [statusMenuVisible, setStatusMenuVisible] = useState<boolean>(false);
  const [orientation, setOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>(
    Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT'
  );
  const [statusFilters, setStatusFilters] = useState<LeadStatus[]>([]);
  
  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState<number>(20);
  const numberOfItemsPerPageList = [10, 20, 30, 50];

  // Effect for handling orientation change
  useEffect(() => {
    const updateLayout = () => {
      const { width, height } = Dimensions.get('window');
      setOrientation(width > height ? 'LANDSCAPE' : 'PORTRAIT');
    };

    const subscription = Dimensions.addEventListener('change', updateLayout);
    return () => subscription.remove();
  }, []);

  // Fetch leads when filters or pagination change
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Build query parameters
        const params: any = {
          page,
          page_size: numberOfItemsPerPage
        };

        // Add type filter
        if (orderTypeFilter) {
          params.type = orderTypeFilter.toUpperCase();
        }

        // Add status filters
        if (statusFilters.length > 0) {
          params.status = statusFilters.join(',');
        }

        // Add search filter
        if (search) {
          params.search = search;
        }
        console.log("fetching reslults for", params)
        await fetchLeads(params);
      } catch (err) {
        console.error('Error fetching leads:', err);
      }
    };

    fetchData();
  }, [page, numberOfItemsPerPage, orderTypeFilter, statusFilters, search, fetchLeads]);

  // Show error alert if there's an error
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  // Use memoization for column count
  const numColumns = useMemo(() => (orientation === 'LANDSCAPE' ? 3 : 2), [orientation]);

  // Convert API leads to frontend format
  const filteredLeads = useMemo(() => {
    return leads.map((lead: any) => ({
      lead_id: lead.lead_id?.toString() || 'Unknown',
      name: lead.lead?.salePersonName || 'Unknown Customer',
      phone: '555-000-0000',
      email: 'customer@example.com',
      station: lead.firestation?.name || 'Unknown Station',
      status: lead.lead_status || 'Unknown',
      leadType: lead.type === 'REPAIR' ? 'Repair' : 'Inspection',
      technicianDetails: [],
      department: lead.firestation?.name || 'Unknown Department',
      phWater : 5,
      appointmentDate: useFormattedDate(lead.schedule_date)
    }));
  }, [leads]);

  const clearFilters = useCallback(() => {
    setStatusFilters([]);
    setOrderTypeFilter(null);
    setSearch('');
    setPage(1);
  }, []);

  // Status Color Helper
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
    const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };


  // Typed Render Function for FlatList
  const renderLead = useCallback(({ item }: { item: LeadItem }) => 
    
    
    (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.navigate('LeadDetail', { lead: item })}
      style={[styles.card, styles.shadow, { borderColor: colors.outline }]}
    > 
      <Card style={{backgroundColor: colors.surface}}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
              Job #{item.lead_id}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: p(6) }}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(item.status) },
                ]}
              />
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                {item.status}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems:"flex-end" }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Icon source="account" size={18} color="#555" />
                <Text style={{ marginLeft: 6 }}>{item.name}</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                <Icon source="phone" size={18} color="#555" />
                <Text style={{ marginLeft: 6 }}>{item.phone}</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                <Icon source="email-outline" size={18} color="#555"  />
                <Text style={{ marginLeft: 6 }}>{item.email}</Text>
              </View>
                              {/* { icon: 'calendar', label: 'Appointment Date', value: formatDate(lead.scheduledDate) }, */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                <Icon source="calendar" size={18} color="#555"  />
                <Text style={{ marginLeft: 6 }}>{item?.appointmentDate}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                <Icon source="clock" size={18} color="#555"  />
                <Text style={{ marginLeft: 6 }}>{"10:30 PM"}</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon source='office-building' size={18} color="#555" />
                <Text style={{ marginLeft: 6 }} ellipsizeMode="tail"> 
                  {item.station?.length > 28
                  ? item.station.slice(0, 28) + '...'
                  : item.station}
                </Text>
              </View>
            </View>
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems:"flex-end" }}>
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
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity> 
  ), [colors, getStatusColor, navigation]);

  // Pagination calculations
  const from = (page - 1) * numberOfItemsPerPage;
  const to = Math.min(page * numberOfItemsPerPage, pagination?.total || 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View>
        <Text
          variant="headlineMedium"
          style={[styles.header, { color: colors.primary }]}
        >
          Redline Gear
        </Text>

        {/* Search */}
        <TextInput
          mode="outlined"
          placeholder="Search by job id"
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
            onPress={() => {
              setOrderTypeFilter(orderTypeFilter === 'Repair' ? null : 'Repair');
              setPage(1);
            }}
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
            onPress={() => {
              setOrderTypeFilter(orderTypeFilter === 'Inspection' ? null : 'Inspection');
              setPage(1);
            }}
            style={styles.filterButton}
            labelStyle={styles.filterLabel}
            buttonColor={orderTypeFilter === 'Inspection' ? colors.primary : colors.surface}
            textColor={orderTypeFilter === 'Inspection' ? colors.onPrimary : colors.onSurface}
            rippleColor={colors.primaryContainer}
          >
            Inspection
          </Button>

          {/* Status Dropdown */}
          <View>
            <Menu
              visible={statusMenuVisible}
              onDismiss={() => setStatusMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setStatusMenuVisible(true)}
                  style={styles.filterButton}
                  labelStyle={styles.filterLabel}
                  textColor={statusFilters.length > 0 ? colors.primary : colors.onSurface}
                  icon={statusFilters.length > 0 ? 'filter-check-outline' : 'filter-variant'}
                >
                  {statusFilters.length > 0 ? `${statusFilters.length} Selected` : 'Status'}
                </Button>
              }
            >
              {[
                { status: 'Ongoing', icon: 'progress-clock' },
                { status: 'Completed', icon: 'check-circle' },
                { status: 'Canceled', icon: 'close-circle' },
                { status: 'Rescheduled', icon: 'calendar-refresh' },
                { status: 'Scheduled', icon: 'calendar-check' },
              ].map(({ status, icon }) => {
                const selected = statusFilters.includes(status as LeadStatus);
                return (
                  <Menu.Item
                    key={status}
                    onPress={() => {
                      setStatusFilters((prev) =>
                        selected ? prev.filter((s) => s !== status) : [...prev, status as LeadStatus]
                      );
                      setPage(1);
                    }}
                    title={status}
                    leadingIcon={icon}
                    trailingIcon={selected ? 'check' : undefined}
                  />
                );
              })}

              <Divider />
              <Menu.Item
                onPress={() => {
                  setStatusFilters([]);
                  setPage(1);
                }}
                title="Clear All"
                leadingIcon="close"
              />
            </Menu>
          </View>

          <View style={{ position: 'relative' }}>
            <Button
              mode="text"
              onPress={clearFilters}
              textColor={
                statusFilters.length > 0 || orderTypeFilter || search
                  ? colors.primary
                  : colors.outline
              }
              style={styles.clearFilterButton}
              icon="filter-remove-outline"
            >
              Clear
            </Button>
            {(statusFilters.length > 0 || orderTypeFilter || search) && (
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
                  statusFilters.length > 0 ? 1 : 0,
                  orderTypeFilter ? 1 : 0,
                  search ? 1 : 0,
                ].reduce((a, b) => a + b, 0)}
              </Badge>
            )}
          </View>
        </View>

        {/* Active Status Filters */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
          {statusFilters.map((status) => (
            <Button
              key={status}
              mode="outlined"
              icon="close"
              onPress={() => {
                setStatusFilters((prev) => prev.filter((s) => s !== status));
                setPage(1);
              }}
              style={{
                marginRight: 6,
                marginBottom: 6,
                borderColor: getStatusColor(status),
              }}
              textColor={getStatusColor(status)}
            >
              {status}
            </Button>
          ))}
        </View>

        {/* Loading State */}
        {loading || filteredLeads.length === 0 ? (
          <View >
            <LeadCardSkeleton />
          </View>
        ) : (
          <>
            {/* Grid of Leads */}
            <FlatList
              key={numColumns.toString()}
              // @ts-ignore
              data={filteredLeads}
              renderItem={renderLead}
              keyExtractor={(item) => item.lead_id}
              numColumns={numColumns}
              contentContainerStyle={styles.grid}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon source="inbox" size={64} color={colors.outline} />
                  <Text variant="titleMedium" style={{ marginTop: 16, color: colors.outline }}>
                    No leads found
                  </Text>
                  <Button 
                    mode="contained" 
                    // onPress={() => fetchLeads({ page: 1, page_size: numberOfItemsPerPage })}
                    style={{ marginTop: 16 }}
                  >
                    Refresh
                  </Button>
                </View>
              }
            />
          </>
        )}
      </View>
                  {/* Pagination */}
            {pagination && pagination.total > 0 && (
              <View style={[styles.paginationContainer, { backgroundColor: colors.surface, borderTopColor: colors.outline }]}>
                <DataTable.Pagination
                  page={page - 1} // DataTable.Pagination uses 0-based index
                  numberOfPages={Math.ceil((pagination.total || 0) / numberOfItemsPerPage)}
                  onPageChange={(newPage) => setPage(newPage + 1)} // Convert back to 1-based
                  label={`${from + 1}-${to} of ${pagination.total}`}
                  showFastPaginationControls
                  numberOfItemsPerPageList={numberOfItemsPerPageList}
                  numberOfItemsPerPage={numberOfItemsPerPage}
                  onItemsPerPageChange={setNumberOfItemsPerPage}
                  selectPageDropdownLabel={'Rows per page'}
                  theme={{
                    colors: {
                      primary: colors.primary,
                      onSurface: colors.onSurface,
                      surface: colors.surface,
                    },
                  }}
                />
              </View>
            )}
      
      <BottomNavBar />
    </SafeAreaView>
  );
};


            // selectPageDropdownLabel="Rows per page"
         
            // }}
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: p(10) },
  header: { textAlign: 'center', marginVertical: p(15), fontSize: 24 },
  search: { marginBottom: p(10), width: '100%' },
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
  paginationContainer: {
    // marginVertical: p(10),
    // backgroundColor: 'transparent',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        marginInline:'auto',
        marginBottom:p(65),
        backgroundColor: '#f5f5f5',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  skeleton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
});

export default LeadScreen;