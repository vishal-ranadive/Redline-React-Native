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
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { franchiseApi, Franchise } from '../../../services/franchiseApi';
import useDebounce from '../../../hooks/useDebounce';
import Pagination from '../Pagination';

interface FranchiseSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onFranchiseSelect: (franchise: Franchise) => void;
}

const FranchiseSelectorModal: React.FC<FranchiseSelectorModalProps> = ({
  visible,
  onClose,
  onFranchiseSelect,
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState(10);
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [supportedOrientations, setSupportedOrientations] = useState<
    ('portrait' | 'landscape' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right')[]
  >(['portrait', 'landscape']);

  // State for franchises
  const [franchises, setFranchises] = useState<Franchise[]>([]);
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

  const fetchFranchises = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        page_size: numberOfItemsPerPage,
      };

      if (debouncedSearch.trim()) {
        params.franchise_name = debouncedSearch.trim();
      }

      console.log('🔄 Fetching franchises with params:', params);
      const response = await franchiseApi.getFranchises(params);

      if (response.status) {
        setFranchises(response.franchises);
        setPagination(response.pagination);
      } else {
        console.error('❌ Failed to fetch franchises:', response.message);
        // Show specific error message for no franchises found
        if (response.message && response.message.toLowerCase().includes('no franchises found')) {
          Alert.alert('No Franchises Found', 'No franchises were found matching your search. Please try a different search term.');
        } else {
          Alert.alert('Error', response.message || 'Failed to fetch franchises');
        }
      }
    } catch (error: any) {
      console.error('❌ Error fetching franchises:', error);

      // Handle HTTP errors
      if (error.response?.status === 404) {
        Alert.alert('No Franchises Found', 'No franchises are available. Please contact your administrator.');
      } else {
        Alert.alert('Error', 'Failed to fetch franchises. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, numberOfItemsPerPage]);

  // Fetch franchises when modal opens or search/pagination changes
  useEffect(() => {
    if (visible) {
      fetchFranchises();
    }
  }, [visible, fetchFranchises]);

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setPage(1);
      setNumberOfItemsPerPage(10);
      setFranchises([]);
      setPagination({ page: 1, page_size: 10, total: 0 });
    }
  }, [visible]);

  // Reset page when search query changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const handleFranchiseSelect = (franchise: Franchise) => {
    onFranchiseSelect(franchise);
    onClose();
  };

  const renderFranchiseItem = ({ item }: { item: Franchise }) => (
    <TouchableOpacity
      style={[styles.franchiseItem, { backgroundColor: colors.surface }]}
      onPress={() => handleFranchiseSelect(item)}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
        <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
          {item.franchise_name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.franchiseInfo}>
        <Text style={[styles.franchiseName, { color: colors.onSurface, fontSize: p(18) }]}>
          {item.franchise_name}
        </Text>
        <Text style={[styles.franchiseDetail, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
          {item.city}, {item.state}
        </Text>
        <Text style={[styles.franchiseDetail, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
          {item.email || 'No email'}
        </Text>
      </View>
      <Icon source="chevron-right" size={p(20)} color={colors.onSurfaceVariant} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
      supportedOrientations={supportedOrientations}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.onSurface, fontSize: p(20) }]}>
            Select Franchise
          </Text>
          <Button mode="text" onPress={onClose}>
            <Icon source="close" size={p(22)} color={colors.onSurface} />
          </Button>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search by franchise name"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchBar}
            icon="magnify"
            inputStyle={{ fontSize: p(16) }}
          />
        </View>

        {/* Franchise List */}
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
                Loading franchises...
              </Text>
            </View>
          ) : franchises.length > 0 ? (
            <>
              <FlatList
                data={franchises}
                keyExtractor={(item) => item.franchise_id.toString()}
                renderItem={renderFranchiseItem}
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
              <Icon source="office-building" size={p(64)} color={colors.onSurfaceVariant} />
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant, fontSize: p(18) }]}>
                {searchQuery ? 'No franchises found matching your search' : 'No franchises available'}
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
                {searchQuery ? 'Try a different search term' : 'Please check your connection and try again'}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
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
  franchiseItem: {
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
  franchiseInfo: {
    flex: 1,
  },
  franchiseName: {
    fontWeight: '600',
    marginBottom: p(4),
  },
  franchiseDetail: {
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

export default FranchiseSelectorModal;
