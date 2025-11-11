import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image } from 'react-native';
import { Text, Card, Button, Icon, useTheme, Chip, Portal, Dialog, TextInput, DataTable } from 'react-native-paper';
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
  rosterName?: string;
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

// Mock data for gears (max 8 per bin)
const MOCK_GEARS: Gear[] = [
  {
    id: 'G1',
    name: 'Helmet A',
    status: 'PASS',
    lastInspection: '2025-11-01',
    imageUrl: 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
    serialNumber: 'SER-00121',
    condition: 'Good',
    remarks: 'Minor scratches',
    rosterName:"John Doe"
  },
  {
    id: 'G2',
    name: 'Helmet B',
    status: 'REPAIR',
    lastInspection: '2025-11-01',
    imageUrl: 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
    serialNumber: 'SER-00122',
    condition: 'Needs Repair',
    remarks: 'Cracked visor',
    rosterName:"John Doe"
  },
  {
    id: 'G3',
    name: 'Helmet C',
    status: 'EXPIRED',
    lastInspection: '2025-10-15',
    imageUrl: 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
    serialNumber: 'SER-00123',
    condition: 'Expired',
    remarks: 'Certification expired',
    rosterName:"John Doe"
  },
  {
    id: 'G4',
    name: 'Helmet D',
    status: 'RECOMMEND OOS',
    lastInspection: '2025-11-05',
    imageUrl: 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
    serialNumber: 'SER-00124',
    condition: 'Poor',
    remarks: 'Structural damage',
    rosterName:"John Doe"
  },
  {
    id: 'G5',
    name: 'Helmet E',
    status: 'PASS',
    lastInspection: '2025-11-02',
    imageUrl: 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
    serialNumber: 'SER-00125',
    condition: 'Excellent',
    remarks: 'Like new condition',
    rosterName:"John Doe"
  },
  {
    id: 'G6',
    name: 'Helmet E',
    status: 'CORRECTIVE ACTION REQUIRED',
    lastInspection: '2025-11-02',
    imageUrl: 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
    serialNumber: 'SER-00125',
    condition: 'Excellent',
    remarks: 'Like new condition',
    rosterName:"John Doe"
  }
];

export default function GearsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { load, bin } = route.params as RouteProps;
  
  const [gears, setGears] = useState<Gear[]>(MOCK_GEARS);
  const [addGearDialog, setAddGearDialog] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [gearToDelete, setGearToDelete] = useState<string | null>(null);
  
  const [newGearName, setNewGearName] = useState('');
  const [newGearStatus, setNewGearStatus] = useState<GearStatus>('PASS');


  const [searchQuery, setSearchQuery] = useState('');
const [statusFilter, setStatusFilter] = useState<GearStatus | 'All'>('All');

  // Pagination state
  const [page, setPage] = useState(0);
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState(4);
  const numberOfItemsPerPageList = [4, 6, 8];

  // Pagination calculations
  const from = page * numberOfItemsPerPage;
  const to = Math.min((page + 1) * numberOfItemsPerPage, gears.length);
const filteredGears = gears.filter(gear => {
  const matchesSearch =
    gear.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gear.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());

  const matchesStatus = statusFilter === 'All' || gear.status === statusFilter;

  return matchesSearch && matchesStatus;
});

