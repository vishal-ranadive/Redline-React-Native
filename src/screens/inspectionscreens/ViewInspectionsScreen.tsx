import React, { useMemo, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
import InspectionCard from '../../components/InspectionCard';

import useDebounce from '../../hooks/useDebounce';
import { InspectionItem } from '../../types/Inspection';

const p = (v: number) => v;

const MOCK_INSPECTIONS: InspectionItem[] = [
  {
    id: 'I-H001',
    title: 'Helmet',
    station: 'Station 12',
    inspector: 'John D.',
    date: '2025-11-10',
    count: 5,
    image: 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg?fcts=20210826055750&resizeid=7&resizeh=250&resizew=250',
  },
  {
    id: 'I-FB001',
    title: 'Fireboots',
    station: 'Station 12',
    inspector: 'John D.',
    date: '2025-11-10',
    count: 2,
    image: 'https://www.hacsons.com/wp-content/uploads/2024/08/image-3-1.png',
  },
  {
    id: 'I-G001',
    title: 'Gloves',
    station: 'Station 12',
    inspector: 'John D.',
    date: '2025-11-10',
    count: 3,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFDCux32MFLBioGWbYdOiDfJoCV4sko1-sSQ&s',
  },
];

export default function ViewInspectionsScreen() {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 250);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return MOCK_INSPECTIONS;
    return MOCK_INSPECTIONS.filter(i => i.title.toLowerCase().includes(q) || i.station.toLowerCase().includes(q) || i.id?.toLowerCase().includes(q));
  }, [debounced]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text variant="headlineSmall" style={[styles.header, { color: colors.primary }]}>View InProgess Inspections</Text>

   
        <Text
          variant="titleMedium"
          style={{ color: colors.primary, marginBottom: 4, textAlign: 'center', alignSelf: 'center' }}
        >
          Lead ID: {MOCK_INSPECTIONS[0]?.id ?? '—'}
        </Text>
        
   

      

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id || item.title}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => <InspectionCard item={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: p(12) },
  header: { textAlign: 'center', marginVertical: p(12) },
  search: { marginBottom: p(8) },
});