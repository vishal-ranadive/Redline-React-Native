import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Dimensions,
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
import { useManufacturerStore } from '../../../store/manufacturerStore';
import useDebounce from '../../../hooks/useDebounce';
import Pagination from '../Pagination';

interface ManufacturerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (mfr: any) => void;
}

const ManufacturerModal: React.FC<ManufacturerModalProps> = ({ visible, onClose, onSelect }) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState(10);
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [supportedOrientations, setSupportedOrientations] = useState<
    ('portrait' | 'landscape' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right')[]
  >(['portrait', 'landscape']);

  // Store
  const { manufacturers, loading, fetchManufacturers, pagination } = useManufacturerStore();

  // Lock to current orientation when modal opens
  useEffect(() => {
    if (visible) {
      const { width, height } = Dimensions.get('window');
      const isLandscape = width > height;
      setSupportedOrientations(
        isLandscape
          ? ['landscape', 'landscape-left', 'landscape-right']
          : ['portrait', 'portrait-upside-down']
      );
    }
  }, [visible]);

  const numberOfItemsPerPageList = [10, 20, 50, 100];

  // Fetch manufacturers with search and pagination
  useEffect(() => {
    if (visible) {
      const searchParams: any = {
        page: page,
        page_size: numberOfItemsPerPage,
      };

      if (debouncedSearch.trim()) {
        searchParams.manufacturer_name = debouncedSearch;
      }

      fetchManufacturers(searchParams);
    }
  }, [visible, debouncedSearch, page, numberOfItemsPerPage, fetchManufacturers]);

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setPage(1);
      setNumberOfItemsPerPage(10);
    }
  }, [visible]);

  // Reset page when search query changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const handleSelect = (m: any) => {
    onSelect(m);
    onClose();
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.item, { backgroundColor: colors.surface }]} 
      onPress={() => handleSelect(item)}
    >
      <View style={styles.itemLeft}>
        <Icon source="factory" size={p(22)} color={colors.primary} />
      </View>
      <View style={styles.itemBody}>
        <Text style={[styles.itemTitle, { color: colors.onSurface }]}>{item.manufacturer_name}</Text>
        {(item.city || item.state || item.country) && (
          <Text style={[styles.itemSub, { color: colors.onSurfaceVariant }]}>
            {[item.city, item.state, item.country].filter(Boolean).join(' • ')}
          </Text>
        )}
        {(item.email || item.phone) && (
          <Text style={[styles.itemSub, { color: colors.onSurfaceVariant }]}>
            {[item.email, item.phone].filter(Boolean).join(' • ')}
          </Text>
        )}
      </View>
      <Icon source="chevron-right" size={p(20)} color={colors.onSurfaceVariant} />
    </TouchableOpacity>
  );

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="pageSheet" 
      onRequestClose={onClose}
      supportedOrientations={supportedOrientations}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.onSurface, fontSize: p(20) }]}>Select Manufacturer</Text>
          <Button mode="text" onPress={onClose}>
            <Icon source="close" size={p(22)} color={colors.onSurface} />
          </Button>
        </View>

        <View style={styles.searchWrap}>
          <Searchbar
            placeholder="Search manufacturer name"
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
          ) : manufacturers.length > 0 ? (
            <>
              <FlatList
                data={manufacturers}
                keyExtractor={(item) => item.manufacturer_id.toString()}
                renderItem={renderItem}
                ItemSeparatorComponent={() => <Divider />}
                showsVerticalScrollIndicator={false}
              />

              {/* Pagination Controls */}
              {pagination && pagination.total > 0 && (
                <Pagination
                  page={page}
                  total={pagination.total}
                  itemsPerPage={numberOfItemsPerPage}
                  itemsPerPageList={numberOfItemsPerPageList}
                  onPageChange={setPage}
                  onItemsPerPageChange={setNumberOfItemsPerPage}
                />
              )}
            </>
          ) : (
            <View style={styles.empty}>
              <Icon source="factory" size={p(60)} color={colors.onSurfaceVariant} />
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant, fontSize: p(18) }]}>
                {searchQuery ? 'No manufacturers found matching your search' : 'No manufacturers available'}
              </Text>
              <Text style={[styles.emptySub, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
                {searchQuery ? 'Try a different search term' : 'Add a manufacturer via the admin panel'}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.footer, { backgroundColor: colors.surface }]}>
          <Button 
            mode="contained" 
            onPress={() => { /* open add manufacturer flow */ }} 
            buttonColor={colors.primary} 
            textColor={colors.surface} 
            style={styles.addBtn} 
            icon="plus"
            disabled={true} // Disabled as per requirement
          >
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
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: p(16), 
    paddingVertical: p(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  title: { fontWeight: '700' },

  searchWrap: { padding: p(16) },
  search: { borderRadius: p(12) },

  listWrap: { flex: 1, paddingHorizontal: p(8) },

  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  item: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: p(12) 
  },
  itemLeft: { 
    width: p(44), 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  itemBody: { 
    flex: 1, 
    marginLeft: p(8) 
  },
  itemTitle: { 
    fontWeight: '600', 
    marginBottom: p(4) 
  },
  itemSub: { 
    fontSize: p(13), 
    marginBottom: p(2) 
  },

  empty: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: p(24) 
  },
  emptyText: { 
    fontWeight: '600', 
    marginTop: p(12) 
  },
  emptySub: { 
    textAlign: 'center', 
    marginTop: p(6) 
  },

  footer: { 
    padding: p(16), 
    borderTopWidth: StyleSheet.hairlineWidth, 
    borderTopColor: 'rgba(0,0,0,0.08)' 
  },
  addBtn: { 
    borderRadius: p(10) 
  },
});

export default ManufacturerModal;