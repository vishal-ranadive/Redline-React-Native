import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Card, Button, Icon, useTheme, Chip, TextInput } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../../components/common/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { inspectionApi } from '../../services/inspectionApi';
import { useLeadStore } from '../../store/leadStore';

type GearStatus = 'Pass' | 'Expired' | 'Recommended OOS' | 'Corrective Action Required';

type GearInspection = {
  gear: {
    gear_id: number;
    gear_name: string;
    manufacturer: {
      manufacturer_id: number;
      manufacturer_name: string;
    };
    gear_type: {
      gear_type_id: number;
      gear_type: string;
    };
    manufacturing_date: string;
    gear_size: string;
    serial_number: string;
  };
  roster: {
    name: string; // firstName + MiddleName + LastName
    color_tag: string;
  };
  inspection_id: number;
  inspection_date: string;
  hydro_test_result: 'PASS' | 'FAIL';
  hydro_test_performed: 'YES' | 'NO';
  gear_findings: string;
  inspection_cost: number;
  remarks: string;
  gear_status: {
    id: number;
    status: GearStatus;
  };
  service_type: {
    id: number;
    status: 'cleaned and inspected' | 'cleaned only' | 'inspected only' | 'specialized cleaning' | 'other';
  };
};

type Load = {
  id: string;
  name: string;
  loadNumber: number;
};