const currentGears = filteredGears.slice(from, to);

  useEffect(() => {
    setPage(0);
  }, [numberOfItemsPerPage]);

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
      case 'CORRECTIVE ACTION REQUIRED': return 'alert-trangle';
      default: return 'help-circle';
    }
  };

  const handleAddGear = () => {
    if (!newGearName.trim() || gears.length >= 8) return;

    const newGear: Gear = {
      id: `G${gears.length + 1}`,
      name: newGearName,
      status: newGearStatus,
      lastInspection: new Date().toISOString().split('T')[0],
      imageUrl: getDefaultImage(bin.gearType),
      serialNumber: `SER-00${gears.length + 100}`,
      condition: newGearStatus === 'PASS' ? 'Good' : 'Needs Attention'
    };

    setGears(prev => [...prev, newGear]);
    setNewGearName('');
    setNewGearStatus('PASS');
    setAddGearDialog(false);
  };

  const handleDeleteGear = () => {
    if (!gearToDelete) return;
    setGears(prev => prev.filter(gear => gear.id !== gearToDelete));
    setDeleteConfirmDialog(false);
    setGearToDelete(null);
  };

  const handleViewGear = (gear: Gear) => {
    // Navigate to Gear Detail Screen
    navigation.navigate('GearDetail');
  };

  const handleInspectGear = (gear: Gear) => {
    // Navigate to Update Inspection Screen
    navigation.navigate('UpadateInspection');
  };

  const getDefaultImage = (gearType: string) => {
    const images = {
      'Helmet': 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
      'Gloves': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFDCux32MFLBioGWbYdOiDfJoCV4sko1-sSQ&s',
      'Boots': 'https://www.hacsons.com/wp-content/uploads/2024/08/image-3-1.png',
      'Jacket': 'https://example.com/jacket1.jpg',
      'Mask': 'https://example.com/mask1.jpg',
      'Harness': 'https://example.com/harness1.jpg',
      'Axe': 'https://example.com/axe1.jpg',
      'Hose': 'https://example.com/hose1.jpg'
    };
    return images[gearType as keyof typeof images] || 'https://via.placeholder.com/80';
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

          </View>
          
          <View style={styles.gearInfo}>
            <Text variant="titleMedium" style={{ fontWeight: '700', fontSize: p(16), marginBottom: p(4) }}>
              {gear.name}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, fontSize: p(12), marginBottom: p(2) }}>
              Serial: {gear.serialNumber}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, fontSize: p(12), marginBottom: p(2) }}>
              Last Inspected: {gear.lastInspection}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, fontSize: p(12) }}>
              Condition: {gear.condition}
            </Text>
            
            {gear.remarks && (
            <View style={styles.remarksContainer}>
                <Icon
                source="comment-text"
                size={p(12)}
                color={colors.onSurfaceVariant}
                />
                <Text
                variant="bodySmall"
                style={{
                    color: colors.onSurfaceVariant,
                    fontSize: p(11),
                    marginLeft: p(4),
                    flex: 1,
                }}
                >
                {gear.remarks}
                </Text>

                {/* Roster Name with Person Icon */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: p(8) }}>
                <Icon
                    source="account"
                    size={p(12)}
                    color={colors.onSurfaceVariant}
                />
                <Text
                    variant="bodySmall"
                    style={{
                    color: colors.onSurfaceVariant,
                    fontSize: p(11),
                    marginLeft: p(4),
                    }}
                >
                    {gear.rosterName || 'N/A'}
                </Text>
                </View>
            </View>
            )}

          </View>
          <View>
            <Chip 
              style={[styles.statusChip, { backgroundColor: getGearStatusColor(gear.status) }]}
              textStyle={{ color: '#fff', fontSize: p(10), fontWeight: '600' }}
            >
              {gear.status}
            </Chip>
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
          <Button
            mode="text"
            onPress={() => {
              setGearToDelete(gear.id);
              setDeleteConfirmDialog(true);
            }}
            icon="delete"
            textColor={colors.error}
            compact
             {...({} as any)}
          >
            {/* Delete */}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title={`Gears - ${bin.name}`}
        showBackButton={true}
      />
{/* 🔹 Simplified Bin Info */}
<Card style={[styles.binInfoCard, { backgroundColor: colors.surface }]}>
  <Card.Content>
    <View style={styles.binCompactRow}>
      
      {/* Left: Load / Bin */}
      <View style={{ flex: 1 }}>
        <Text variant="titleSmall" style={{ fontWeight: '600' }}>
          {load.name || 'Load Name'} / {bin.name}
        </Text>
      </View>

      {/* Middle: Gears + Progress */}
      <View style={styles.gearProgressContainer}>
        <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
          {gears.length}/8
        </Text>
        <View style={styles.capacityBarCompact}>
          <View
            style={[
              styles.capacityFillCompact,
              {
                width: `${(gears.length / 8) * 100}%`,
                backgroundColor:
                  gears.length === 8
                    ? '#4CAF50'
                    : gears.length > 6
                    ? '#FF9800'
                    : '#2196F3',
              },
            ]}
          />
        </View>
      </View>

      {/* Right: Status Chip */}
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



      {/* 🔍 Search & Filter Section */}
