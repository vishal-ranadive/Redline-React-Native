// src/screens/gearscreens/GearSearchScreen.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, TextInput, Button, useTheme, Icon, Chip, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import useDebounce from '../../hooks/useDebounce';
import GearCard from '../../components/GearCard';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { p } from '../../utils/responsive';
import { useGearStore } from '../../store/gearStore';
import { useLeadStore } from '../../store/leadStore';

// Import gear images
const gearImages = {
  Helmet: require('../../assets/jacket1.png'),
  'Fire Jacket': require('../../assets/jacket2.png'),
  'Fire Gloves': require('../../assets/jacket3.png'),
  'Fire Boots': require('../../assets/jacketScanning.png'),
  Respirator: require('../../assets/jacket1.png'),
  Harness: require('../../assets/jacket2.png'),
  'Fire Axe': require('../../assets/jacket3.png'),
  'Fire Hose': require('../../assets/jacketScanning.png'),
  'Protective Pants': require('../../assets/jacket1.png'),
  'Thermal Imaging Camera': require('../../assets/jacket2.png'),
  default: require('../../assets/jacketScanning.png'),
};

const CATEGORIES = ['All', 'Helmet', 'Fire Jacket', 'Fire Gloves', 'Fire Boots', 'Respirator', 'Harness', 'Fire Axe', 'Fire Hose', 'Protective Pants', 'Thermal Imaging Camera'] as const;

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GearSearch', 'AddGear'>;

