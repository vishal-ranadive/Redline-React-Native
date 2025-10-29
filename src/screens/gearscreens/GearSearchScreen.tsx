import React, { useMemo, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, TextInput, Button, useTheme, Icon } from 'react-native-paper';
import useDebounce from '../../hooks/useDebounce';
import GearCard from '../../components/GearCard';
import { GearItem } from '../../types/gears';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';

const p = (v: number) => v;

const MOCK_GEARS: GearItem[] = [
  { id: 'G001', name: 'Structural Helmet', category: 'Helmet', available: true, description: 'Heat resistant helmet', image: 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg?fcts=20210826055750&resizeid=7&resizeh=250&resizew=250' },
  { id: 'G002', name: 'Turnout Jacket', category: 'Jacket', available: true, description: 'Fire resistant coat', image: 'https://s7d9.scene7.com/is/image/minesafetyappliances/GlobeG-XCELJacket_gxcelJacket?$Home%20Market%20Card$' },
  { id: 'G003', name: 'Nomex Gloves', category: 'Gloves', available: false, description: 'Thermal protection', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFDCux32MFLBioGWbYdOiDfJoCV4sko1-sSQ&s' },
  { id: 'G004', name: 'Fire Boots', category: 'Boots', available: true, description: 'Steel toe boots', image: 'https://www.hacsons.com/wp-content/uploads/2024/08/image-3-1.png' },
  { id: 'G005', name: 'Hood', category: 'Hood', available: true, description: 'Thermal hood', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkw4nizmHCNS7sLbP0Cr5oL6OcBtaEEnfQFA&s' },
  { id: 'G006', name: 'SCBA Cylinder', category: 'Cylinder', available: false, description: 'Breathing apparatus cylinder', image: 'https://s7d9.scene7.com/is/image/minesafetyappliances/G1SCBACylinders_000010000800002001?$Home%20Market%20Card$' },
];

const CATEGORIES = ['All', 'Helmet', 'Jacket', 'Gloves', 'Boots', 'Hood', 'Cylinder'] as const;

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GearSearch'>;

export default function GearSearchScreen() {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('All');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const navigation = useNavigation<NavigationProp>();
  const filtered = useMemo(() => {
    return MOCK_GEARS.filter((g) => {
      const matchesSearch = g.name.toLowerCase().includes(debouncedSearch.trim().toLowerCase()) || g.id.includes(debouncedSearch.trim());
      const matchesCategory = category === 'All' ? true : g.category === category;
      const matchesAvailability = onlyAvailable ? g.available === true : true;
      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [debouncedSearch, category, onlyAvailable]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
    <View style={[styles.header]}>
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          contentStyle={{ flexDirection: 'row' }}
        >
          <Icon source="arrow-left" size={p(22)} color={colors.onSurface} />
        </Button>
        <Text style={[styles.title, { color: colors.onSurface }]}>Search Gear</Text>
        <Button
          mode="text"
          onPress={() => {}}
        >
          <Icon source="plus-circle" size={p(22)} color={colors.primary} />
        </Button>
      </View>
     

      <TextInput
        mode="outlined"
        placeholder="Search by name or ID"
        value={search}
        onChangeText={setSearch}
        left={<TextInput.Icon icon="magnify" />}
        style={styles.search}
        activeOutlineColor={colors.primary}
      />

      <View style={styles.filterRow}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i) => i}
          renderItem={({ item }) => (
            <Button
              mode={item === category ? 'contained' : 'outlined'}
              onPress={() => setCategory(item)}
              style={styles.catButton}
              labelStyle={styles.catLabel}
              compact
            >
              {item}
            </Button>
          )}
        />
        {/* <Button
          mode={onlyAvailable ? 'contained' : 'outlined'}
          onPress={() => setOnlyAvailable((s) => !s)}
          style={styles.availButton}
        >
          Available
        </Button> */}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => <GearCard gear={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: p(18), fontWeight: 'bold' },
  container: { flex: 1, padding: p(12) },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: p(12),
      paddingTop: p(10),
    },
  search: { marginBottom: p(8) },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: p(8) },
  catButton: { marginRight: p(8), borderRadius: p(16) },
  catLabel: { fontSize: p(12) },
  availButton: { marginLeft: 'auto' },
  grid: { paddingBottom: p(120) },
});

