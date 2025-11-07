import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Button, Icon, useTheme, Chip, Portal, Dialog, TextInput, DataTable } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/common/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type LoadStatus = 'Scanning' | 'Partially' | 'Ready' | 'Completed' | 'Attention';

type Load = {
  id: string;
  name: string;
  status: LoadStatus;
  binCount: number;
  gearCount: number;
  createdDate: string;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'BinsScreen'>;

// Mock data
const MOCK_LOADS: Load[] = [
  {
    id: 'L1',
    name: 'Load 1 - Emergency Response',
    status: 'Scanning',
    binCount: 2,
    gearCount: 3,
    createdDate: '2025-11-10'
  },
  {
    id: 'L2',
    name: 'Load 2 - Training Equipment',
    status: 'Partially',
    binCount: 1,
    gearCount: 5,
    createdDate: '2025-11-09'
  },
  {
    id: 'L3',
    name: 'Load 3 - Rescue Operations',
    status: 'Completed',
    binCount: 1,
    gearCount: 2,
    createdDate: '2025-11-08'
  },
  {
    id: 'L4',
    name: 'Load 4 - Fire Suppression',
    status: 'Ready',
    binCount: 1,
    gearCount: 1,
    createdDate: '2025-11-07'
  }
];

export default function LoadsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  
  const [loads, setLoads] = useState<Load[]>(MOCK_LOADS);
  const [addLoadDialog, setAddLoadDialog] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [loadToDelete, setLoadToDelete] = useState<string | null>(null);
  
  const [newLoadName, setNewLoadName] = useState('');
  const [newLoadStatus, setNewLoadStatus] = useState<LoadStatus>('Scanning');

  //search 
  const [searchQuery, setSearchQuery] = useState('');
const [statusFilter, setStatusFilter] = useState<LoadStatus | 'All'>('All');

  // Pagination state
  const [page, setPage] = useState(0);
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState(3);
  const numberOfItemsPerPageList = [2, 3, 4];

  // Pagination calculations
  const from = page * numberOfItemsPerPage;
  const to = Math.min((page + 1) * numberOfItemsPerPage, loads.length);
// Filter loads by search and status
  const filteredLoads = loads.filter(load => {
    const matchesSearch =
      load.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      load.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || load.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const currentLoads = filteredLoads.slice(from, to);

  useEffect(() => {
    setPage(0);
  }, [numberOfItemsPerPage]);

  const getLoadStatusColor = (status: LoadStatus) => {
    switch (status) {
      case 'Scanning': return '#FFB300';
      case 'Partially': return '#FF9800';
      case 'Ready': return '#4CAF50';
      case 'Completed': return '#2196F3';
      case 'Attention': return '#E53935';
      default: return '#9E9E9E';
    }
  };

  const handleAddLoad = () => {
    if (!newLoadName.trim()) {
      return;
    }

    const newLoad: Load = {
      id: `L${loads.length + 1}`,
      name: newLoadName,
      status: newLoadStatus,
      binCount: 0,
      gearCount: 0,
      createdDate: new Date().toISOString().split('T')[0]
    };

    setLoads(prev => [...prev, newLoad]);
    setNewLoadName('');
    setNewLoadStatus('Scanning');
    setAddLoadDialog(false);
  };

  const handleDeleteLoad = () => {
    if (!loadToDelete) return;
    setLoads(prev => prev.filter(load => load.id !== loadToDelete));
    setDeleteConfirmDialog(false);
    setLoadToDelete(null);
  };

  const handleViewBins = (load: Load) => {
    navigation.navigate('BinsScreen', { load });
    // navigation.navigate('BinsScreen');
  };

  const renderLoadCard = (load: Load) => (
    // <Card key={load.id} style={[styles.loadCard, { backgroundColor: colors.surface }]}>
<Card key={load.id} style={[styles.loadCard, { backgroundColor: colors.surface, paddingVertical: p(8), paddingHorizontal: p(10) }]}>

      <Card.Content>
        <View style={styles.loadHeader}>
          <View style={styles.loadTitle}>
            <Icon source="truck" size={p(24)} color={colors.primary} />
            <View style={styles.loadText}>
                <Text variant="titleLarge" style={{ fontWeight: '700', fontSize: p(16) }}>{load.name}</Text>
                <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, fontSize: p(12) }}>
                  Created: {load.createdDate}
                </Text>
            </View>
          </View>
          <Chip 
            style={{ backgroundColor: getLoadStatusColor(load.status) }}
            textStyle={{ color: '#fff', fontWeight: '600' }}
          >
            {load.status}
          </Chip>
        </View>

        <View style={styles.loadStats}>
          <View style={styles.stat}>
            <Icon source="package-variant" size={p(20)} color={colors.primary} />
            <Text variant="titleMedium" style={{ fontWeight: '600', fontSize: p(18), marginLeft: p(4) }}>
              {load.binCount}
            </Text>
            <Text variant="bodySmall" style={{ fontSize: p(12) }}>Bins</Text>
          </View>
          <View style={styles.stat}>
            <Icon source="tools" size={p(20)} color={colors.primary} />
            <Text variant="titleMedium" style={{ fontWeight: '600', fontSize: p(18), marginLeft: p(4) }}>
              {load.gearCount}
            </Text>
            <Text variant="bodySmall" style={{ fontSize: p(12) }}>Gears</Text>
          </View>
        </View>

        <View style={styles.loadActions}>
          <Button
            mode="outlined"
            onPress={() => handleViewBins(load)}
            icon="arrow-right"
            style={styles.viewButton}
          >
            View Bins
          </Button>
          <Button
            mode="text"
            onPress={() => {
              setLoadToDelete(load.id);
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
      <Header title="Inspection Loads" />

      {/* 🔍 Search & Filter */}
<View style={[styles.searchFilterContainer, { backgroundColor: colors.surface }]}>
  <TextInput
    mode="outlined"
    placeholder="Search by name or ID"
    value={searchQuery}
    onChangeText={setSearchQuery}
    left={<TextInput.Icon icon="magnify" />}
    style={styles.searchInput}
    dense
  />
  <View style={styles.filterChips}>
    {(['All', 'Scanning', 'Partially', 'Ready', 'Completed', 'Attention'] as (LoadStatus | 'All')[]).map(status => (
      <Chip
        key={status}
        selected={statusFilter === status}
        onPress={() => setStatusFilter(status)}
        style={[
          styles.filterChip,
          { backgroundColor: statusFilter === status ? getLoadStatusColor(status as LoadStatus) : colors.surfaceVariant }
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


      {/* Loads List */}
      <FlatList
        data={currentLoads}
        renderItem={({ item }) => renderLoadCard(item)}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      {/* Add New Button */}
      {/* <View style={styles.addButtonContainer}>
        <Button
          mode="contained"
          onPress={() => setAddLoadDialog(true)}
          icon="plus"
          style={styles.floatingAddButton}
          contentStyle={styles.floatingAddButtonContent}
        >
          Add New Load
        </Button>
      </View> */}

      {/* Pagination at Bottom */}
      <View style={styles.paginationContainer}>
        <DataTable.Pagination
          page={page}
          numberOfPages={Math.ceil(loads.length / numberOfItemsPerPage)}
          onPageChange={page => setPage(page)}
          label={`${from + 1}-${to} of ${loads.length}`}
          showFastPaginationControls
          numberOfItemsPerPageList={numberOfItemsPerPageList}
          numberOfItemsPerPage={numberOfItemsPerPage}
          onItemsPerPageChange={setNumberOfItemsPerPage}
          selectPageDropdownLabel={'Rows per page'}
        />
      </View>

      {/* Add Load Dialog */}
      <Portal>
        <Dialog visible={addLoadDialog} onDismiss={() => setAddLoadDialog(false)}>
          <Dialog.Title>Add New Load</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Load Name"
              value={newLoadName}
              onChangeText={setNewLoadName}
              mode="outlined"
              placeholder="e.g., Emergency Response Load"
              style={styles.input}
            />
            
            <Text variant="titleSmall" style={[styles.sectionLabel, { color: colors.onSurface }]}>
              Load Status
            </Text>
            <View style={styles.statusOptions}>
              {(['Scanning', 'Partially', 'Ready', 'Completed', 'Attention'] as LoadStatus[]).map(status => (
                <Chip
                  key={status}
                  selected={newLoadStatus === status}
                  onPress={() => setNewLoadStatus(status)}
                  style={[
                    styles.statusChipOption,
                    { backgroundColor: newLoadStatus === status ? getLoadStatusColor(status) : colors.surface }
                  ]}
                  textStyle={{ color: newLoadStatus === status ? '#fff' : colors.onSurface }}
                >
                  {status}
                </Chip>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddLoadDialog(false)}>Cancel</Button>
            <Button onPress={handleAddLoad}>Add Load</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={deleteConfirmDialog} onDismiss={() => setDeleteConfirmDialog(false)}>
          <Dialog.Title>Confirm Delete</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this load? This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteConfirmDialog(false)}>Cancel</Button>
            <Button onPress={handleDeleteLoad} textColor={colors.error}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContainer: {
    padding: p(14),
    paddingBottom: p(120),
  },

  // search 

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
  paginationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    marginInline:'auto',
    marginBottom:p(45),
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  loadCard: {
    marginBottom: p(16),
    borderRadius: p(12),
    elevation: 2,
  },
  loadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: p(12),
  },
  loadTitle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  loadText: {
    marginLeft: p(12),
    flex: 1,
  },
  loadStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: p(12),
    padding: p(12),
    backgroundColor: '#f8f9fa',
    borderRadius: p(8),
  },
  stat: {
    alignItems: 'center',
  },
  loadActions: {
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
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: p(6),
  },
  statusChipOption: {
    marginBottom: p(4),
  },
});