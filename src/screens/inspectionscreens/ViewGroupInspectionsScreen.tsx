import React, { useMemo, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Button, Icon, Text, TextInput, useTheme } from 'react-native-paper';
import InspectionCard from '../../components/InspectionCard';

import useDebounce from '../../hooks/useDebounce';
import { GroupInspectionItem } from '../../types/Inspection';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';


const p = (v: number) => v;
 
const MOCK_INSPECTIONS: GroupInspectionItem[] = [
  {
    id: 'I-H001',
    title: 'Helmet',
    station: 'Station 12',
    inspector: 'John D.',
    date: '2025-11-10',
    type: 'Helmet',
    count: 5,
    image: 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg?fcts=20210826055750&resizeid=7&resizeh=250&resizew=250',
  },
  {
    id: 'I-FB001',
    title: 'Fireboots',
    station: 'Station 12',
    inspector: 'John D.',
    type: 'Boots',
    date: '2025-11-10',
    count: 2,
    image: 'https://www.hacsons.com/wp-content/uploads/2024/08/image-3-1.png',
  },
  {
    id: 'I-G001',
    title: 'Gloves',
    type: 'Gloves',
    station: 'Station 12',
    inspector: 'John D.',
    date: '2025-11-10',
    count: 3,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFDCux32MFLBioGWbYdOiDfJoCV4sko1-sSQ&s',
  },
];
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GearSearch'>;
export default function ViewGroupInspectionsScreen() {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 250);
  const navigation = useNavigation<NavigationProp>();

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return MOCK_INSPECTIONS;
    return MOCK_INSPECTIONS.filter(i => i.title.toLowerCase().includes(q) || i.station.toLowerCase().includes(q) || i.id?.toLowerCase().includes(q));
  }, [debounced]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header]}>
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          contentStyle={{ flexDirection: 'row' }}
        >
          <Icon source="arrow-left" size={p(22)} color={colors.onSurface} />
        </Button>
        <Text style={[styles.title, { color: colors.onSurface }]}>Group Inspection Gears</Text>
        <Button
                  style={[
                    styles.statusBadge,        
                    { backgroundColor: '#FFC107',}
                  ]}
                  labelStyle={{
                      fontSize: p(14),
                      fontWeight: '600',
                      
                      color: colors.surface,
                    }}
                >
                  InProgress
            </Button>
      </View>

   
        <Text
          variant="titleMedium"
          style={{ color: colors.primary, marginBottom: 5, textAlign: 'left',fontSize: p(26), fontWeight: '600' }}
        >
          Lead ID: {MOCK_INSPECTIONS[0]?.id ?? '—'}
        </Text>
        
   

      

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id || item.title}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => (
          <InspectionCard item={item} onPress={()=>{
            navigation.navigate('NestedInspections', { type: item.type })
          }} />
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: p(18), fontWeight: 'bold' },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: p(12),
      paddingTop: p(10),
    },
  container: { flex: 1, padding: p(12) },
  statusBadge: {
      alignSelf: 'center',
      fontSize: p(20),
      fontWeight: '700',
      paddingHorizontal: p(6),
      // paddingVertical: p(2),
    },
  
  search: { marginBottom: p(8) },
});