export default function GearSearchScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  
  // Stores
  const { gears, loading, searchGears, clearGears, error } = useGearStore();
  const { currentLead } = useLeadStore();
  
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Fetch all gears when screen loads initially
  useEffect(() => {
    const fetchInitialGears = async () => {
      console.log('🔄 Fetching all gears on initial load');
      try {
        // Call searchGears with empty params to get all gears
        await searchGears({});
        setInitialLoad(false);
      } catch (error) {
        console.log('❌ Error fetching initial gears:', error);
        setInitialLoad(false);
      }
    };

    fetchInitialGears();
  }, []);

  // Search gears when debounced search changes
  useEffect(() => {
    console.log('🔄 Search effect triggered, debouncedSearch:', debouncedSearch);
    
    if (debouncedSearch.trim()) {
      const searchParams: any = {
        gear_name: debouncedSearch.trim()
      };
      console.log('🔍 Calling searchGears with params:', searchParams);
      searchGears(searchParams);
    } else if (!initialLoad) {
      // If search is cleared and not initial load, fetch all gears again
      console.log('🔍 Fetching all gears (search cleared)');
      searchGears({});
    }
  }, [debouncedSearch, initialLoad]);

  // Debug when gears change
  useEffect(() => {
    console.log('📦 Gears updated:', gears.length, 'items');
    console.log('📦 Loading state:', loading);
    console.log('📦 Error state:', error);
  }, [gears, loading, error]);

  // Convert API gear data to GearItem format for GearCard
  const formattedGears = useMemo(() => {
    console.log('🔄 Formatting gears:', gears.length);
    return gears.map(gear => ({
      id: gear.gear_id.toString(),
      name: gear.gear_name,
      category: gear?.gear_type?.gear_type,
      available: gear.active_status,
      description: `Serial: ${gear.serial_number}`,
      image: gearImages[gear?.gear_type?.gear_type as keyof typeof gearImages] || gearImages?.default,
      gearData: gear // Pass full gear data for navigation
    }));
  }, [gears]);

  // Filter by category and availability
  const filtered = useMemo(() => {
    console.log('🔄 Filtering gears:', formattedGears.length, 'items');
    const result = formattedGears.filter(g => {
      const matchesCategory = category === 'All' ? true : g.category === category;
      const matchesAvailability = onlyAvailable ? g.available : true;
      return matchesCategory && matchesAvailability;
    });
    console.log('🔄 Filtered result:', result.length, 'items');
    return result;
  }, [formattedGears, category, onlyAvailable]);

  const handleGearPress = (gear: any) => {
    console.log('🎯 Gear pressed:', gear.gearData.gear_id);
    navigation.navigate('GearDetail', { 
      gear_id: gear.gearData.gear_id
    });
  };

  const handleAddGear = () => {
    if (!currentLead) {
      console.log('❌ No current lead, cannot add gear');
      // Show error or navigate to lead selection
      return;
    }
    console.log('➕ Navigating to AddGear');
    navigation.navigate('AddGear');
  };

  const handleRefresh = () => {
    console.log('🔄 Manual refresh - fetching all gears');
    searchGears({});
  };

  console.log("🔍 Current gears state:", gears.length);
  console.log("🔍 Loading:", loading);
  console.log("🔍 Error:", error);
  console.log("🔍 Initial load:", initialLoad);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.outline,
          },
        ]}
      >
        <Button mode="text" onPress={() => navigation.goBack()} contentStyle={{ flexDirection: 'row' }}>
          <Icon source="arrow-left" size={p(22)} color={colors.onSurface} />
        </Button>
        <Text style={[styles.title, { color: colors.onSurface }]}>Search Gear</Text>
        <View style={styles.headerActions}>
          <Button mode="text" onPress={handleRefresh} disabled={loading}>
            <Icon source="refresh" size={p(22)} color={loading ? colors.onSurfaceVariant : colors.primary} />
          </Button>
          <Button mode="text" onPress={handleAddGear}>
            <Icon source="plus-circle" size={p(22)} color={colors.primary} />
            <Text style={[styles.addButtonText, { color: colors.primary }]}>Add</Text>
          </Button>
        </View>
      </View>

      {/* Search Bar */}
      <TextInput
        mode="outlined"
        placeholder="Search by gear name..."
        value={search}
        onChangeText={setSearch}
        left={<TextInput.Icon icon="magnify" />}
        style={styles.search}
        activeOutlineColor={colors.primary}
        outlineColor={colors.outline}
      />

      {/* Category Chips */}
      <View>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          keyExtractor={i => i}
          renderItem={({ item }) => (
            <Chip
              mode={item === category ? 'flat' : 'outlined'}
              selected={item === category}
              onPress={() => setCategory(item)}
              style={[
                styles.chip,
                {
                  backgroundColor: item === category ? colors.primary : 'transparent',
                  borderColor: colors.outline,
                  paddingVertical: p(1),
                },
              ]}
              textStyle={{
                color: item === category ? colors.onPrimary : colors.onSurface,
                fontSize: p(16),
                lineHeight: p(20),
              }}
              selectedColor={colors.onPrimary}
            >
              {item}
            </Chip>
          )}
        />
      </View>

      {/* Error Display */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.errorContainer }]}>
          <Icon source="alert-circle" size={p(20)} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.onErrorContainer }]}>
            Error: {error}
          </Text>
        </View>
      )}

      {/* Loading Indicator */}
      {(loading || initialLoad) && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {initialLoad ? 'Loading gears...' : 'Searching gears...'}
          </Text>
        </View>
      )}

      {/* Gear Grid Section */}
      <View style={styles.gridContainer}>
        {!loading && !initialLoad && !error && (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: p(8) }}
            renderItem={({ item }) => (
              <View style={{ flex: 1, margin: p(8), maxWidth: '48%' }}>
                <GearCard
                  gear={item}
                  onPress={() => handleGearPress(item)}
                />
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon source="magnify" size={p(48)} color={colors.onSurfaceVariant} />
                <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                  {search ? 'No gears found' : 'No gears available'}
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.onSurfaceVariant }]}>
                  {search ? 'Try a different search term' : 'Add a new gear to get started'}
                </Text>
                {!search && (
                  <Button 
                    mode="contained" 
                    onPress={handleAddGear}
                    style={styles.emptyActionButton}
                    buttonColor={colors.primary}
                  >
                    Add First Gear
                  </Button>
                )}
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: p(20),
    paddingVertical: p(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: { 
    fontSize: p(18), 
    fontWeight: '700' 
  },
  addButtonText: {
    fontSize: p(14),
    fontWeight: '600',
  },
  search: { 
    marginHorizontal: p(16), 
    marginTop: p(10),
    fontSize: p(16),
  },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: p(10),
    marginVertical: p(10),
  },
  chip: {
    marginRight: p(8),
    borderRadius: p(20),
    height: p(34),
  },
  gridContainer: {
    flex: 1,
    paddingHorizontal: p(4),
  },
  grid: {
    justifyContent: 'space-between',
    paddingBottom: p(20),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: p(16),
    fontSize: p(16),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: p(32),
  },
  emptyText: {
    fontSize: p(18),
    fontWeight: '600',
    marginTop: p(16),
    marginBottom: p(8),
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: p(14),
    textAlign: 'center',
    marginBottom: p(16),
  },
  emptyActionButton: {
    borderRadius: p(8),
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: p(12),
    margin: p(16),
    borderRadius: p(8),
    gap: p(8),
  },
  errorText: {
    fontSize: p(14),
    flex: 1,
  },
});