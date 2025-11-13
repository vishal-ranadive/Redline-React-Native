import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Card, Icon, useTheme, Chip, Portal, Dialog, TextInput, DataTable, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/common/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type LoadStatus = 'Sorting' | 'Cleaning' | 'Hand Over' | 'Complete';

type Load = {
  id: string;
  name: string;
  status: LoadStatus;
  binCount: number;
  createdDate: string;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'BinsScreen'>;

// Mock data with updated statuses
const MOCK_LOADS: Load[] = [
  {
    id: 'L1',
    name: 'Load 1 - Emergency Response',
    status: 'Sorting',
    binCount: 2,
    createdDate: '2025-11-10'
  },
  {
    id: 'L2',
    name: 'Load 2 - Training Equipment',
    status: 'Cleaning',
    binCount: 1,
    createdDate: '2025-11-09'
  },
  {
    id: 'L3',
    name: 'Load 3 - Rescue Operations',
    status: 'Complete',
    binCount: 1,
    createdDate: '2025-11-08'
  },
  {
    id: 'L4',
    name: 'Load 4 - Fire Suppression',
    status: 'Hand Over',
    binCount: 1,
    createdDate: '2025-11-07'
  },
  {
    id: 'L5',
    name: 'Load 5 - Medical Supplies',
    status: 'Sorting',
    binCount: 3,
    createdDate: '2025-11-06'
  },
  {
    id: 'L6',
    name: 'Load 6 - Safety Gear',
    status: 'Cleaning',
    binCount: 2,
    createdDate: '2025-11-05'
  }
];

export default function LoadsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  
  const [loads, setLoads] = useState<Load[]>(MOCK_LOADS);
  const [addLoadDialog, setAddLoadDialog] = useState(false);
  
  const [newLoadName, setNewLoadName] = useState('');
  const [newLoadStatus, setNewLoadStatus] = useState<LoadStatus>('Sorting');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LoadStatus | 'All'>('All');

  // Pagination state
  const [page, setPage] = useState(0);
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState(5);
  const numberOfItemsPerPageList = [3, 4, 5, 6];

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
  }, [numberOfItemsPerPage, filteredLoads.length]);

  const getLoadStatusColor = (status: LoadStatus) => {
    switch (status) {
      case 'Sorting': return '#FFB300';
      case 'Cleaning': return '#FF9800';
      case 'Hand Over': return '#4CAF50';
      case 'Complete': return '#2196F3';
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
      createdDate: new Date().toISOString().split('T')[0]
    };

    setLoads(prev => [...prev, newLoad]);
    setNewLoadName('');
    setNewLoadStatus('Sorting');
    setAddLoadDialog(false);
  };

  const handleCardPress = (load: Load) => {
    navigation.navigate('BinsScreen', { load });
  };

  const renderLoadCard = (load: Load) => (
    <TouchableOpacity onPress={() => handleCardPress(load)}>
      <Card key={load.id} style={[styles.loadCard, { backgroundColor: colors.surface }]}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.loadMainRow}>
            <View style={styles.loadInfo}>
              <Icon source="truck" size={p(20)} color={colors.primary} />
              <View style={styles.loadText}>
                <Text variant="titleMedium" style={styles.loadName}>
                  {load.name}
                </Text>
                <Text variant="bodySmall" style={[styles.loadDate, { color: colors.onSurfaceVariant }]}>
                  {load.id} • Created: {load.createdDate}
                </Text>
              </View>
            </View>
            
            <View style={styles.loadMeta}>
              <Chip 
                style={[styles.statusChip, { backgroundColor: getLoadStatusColor(load.status) }]}
                textStyle={styles.statusChipText}
                compact
              >
                {load.status}
              </Chip>
              <Icon source="chevron-right" size={p(20)} color={colors.onSurfaceVariant} />
            </View>
          </View>

          <View style={styles.binCountContainer}>
            <Icon source="package-variant" size={p(16)} color={colors.primary} />
            <Text variant="bodyMedium" style={styles.binCountText}>
              {load.binCount} {load.binCount === 1 ? 'Bin' : 'Bins'}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
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
          {(['All', 'Sorting', 'Cleaning', 'Hand Over', 'Complete'] as (LoadStatus | 'All')[]).map(status => (
            <Chip
              key={status}
              selected={statusFilter === status}
              onPress={() => setStatusFilter(status)}
              style={[
                styles.filterChip,
                { 
                  backgroundColor: statusFilter === status 
                    ? status === 'All' ? colors.primary : getLoadStatusColor(status as LoadStatus)
                    : colors.surfaceVariant 
                }
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

      {/* Pagination at Bottom */}
      <View style={styles.paginationContainer}>
        <DataTable.Pagination
          page={page}
          numberOfPages={Math.ceil(filteredLoads.length / numberOfItemsPerPage)}
          onPageChange={page => setPage(page)}
          label={`${from + 1}-${to} of ${filteredLoads.length}`}
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
              {(['Sorting', 'Cleaning', 'Hand Over', 'Complete'] as LoadStatus[]).map(status => (
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  listContainer: {
    padding: p(12),
    paddingBottom: p(80),
  },
  searchFilterContainer: {
    paddingHorizontal: p(12),
    paddingTop: p(8),
    paddingBottom: p(8),
  },
  searchInput: {
    marginBottom: p(8),
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: p(4),
  },
  filterChip: {
    marginRight: p(4),
    marginBottom: p(4),
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  loadCard: {
    marginBottom: p(8),
    borderRadius: p(8),
    elevation: 1,
  },
  cardContent: {
    paddingVertical: p(12),
    paddingHorizontal: p(16),
  },
  loadMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: p(8),
  },
  loadInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  loadText: {
    marginLeft: p(12),
    flex: 1,
  },
  loadName: {
    fontWeight: '600',
    fontSize: p(14),
    lineHeight: p(18),
  },
  loadDate: {
    fontSize: p(11),
    marginTop: p(2),
  },
  loadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: p(8),
  },
  statusChip: {
    height: p(24),
  },
  statusChipText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: p(10),
    lineHeight: p(14),
  },
  binCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: p(6),
  },
  binCountText: {
    fontSize: p(12),
    fontWeight: '500',
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