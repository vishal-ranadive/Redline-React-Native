// src/screens/leadscreens/LeadScreen.tsx
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Store and custom hooks
import { useLeadStore } from '../../store/leadStore';
import LeadCardSkeleton from '../skeleton/LeadSkeleton';
import useFormattedDate from '../../hooks/useFormattedDate';

// Status management
import { 
  getStatusesByType, 
  getAllStatusesGrouped,
  getStatusColor,
  formatStatus,
  type LeadStatus
} from '../../constants/leadStatuses';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import BottomNavBar from '../../navigation/BottomNavBar';
import { printTable } from '../../utils/printTable';

// Responsive utility placeholder
const p = (size: number): number => size;

type LeadDetailNavProp = NativeStackNavigationProp<RootStackParamList, 'LeadDetail'>;

/**
 * LeadScreen - Main screen for displaying and filtering leads
 * Features dynamic status handling for Repair and Inspection leads
 */
const LeadScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<LeadDetailNavProp>();
  
  // Zustand store for lead management
  const { leads, loading, error, pagination, fetchLeads } = useLeadStore();
  
  // State Hooks
  const [search, setSearch] = useState<string>(''); // Search query
  const [orderTypeFilter, setOrderTypeFilter] = useState<'REPAIR' | 'INSPECTION' | null>(null); // Type filter
  const [statusMenuVisible, setStatusMenuVisible] = useState<boolean>(false); // Status dropdown visibility
  const [orientation, setOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>(
    Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT'
  ); // Screen orientation
  const [statusFilters, setStatusFilters] = useState<LeadStatus[]>([]); // Selected status filters
  
  // Pagination state
  const [page, setPage] = useState<number>(1); // Current page
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState<number>(20); // Items per page
  const numberOfItemsPerPageList = [10, 20, 30, 50]; // Page size options

  /**
   * Get available statuses based on current type filter
   * If no filter is set, shows all statuses grouped by type
   */
  const availableStatuses = useMemo(() => {
    if (orderTypeFilter) {
      return getStatusesByType(orderTypeFilter);
    }
    // If no type filter, return grouped statuses for the dropdown
    return getAllStatusesGrouped();
  }, [orderTypeFilter]);

  /**
   * Check if a status is available for selection based on current filters
   */
  const isStatusAvailable = useCallback((status: LeadStatus) => {
    if (!orderTypeFilter) return true; // All statuses available when no type filter
    
    const statuses = getStatusesByType(orderTypeFilter);
    return statuses.some(s => s.status === status);
  }, [orderTypeFilter]);

  // Effect for handling screen orientation changes
  useEffect(() => {
    const updateLayout = () => {
      const { width, height } = Dimensions.get('window');
      setOrientation(width > height ? 'LANDSCAPE' : 'PORTRAIT');
    };

    const subscription = Dimensions.addEventListener('change', updateLayout);
    return () => subscription.remove();
  }, []);

  /**
   * Fetch leads when filters or pagination change
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Build query parameters for API call
        const params: any = {
          page,
          page_size: numberOfItemsPerPage
        };

        // Add type filter if selected
        if (orderTypeFilter) {
          params.type = orderTypeFilter;
        }

        // Add status filters if any selected
        if (statusFilters.length > 0) {
          params.lead_status = statusFilters.join(',');
        }

        // Add search query if provided
        if (search) {
          params.search = search;
        }
        
        console.log("Fetching leads with params:", params);
        await fetchLeads(params);
      } catch (err) {
        console.error('Error fetching leads:', err);
      }
    };

    fetchData();
  }, [page, numberOfItemsPerPage, orderTypeFilter, statusFilters, search, fetchLeads]);

  // Show error alert if there's an error from the store
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  // Calculate number of columns based on screen orientation
  const numColumns = useMemo(() => (orientation === 'LANDSCAPE' ? 3 : 2), [orientation]);

  /**
   * Convert API lead data to frontend format
   * Adds missing fields and formats data for display
   */
  const filteredLeads = useMemo(() => {
    return leads.map((lead: any) => ({
      lead_id: lead?.lead_id?.toString() || 'Unknown',
      name: lead?.lead?.salePersonName || 'Unknown Customer',
      // phone: '555-000-0000', // Placeholder - update with actual data if available
      // email: 'customer@example.com', // Placeholder - update with actual data if available
      station: lead?.firestation?.name || 'Unknown Station',
      address: lead?.firestation?.address || 'Unknown Address',
      status: lead?.lead_status || 'Unknown',
      leadType: lead?.type, // Keep as 'REPAIR' or 'INSPECTION'
      technicianDetails: [],
      department: lead?.firestation?.name || 'Unknown Department',
      phWater: 5, // Placeholder - update with actual data if available
      appointmentDate: useFormattedDate(lead?.schedule_date),
      // Include the full lead object for navigation
      ...lead
    }));
  }, [leads]);

  /**
   * Clear all filters and reset to default state
   */
  const clearFilters = useCallback(() => {
    setStatusFilters([]);
    setOrderTypeFilter(null);
    setSearch('');
    setPage(1);
  }, []);

  /**
   * Render individual lead card
   */
  const renderLead = useCallback(({ item }: { item: any }) => {

    printTable("renderLead-item", item)
    return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.navigate('LeadDetail', { lead: item })}
      style={[styles.card, styles.shadow, { borderColor: colors.outline }]}
    > 
      <Card style={{backgroundColor: colors.surface}}>
        <Card.Content>
          {/* Card Header with Job ID and Status */}
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
              Job #{item.lead_id}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: p(6) }}>
              {/* Status indicator dot */}
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(item.status) },
                ]}
              />
              <Text variant="titleMedium" style={{ fontWeight: 'bold', fontSize: 12 }}>
                {formatStatus(item.status)}
              </Text>
            </View>
          </View>

          {/* Lead Details */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems:"flex-end" }}>
            <View>
              {/* Customer Name */}
              {/* <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Icon source="account" size={18} color="#555" />
                <Text style={{ marginLeft: 6 }}>{item.name}</Text>
              </View> */}

              {/* Phone Number */}
              {/* <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                <Icon source="phone" size={18} color="#555" />
                <Text style={{ marginLeft: 6 }}>{item.phone}</Text>
              </View> */}

              {/* Email */}
              {/* <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                <Icon source="email-outline" size={18} color="#555"  />
                <Text style={{ marginLeft: 6 }}>{item.email}</Text>
              </View> */}

              {/* Appointment Date */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                <Icon source="calendar" size={18} color="#555"  />
                <Text style={{ marginLeft: 6 }}>{item?.appointmentDate}</Text>
              </View>

              {/* Station/Department */}
              <View style={{ flexDirection: 'row', alignItems: 'center',marginBottom: 6, }}>
                <Icon source='office-building' size={18} color="#555" />
                <Text style={{ marginLeft: 6 }} ellipsizeMode="tail"> 
                  {item.station?.length > 28
                  ? item.station.slice(0, 28) + '...'
                  : item.station}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                <Icon source="map-marker" size={18} color="#555" />
                <Text style={{ marginLeft: 6 }}>
                  {item.address}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                <Icon source="truck" size={18} color="#555" />
                <Text style={{ marginLeft: 6 }}>
                  MEU : {item.lead.meu}
                </Text>
              </View>

              {/* Assigned Technician */}
              {/* {item.assigned_technicians?.length > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Icon source="account-wrench" size={18} color="#555" />
                  <Text style={{ marginLeft: 6 }}>
                    {item.assigned_technicians.map((t:any) => t.name).join(', ')}
                  </Text>
                </View>
              )} */}
            </View>
            
            {/* Lead Type Badge */}
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
                    source={item.leadType === 'REPAIR' ? 'wrench' : 'magnify'}
                    color={colors.primary}
                    size={p(14)}
                  />
                  <Text style={{ marginLeft: p(4), color: colors.onSurface, fontSize: 12 }}>
                    {item.leadType === 'REPAIR' ? 'Repair' : 'Inspection'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity> 
  )}, [colors, navigation]);

  /**
   * Render status dropdown with grouped sections
   */
  const renderStatusMenu = () => {
    // If type filter is applied, show simple list
    if (orderTypeFilter) {
      const statuses = getStatusesByType(orderTypeFilter);
      return (
        <>
          {statuses.map(({ status, icon, label }) => {
            const selected = statusFilters.includes(status);
            return (
              <Menu.Item
                key={status}
                onPress={() => {
                  setStatusFilters((prev) =>
                    selected ? prev.filter((s) => s !== status) : [...prev, status]
                  );
                  setPage(1);
                }}
                title={label}
                leadingIcon={icon}
                trailingIcon={selected ? 'check' : undefined}
              />
            );
          })}
        </>
      );
    }

    // If no type filter, show grouped statuses
    return (
      <>
        {getAllStatusesGrouped().map((group, index) => (
          <View key={group.title}>
            {/* Section Header */}
            <View style={[styles.menuSectionHeader, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.menuSectionTitle, { color: colors.onSurfaceVariant }]}>
                {group.title}
              </Text>
            </View>
            
            {/* Section Items */}
            {group.data.map(({ status, icon, label }) => {
              const selected = statusFilters.includes(status);
              const available = isStatusAvailable(status);
              
              return (
                <Menu.Item
                  key={status}
                  onPress={() => {
                    if (!available) return;
                    setStatusFilters((prev) =>
                      selected ? prev.filter((s) => s !== status) : [...prev, status]
                    );
                    setPage(1);
                  }}
                  title={label}
                  leadingIcon={icon}
                  trailingIcon={selected ? 'check' : undefined}
                  style={!available ? { opacity: 0.5 } : {}}
                  disabled={!available}
                />
              );
            })}
            
            {/* Divider between sections (except last) */}
            {index < getAllStatusesGrouped().length - 1 && <Divider />}
          </View>
        ))}
      </>
    );
  };

  // Pagination calculations
  const from = (page - 1) * numberOfItemsPerPage;
  const to = Math.min(page * numberOfItemsPerPage, pagination?.total || 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View>
        {/* Header */}
        <Text
          variant="headlineMedium"
          style={[styles.header, { color: colors.primary }]}
        >
          Redline Gear
        </Text>

        {/* Search Input */}
        <TextInput
          mode="outlined"
          placeholder="Search by job id"
          value={search}
          onChangeText={setSearch}
          style={styles.search}
          left={<TextInput.Icon icon="magnify" />}
          activeOutlineColor={colors.primary}
        />

        {/* Filter Row */}
        <View style={styles.filterRow}>
          {/* Repair Type Filter Button */}
          <Button
            mode={orderTypeFilter === 'REPAIR' ? 'contained' : 'outlined'}
            onPress={() => {
              setOrderTypeFilter(orderTypeFilter === 'REPAIR' ? null : 'REPAIR');
              setPage(1);
            }}
            style={styles.filterButton}
            labelStyle={styles.filterLabel}
            buttonColor={orderTypeFilter === 'REPAIR' ? colors.primary : colors.surface}
            textColor={orderTypeFilter === 'REPAIR' ? colors.onPrimary : colors.onSurface}
            rippleColor={colors.primaryContainer}
          >
            Repair
          </Button>

          {/* Inspection Type Filter Button */}
          <Button
            mode={orderTypeFilter === 'INSPECTION' ? 'contained' : 'outlined'}
            onPress={() => {
              setOrderTypeFilter(orderTypeFilter === 'INSPECTION' ? null : 'INSPECTION');
              setPage(1);
            }}
            style={styles.filterButton}
            labelStyle={styles.filterLabel}
            buttonColor={orderTypeFilter === 'INSPECTION' ? colors.primary : colors.surface}
            textColor={orderTypeFilter === 'INSPECTION' ? colors.onPrimary : colors.onSurface}
            rippleColor={colors.primaryContainer}
          >
            Inspection
          </Button>

          {/* Status Filter Dropdown */}
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
              {renderStatusMenu()}

              <Divider />
              {/* Clear all status filters */}
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

          {/* Clear Filters Button with Badge */}
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
            {/* Show badge when filters are active */}
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

        {/* Active Status Filter Chips */}
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
              labelStyle={{ fontSize: 12 }}
            >
              {formatStatus(status)}
            </Button>
          ))}
        </View>

        {/* Loading State or Lead Grid */}
        {loading || filteredLeads.length === 0 ? (
          <View >
            <LeadCardSkeleton />
          </View>
        ) : (
          <>
            {/* Grid of Leads */}
            <FlatList
              key={numColumns.toString()}
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

      {/* Pagination Controls */}
      {pagination && pagination.total > 0 && (
        <View style={[styles.paginationContainer, { backgroundColor: colors.surface, borderTopColor: colors.outline }]}>
          <DataTable.Pagination
            page={page - 1}
            numberOfPages={Math.ceil((pagination.total || 0) / numberOfItemsPerPage)}
            onPageChange={(newPage) => setPage(newPage + 1)}
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
      
      {/* Bottom Navigation */}
      <BottomNavBar />
    </SafeAreaView>
  );
};

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
  menuSectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default LeadScreen;