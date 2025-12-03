import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
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

  // Detect if device is mobile (width < 600)
  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth < 600;
  const numColumns = isMobile ? 1 : 2;

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

      // Handle API response structure: { status, message, lead_id, loads }
      if (response?.status && response?.loads) {
        const apiLoads: ApiLoad[] = response.loads;

        const mapped: Load[] = apiLoads.map((l) => ({
          id: `L${l.load_number}`,
          name: `Load ${l.load_number}`,
          loadNumber: l.load_number,
          totalGears: l.total_gears || 0,
          totalRosters: l.total_rosters || 0,
        }));

        setLoads(mapped);
      } else {
        // If response structure is different, try direct access
        const apiLoads: ApiLoad[] = response?.loads || [];
        const mapped: Load[] = apiLoads.map((l) => ({
          id: `L${l.load_number}`,
          name: `Load ${l.load_number}`,
          loadNumber: l.load_number,
          totalGears: l.total_gears || 0,
          totalRosters: l.total_rosters || 0,
        }));
        setLoads(mapped);
      }
    } catch (error) {
      console.error('Error fetching loads:', error);
      setLoads([]);
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

  const renderLoadCard = ({ item: load }: { item: Load }) => (
    <TouchableOpacity 
      onPress={() => handleCardPress(load)}
      style={[styles.cardWrapper, isMobile && styles.cardWrapperMobile]}
      activeOpacity={0.7}
    >
      <Card style={[styles.loadCard, { backgroundColor: colors.surface }]}>
        <Card.Content style={styles.cardContent}>
          {/* Load Number - Top */}
          <View style={styles.loadNumberContainer}>
            <View style={[styles.loadIconBadge, { backgroundColor: colors.primaryContainer }]}>
              <Icon source="truck" size={p(20)} color={colors.primary} />
            </View>
            <Text variant="headlineSmall" style={[styles.loadNumber, { color: colors.primary }]}>
              {load.name}
            </Text>
          </View>
          
          {/* Stats Row - Bottom */}
          <View style={styles.statsRow}>
            {/* Gear Section */}
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.primaryContainer + '40' }]}>
                <Icon source="tools" size={p(18)} color={colors.primary} />
              </View>
              <View style={styles.statInfo}>
                <Text variant="bodySmall" style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                  Gear
                </Text>
                <Text variant="titleLarge" style={[styles.statValue, { color: colors.onSurface }]}>
                  {load.totalGears}
                </Text>
              </View>
            </View>
            
            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.outline }]} />
            
            {/* Firefighter Section */}
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.primaryContainer + '40' }]}>
                <Icon source="account-group" size={p(18)} color={colors.primary} />
              </View>
              <View style={styles.statInfo}>
                <Text variant="bodySmall" style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                  Firefighter
                </Text>
                <Text variant="titleLarge" style={[styles.statValue, { color: colors.onSurface }]}>
                  {load.totalRosters}
                </Text>
              </View>
            </View>
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
          placeholder="Search by load number"
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
          renderItem={renderLoadCard}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          contentContainerStyle={[styles.listContainer, isMobile && styles.listContainerMobile]}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
          showsVerticalScrollIndicator={false}
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
    paddingBottom: p(100),
    gap: p(10),
  },
  listContainerMobile: {
    paddingHorizontal: p(12),
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: p(10),
  },
  cardWrapper: {
    width: '48%',
    marginBottom: p(8),
  },
  cardWrapperMobile: {
    width: '100%',
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
    borderRadius: p(16),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    minHeight: p(140),
    overflow: 'hidden',
  },
  cardContent: {
    padding: p(16),
  },
  loadNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: p(16),
    gap: p(10),
  },
  loadIconBadge: {
    width: p(40),
    height: p(40),
    borderRadius: p(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadNumber: {
    fontWeight: '700',
    fontSize: p(20),
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: p(12),
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: p(10),
    paddingHorizontal: p(8),
  },
  statIconContainer: {
    width: p(36),
    height: p(36),
    borderRadius: p(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: p(11),
    fontWeight: '500',
    marginBottom: p(2),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontWeight: '700',
    fontSize: p(20),
    lineHeight: p(24),
  },
  divider: {
    width: 1,
    height: p(40),
    opacity: 0.3,
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