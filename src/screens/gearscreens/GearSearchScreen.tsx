// src/screens/gearscreens/GearSearchScreen.tsx
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, TextInput, Button, useTheme, Icon, Chip } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import useDebounce from '../../hooks/useDebounce';
import GearCard from '../../components/GearCard';
import { GearItem } from '../../types/gears';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { p } from '../../utils/responsive';
// const p = (v: number) => v * 1.125; // Slight scale up for better visibility

const MOCK_GEARS: GearItem[] = [
  {
    id: 'G001',
    name: 'Structural Helmet',
    category: 'Helmet',
    available: true,
    description: 'Heat resistant helmet',
    image: 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg?fcts=20210826055750&resizeid=7&resizeh=250&resizew=250',
  },
  {
    id: 'G0012',
    name: 'Structural Helmet',
    category: 'Helmet',
    available: true,
    description: 'Heat resistant helmet',
    image: 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg?fcts=20210826055750&resizeid=7&resizeh=250&resizew=250',
  },
  {
    id: 'G002',
    name: 'Turnout Jacket',
    category: 'Jacket',
    available: true,
    description: 'Fire resistant coat',
    image: 'https://s7d9.scene7.com/is/image/minesafetyappliances/GlobeG-XCELJacket_gxcelJacket?$Home%20Market%20Card$',
  },
  {
    id: 'G003',
    name: 'Nomex Gloves',
    category: 'Gloves',
    available: false,
    description: 'Thermal protection',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFDCux32MFLBioGWbYdOiDfJoCV4sko1-sSQ&s',
  },
  {
    id: 'G004',
    name: 'Fire Boots',
    category: 'Boots',
    available: true,
    description: 'Steel toe boots',
    image: 'https://www.hacsons.com/wp-content/uploads/2024/08/image-3-1.png',
  },
  {
    id: 'G005',
    name: 'Hood',
    category: 'Hood',
    available: true,
    description: 'Thermal hood',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkw4nizmHCNS7sLbP0Cr5oL6OcBtaEEnfQFA&s',
  },
  {
    id: 'G006',
    name: 'SCBA Cylinder',
    category: 'Cylinder',
    available: false,
    description: 'Breathing apparatus cylinder',
    image: 'https://s7d9.scene7.com/is/image/minesafetyappliances/G1SCBACylinders_000010000800002001?$Home%20Market%20Card$',
  },
];

const CATEGORIES = ['All', 'Helmet', 'Jacket', 'Gloves', 'Boots', 'Hood', 'Cylinder'] as const;

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GearSearch'>;

export default function GearSearchScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const filtered = useMemo(() => {
    return MOCK_GEARS.filter(g => {
      const matchesSearch =
        g.name.toLowerCase().includes(debouncedSearch.trim().toLowerCase()) ||
        g.id.includes(debouncedSearch.trim());
      const matchesCategory = category === 'All' ? true : g.category === category;
      const matchesAvailability = onlyAvailable ? g.available : true;
      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [debouncedSearch, category, onlyAvailable]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            marginTop: insets.top + p(4),
            backgroundColor: colors.surface,
            borderBottomColor: colors.outline,
          },
        ]}
      >
        <Button mode="text" onPress={() => navigation.goBack()} contentStyle={{ flexDirection: 'row' }}>
          <Icon source="arrow-left" size={p(22)} color={colors.onSurface} />
        </Button>
        <Text style={[styles.title, { color: colors.onSurface }]}>Search Gear</Text>
        <Button mode="text" onPress={() => navigation.navigate('AddGear')}>
          <Icon source="plus-circle" size={p(22)} color={colors.primary} />
          <Text style={[styles.title, { color: colors.onSurface }]}>Add Gear</Text>
        </Button>
      </View>

      {/* Search Bar */}
      <TextInput
        mode="outlined"
        placeholder="Search by name or ID"
        value={search}
        onChangeText={setSearch}
        left={<TextInput.Icon icon="magnify" />}
        style={styles.search}
        activeOutlineColor={colors.primary}
      />
<View >

      {/* Category Chips */}
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
          paddingVertical: p(1), // ✅ reduce inner vertical spacing
        },
      ]}
      textStyle={{
        color: item === category ? colors.onPrimary : colors.onSurface,
        fontSize: p(16),
        lineHeight: p(20),
      }}
      selectedColor={colors.onPrimary} // ✅ makes tick white on selected
    >
      {item}
    </Chip>
  )}
/>

</View>


{/* 🧤 Gear Grid Section */}
<View style={styles.gridContainer}>
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
      onPress={() => navigation.navigate('GearDetail')}
    />
  </View>
  )}
    ListEmptyComponent={
      <Text style={styles.emptyText}>No gear found</Text>
    }
    showsVerticalScrollIndicator={false}
  />
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
  title: { fontSize: p(18), fontWeight: '700' },
  search: { marginHorizontal: p(16), marginTop: p(10) },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: p(10),
    marginVertical: p(10),
  },
chip: {
  marginRight: p(8),
  borderRadius: p(20),
  height: p(34), // ✅ gives uniform chip height
},




    gridContainer: {
  flex: 1,
  paddingHorizontal: p(4),
  // marginTop: p(4),
},
grid: {
  justifyContent: 'space-between',
  paddingBottom: p(20),
},
emptyText: {
  textAlign: 'center',
  color: '#999',
  fontSize: p(16),
  marginTop: p(40),
},
});