type RouteProps = {
  load: Load;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'UpadateInspection'>;

// Mock data matching new API structure
const MOCK_GEAR_INSPECTIONS: GearInspection[] = [
  {
    gear: {
      gear_id: 14,
      gear_name: "Fire Helmet Pro",
      manufacturer: { manufacturer_id: 12, manufacturer_name: "Fire Safety Equipment Inc." },
      gear_type: { gear_type_id: 1, gear_type: "Helmet" },
      manufacturing_date: "2022-10-15",
      gear_size: "small",
      serial_number: "SN-001-2024"
    },
    roster: {
      name: "Jane M Doe",
      color_tag: "red"
    },
    inspection_id: 1,
    inspection_date: "2025-11-08",
    hydro_test_result: "PASS",
    hydro_test_performed: "YES",
    gear_findings: "Gear is in good condition with minor wear",
    inspection_cost: 250.75,
    remarks: "Inspection scheduled for tomorrow morning.",
    gear_status: {
      id: 1,
      status: "Pass"
    },
    service_type: {
      id: 1,
      status: "cleaned and inspected"
    }
  },
  {
    gear: {
      gear_id: 15,
      gear_name: "Fire Helmet Pro",
      manufacturer: { manufacturer_id: 12, manufacturer_name: "Fire Safety Equipment Inc." },
      gear_type: { gear_type_id: 1, gear_type: "Helmet" },
      manufacturing_date: "2022-10-15",
      gear_size: "medium",
      serial_number: "SN-002-2024"
    },
    roster: {
      name: "John A Smith",
      color_tag: "blue"
    },
    inspection_id: 2,
    inspection_date: "2025-11-08",
    hydro_test_result: "FAIL",
    hydro_test_performed: "YES",
    gear_findings: "Cracked visor needs replacement",
    inspection_cost: 300.50,
    remarks: "Requires immediate attention.",
    gear_status: {
      id: 2,
      status: "Expired"
    },
    service_type: {
      id: 2,
      status: "inspected only"
    }
  }
];

export default function GearsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { load } = route.params as RouteProps;
  const { currentLead } = useLeadStore();
  
  const [gearInspections, setGearInspections] = useState<GearInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<GearStatus | 'All'>('All');

  // Fetch gear inspections on mount
  useEffect(() => {
    fetchGearInspections();
  }, [load, currentLead]);

  const fetchGearInspections = async () => {
    if (!load?.loadNumber || !currentLead?.lead_id) {
      console.log('Missing loadId or leadId');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await inspectionApi.getGearInspections(load.loadNumber, currentLead.lead_id);
      
      if (response?.gear_inspections) {
        setGearInspections(response.gear_inspections);
      } else {
        // Fallback to mock data for development
        setGearInspections(MOCK_GEAR_INSPECTIONS);
      }
    } catch (error) {
      console.error('Error fetching gear inspections:', error);
      // Fallback to mock data on error
      setGearInspections(MOCK_GEAR_INSPECTIONS);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredGearInspections = gearInspections.filter(inspection => {
    const matchesSearch =
      inspection.gear.gear_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inspection.gear.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inspection.roster.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || inspection.gear_status.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getGearStatusColor = (status: GearStatus) => {
    switch (status) {
      case 'Pass': return '#34A853';
      case 'Expired': return '#E53935';
      case 'Recommended OOS': return '#F9A825';
      case 'Corrective Action Required': return '#9C27B0';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: GearStatus) => {
    switch (status) {
      case 'Pass': return 'check-circle';
      case 'Expired': return 'clock-alert';
      case 'Recommended OOS': return 'alert-circle';
      case 'Corrective Action Required': return 'alert-triangle';
      default: return 'help-circle';
    }
  };

  const handleUpdateGear = (inspection: GearInspection) => {
    navigation.navigate('UpadateInspection', {
      gearId: inspection.gear.gear_id,
      inspectionId: inspection.inspection_id,
      mode: 'update'
    });
  };

  /**
   * Render individual gear inspection card
   */
  const renderGear = useCallback(({ item }: { item: GearInspection }) => (
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
              #{item.gear.gear_id}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: p(6) }}>
              {/* Status indicator dot */}
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getGearStatusColor(item.gear_status.status) },
                ]}
              />
              <Text variant="titleMedium" style={{ fontWeight: 'bold', fontSize: 12 }}>
                {item.gear_status.status}
              </Text>
            </View>
          </View>

          {/* Gear Details */}
          <View style={styles.gearDetails}>
            {/* Serial Number - Show First */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Icon source="barcode" size={16} color="#555" />
              <Text style={{ marginLeft: 6, fontSize: 14, fontWeight: '600' }}>{item.gear.serial_number}</Text>
            </View>

            {/* Gear Name */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Icon source="hard-hat" size={16} color="#555" />
              <Text style={{ marginLeft: 6 }} numberOfLines={1}>{item.gear.gear_name}</Text>
            </View>

            {/* Firefighter Name */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Icon source="account" size={16} color="#555" />
              <Text style={{ marginLeft: 6 }} numberOfLines={1}>
                {item.roster.name}
              </Text>
            </View>

            {/* Manufacturer */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Icon source="factory" size={16} color="#555" />
              <Text style={{ marginLeft: 6 }} numberOfLines={1}>
                {item.gear.manufacturer.manufacturer_name}
              </Text>
            </View>

            {/* Gear Type */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Icon source="tag-outline" size={16} color="#555" />
              <Text style={{ marginLeft: 6 }}>{item.gear.gear_type.gear_type}</Text>
            </View>

            {/* Inspection Date */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Icon source="calendar" size={16} color="#555" />
              <Text style={{ marginLeft: 6 }}>{item.inspection_date}</Text>
            </View>

            {/* Color Tag */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <View style={[styles.colorTag, { backgroundColor: item.roster.color_tag }]} />
              <Text style={{ marginLeft: 6 }}>Color: {item.roster.color_tag}</Text>
            </View>
          </View>

          {/* Update Button */}
          <Button
            mode="contained"
            onPress={() => handleUpdateGear(item)}
            icon="clipboard-edit-outline"
            style={styles.updateButton}
            contentStyle={styles.updateButtonContent}
            buttonColor={getGearStatusColor(item.gear_status.status)}
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
        title={`Gears - ${load.name}`}
        showBackButton={true}
      />

      {/* Load Info Card */}
      <Card style={[styles.binInfoCard, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <View style={styles.binCompactRow}>
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall" style={{ fontWeight: '600' }}>
                {load.name || 'Load Name'}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginTop: p(2) }}>
                {gearInspections.length} Gear Inspections
              </Text>
            </View>
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
          {(['All', 'Pass', 'Expired', 'Recommended OOS', 'Corrective Action Required'] as (GearStatus | 'All')[]).map(status => (
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
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.onSurfaceVariant }}>Loading gear inspections...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGearInspections}
          renderItem={renderGear}
          keyExtractor={(item) => item.inspection_id.toString()}
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
                  : 'No gear inspections available for this load.'}
              </Text>
            </View>
          }
        />
      )}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  colorTag: {
    width: p(16),
    height: p(16),
    borderRadius: p(8),
  },
});