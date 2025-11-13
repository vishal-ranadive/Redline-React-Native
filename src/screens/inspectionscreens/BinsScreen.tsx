import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Card, Icon, useTheme, Portal, Dialog, TextInput, DataTable, Button, Chip } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../../components/common/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

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
    gearCount: 2,
    maxCapacity: 8,
    createdDate: '2025-11-10'
  },
  {
    id: 'B2',
    name: 'Gloves Bin A',
    gearType: 'Gloves',
    gearCount: 1,
    maxCapacity: 8,
    createdDate: '2025-11-10'
  },
  {
    id: 'B3',
    name: 'Boots Bin A',
    gearType: 'Boots',
    gearCount: 5,
    maxCapacity: 8,
    createdDate: '2025-11-09'
  },
  {
    id: 'B4',
    name: 'Jacket Bin A',
    gearType: 'Jacket',
    gearCount: 3,
    maxCapacity: 8,
    createdDate: '2025-11-08'
  },
  {
    id: 'B5',
    name: 'Mask Bin A',
    gearType: 'Mask',
    gearCount: 4,
    maxCapacity: 8,
    createdDate: '2025-11-07'
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
  
  const [newBinName, setNewBinName] = useState('');
  const [newBinType, setNewBinType] = useState('Helmet');

  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [page, setPage] = useState(0);
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState(5);
  const numberOfItemsPerPageList = [3, 4, 5, 6];

  // Pagination calculations
  const from = page * numberOfItemsPerPage;
  const to = Math.min((page + 1) * numberOfItemsPerPage, bins.length);

  // Filter bins based on search
  const filteredBins = bins.filter(bin => {
    const matchesSearch =
      bin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bin.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bin.gearType.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const currentBins = filteredBins.slice(from, to);

  useEffect(() => {
    setPage(0);
  }, [numberOfItemsPerPage, filteredBins.length]);

  const handleAddBin = () => {
    if (!newBinName.trim()) return;

    const newBin: Bin = {
      id: `B${bins.length + 1}`,
      name: newBinName,
      gearType: newBinType,
      gearCount: 0,
      maxCapacity: 8,
      createdDate: new Date().toISOString().split('T')[0]
    };

    setBins(prev => [...prev, newBin]);
    setNewBinName('');
    setNewBinType('Helmet');
    setAddBinDialog(false);
  };

  const handleCardPress = (bin: Bin) => {
    navigation.navigate('GearScreen', { load, bin });
  };

  const renderBinCard = (bin: Bin) => (
    <TouchableOpacity onPress={() => handleCardPress(bin)}>
      <Card key={bin.id} style={[styles.binCard, { backgroundColor: colors.surface }]}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.binMainRow}>
            <View style={styles.binInfo}>
              <Icon source="package-variant" size={p(20)} color={colors.primary} />
              <View style={styles.binText}>
                <Text variant="titleMedium" style={styles.binName}>
                  {bin.name}
                </Text>
                <Text variant="bodySmall" style={[styles.binDetails, { color: colors.onSurfaceVariant }]}>
                  {bin.gearType} • {bin.id} • Created: {bin.createdDate}
                </Text>
              </View>
            </View>
            
            <View style={styles.binMeta}>
              <View style={styles.gearCountContainer}>
                <Icon source="tools" size={p(16)} color={colors.primary} />
                <Text variant="bodyMedium" style={styles.gearCountText}>
                  {bin.gearCount}/{bin.maxCapacity}
                </Text>
              </View>
              <Icon source="chevron-right" size={p(20)} color={colors.onSurfaceVariant} />
            </View>
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
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title={`Bins - ${load.name}`}
        showBackButton={true}
      />

      {/* Load Info */}
      <Card style={[styles.loadInfoCard, { backgroundColor: colors.surface }]}>
        <Card.Content style={styles.loadInfoContent}>
          <View style={styles.loadInfoRow}>
            <Icon source="truck" size={p(18)} color={colors.primary} />
            <Text variant="titleSmall" style={styles.loadName}>
              {load.name}
            </Text>
          </View>
          <Text variant="bodySmall" style={[styles.loadDetails, { color: colors.onSurfaceVariant }]}>
            Total Bins: {bins.length} • Status: {load.status}
          </Text>
        </Card.Content>
      </Card>

      {/* 🔍 Search Section */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          mode="outlined"
          placeholder="Search by bin name, type, or ID"
          value={searchQuery}
          onChangeText={setSearchQuery}
          left={<TextInput.Icon icon="magnify" />}
          style={styles.searchInput}
          dense
        />
      </View>

      {/* Bins List */}
      <FlatList
        data={currentBins}
        renderItem={({ item }) => renderBinCard(item)}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      {/* Pagination at Bottom */}
      <View style={styles.paginationContainer}>
        <DataTable.Pagination
          page={page}
          numberOfPages={Math.ceil(filteredBins.length / numberOfItemsPerPage)}
          onPageChange={page => setPage(page)}
          label={`${from + 1}-${to} of ${filteredBins.length}`}
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
                  style={[
                    styles.gearTypeChip,
                    { 
                      backgroundColor: newBinType === type ? colors.primary : colors.surfaceVariant 
                    }
                  ]}
                  textStyle={{ 
                    color: newBinType === type ? '#fff' : colors.onSurfaceVariant 
                  }}
                >
                  {type}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  loadInfoCard: {
    margin: p(12),
    marginBottom: p(8),
    borderRadius: p(8),
    elevation: 1,
  },
  loadInfoContent: {
    paddingVertical: p(12),
    paddingHorizontal: p(16),
  },
  loadInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: p(4),
  },
  loadName: {
    fontWeight: '600',
    marginLeft: p(8),
  },
  loadDetails: {
    fontSize: p(12),
  },
  listContainer: {
    padding: p(12),
    paddingBottom: p(80),
  },
  searchContainer: {
    paddingHorizontal: p(12),
    paddingTop: p(8),
    paddingBottom: p(8),
  },
  searchInput: {
    marginBottom: p(0),
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
  binCard: {
    marginBottom: p(8),
    borderRadius: p(8),
    elevation: 1,
  },
  cardContent: {
    paddingVertical: p(12),
    paddingHorizontal: p(16),
  },
  binMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: p(8),
  },
  binInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  binText: {
    marginLeft: p(12),
    flex: 1,
  },
  binName: {
    fontWeight: '600',
    fontSize: p(14),
    lineHeight: p(18),
  },
  binDetails: {
    fontSize: p(11),
    marginTop: p(2),
  },
  binMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: p(8),
  },
  gearCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: p(4),
  },
  gearCountText: {
    fontSize: p(12),
    fontWeight: '500',
  },
  capacityBar: {
    height: p(6),
    backgroundColor: '#e0e0e0',
    borderRadius: p(3),
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: p(3),
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
  },
  gearTypeChip: {
    marginBottom: p(4),
  },
});