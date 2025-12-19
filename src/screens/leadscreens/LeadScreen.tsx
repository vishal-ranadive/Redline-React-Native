// src/screens/leadscreens/LeadScreen.tsx
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions, Alert, ScrollView, Image } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  useTheme,
  Icon,
  IconButton,
  Badge,
  Modal,
  Portal,
  Checkbox,
  Divider,
} from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Store and custom hooks
import { useLeadStore } from '../../store/leadStore';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import LeadCardSkeleton from '../skeleton/LeadSkeleton';
// Helper function to format dates
const formatDate = (date?: string | Date | null, format: string = 'DD MMM YYYY', placeholder: string = 'Date not set'): string => {
  if (!date) return placeholder;
  const dayjs = require('dayjs');
  const parsed = dayjs(date);
  if (!parsed.isValid()) return placeholder;
  return parsed.format(format);
};

// Helper function to normalize lead type (handles case variations)
const normalizeLeadType = (type?: string): 'REPAIR' | 'INSPECTION' | null => {
  if (!type) return null;
  const normalized = type.toUpperCase().trim();
  if (normalized === 'REPAIR') return 'REPAIR';
  if (normalized === 'INSPECTION') return 'INSPECTION';
  return null;
};

// Helper function to get display text for lead type
const getLeadTypeDisplay = (type: string | undefined): 'Repair' | 'Inspection' | 'Unknown' => {
  const normalized = normalizeLeadType(type);
  if (normalized === 'REPAIR') return 'Repair';
  if (normalized === 'INSPECTION') return 'Inspection';
  return 'Unknown';
};

// Helper function to check if lead type matches filter (case insensitive)
const matchesLeadType = (leadType: string | undefined, filterType: 'Repair' | 'Inspection' | null): boolean => {
  if (!filterType) return true; // No filter applied
  const normalized = normalizeLeadType(leadType);
  return normalized === (filterType === 'Repair' ? 'REPAIR' : filterType === 'Inspection' ? 'INSPECTION' : null);
};
import Pagination from '../../components/common/Pagination';

