import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Button, Icon, useTheme, Chip, Portal, Dialog, TextInput, DataTable } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../../components/common/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type BinStatus = 'Pending' | 'Done' | 'Issue';
type GearStatus = 'Pass' | 'Repair' | 'Expired' | 'RECOMMEND OOS';

type Gear = {
  id: string;
  name: string;
  status: GearStatus;
  lastInspection: string;
  imageUrl: string;
};

type Bin = {
  id: string;
  name: string;
  gearType: string;
  status: BinStatus;
  gearCount: number;
  maxCapacity: number;
  createdDate: string;
};

type Load = {
  id: string;
  name: string;
  status: string;
};

type RouteProps = {
  load: Load;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GearScreen'>;

// Mock data for bins
const MOCK_BINS: Bin[] = [
  {
    id: 'B1',
    name: 'Helmet Bin A',
    gearType: 'Helmet',
    status: 'Pending',
    gearCount: 2,
    maxCapacity: 8,
    createdDate: '2025-11-10'
  },
  {
    id: 'B2',
    name: 'Gloves Bin A',
    gearType: 'Gloves',
    status: 'Done',
    gearCount: 1,
    maxCapacity: 8,
    createdDate: '2025-11-10'
  },
  {
    id: 'B3',
    name: 'Boots Bin A',
    gearType: 'Boots',
    status: 'Issue',
    gearCount: 5,
    maxCapacity: 8,
    createdDate: '2025-11-09'
  }
];

// Available gear types
const GEAR_TYPES = ['Helmet', 'Gloves', 'Boots', 'Jacket', 'Mask', 'Harness', 'Axe', 'Hose'];

export default function BinsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { load } = route.params as RouteProps;
  
  const [bins, setBins] = useState<Bin[]>(MOCK_BINS);
  const [addBinDialog, setAddBinDialog] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [binToDelete, setBinToDelete] = useState<string | null>(null);
  
  const [newBinName, setNewBinName] = useState('');
  const [newBinType, setNewBinType] = useState('Helmet');
  const [newBinStatus, setNewBinStatus] = useState<BinStatus>('Pending');

  const [searchQuery, setSearchQuery] = useState('');
const [statusFilter, setStatusFilter] = useState<BinStatus | 'All'>('All');

  // Pagination state
  const [page, setPage] = useState(0);
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState(3);
  const numberOfItemsPerPageList = [2, 3, 4];

  // Pagination calculations
  const from = page * numberOfItemsPerPage;
  const to = Math.min((page + 1) * numberOfItemsPerPage, bins.length);

  // Filter bins based on search and status
const filteredBins = bins.filter(bin => {
  const matchesSearch =
    bin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bin.id.toLowerCase().includes(searchQuery.toLowerCase());

  const matchesStatus = statusFilter === 'All' || bin.status === statusFilter;

  return matchesSearch && matchesStatus;
});

const currentBins = filteredBins.slice(from, to);

  useEffect(() => {
    setPage(0);
  }, [numberOfItemsPerPage]);

  const getBinStatusColor = (status: BinStatus) => {
    switch (status) {
      case 'Pending': return '#FFB300';
      case 'Done': return '#4CAF50';
      case 'Issue': return '#E53935';
      default: return '#9E9E9E';
    }
  };

  const handleAddBin = () => {
    if (!newBinName.trim()) return;

    const newBin: Bin = {
      id: `B${bins.length + 1}`,
      name: newBinName,
      gearType: newBinType,
      status: newBinStatus,
      gearCount: 0,
      maxCapacity: 8,
      createdDate: new Date().toISOString().split('T')[0]
    };

    setBins(prev => [...prev, newBin]);
    setNewBinName('');
    setNewBinType('Helmet');
    setNewBinStatus('Pending');
    setAddBinDialog(false);
  };

  const handleDeleteBin = () => {
    if (!binToDelete) return;
    setBins(prev => prev.filter(bin => bin.id !== binToDelete));
    setDeleteConfirmDialog(false);
    setBinToDelete(null);
  };

  const handleViewGears = (bin: Bin) => {
    // navigation.navigate('GearDetail', { load, bin });
    navigation.navigate('GearScreen', { load ,bin});
  };

  const renderBinCard = (bin: Bin) => (
    // <Card key={bin.id} style={[styles.binCard, { backgroundColor: colors.surface }]}>
    <Card key={bin.id} style={[styles.binCard, { backgroundColor: colors.surface, paddingVertical: p(8), paddingHorizontal: p(10) }]}>

      <Card.Content>
        <View style={styles.binHeader}>
          <View style={styles.binTitle}>
            <Icon source="package-variant" size={p(24)} color={colors.primary} />
            <View style={styles.binText}>
              {/* <Text variant="titleLarge" style={{ fontWeight: '700', fontSize: p(20) }}>
                {bin.name}
              </Text>
              <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, fontSize: p(14) }}>
                Type: {bin.gearType} • Created: {bin.createdDate}
              </Text> */}
              <Text variant="titleLarge" style={{ fontWeight: '700', fontSize: p(16) }}>{bin.name}</Text>
              <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, fontSize: p(12) }}>
                Type: {bin.gearType} • Created: {bin.createdDate}
              </Text>
            </View>
          </View>
          <Chip 
            style={{ backgroundColor: getBinStatusColor(bin.status) }}
            textStyle={{ color: '#fff', fontWeight: '600' }}
          >
            {bin.status}
          </Chip>
        </View>

        <View style={styles.binStats}>
          <View style={styles.stat}>
            <Icon source="tools" size={p(20)} color={colors.primary} />
            <Text variant="titleMedium" style={{ fontWeight: '600', fontSize: p(18), marginLeft: p(4) }}>
              {bin.gearCount}/{bin.maxCapacity}
            </Text>
            <Text variant="bodySmall" style={{ fontSize: p(12) }}>Gears</Text>
          </View>
          <View style={styles.capacityBar}>
            <View 
              style={[
                styles.capacityFill, 
                { 
                  width: `${(bin.gearCount / bin.maxCapacity) * 100}%`,
                  backgroundColor: bin.gearCount === bin.maxCapacity ? '#4CAF50' : 
                                 bin.gearCount > bin.maxCapacity * 0.7 ? '#FF9800' : '#2196F3'
                }
              ]} 
            />
          </View>
        </View>

        <View style={styles.binActions}>
          <Button
            mode="contained"
            onPress={() => handleViewGears(bin)}
            icon="arrow-right"
            style={styles.viewButton}
            disabled={bin.gearCount === 0}
          >
            View Gears ({bin.gearCount})
          </Button>
          <Button
            mode="text"
            onPress={() => {
              setBinToDelete(bin.id);
              setDeleteConfirmDialog(true);
            }}
            icon="delete"
            textColor={colors.error}
          >
            Delete
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title={`Bins - ${load.name}`}
        showBackButton={true}
      />
      

      {/* Load Info */}
      {/* <Card style={[styles.loadInfoCard, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={{ fontWeight: '600', marginBottom: p(4) }}>
            Load: {load.name}
          </Text>
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
            Status: {load.status} • Total Bins: {bins.length}
          </Text>
        </Card.Content>
      </Card> */}
      {/* 🔍 Search & Filter Section */}
      <View style={[styles.searchFilterContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          mode="outlined"
          placeholder="Search by Bin Name or ID"
          value={searchQuery}
          onChangeText={setSearchQuery}
          left={<TextInput.Icon icon="magnify" />}
          style={styles.searchInput}
          dense
        />
        
        <View style={styles.filterChips}>
          {(['All', 'Pending', 'Done', 'Issue'] as (BinStatus | 'All')[]).map(status => (
            <Chip
              key={status}
              selected={statusFilter === status}
              onPress={() => setStatusFilter(status)}
              style={[
                styles.filterChip,
                { backgroundColor: statusFilter === status ? getBinStatusColor(status as BinStatus) : colors.surfaceVariant }
              ]}
              textStyle={{
                color: statusFilter === status ? '#fff' : colors.onSurfaceVariant,
                fontSize: p(10)
              }}
              compact
            >
              {status}
            </Chip>
          ))}
        </View>
      </View>


      {/* Bins List */}
      <FlatList
        data={currentBins}
        renderItem={({ item }) => renderBinCard(item)}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      {/* Add New Button */}
      {/* <View style={styles.addButtonContainer}>
        <Button
          mode="contained"
          onPress={() => setAddBinDialog(true)}
          icon="plus"
          style={styles.floatingAddButton}
          contentStyle={styles.floatingAddButtonContent}
        >
          Add New Bin
        </Button>
      </View> */}

      {/* Pagination at Bottom */}
      <View style={styles.paginationContainer}>
        <DataTable.Pagination
          page={page}
          numberOfPages={Math.ceil(bins.length / numberOfItemsPerPage)}
          onPageChange={page => setPage(page)}
          label={`${from + 1}-${to} of ${bins.length}`}
          showFastPaginationControls
          numberOfItemsPerPageList={numberOfItemsPerPageList}
          numberOfItemsPerPage={numberOfItemsPerPage}
          onItemsPerPageChange={setNumberOfItemsPerPage}
          selectPageDropdownLabel={'Rows per page'}
        />
      </View>

      {/* Add Bin Dialog */}
      <Portal>
        <Dialog visible={addBinDialog} onDismiss={() => setAddBinDialog(false)}>
          <Dialog.Title>Add New Bin</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Bin Name"
              value={newBinName}
              onChangeText={setNewBinName}
              mode="outlined"
              placeholder="e.g., Helmet Bin A"
              style={styles.input}
            />
            
            <Text variant="titleSmall" style={[styles.sectionLabel, { color: colors.onSurface }]}>
              Gear Type
            </Text>
            <View style={styles.gearTypeOptions}>
              {GEAR_TYPES.map(type => (
                <Chip
                  key={type}
                  selected={newBinType === type}
                  onPress={() => setNewBinType(type)}
                  style={styles.gearTypeChip}
                >
                  {type}
                </Chip>
              ))}
            </View>

            <Text variant="titleSmall" style={[styles.sectionLabel, { color: colors.onSurface }]}>
              Bin Status
            </Text>
            <View style={styles.statusOptions}>
              {(['Pending', 'Done', 'Issue'] as BinStatus[]).map(status => (
                <Chip
                  key={status}
                  selected={newBinStatus === status}
                  onPress={() => setNewBinStatus(status)}
                  style={[
                    styles.statusChipOption,
                    { backgroundColor: newBinStatus === status ? getBinStatusColor(status) : colors.surface }
                  ]}
                  textStyle={{ color: newBinStatus === status ? '#fff' : colors.onSurface }}
                >
                  {status}
                </Chip>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddBinDialog(false)}>Cancel</Button>
            <Button onPress={handleAddBin}>Add Bin</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={deleteConfirmDialog} onDismiss={() => setDeleteConfirmDialog(false)}>
          <Dialog.Title>Confirm Delete</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this bin? This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteConfirmDialog(false)}>Cancel</Button>
            <Button onPress={handleDeleteBin} textColor={colors.error}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadInfoCard: {
    margin: p(14),
    marginBottom: p(8),
    borderRadius: p(8),
    elevation: 1,
  },
  listContainer: {
    padding: p(14),
    paddingBottom: p(120),
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
  paddingHorizontal: p(12),
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
    marginInline:'auto',
    marginBottom:p(50),
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  binCard: {
    marginBottom: p(16),
    borderRadius: p(12),
    elevation: 2,
  },
  binHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: p(12),
  },
  binTitle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  binText: {
    marginLeft: p(12),
    flex: 1,
  },
  binStats: {
    marginBottom: p(12),
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: p(8),
  },
  capacityBar: {
    height: p(8),
    backgroundColor: '#e0e0e0',
    borderRadius: p(4),
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: p(4),
  },
  binActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewButton: {
    flex: 1,
    marginRight: p(8),
  },
  input: {
    marginBottom: p(12),
  },
  sectionLabel: {
    marginBottom: p(8),
    fontWeight: '600',
  },
  gearTypeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: p(6),
    marginBottom: p(12),
  },
  gearTypeChip: {
    marginBottom: p(4),
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: p(6),
  },
  statusChipOption: {
    marginBottom: p(4),
  },
});