<View style={[styles.searchFilterContainer, { backgroundColor: colors.surface }]}>
  <TextInput
    mode="outlined"
    placeholder="Search by Gear Name or Serial Number"
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
                ? getGearStatusColor(status as GearStatus)
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


      {/* Gears List */}
      <FlatList
        data={currentGears}
        renderItem={({ item }) => renderGearCard(item)}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon source="package-variant-closed" size={p(48)} color={colors.onSurfaceVariant} />
            <Text variant="titleMedium" style={{ color: colors.onSurfaceVariant, marginTop: p(8) }}>
              No Gears Added
            </Text>
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center' }}>
              Add gears to this bin to start inspections.
            </Text>
          </View>
        }
      />

      {/* Add New Button - Only show if under capacity */}
      {/* {gears.length < 8 && (
        <View style={styles.addButtonContainer}>
          <Button
            mode="contained"
            onPress={() => setAddGearDialog(true)}
            icon="plus"
            style={styles.floatingAddButton}
            contentStyle={styles.floatingAddButtonContent}
          >
            Add Gear
          </Button>
        </View>
      )} */}

      {/* Pagination at Bottom */}
      <View style={styles.paginationContainer}>
        <DataTable.Pagination
          page={page}
          numberOfPages={Math.ceil(gears.length / numberOfItemsPerPage)}
          onPageChange={page => setPage(page)}
          label={`${from + 1}-${to} of ${gears.length}`}
          showFastPaginationControls
          numberOfItemsPerPageList={numberOfItemsPerPageList}
          numberOfItemsPerPage={numberOfItemsPerPage}
          onItemsPerPageChange={setNumberOfItemsPerPage}
          selectPageDropdownLabel={'Gears per page'}
        />
      </View>

      {/* Add Gear Dialog */}
      <Portal>
        <Dialog visible={addGearDialog} onDismiss={() => setAddGearDialog(false)}>
          <Dialog.Title>Add New Gear</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Gear Name"
              value={newGearName}
              onChangeText={setNewGearName}
              mode="outlined"
              placeholder={`e.g., ${bin.gearType} ${gears.length + 1}`}
              style={styles.input}
            />
            
            <Text variant="titleSmall" style={[styles.sectionLabel, { color: colors.onSurface }]}>
              Initial Status
            </Text>
            <View style={styles.statusOptions}>
              {(['Pass', 'Repair', 'Expired', 'RECOMMEND OOS', 'CORRECTIVE ACTION REQUIRED'] as GearStatus[]).map(status => (
                <Chip
                  key={status}
                  selected={newGearStatus === status}
                  onPress={() => setNewGearStatus(status)}
                  style={[
                    styles.statusChipOption,
                    { backgroundColor: newGearStatus === status ? getGearStatusColor(status) : colors.surface }
                  ]}
                  textStyle={{ color: newGearStatus === status ? '#fff' : colors.onSurface }}
                  icon={getStatusIcon(status)}
                >
                  {status}
                </Chip>
              ))}
            </View>
            
            <Text variant="bodySmall" style={[styles.capacityWarning, { color: colors.onSurfaceVariant }]}>
              {8 - gears.length} slots remaining in this bin
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddGearDialog(false)}>Cancel</Button>
            <Button onPress={handleAddGear} disabled={!newGearName.trim()}>
              Add Gear
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={deleteConfirmDialog} onDismiss={() => setDeleteConfirmDialog(false)}>
          <Dialog.Title>Confirm Delete</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this gear? This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteConfirmDialog(false)}>Cancel</Button>
            <Button onPress={handleDeleteGear} textColor={colors.error}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  binInfoCard: {
    margin: p(14),
    marginBottom: p(8),
    borderRadius: p(8),
    elevation: 1,
  },
  binInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: p(12),
  },
  capacityInfo: {
    marginTop: p(8),
  },
  capacityBar: {
    height: p(6),
    backgroundColor: '#e0e0e0',
    borderRadius: p(3),
    overflow: 'hidden',
    marginTop: p(4),
  },
  capacityFill: {
    height: '100%',
    borderRadius: p(3),
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
  addButtonContainer: {
    position: 'absolute',
    right: p(20),
    bottom: p(80),
    zIndex: 10,
  },
  floatingAddButton: {
    borderRadius: p(25),
    elevation: 4,
  },
  floatingAddButtonContent: {
    paddingHorizontal: p(16),
  },

  // search start
  searchFilterContainer: {
  paddingHorizontal: p(14),
  paddingTop: p(8),
  paddingBottom: p(4),
},
searchInput: {
  marginBottom: p(8),
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

  // search end 
  paginationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
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
  input: {
    marginBottom: p(12),
  },
  sectionLabel: {
    marginBottom: p(8),
    fontWeight: '600',
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: p(6),
    marginBottom: p(12),
  },
  statusChipOption: {
    marginBottom: p(4),
  },
  capacityWarning: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: p(8),
  },


  binCompactRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},

gearProgressContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: p(6),
},

capacityBarCompact: {
  width: p(50),
  height: p(6),
  backgroundColor: '#E0E0E0',
  borderRadius: p(3),
  overflow: 'hidden',
},

capacityFillCompact: {
  height: '100%',
  borderRadius: p(3),
},

});