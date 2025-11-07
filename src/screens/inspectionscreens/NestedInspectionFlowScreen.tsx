import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, Button, Icon, useTheme, Chip, Portal, Dialog, TextInput, DataTable } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../../components/common/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Mock data structure
const MOCK_DATA = {
  loads: [
    {
      id: 'L1',
      name: 'Load 1 - Emergency Response',
      status: 'Scanning',
      bins: [
        {
          id: 'B1',
          name: 'Helmet Bin A',
          gearType: 'Helmet',
          status: 'Pending',
          gears: [
            { id: 'G1', name: 'Helmet A', status: 'Pass', lastInspection: '2025-11-01', imageUrl: 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg' },
            { id: 'G2', name: 'Helmet B', status: 'Repair', lastInspection: '2025-11-01', imageUrl: 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg' },
          ]
        },
        {
          id: 'B2', 
          name: 'Gloves Bin A',
          gearType: 'Gloves',
          status: 'Done',
          gears: [
            { id: 'G3', name: 'Gloves A', status: 'Pass', lastInspection: '2025-11-02', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFDCux32MFLBioGWbYdOiDfJoCV4sko1-sSQ&s' },
          ]
        }
      ]
    },
    {
      id: 'L2',
      name: 'Load 2 - Training Equipment',
      status: 'Partially',
      bins: [
        {
          id: 'B3',
          name: 'Boots Bin A',
          gearType: 'Boots',
          status: 'Issue',
          gears: [
            { id: 'G4', name: 'Boots A', status: 'Expired', lastInspection: '2025-10-28', imageUrl: 'https://www.hacsons.com/wp-content/uploads/2024/08/image-3-1.png' },
            { id: 'G5', name: 'Boots B', status: 'RECOMMEND OOS', lastInspection: '2025-10-28', imageUrl: 'https://www.hacsons.com/wp-content/uploads/2024/08/image-3-1.png' },
          ]
        }
      ]
    },
    {
      id: 'L3',
      name: 'Load 3 - Training Equipment',
      status: 'Attention',
      bins: [
        {
          id: 'B3',
          name: 'Boots Bin A',
          gearType: 'Boots',
          status: 'Issue',
          gears: [
            { id: 'G4', name: 'Boots A', status: 'Expired', lastInspection: '2025-10-28', imageUrl: 'https://www.hacsons.com/wp-content/uploads/2024/08/image-3-1.png' },
            { id: 'G5', name: 'Boots B', status: 'RECOMMEND OOS', lastInspection: '2025-10-28', imageUrl: 'https://www.hacsons.com/wp-content/uploads/2024/08/image-3-1.png' },
          ]
        }
      ]
    },
    {
      id: 'L4',
      name: 'Load 4 - Training Equipment',
      status: 'Completed',
      bins: [
        {
          id: 'B3',
          name: 'Boots Bin A',
          gearType: 'Boots',
          status: 'Issue',
          gears: [
            { id: 'G4', name: 'Boots A', status: 'Expired', lastInspection: '2025-10-28', imageUrl: 'https://www.hacsons.com/wp-content/uploads/2024/08/image-3-1.png' },
            { id: 'G5', name: 'Boots B', status: 'RECOMMEND OOS', lastInspection: '2025-10-28', imageUrl: 'https://www.hacsons.com/wp-content/uploads/2024/08/image-3-1.png' },
          ]
        }
      ]
    }
  ]
};

type LoadStatus = 'Scanning' | 'Partially' | 'Ready' | 'Completed' | 'Attention';
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
  gears: Gear[];
};

type Load = {
  id: string;
  name: string;
  status: LoadStatus;
  bins: Bin[];
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'UpadateInspection'>;

// Available gear types for dropdown
const GEAR_TYPES = ['Helmet', 'Gloves', 'Boots', 'Jacket', 'Mask', 'Harness', 'Axe', 'Hose'];

export default function NestedInspectionFlowScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  
  const [expandedLoad, setExpandedLoad] = useState<string | null>(null);
  const [expandedBin, setExpandedBin] = useState<string | null>(null);
  const [loads, setLoads] = useState<Load[]>(MOCK_DATA.loads);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState(2);
  const numberOfItemsPerPageList = [2, 3, 4];

  // Dialogs state
  const [addLoadDialog, setAddLoadDialog] = useState(false);
  const [addBinDialog, setAddBinDialog] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: 'load' | 'bin', id: string} | null>(null);
  
  // Form state
  const [newLoadName, setNewLoadName] = useState('');
  const [newLoadStatus, setNewLoadStatus] = useState<LoadStatus>('Scanning');
  const [binsToAdd, setBinsToAdd] = useState<Array<{name: string; gearType: string}>>([{ name: '', gearType: 'Helmet' }]);
  
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [newBinName, setNewBinName] = useState('');
  const [newBinType, setNewBinType] = useState('Helmet');
  const [newBinStatus, setNewBinStatus] = useState<BinStatus>('Pending');

  // Pagination calculations
  const from = page * numberOfItemsPerPage;
  const to = Math.min((page + 1) * numberOfItemsPerPage, loads.length);
  const currentLoads = loads.slice(from, to);

  useEffect(() => {
    setPage(0);
  }, [numberOfItemsPerPage]);

  // API call simulation - uncomment when ready
  /*
  const fetchLoads = async (page: number, pageSize: number) => {
    try {
      // const response = await api.get(`/loads?page=${page}&page_size=${pageSize}`);
      // setLoads(response.data.loads);
      console.log('API Call - Fetch loads:', { page, pageSize });
    } catch (error) {
      console.error('Error fetching loads:', error);
    }
  };

  useEffect(() => {
    fetchLoads(page + 1, numberOfItemsPerPage);
  }, [page, numberOfItemsPerPage]);
  */

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

  const getBinStatusColor = (status: BinStatus) => {
    switch (status) {
      case 'Pending': return '#FFB300';
      case 'Done': return '#4CAF50';
      case 'Issue': return '#E53935';
      default: return '#9E9E9E';
    }
  };

  const getGearStatusColor = (status: GearStatus) => {
    switch (status) {
      case 'Pass': return '#4CAF50';
      case 'Repair': return '#FF9800';
      case 'Expired': return '#E53935';
      case 'RECOMMEND OOS': return '#9C27B0';
      default: return '#9E9E9E';
    }
  };

  // Generate unique names
  const generateLoadName = (baseName: string) => {
    const existingNames = loads.map(load => load.name);
    let counter = 1;
    let newName = baseName;
    
    while (existingNames.includes(newName)) {
      newName = `${baseName} ${counter}`;
      counter++;
    }
    
    return newName;
  };

  const generateBinName = (loadId: string, gearType: string) => {
    const load = loads.find(l => l.id === loadId);
    const existingBinNames = load?.bins.map(bin => bin.name) || [];
    let counter = 1;
    let newName = `${gearType} Bin`;
    
    while (existingBinNames.includes(newName)) {
      newName = `${gearType} Bin ${counter}`;
      counter++;
    }
    
    return newName;
  };

  // Add new load with bins
  const handleAddLoad = () => {
    if (!newLoadName.trim()) {
      Alert.alert('Error', 'Please enter a load name');
      return;
    }

    const validBins = binsToAdd.filter(bin => bin.name.trim() && bin.gearType);
    if (validBins.length === 0) {
      Alert.alert('Error', 'Please add at least one valid bin');
      return;
    }

    const newLoad: Load = {
      id: `L${loads.length + 1}`,
      name: generateLoadName(newLoadName),
      status: newLoadStatus,
      bins: validBins.map((bin, index) => ({
        id: `B${Date.now()}${index}`,
        name: bin.name,
        gearType: bin.gearType,
        status: 'Pending' as BinStatus,
        gears: []
      }))
    };

    setLoads(prev => [...prev, newLoad]);
    
    // Reset form
    setNewLoadName('');
    setNewLoadStatus('Scanning');
    setBinsToAdd([{ name: '', gearType: 'Helmet' }]);
    setAddLoadDialog(false);
    
    // API call simulation - uncomment when ready
    /*
    try {
      // await api.post('/loads', newLoad);
      console.log('API Call - Add load:', newLoad);
    } catch (error) {
      console.error('Error adding load:', error);
    }
    */
  };

  // Add new bin to a load
  const handleAddBin = () => {
    if (!selectedLoadId || !newBinName.trim()) {
      Alert.alert('Error', 'Please enter bin name and select gear type');
      return;
    }

    const newBin: Bin = {
      id: `B${Date.now()}`,
      name: newBinName,
      gearType: newBinType,
      status: newBinStatus,
      gears: []
    };

    setLoads(prev => prev.map(load => 
      load.id === selectedLoadId 
        ? { ...load, bins: [...load.bins, newBin] }
        : load
    ));

    // Reset form
    setNewBinName('');
    setNewBinType('Helmet');
    setNewBinStatus('Pending');
    setAddBinDialog(false);
    setSelectedLoadId(null);
  };

  // Add gear to a bin
  const handleAddGear = (loadId: string, binId: string) => {
    setLoads(prev => prev.map(load => {
      if (load.id === loadId) {
        const updatedBins = load.bins.map(bin => {
          if (bin.id === binId && bin.gears.length < 8) {
            const newGear: Gear = {
              id: `G${Date.now()}`,
              name: `${bin.gearType} ${bin.gears.length + 1}`,
              status: 'Pass',
              lastInspection: new Date().toISOString().split('T')[0],
              imageUrl: getDefaultImage(bin.gearType)
            };
            return { ...bin, gears: [...bin.gears, newGear] };
          }
          return bin;
        });
        return { ...load, bins: updatedBins };
      }
      return load;
    }));
  };

  // Delete load or bin
  const handleDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'load') {
      setLoads(prev => prev.filter(load => load.id !== itemToDelete.id));
    } else if (itemToDelete.type === 'bin' && selectedLoadId) {
      setLoads(prev => prev.map(load => 
        load.id === selectedLoadId 
          ? { ...load, bins: load.bins.filter(bin => bin.id !== itemToDelete.id) }
          : load
      ));
    }

    setDeleteConfirmDialog(false);
    setItemToDelete(null);
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

  // Bin management in add load form
  const addBinField = () => {
    setBinsToAdd(prev => [...prev, { name: '', gearType: 'Helmet' }]);
  };

  const removeBinField = (index: number) => {
    if (binsToAdd.length > 1) {
      setBinsToAdd(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateBinField = (index: number, field: 'name' | 'gearType', value: string) => {
    setBinsToAdd(prev => prev.map((bin, i) => 
      i === index ? { ...bin, [field]: value } : bin
    ));
  };

  const renderGearCard = (gear: Gear, loadId: string, binId: string) => (
    <Card 
      key={gear.id}
      style={[styles.gearCard, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('UpadateInspection',)}
    >
      <Card.Content style={styles.gearContent}>
        <View style={styles.gearImageContainer}>
          <Card.Cover source={{ uri: gear.imageUrl }} style={styles.gearImage} />
          <Chip 
            style={[styles.statusChip, { backgroundColor: getGearStatusColor(gear.status) }]}
            textStyle={{ color: '#fff', fontSize: p(12), fontWeight: '600' }}
          >
            {gear.status}
          </Chip>
        </View>
        
        <View style={styles.gearInfo}>
          <Text variant="titleMedium" style={{ fontWeight: '600', fontSize: p(16) }}>
            {gear.name}
          </Text>
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, fontSize: p(14) }}>
            Last: {gear.lastInspection}
          </Text>
          
          <View style={styles.gearActions}>
            <Button 
              mode="outlined" 
              compact
              onPress={() => navigation.navigate('GearDetail')}
              icon="eye-outline"
            >
              View
            </Button>
            <Button 
              mode="contained" 
              compact
              onPress={() => navigation.navigate('UpadateInspection')}
              icon="check-circle-outline"
            >
              Inspect
            </Button>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderBinCard = (bin: Bin, loadId: string) => (
    <Card key={bin.id} style={[styles.binCard, { backgroundColor: colors.surface }]}>
      <Card.Content>
        <View style={styles.binHeader}>
          <View style={styles.binTitle}>
            <Icon source="package-variant" size={p(20)} color={colors.primary} />
            <View style={styles.binText}>
              <Text variant="titleMedium" style={{ fontWeight: '600', fontSize: p(18) }}>
                {bin.name}
              </Text>
              <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, fontSize: p(14) }}>
                Type: {bin.gearType}
              </Text>
            </View>
          </View>
          <View style={styles.binHeaderRight}>
            <Chip 
              style={{ backgroundColor: getBinStatusColor(bin.status) }}
              textStyle={{ color: '#fff', fontWeight: '600', fontSize: p(12) }}
            >
              {bin.status}
            </Chip>
            <Button
              mode="text"
              compact
              onPress={() => {
                setItemToDelete({ type: 'bin', id: bin.id });
                setSelectedLoadId(loadId);
                setDeleteConfirmDialog(true);
              }}
              icon="delete"
              textColor={colors.error}
              {...({} as any)}
            >
              {/* Delete */}
            </Button>
          </View>
        </View>

        <View style={styles.binStats}>
          <Chip compact mode="outlined">
            {bin.gears.length}/8 gears
          </Chip>
          {bin.gears.length < 8 && (
            <Button
              mode="contained-tonal"
              compact
              onPress={() => handleAddGear(loadId, bin.id)}
              icon="plus"
              style={styles.addButton}
            >
              Add Gear
            </Button>
          )}
        </View>

        <Button
          mode="text"
          onPress={() => setExpandedBin(expandedBin === bin.id ? null : bin.id)}
          style={styles.expandButton}
        >
          <Icon 
            source={expandedBin === bin.id ? "chevron-up" : "chevron-down"} 
            size={p(20)} 
          />
          {expandedBin === bin.id ? 'Hide Gears' : `Show Gears (${bin.gears.length})`}
        </Button>

        {expandedBin === bin.id && (
          <View style={styles.gearsContainer}>
            {bin.gears.length > 0 ? (
              bin.gears.map(gear => renderGearCard(gear, loadId, bin.id))
            ) : (
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                No gears in this bin. Click 'Add Gear' to add gears.
              </Text>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderLoadCard = (load: Load) => (
    <Card key={load.id} style={[styles.loadCard, { backgroundColor: colors.surface }]}>
      <Card.Content>
        <View style={styles.loadHeader}>
          <View style={styles.loadTitle}>
            <Icon source="truck" size={p(24)} color={colors.primary} />
            <View style={styles.loadText}>
              <Text variant="titleLarge" style={{ fontWeight: '700', fontSize: p(20) }}>
                {load.name}
              </Text>
              <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, fontSize: p(16) }}>
                Load ID: {load.id}
              </Text>
            </View>
          </View>
          <View style={styles.loadHeaderRight}>
            <Chip 
              style={{ backgroundColor: getLoadStatusColor(load.status) }}
              textStyle={{ color: '#fff', fontWeight: '600' }}
            >
              {load.status}
            </Chip>
            <Button
                mode="text"
                compact
                onPress={() => {
                    setItemToDelete({ type: 'load', id: load.id });
                    setDeleteConfirmDialog(true);
                }}
                icon="delete"
                textColor={colors.error}
                {...({} as any)}
            />
          </View>
        </View>

        <View style={styles.loadStats}>
          <View style={styles.stat}>
            <Text variant="titleMedium" style={{ fontWeight: '600', fontSize: p(18) }}>
              {load.bins.length}
            </Text>
            <Text variant="bodySmall" style={{ fontSize: p(14) }}>Bins</Text>
          </View>
          <View style={styles.stat}>
            <Text variant="titleMedium" style={{ fontWeight: '600', fontSize: p(18) }}>
              {load.bins.reduce((total, bin) => total + bin.gears.length, 0)}
            </Text>
            <Text variant="bodySmall" style={{ fontSize: p(14) }}>Gears</Text>
          </View>
          <View style={styles.stat}>
            <Button
              mode="outlined"
              compact
              onPress={() => {
                setSelectedLoadId(load.id);
                setAddBinDialog(true);
              }}
              icon="plus"
            >
              Add Bin
            </Button>
          </View>
        </View>

        <Button
          mode="outlined"
          onPress={() => setExpandedLoad(expandedLoad === load.id ? null : load.id)}
          style={styles.expandButton}
          icon={expandedLoad === load.id ? "chevron-up" : "chevron-down"}
        >
          {expandedLoad === load.id ? 'Hide Bins' : `View Bins (${load.bins.length})`}
        </Button>

        {expandedLoad === load.id && (
          <View style={styles.binsContainer}>
            {load.bins.length > 0 ? (
              load.bins.map(bin => renderBinCard(bin, load.id))
            ) : (
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                No bins in this load. Click 'Add Bin' to create one.
              </Text>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title="View Inspections Loads"
      />

      {/* Current Loads List */}
      <FlatList
        data={currentLoads}
        renderItem={({ item }) => renderLoadCard(item)}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      {/* Add New Button */}


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

        <View >
        <Button
          mode="contained"
          onPress={() => setAddLoadDialog(true)}
          icon="plus"
          style={styles.floatingAddButton}
          contentStyle={styles.floatingAddButtonContent}
        >
          Add New Load
        </Button>
      </View>
      </View>

      {/* Add Load Dialog */}
      <Portal>
        <Dialog visible={addLoadDialog} onDismiss={() => setAddLoadDialog(false)} style={styles.dialog}>
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

            <Text variant="titleSmall" style={[styles.sectionLabel, { color: colors.onSurface }]}>
              Bins Configuration
            </Text>
            {binsToAdd.map((bin, index) => (
              <View key={index} style={styles.binFormRow}>
                <TextInput
                  label={`Bin Name ${index + 1}`}
                  value={bin.name}
                  onChangeText={(value) => updateBinField(index, 'name', value)}
                  mode="outlined"
                  placeholder="e.g., Helmet Bin A"
                  style={[styles.input, styles.binNameInput]}
                />
                <View style={styles.binTypeContainer}>
                  <TextInput
                    label="Gear Type"
                    value={bin.gearType}
                    onChangeText={(value) => updateBinField(index, 'gearType', value)}
                    mode="outlined"
                    style={styles.binTypeInput}
                    render={props => (
                      <TextInput.Icon 
                        icon="menu-down" 
                        onPress={() => {}} // Would open dropdown in real implementation
                      />
                    )}
                  />
                  {binsToAdd.length > 1 && (
                    <Button
                      mode="text"
                      compact
                      onPress={() => removeBinField(index)}
                      icon="close"
                      textColor={colors.error}
                      style={styles.removeBinButton}
                      {...({} as any)}
                    />
                  )}
                </View>
              </View>
            ))}
            <Button
              mode="outlined"
              onPress={addBinField}
              icon="plus"
              style={styles.addBinFieldButton}
            >
              Add Another Bin
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddLoadDialog(false)}>Cancel</Button>
            <Button onPress={handleAddLoad}>Add Load</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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
              placeholder="e.g., Helmet Bin B"
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
            <Text>
              Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteConfirmDialog(false)}>Cancel</Button>
            <Button onPress={handleDelete} textColor={colors.error}>Delete</Button>
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
    paddingBottom: p(120), // Extra space for buttons and pagination
  },
  addButtonContainer: {
    position: 'absolute',
    right: p(20),
    bottom: p(90), // Above pagination
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
    display:'flex',
    flexDirection:'row',
    alignItems:'center',
    justifyContent:"space-evenly",
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
        marginBottom: p(50),
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
  loadHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: p(8),
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: p(12),
    padding: p(12),
    backgroundColor: '#f8f9fa',
    borderRadius: p(8),
  },
  stat: {
    alignItems: 'center',
  },
  expandButton: {
    marginTop: p(8),
  },
  binsContainer: {
    marginTop: p(12),
    gap: p(12),
  },
  binCard: {
    borderRadius: p(8),
    elevation: 1,
  },
  binHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: p(8),
  },
  binHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: p(8),
  },
  binTitle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  binText: {
    marginLeft: p(8),
    flex: 1,
  },
  binStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: p(8),
  },
  addButton: {
    marginLeft: p(8),
  },
  gearsContainer: {
    marginTop: p(12),
    gap: p(8),
  },
  gearCard: {
    borderRadius: p(8),
    elevation: 1,
  },
  gearContent: {
    flexDirection: 'row',
  },
  gearImageContainer: {
    position: 'relative',
    marginRight: p(12),
  },
  gearImage: {
    width: p(80),
    height: p(80),
    borderRadius: p(8),
  },
  statusChip: {
    position: 'absolute',
    top: p(4),
    right: p(4),
  },
  gearInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  gearActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: p(8),
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    padding: p(16),
    fontSize: p(14),
  },
  dialog: {
    maxHeight: '80%',
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
  binFormRow: {
    flexDirection: 'row',
    gap: p(8),
    marginBottom: p(8),
    alignItems: 'flex-end',
  },
  binNameInput: {
    flex: 2,
  },
  binTypeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: p(4),
  },
  binTypeInput: {
    flex: 1,
  },
  removeBinButton: {
    marginBottom: p(8),
  },
  addBinFieldButton: {
    marginTop: p(8),
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
});