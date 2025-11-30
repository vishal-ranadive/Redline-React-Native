import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Card, Icon, useTheme, Portal, Dialog, TextInput, DataTable, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/common/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLeadStore } from '../../store/leadStore';
import { inspectionApi } from '../../services/inspectionApi';

type ApiLoad = {
  load_number: number;
  total_gears: number;
  total_rosters: number;
};

type Load = {
  id: string;
  name: string;
  loadNumber: number;
  totalGears: number;
  totalRosters: number;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GearScreen'>;

export default function LoadsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { currentLead } = useLeadStore();
  
  const [loads, setLoads] = useState<Load[]>([]);
  const [addLoadDialog, setAddLoadDialog] = useState(false);
  
  const [newLoadName, setNewLoadName] = useState('');

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(0);
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState(5);
  const numberOfItemsPerPageList = [3, 4, 5, 6];

  // Pagination calculations
  const from = page * numberOfItemsPerPage;
  const to = Math.min((page + 1) * numberOfItemsPerPage, loads.length);

  // Filter loads by search
  const filteredLoads = loads.filter(load => {
    const matchesSearch =
      load.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      load.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const currentLoads = filteredLoads.slice(from, to);

  useEffect(() => {
    fetchLoads();
  }, [currentLead]);

  useEffect(() => {
    setPage(0);
  }, [numberOfItemsPerPage, filteredLoads.length]);

  const fetchLoads = async () => {
    if (!currentLead?.lead_id) {
      console.log('Missing lead_id for loads API');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await inspectionApi.getLeadLoads(currentLead.lead_id);

      const apiLoads: ApiLoad[] = response?.loads || [];

      const mapped: Load[] = apiLoads.map((l) => ({
        id: `L${l.load_number}`,
        name: `Load ${l.load_number}`,
        loadNumber: l.load_number,
        totalGears: l.total_gears,
        totalRosters: l.total_rosters,
      }));

      setLoads(mapped);
    } catch (error) {
      console.error('Error fetching loads:', error);
      // Fallback single dummy load if API fails
      setLoads([
        {
          id: 'L1',
          name: 'Load 1',
          loadNumber: 1,
          totalGears: 0,
          totalRosters: 0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLoad = () => {
    if (!newLoadName.trim()) {
      return;
    }

    const newLoad: Load = {
      id: `L${loads.length + 1}`,
      name: newLoadName,
      loadNumber: loads.length + 1,
      totalGears: 0,
      totalRosters: 0,
    };

    setLoads(prev => [...prev, newLoad]);
    setNewLoadName('');
    setAddLoadDialog(false);
  };

  const handleCardPress = (load: Load) => {
    navigation.navigate('GearScreen', { load });
  };

  const renderLoadCard = (load: Load) => (
    <TouchableOpacity onPress={() => handleCardPress(load)}>
      <Card key={load.id} style={[styles.loadCard, { backgroundColor: colors.surface }]}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.loadMainRow}>
            <View style={styles.loadInfo}>
              <View style={styles.loadIconContainer}>
                <Icon source="truck" size={p(22)} color={colors.primary} />
              </View>
              <Text variant="titleMedium" style={styles.loadName}>
                {load.name}
              </Text>
            </View>
            <Icon source="chevron-right" size={p(20)} color={colors.onSurfaceVariant} />
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Inspection Loads" />

      {/* 🔍 Search */}
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
      </View>

      {/* Loads List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.onSurfaceVariant }}>Loading loads...</Text>
        </View>
      ) : (
        <FlatList
          data={currentLoads}
          renderItem={({ item }) => renderLoadCard(item)}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}

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
    alignItems: 'center',
  },
  loadInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadName: {
    fontWeight: '600',
    fontSize: p(16),
    lineHeight: p(20),
  },
  loadIconContainer: {
    marginRight: p(12),
  },
  input: {
    marginBottom: p(12),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: p(40),
  },
});