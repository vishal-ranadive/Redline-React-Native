import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
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
import { firestationApi, Firestation } from '../../../services/firestationApi';
import useDebounce from '../../../hooks/useDebounce';
import Pagination from '../Pagination';

interface FirestationSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onFirestationSelect: (firestation: Firestation) => void;
  franchiseId: number | null;
}

const FirestationSelectorModal: React.FC<FirestationSelectorModalProps> = ({
  visible,
  onClose,
  onFirestationSelect,
  franchiseId,
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState(10);
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [supportedOrientations, setSupportedOrientations] = useState<
    ('portrait' | 'landscape' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right')[]
  >(['portrait', 'landscape']);

  // State for firestations
  const [firestations, setFirestations] = useState<Firestation[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
  });

  const numberOfItemsPerPageList = [10, 20, 30, 50];

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

  const fetchFirestations = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        page_size: numberOfItemsPerPage,
      };

      // Add search query if provided
      if (debouncedSearch.trim()) {
        params.fire_station_name = debouncedSearch.trim();
      }

      let response;

      if (franchiseId) {
        // Search within the specified franchise
        console.log('🔄 Fetching firestations for franchise:', franchiseId, 'with params:', params);
        response = await firestationApi.getFirestationsByFranchise(franchiseId, params);
      } else {
        // Fallback: search globally (shouldn't happen in current flow)
        console.log('🔄 Fetching firestations globally with params:', params);
        response = await firestationApi.getFirestations(params);
      }

      if (response.status) {
        setFirestations(response.firestations);
        setPagination(response.pagination);
      } else {
        console.error('❌ Failed to fetch firestations:', response.message);
        // Show specific error message for "No firestations found"
        if (response.message && response.message.toLowerCase().includes('no firestations found')) {
          Alert.alert('No Fire Stations Found', 'No fire stations were found for this franchise. Please contact your administrator if you believe this is an error.');
        } else {
          Alert.alert('Error', response.message || 'Failed to fetch fire stations');
        }
      }
    } catch (error: any) {
      console.error('❌ Error fetching firestations:', error);

      // Handle HTTP errors (like 404)
      if (error.response?.status === 404) {
        const message = error.response?.data?.message;
        if (message && message.toLowerCase().includes('no firestations found')) {
          Alert.alert('No Fire Stations Found', 'No fire stations were found for this franchise. Please contact your administrator if you believe this is an error.');
        } else {
          Alert.alert('Franchise Not Found', 'The selected franchise could not be found or has no fire stations assigned.');
        }
      } else {
        Alert.alert('Error', 'Failed to fetch fire stations. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [franchiseId, debouncedSearch, page, numberOfItemsPerPage]);

  // Fetch firestations when modal opens or search/pagination changes
  useEffect(() => {
    if (visible) {
      fetchFirestations();
    }
  }, [visible, fetchFirestations]);

  // Reset when modal opens or franchise changes
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setPage(1);
      setNumberOfItemsPerPage(10);
      setFirestations([]);
      setPagination({ page: 1, page_size: 10, total: 0 });
    }
  }, [visible, franchiseId]);

  // Reset page when search query changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const handleFirestationSelect = (firestation: Firestation) => {
    onFirestationSelect(firestation);
    onClose();
  };

  const renderFirestationItem = ({ item }: { item: Firestation }) => (
    <TouchableOpacity
      style={[styles.firestationItem, { backgroundColor: colors.surface }]}
      onPress={() => handleFirestationSelect(item)}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
        <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
          {item.fire_station_name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.firestationInfo}>
        <Text style={[styles.firestationName, { color: colors.onSurface, fontSize: p(18) }]}>
          {item.fire_station_name}
        </Text>
        <Text style={[styles.firestationDetail, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
          {item.city}, {item.state}
        </Text>
        <Text style={[styles.firestationDetail, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
          {item.address}
        </Text>
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
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.onSurface, fontSize: p(20) }]}>
            Select Fire Station
          </Text>
          <Button mode="text" onPress={onClose}>
            <Icon source="close" size={p(22)} color={colors.onSurface} />
          </Button>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search by fire station name"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchBar}
            icon="magnify"
            inputStyle={{ fontSize: p(16) }}
          />
        </View>

        {/* Firestation List */}
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
                Loading fire stations...
              </Text>
            </View>
          ) : firestations.length > 0 ? (
            <>
              <FlatList
                data={firestations}
                keyExtractor={(item) => item.firestation_id.toString()}
                renderItem={renderFirestationItem}
                ItemSeparatorComponent={() => <Divider />}
                showsVerticalScrollIndicator={false}
              />

              {/* Pagination Controls */}
              {pagination.total > 0 && (
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
            <View style={styles.emptyContainer}>
              <Icon source="fire-truck" size={p(64)} color={colors.onSurfaceVariant} />
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant, fontSize: p(18) }]}>
                {searchQuery ? 'No fire stations found matching your search' : 'No fire stations available'}
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
                {searchQuery ? 'Try a different search term' : 'Please select a franchise first or check your connection'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: p(16),
    paddingVertical: p(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontWeight: '700',
  },
  searchContainer: {
    padding: p(16),
  },
  searchBar: {
    borderRadius: p(12),
  },
  listContainer: {
    flex: 1,
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
  firestationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: p(16),
  },
  avatar: {
    width: p(44),
    height: p(44),
    borderRadius: p(22),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: p(12),
  },
  avatarText: {
    fontSize: p(18),
    fontWeight: '600',
  },
  firestationInfo: {
    flex: 1,
  },
  firestationName: {
    fontWeight: '600',
    marginBottom: p(4),
  },
  firestationDetail: {
    marginBottom: p(2),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: p(32),
  },
  emptyText: {
    fontWeight: '600',
    marginTop: p(16),
    marginBottom: p(8),
    textAlign: 'center',
  },
  emptySubtext: {
    textAlign: 'center',
  },
});

export default FirestationSelectorModal;