// Status management
import {
  getAllStatusesGrouped,
  getStatusColor,
  formatStatus,
  type LeadStatus
} from '../../constants/leadStatuses';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import BottomNavBar from '../../navigation/BottomNavBar';
import { Avatar } from 'react-native-paper';

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
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  
  // State Hooks
  const [search, setSearch] = useState<string>(''); // Search query
  const [orderTypeFilter, setOrderTypeFilter] = useState<'Repair' | 'Inspection' | null>(null); // Type filter
  const [orientation, setOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>(
    Dimensions.get('window').width > Dimensions.get('window').height ? 'LANDSCAPE' : 'PORTRAIT'
  ); // Screen orientation
  const [screenWidth, setScreenWidth] = useState<number>(Dimensions.get('window').width); // Screen width for responsive design
  const [statusFilters, setStatusFilters] = useState<LeadStatus[]>([]); // Selected status filters
  const [statusModalVisible, setStatusModalVisible] = useState(false); // Modal visibility state
  const [dateFilter, setDateFilter] = useState<string>(''); // Date filter
  const [datePickerVisible, setDatePickerVisible] = useState(false); // Date picker modal visibility
  
  // Determine if device is mobile (typically < 600px width)
  const isMobile = screenWidth < 600;
  // Determine if device is mobile or tablet (typically < 1024px width) - for absolute button positioning
  const isMobileOrTablet = screenWidth < 1024;
  
  // Get screen height for modal sizing - reactive to dimension changes
  const modalHeight = useMemo(() => {
    const screenHeight = Dimensions.get('window').height;
    return screenHeight * 0.8; // 80% of screen height
  }, []); // No dependencies needed since Dimensions.get is called inside
  
  // Pagination state
  const [page, setPage] = useState<number>(1); // Current page
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState<number>(20); // Items per page
  const numberOfItemsPerPageList = [10, 20, 30, 50]; // Page size options
  
  // Ref to track initial mount and prevent double fetch
  const isInitialMount = useRef(true);

  const groupedStatusSections = useMemo(() => {
    const sections = getAllStatusesGrouped();
    if (!orderTypeFilter) return sections;

    const typeKey = orderTypeFilter === 'Repair' ? 'repair' : 'inspection';
    return sections.filter(
      (section) => section.type === 'common' || section.type === typeKey,
    );
  }, [orderTypeFilter]);

  /**
   * Toggle status selection in modal
   */
  const toggleStatusSelection = useCallback((status: LeadStatus) => {
    setStatusFilters((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  }, []);

  /**
   * Handle modal close and apply filters
   */
  const handleModalClose = useCallback(() => {
    setStatusModalVisible(false);
    setPage(1);
  }, []);

  /**
   * Render status item in modal
   */
  const renderModalStatusItem = useCallback(
    (statusItem: { status: LeadStatus; label: string; icon: string }) => {
      const isSelected = statusFilters.includes(statusItem.status);

      return (
        <TouchableOpacity
          key={statusItem.status}
          style={[
            styles.modalStatusItem,
            isSelected && { backgroundColor: colors.primaryContainer },
          ]}
          onPress={() => toggleStatusSelection(statusItem.status)}
          activeOpacity={0.7}
        >
          <Checkbox
            status={isSelected ? 'checked' : 'unchecked'}
            onPress={() => toggleStatusSelection(statusItem.status)}
            color={colors.primary}
          />
          {statusItem.icon && (
            <Icon
              source={statusItem.icon}
              size={22}
              color={isSelected ? colors.primary : colors.onSurfaceVariant}
            />
          )}
          <Text
            style={[
              styles.modalStatusItemLabel,
              {
                color: isSelected ? colors.primary : colors.onSurface,
                fontWeight: isSelected ? '600' : '400',
              },
            ]}
          >
            {statusItem.label}
          </Text>
        </TouchableOpacity>
      );
    },
    [statusFilters, colors, toggleStatusSelection],
  );

  // Effect for handling screen orientation and size changes
  useEffect(() => {
    const updateLayout = () => {
      const { width, height } = Dimensions.get('window');
      setOrientation(width > height ? 'LANDSCAPE' : 'PORTRAIT');
      setScreenWidth(width);
    };

    const subscription = Dimensions.addEventListener('change', updateLayout);
    return () => subscription.remove();
  }, []);

  /**
   * Fetch leads function - reusable for both useEffect and useFocusEffect
   */
  const fetchData = useCallback(async () => {
    try {
      // Build query parameters for API call
      const params: any = {
        page,
        page_size: numberOfItemsPerPage
      };

      // Add type filter if selected
      if (orderTypeFilter) {
        params.type = orderTypeFilter; // Send as title case: 'Repair' or 'Inspection'
      }

      // Add status filters if any selected
      if (statusFilters.length > 0) {
        params.lead_status = statusFilters.join(',');
      }

      // Add date filter if selected (COMMENTED FOR NOW - WILL FILTER ON FRONTEND)
      // if (dateFilter) {
      //   params.schedule_date = dateFilter;
      // }

      // Add search query if provided
      if (search) {
        params.search = search;
      }
      
      console.log("Fetching leads with params:", params);
      await fetchLeads(params);
    } catch (err) {
      console.error('Error fetching leads:', err);
    }
  }, [page, numberOfItemsPerPage, orderTypeFilter, statusFilters, search, fetchLeads]);

  /**
   * Fetch leads when filters or pagination change
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Refresh leads when screen comes into focus (e.g., when navigating back)
   * Skip on initial mount to avoid double fetch (useEffect handles initial load)
   */
  useFocusEffect(
    useCallback(() => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      console.log("LeadScreen focused - refreshing leads");
      fetchData();
    }, [fetchData])
  );

  // Show error alert if there's an error from the store
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  // Calculate number of columns - 1 for mobile, 2 for larger screens
  const numColumns = isMobile ? 1 : 2;

  // Calculate total active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    count += statusFilters.length; // Count of status filters
    if (orderTypeFilter) count += 1; // Order type filter
    if (search) count += 1; // Search filter
    if (dateFilter) count += 1; // Date filter
    return count;
  }, [statusFilters.length, orderTypeFilter, search, dateFilter]);

  /**
   * Convert API lead data to frontend format
   * Adds missing fields and formats data for display
   * Also filters by search term (lead ID) and date if provided
   */
  const filteredLeads = useMemo(() => {
    const mappedLeads = leads.map((lead: any) => ({
      lead_id: lead?.lead_id?.toString() || 'Unknown',
      name: lead?.lead?.salePersonName || 'Unknown Customer',
      // phone: '555-000-0000', // Placeholder - update with actual data if available
      // email: 'customer@example.com', // Placeholder - update with actual data if available
      station: lead?.firestation?.name || 'Unknown Station',
      address: lead?.firestation?.address || 'Unknown Address',
      status: lead?.lead_status || 'Unknown',
      leadType: normalizeLeadType(lead?.type), // Normalize to consistent uppercase
      technicianDetails: [],
      department: lead?.firestation?.name || 'Unknown Department',
      phWater: 5, // Placeholder - update with actual data if available
      appointmentDate: formatDate(lead?.schedule_date, 'DD MMM YYYY', 'No date'),
      schedule_date: lead?.schedule_date, // Keep raw date for filtering
      // Include the full lead object for navigation
      ...lead
    }));

    let filtered = mappedLeads;

    // Filter by search term if provided (search by lead ID)
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      filtered = filtered.filter((lead: any) => {
        // Check if search matches lead_id
        const leadId = lead.lead_id?.toString().toLowerCase() || '';
        return leadId.includes(searchTerm);
      });
    }

    // Filter by date if provided (FRONTEND FILTERING)
    if (dateFilter) {
      filtered = filtered.filter((lead: any) => {
        if (!lead.schedule_date) return false;
        // Compare dates (YYYY-MM-DD format)
        const leadDate = lead.schedule_date.split('T')[0]; // Get date part only
        return leadDate === dateFilter;
      });
    }

    return filtered;
  }, [leads, search, dateFilter]);

  /**
   * Clear all filters and reset to default state
   */
  const clearFilters = useCallback(() => {
    setStatusFilters([]);
    setOrderTypeFilter(null);
    setSearch('');
    setDateFilter('');
    setPage(1);
  }, []);


  /**
   * Format date for display
   */
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };


  /**
   * Render individual lead card
   */
  const renderLead = useCallback(({ item }: { item: any }) => {

    // printTable("renderLead-item", item)
    return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.navigate('LeadDetail', { lead: item })}
      style={[
        styles.card,
        // styles.shadow,
        { 
          borderColor: colors.outline,
          width: isMobile ? '100%' : '48%',
        }
      ]}
    > 
      <Card style={[styles.cardContainer, {backgroundColor: colors.surface}]}>
        <Card.Content style={styles.cardContentMobile }>
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
          <View style={isMobileOrTablet ? styles.leadDetailsMobile : { flexDirection: 'row', justifyContent: 'space-between', alignItems:"flex-end" }}>
            <View style={isMobileOrTablet ? { flex: 1, paddingBottom: p(10) } : undefined}>
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
                <Icon source="calendar" size={18} color={colors.onSurfaceVariant}  />
                <Text style={{ marginLeft: 6 }}>{item?.appointmentDate}</Text>
              </View>

              {/* Station/Department */}
              <View style={{ flexDirection: 'row', alignItems: 'center',marginBottom: 6, }}>
                <Icon source='office-building' size={18} color={colors.onSurfaceVariant} />
                <Text style={{ marginLeft: 6 }} ellipsizeMode="tail"> 
                  {item.station?.length > 28
                  ? item.station.slice(0, 28) + '...'
                  : item.station}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                <Icon source="map-marker" size={18} color={colors.onSurfaceVariant} />
                <Text style={{ marginLeft: 6 }}>
                  {item.address}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                <Icon source="truck" size={18} color={colors.onSurfaceVariant} />
                <Text style={{ marginLeft: 6 }}>
                  MEU : {item?.lead?.meu}
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
            
            {/* Lead Type Badge - Only for desktop (not mobile/tablet) */}
            {!isMobileOrTablet && (
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
                      {getLeadTypeDisplay(item.leadType)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </Card.Content>
        
        {/* Mobile/Tablet: Lead Type Badge - Absolute positioned at bottom right */}
        {isMobileOrTablet && (
          <View
            style={[
              styles.orderTypePillMobile,
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
              {getLeadTypeDisplay(item.leadType)}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity> 
  )}, [colors, navigation, isMobile, isMobileOrTablet]);


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* User Profile Button - Top Left */}


      <View style={[styles.contentWrapper, isMobile && styles.contentWrapperMobile]}>

      {user && (
        <TouchableOpacity
          style={[styles.userProfileButton, { backgroundColor: colors.primaryContainer }]}
          onPress={() => navigation.navigate('Profile' as any)}
          activeOpacity={0.7}
        >
          <Avatar.Text
            size={40}
            label={user.firstName?.[0]?.toUpperCase() || '?'}
            style={{ backgroundColor: colors.primary }}
            labelStyle={{ color: colors.onPrimary }}
          />
        </TouchableOpacity>
      )}
        {/* Header */}
        <View style={styles.headerContainer}>
          <Image
            source={{ 
              uri: theme === 'dark'
                ? 'https://res.cloudinary.com/dwwykeft2/image/upload/v1765531884/RedLine/gdfwbzg3ejynlcu3kqk3.png'
                : 'https://res.cloudinary.com/dwwykeft2/image/upload/v1765457898/RedLine/wqoaomsleu1egppnvjo6.png'
            }}
            style={styles.headerLogo}
            resizeMode="cover"
          />
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            mode="outlined"
            placeholder="Search by lead id"
            value={search}
            onChangeText={setSearch}
            style={styles.search}
            left={<TextInput.Icon icon="magnify" />}
            activeOutlineColor={colors.primary}
          />
          <View style={styles.filterButtonContainer}>
            <IconButton
              icon="filter-variant"
              iconColor={activeFilterCount > 0 ? colors.primary : colors.onSurface}
              size={24}
              onPress={clearFilters}
              style={styles.searchFilterButton}
            />
            {activeFilterCount > 0 && (
              <Badge
                visible
                size={18}
                style={[
                  styles.filterBadge,
                  {
                    backgroundColor: colors.error,
                    color: colors.onError,
                  },
                ]}
              >
                {activeFilterCount}
              </Badge>
            )}
          </View>
        </View>

        {/* Filter Rows - Responsive Layout */}
        <View style={[styles.filterRow, isMobileOrTablet && styles.filterRowMobile]}>
          {isMobileOrTablet ? (
            // Mobile/Tablet: All buttons in single row with wrapping
            <>
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
                icon="wrench"
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
                icon="magnify"
              >
                Inspection
              </Button>

              <Button
                mode="outlined"
                onPress={() => setStatusModalVisible(true)}
                style={styles.filterButton}
                labelStyle={styles.filterLabel}
                buttonColor={colors.surface}
                textColor={statusFilters.length > 0 ? colors.primary : colors.onSurface}
                icon="filter-variant"
              >
                Status
              </Button>

              <Button
                mode="outlined"
                onPress={() => setDatePickerVisible(true)}
                style={styles.filterButton}
                labelStyle={styles.filterLabel}
                buttonColor={colors.surface}
                textColor={dateFilter ? colors.primary : colors.onSurface}
                icon="calendar"
              >
                Date
              </Button>

              <Button
                mode="contained"
                onPress={() => navigation.navigate('CreateJob')}
                style={styles.createJobButtonMobile}
                labelStyle={styles.filterLabel}
                buttonColor={colors.primary}
                textColor={colors.onPrimary}
                rippleColor={colors.primaryContainer}
                icon="plus"
              >
                Create Job
              </Button>
            </>
          ) : (
            // Desktop: Filters on left, Create Job on right
            <>
              {/* Left side - Filter options */}
              <View style={styles.filterLeftGroup}>
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
                  icon="wrench"
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
                  icon="magnify"
                >
                  Inspection
                </Button>

                <Button
                  mode="outlined"
                  onPress={() => setStatusModalVisible(true)}
                  style={styles.filterButton}
                  labelStyle={styles.filterLabel}
                  buttonColor={colors.surface}
                  textColor={statusFilters.length > 0 ? colors.primary : colors.onSurface}
                  icon="filter-variant"
                >
                  Status
                </Button>

                <Button
                  mode="outlined"
                  onPress={() => setDatePickerVisible(true)}
                  style={styles.filterButton}
                  labelStyle={styles.filterLabel}
                  buttonColor={colors.surface}
                  textColor={dateFilter ? colors.primary : colors.onSurface}
                  icon="calendar"
                >
                  Date
                </Button>
              </View>

              {/* Right side - Create Job button */}
              <Button
                mode="contained"
                onPress={() => navigation.navigate('CreateJob')}
                style={styles.createJobButton}
                labelStyle={styles.filterLabel}
                buttonColor={colors.primary}
                textColor={colors.onPrimary}
                rippleColor={colors.primaryContainer}
                icon="plus"
              >
                Create Job
              </Button>
            </>
          )}
        </View>

        {/* Active Status & Date Filter Chips */}
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
          {dateFilter && (
            <Button
              mode="outlined"
              icon="close"
              onPress={() => {
                setDateFilter('');
                setPage(1);
              }}
              style={{
                marginRight: 6,
                marginBottom: 6,
                borderColor: colors.primary,
              }}
              textColor={colors.primary}
              labelStyle={{ fontSize: 12 }}
            >
              {formatDateForDisplay(dateFilter)}
            </Button>
          )}
        </View>

        {/* Loading State or Lead Grid */}
        {loading ? (
          <View >
            <LeadCardSkeleton isMobile={isMobile} numColumns={numColumns} count={6} />
          </View>
        ) : (
          <View style={[styles.leadsContainer, isMobile && styles.leadsContainerMobile]}>
            {/* Grid of Leads */}
            <FlatList
              key={numColumns.toString()}
              data={filteredLeads}
              renderItem={renderLead}
              keyExtractor={(item) => item.lead_id}
              numColumns={numColumns}
              contentContainerStyle={[styles.grid, isMobile && styles.gridMobile]}
              columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
              showsVerticalScrollIndicator={true}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              style={isMobile ? styles.flatListMobile : undefined}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon source="inbox" size={64} color={colors.outline} />
                  <Text variant="titleMedium" style={{ marginTop: 16, color: colors.outline }}>
                    No leads found
                  </Text>
                  <Button 
                    mode="contained" 
                    style={{ marginTop: 16 }}
                    onPress={() => fetchData()}
                  >
                    Refresh
                  </Button>
                </View>
              }
            />
          </View>
        )}
      </View>

      {/* Pagination Controls */}
      {pagination && pagination.total > 0 && (
        <Pagination
          page={page}
          total={pagination.total}
          itemsPerPage={numberOfItemsPerPage}
          itemsPerPageList={numberOfItemsPerPageList}
          onPageChange={setPage}
          onItemsPerPageChange={setNumberOfItemsPerPage}
          containerStyle={[
            styles.paginationContainer,
            isMobile && styles.paginationContainerMobile,
          ]}
        />
      )}
      
      {/* Bottom Navigation */}
      <BottomNavBar />

      {/* Status Selection Modal */}
      <Portal>
        <Modal
          visible={statusModalVisible}
          onDismiss={handleModalClose}
          contentContainerStyle={[
            styles.modalContainer,
            isMobile && styles.modalContainerMobile,
            { 
              backgroundColor: colors.surface,
              height: modalHeight,
            },
          ]}
        >
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.outline }]}>
            <Text variant="titleLarge" style={{ fontWeight: 'bold', color: colors.onSurface }}>
              Select Status
            </Text>
            <Button
              mode="text"
              onPress={handleModalClose}
              icon="close"
              textColor={colors.onSurface}
              style={styles.modalCloseButton}
            >
              Close
            </Button>
          </View>

          {/* Selected Status Summary */}
          {statusFilters.length > 0 && (
            <View style={[styles.selectedStatusSummary, { backgroundColor: colors.primaryContainer }]}>
              <Text variant="bodyMedium" style={{ color: colors.onPrimaryContainer, fontWeight: '600' }}>
                {statusFilters.length} status{statusFilters.length > 1 ? 'es' : ''} selected
              </Text>
            </View>
          )}

          {/* Status Options */}
          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {groupedStatusSections.map((section, sectionIndex) => (
              <View key={section.type} style={styles.modalSection}>
                {/* Section Header */}
                <View style={[styles.modalSectionHeader, { backgroundColor: colors.surfaceVariant }]}>
                  <Text
                    variant="titleMedium"
                    style={[
                      styles.modalSectionHeaderText,
                      { color: colors.onSurfaceVariant },
                    ]}
                  >
                    {section.title}
                  </Text>
                </View>

                {/* Section Items */}
                {section.data.map((statusItem) => renderModalStatusItem(statusItem))}

                {/* Divider between sections (except last) */}
                {sectionIndex < groupedStatusSections.length - 1 && (
                  <Divider style={{ marginVertical: p(8) }} />
                )}
              </View>
            ))}
          </ScrollView>

          {/* Modal Footer */}
          <View style={[styles.modalFooter, { borderTopColor: colors.outline }]}>
            <Button
              mode="text"
              onPress={() => {
                setStatusFilters([]);
              }}
              textColor={colors.error}
              disabled={statusFilters.length === 0}
            >
              Clear All
            </Button>
            <Button
              mode="contained"
              onPress={handleModalClose}
              buttonColor={colors.primary}
              textColor={colors.onPrimary}
            >
              Apply ({statusFilters.length})
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Calendar Date Picker Modal */}
      <Portal>
        <Modal
          visible={datePickerVisible}
          onDismiss={() => setDatePickerVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            isMobile && styles.modalContainerMobile,
            {
              backgroundColor: colors.surface,
              height: modalHeight,
            },
          ]}
        >
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.outline }]}>
            <Text variant="titleLarge" style={{ fontWeight: 'bold', color: colors.onSurface }}>
              Select Date
            </Text>
            <Button
              mode="text"
              onPress={() => setDatePickerVisible(false)}
              icon="close"
              textColor={colors.onSurface}
              style={styles.modalCloseButton}
            >
              Close
            </Button>
          </View>

          {/* Calendar */}
          <View style={styles.calendarContainer}>
            <Calendar
              current={dateFilter || new Date().toISOString().split('T')[0]}
              markedDates={dateFilter ? {
                [dateFilter]: {
                  selected: true,
                  selectedColor: colors.primary,
                  selectedTextColor: colors.onPrimary,
                }
              } : {}}
              onDayPress={(day) => {
                const selectedDate = day.dateString;
                setDateFilter(selectedDate);
                setDatePickerVisible(false);
                setPage(1);
              }}
              theme={{
                backgroundColor: colors.surface,
                calendarBackground: colors.surface,
                textSectionTitleColor: colors.onSurface,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: colors.onPrimary,
                todayTextColor: colors.primary,
                dayTextColor: colors.onSurface,
                textDisabledColor: colors.outline,
                dotColor: colors.primary,
                selectedDotColor: colors.onPrimary,
                arrowColor: colors.primary,
                monthTextColor: colors.onSurface,
                indicatorColor: colors.primary,
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
              style={styles.calendar}
            />
          </View>

          {/* Modal Footer */}
          <View style={[styles.modalFooter, { borderTopColor: colors.outline }]}>
            <Button
              mode="text"
              onPress={() => {
                setDateFilter('');
                setDatePickerVisible(false);
                setPage(1);
              }}
              textColor={colors.error}
              disabled={!dateFilter}
            >
              Clear
            </Button>
            <Button
              mode="contained"
              onPress={() => setDatePickerVisible(false)}
              buttonColor={colors.primary}
              textColor={colors.onPrimary}
            >
              Done
            </Button>
          </View>
        </Modal>
      </Portal>


    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: p(10),  },
  userProfileButton: {
    position: 'absolute',
    top: p(10),
    left: p(10),
    zIndex: 1000,
    borderRadius: 50,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  contentWrapper: {
    flex: 1,
  },
  contentWrapperMobile: {
    flex: 1,
  },
  headerContainer: { 
    alignItems: 'center', 
    justifyContent: 'center',
    // marginVertical: p(15),
  },
  headerLogo: {
    width: p(200),
    height: p(60),
  },
  searchContainer: {
    position: 'relative',
    marginBottom: p(10),
    flexDirection: 'row',
    alignItems: 'center',
  },
  search: { 
    flex: 1,
    paddingRight: p(50), // Add padding to prevent text overlap with filter button
  },
  filterButtonContainer: {
    position: 'absolute',
    right: p(4),
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  searchFilterButton: {
    margin: 0,
  },
  filterBadge: {
    position: 'absolute',
    top: p(8),
    right: p(8),
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: p(10),
  },
  filterRowMobile: {
    flexWrap: 'wrap',
    gap: p(4),
  },
  filterLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: p(4),
  },
  filterButton: {
    marginRight: 0,
    borderRadius: p(16),
    borderWidth: 1,
    paddingHorizontal: p(0),
    marginVertical: p(4),
  },
  createJobButton: {
    borderRadius: p(16),
    borderWidth: 1,
    paddingHorizontal: p(0),
    marginVertical: p(4),
  },
  createJobButtonMobile: {
    borderRadius: p(16),
    borderWidth: 1,
    paddingHorizontal: p(0),
    marginVertical: p(4),
    flex: 1,
    minWidth: p(120),
  },
  modalContainer: {
    margin: p(20),
    borderRadius: p(16),
    width: p(600),
    alignSelf: 'center',
    display: 'flex',
    flexDirection: 'column',
  },
  modalContainerMobile: {
    margin: p(10),
    width: '95%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: p(16),
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    marginLeft: 'auto',
  },
  selectedStatusSummary: {
    padding: p(12),
    marginHorizontal: p(16),
    marginTop: p(8),
    borderRadius: p(8),
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: p(16),
    paddingVertical: p(8),
  },
  modalSection: {
    marginBottom: p(16),
  },
  modalSectionHeader: {
    padding: p(12),
    borderRadius: p(8),
    marginBottom: p(8),
  },
  modalSectionHeaderText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: p(12),
    paddingHorizontal: p(8),
    borderRadius: p(8),
    marginBottom: p(4),
  },
  modalStatusItemLabel: {
    fontSize: p(16),
    marginLeft: p(12),
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: p(16),
    borderTopWidth: 1,
  },
  filterLabel: {
    fontSize: p(14),
  },
  clearFilterButton: {
    marginLeft: 'auto',
    marginVertical: p(4),
  },
  clearFilterButtonMobile: {
    marginLeft: 0,
    marginVertical: 0,
  },
  grid: {
    paddingBottom: p(200), // Extra padding to prevent cards from rendering behind pagination and bottom bar
    paddingHorizontal: p(5),
    gap: p(6),
  },
  gridMobile: {
    paddingBottom: p(180), // Extra padding for mobile: pagination (~60px) + bottom bar (~70px) + spacing (10px) + buffer (~40px)
    paddingHorizontal: 0,
    paddingTop: p(5),
    gap: p(10),
  },
  leadsContainer: {
    paddingRight: p(10),
    paddingBottom: p(300),
  },
  leadsContainerMobile: {
    paddingRight: 0,
    paddingBottom: p(340), // Match gridMobile padding
    flex: 1,
  },
  flatListMobile: {
    flex: 1,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    gap: p(6),
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  card: {
    margin: 0,
    marginInline: p(1),
    borderRadius: p(10),
  },
  cardContainer: {
    position: 'relative',
  },
  cardContentMobile: {
    paddingBottom: p(10), // Increased padding to accommodate absolute positioned button in both portrait and landscape
  },
  leadDetailsMobile: {
    flexDirection: 'column',
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
  orderTypePillMobile: {
    position: 'absolute',
    bottom: p(12),
    right: p(12),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: p(8),
    paddingVertical: p(4),
    borderRadius: p(15),
    borderWidth: 1,
    zIndex: 1,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    marginInline:'auto',
    marginBottom:p(65), // Space for bottom bar on desktop
    zIndex: 10,
  },
  paginationContainerMobile: {
    marginBottom: p(55), // 65px (bottom bar) + 10px (spacing between pagination and bottom bar)
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    minHeight: 400,
    paddingBottom: p(200),
  },
  calendarContainer: {
    flex: 1,
    padding: p(16),
    justifyContent: 'center',
  },
  calendar: {
    borderRadius: p(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
});

export default LeadScreen;