// src/components/common/Modal/ManufacturerModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import {
  Text,
  Searchbar,
  Button,
  Icon,
  useTheme,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { p } from '../../../utils/responsive';

interface Manufacturer {
  manufacturer_id: number;
  manufacturer_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  zip_code?: string;
  state?: string;
  country?: string;
  active_status?: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

interface ApiResponse {
  status: boolean;
  message: string;
  manufacturers: Manufacturer[];
  pagination: { page: number; page_size: number; total: number; };
}

interface ManufacturerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (mfr: Manufacturer) => void;
}

// Mock fetch function - replace with actual API
const fetchManufacturersFromAPI = async (): Promise<ApiResponse> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        status: true,
        message: 'Manufacturers fetched successfully',
        manufacturers: [
          {
            manufacturer_id: 12,
            manufacturer_name: 'Fire Safety Equipment Inc.',
            email: 'contact@firesafetyequip.com',
            phone: '+1-555-0123',
            address: '123 Industrial Park Drive',
            city: 'Chicago',
            zip_code: '60601',
            state: 'Illinois',
            country: 'USA',
            active_status: true,
            is_deleted: false,
            created_at: '2025-10-24T15:31:43.461462Z',
            updated_at: '2025-10-24T15:31:43.461462Z',
            created_by: 'system',
            updated_by: 'system'
          }
        ],
        pagination: { page: 1, page_size: 10, total: 1 }
      });
    }, 600);
  });
};

const ManufacturerModal: React.FC<ManufacturerModalProps> = ({ visible, onClose, onSelect }) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [filtered, setFiltered] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchManufacturers = async () => {
    try {
      setLoading(true);
      const res = await fetchManufacturersFromAPI();
      const active = res.manufacturers.filter(m => m.active_status && !m.is_deleted);
      setManufacturers(active);
      setFiltered(active);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to fetch manufacturers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchManufacturers();
      setSearchQuery('');
    }
  }, [visible]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFiltered(manufacturers);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFiltered(manufacturers.filter(m =>
      m.manufacturer_name.toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.city || '').toLowerCase().includes(q)
    ));
  }, [searchQuery, manufacturers]);

  const handleSelect = (m: Manufacturer) => {
    onSelect(m);
    onClose();
  };

  const renderItem = ({ item }: { item: Manufacturer }) => (
    <TouchableOpacity style={[styles.item, { backgroundColor: colors.surface }]} onPress={() => handleSelect(item)}>
      <View style={styles.itemLeft}>
        <Icon source="factory" size={p(22)} color={colors.primary} />
      </View>
      <View style={styles.itemBody}>
        <Text style={[styles.itemTitle, { color: colors.onSurface }]}>{item.manufacturer_name}</Text>
        <Text style={[styles.itemSub, { color: colors.onSurfaceVariant }]}>{item.city} • {item.country}</Text>
        <Text style={[styles.itemSub, { color: colors.onSurfaceVariant }]}>{item.email} • {item.phone}</Text>
      </View>
      <Icon source="chevron-right" size={p(20)} color={colors.onSurfaceVariant} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.onSurface, fontSize: p(20) }]}>Select Manufacturer</Text>
          <Button mode="text" onPress={onClose}>
            <Icon source="close" size={p(22)} color={colors.onSurface} />
          </Button>
        </View>

        <View style={styles.searchWrap}>
          <Searchbar
            placeholder="Search manufacturer, email or city..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.search}
            icon="magnify"
            inputStyle={{ fontSize: p(16) }}
          />
        </View>

        <View style={styles.listWrap}>
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.onSurfaceVariant, marginTop: p(12) }}>Loading manufacturers...</Text>
            </View>
          ) : filtered.length > 0 ? (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.manufacturer_id.toString()}
              renderItem={renderItem}
              ItemSeparatorComponent={() => <Divider />}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.empty}>
              <Icon source="factory" size={p(60)} color={colors.onSurfaceVariant} />
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant, fontSize: p(18) }]}>
                {searchQuery ? 'No manufacturers found' : 'No manufacturers available'}
              </Text>
              <Text style={[styles.emptySub, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
                {searchQuery ? 'Try a different search term' : 'Add a manufacturer via the admin panel'}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.footer, { backgroundColor: colors.surface }]}>
          <Button mode="contained" onPress={() => { /* open add manufacturer flow */ }} buttonColor={colors.primary} textColor={colors.surface} style={styles.addBtn} icon="plus">
            Add Manufacturer
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: p(16), paddingVertical: p(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  title: { fontWeight: '700' },

  searchWrap: { padding: p(16) },
  search: { borderRadius: p(12) },

  listWrap: { flex: 1, paddingHorizontal: p(8) },

  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  item: { flexDirection: 'row', alignItems: 'center', padding: p(12) },
  itemLeft: { width: p(44), alignItems: 'center', justifyContent: 'center' },
  itemBody: { flex: 1, marginLeft: p(8) },
  itemTitle: { fontWeight: '600', marginBottom: p(4) },
  itemSub: { fontSize: p(13), marginBottom: p(2) },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: p(24) },
  emptyText: { fontWeight: '600', marginTop: p(12) },
  emptySub: { textAlign: 'center', marginTop: p(6) },

  footer: { padding: p(16), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.08)' },
  addBtn: { borderRadius: p(10) },
});

export default ManufacturerModal;
