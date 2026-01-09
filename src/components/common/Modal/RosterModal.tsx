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
import { useRosterStore } from '../../../store/rosterStore';
import { useLeadStore } from '../../../store/leadStore';
import useDebounce from '../../../hooks/useDebounce';
import Pagination from '../Pagination';

interface RosterModalProps {
  visible: boolean;
  onClose: () => void;
  onRosterSelect: (roster: any) => void;
  onAddRosterManual: () => void;
}

const RosterModal: React.FC<RosterModalProps> = ({
  visible,
  onClose,
  onRosterSelect,
  onAddRosterManual,
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState(10);
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [supportedOrientations, setSupportedOrientations] = useState<
    ('portrait' | 'landscape' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right')[]
  >(['portrait', 'landscape']);
  
  // Stores
  const { rosters, loading, pagination, fetchRostersByFirestation } = useRosterStore();
  const { currentLead } = useLeadStore();

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

  const numberOfItemsPerPageList = [10, 20, 30, 40, 50];

  // All pagination is handled server-side

  // Fetch rosters when modal opens or search changes (server-side search and pagination)
  useEffect(() => {
    if (visible && currentLead?.firestation?.id && currentLead?.lead_id) {
      const searchParams: any = {
        page: page,
        page_size: numberOfItemsPerPage,
        leadId: currentLead.lead_id, // Pass leadId to get tag_color in response
        name: debouncedSearch.trim() || undefined, // Add debounced search to API call
      };

      fetchRostersByFirestation(currentLead.firestation.id, searchParams);
    }
  }, [visible, currentLead?.firestation?.id, currentLead?.lead_id, debouncedSearch, numberOfItemsPerPage, page, fetchRostersByFirestation]);

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

  const handleRosterSelect = (roster: any) => {
    onRosterSelect(roster);
    onClose();
  };

  const handleAddManual = () => {
    onClose();
    onAddRosterManual();
  };

  const getInitials = (name: string = '') => {
    const trimmed = name.trim();
    if (!trimmed) return '';
    const parts = trimmed.split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  };

  const renderRosterItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.rosterItem, { backgroundColor: colors.surface }]}
      onPress={() => handleRosterSelect(item)}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
        <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
          {getInitials(
            item.roster_name || 
            (item.first_name && item.last_name ? `${item.first_name} ${item.last_name}` : '') ||
            ''
          )}
        </Text>
      </View>
      <View style={styles.rosterInfo}>
        <View style={styles.rosterNameContainer}>
          {/* Tag Color Dot */}
          {item.tag_color && (
            <View
              style={[
                styles.tagColorDot,
                { backgroundColor: '#FFEBEE' } // Light red background for both light and dark mode
              ]}
            />
          )}
          <Text style={[styles.rosterName, { color: colors.onSurface, fontSize: p(18) }]}>
            {item.roster_name || 
             (item.first_name && item.last_name ? `${item.first_name} ${item.last_name}`.trim() : '') ||
             'Unknown Firefighter'}
          </Text>

          {/* Rank Pill */}
          {item.rank && item.rank.trim() && (
            <View
              style={[
                styles.rankPill,
                { backgroundColor: colors.primaryContainer, marginLeft: p(8) }
              ]}
            >
              <Text
                style={[
                  styles.rankPillText,
                  { color: colors.primary }
                ]}
              >
                {item.rank}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.rosterDetail, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
          {item.firestation?.name || 'Unknown Station'}
        </Text>
        <Text style={[styles.rosterDetail, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
          {item.email || 'No email'} • {item.phone || 'No phone'}
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
            Select Fire Fighter
          </Text>
          <Button mode="text" onPress={onClose}>
            <Icon source="close" size={p(22)} color={colors.onSurface} />
          </Button>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search by firefighter's name"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchBar}
            icon="magnify"
            inputStyle={{ fontSize: p(16) }}
          />
        </View>

        {/* Fire Fighter List */}
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
                Loading fire fighters...
              </Text>
            </View>
          ) : rosters.length > 0 ? (
            <>
              <FlatList
                data={rosters}
                keyExtractor={(item) => item.roster_id.toString()}
                renderItem={renderRosterItem}
                ItemSeparatorComponent={() => <Divider />}
                showsVerticalScrollIndicator={false}
              />
              
              {/* Pagination Controls */}
              {(pagination?.total || 0) > 0 && (
                <Pagination
                  page={page}
                  total={pagination?.total || 0}
                  itemsPerPage={numberOfItemsPerPage}
                  itemsPerPageList={numberOfItemsPerPageList}
                  onPageChange={setPage}
                  onItemsPerPageChange={setNumberOfItemsPerPage}
                />
              )}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Icon source="account-search" size={p(64)} color={colors.onSurfaceVariant} />
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant, fontSize: p(18) }]}>
                {searchQuery ? 'No fire fighters found matching your search' : 'No fire fighters available'}
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
                {searchQuery ? 'Try a different search term or add a new fire fighter manually' : 'Add a new fire fighter manually'}
              </Text>
            </View>
          )}
        </View>

        {/* Footer with Add Manual Button */}
        <View style={[styles.modalFooter, { backgroundColor: colors.surface }]}>
          <Button
            mode="contained"
            onPress={handleAddManual}
            buttonColor={colors.primary}
            textColor={"#fff"}
            style={styles.addButton}
            icon="account-plus"
            labelStyle={{ fontSize: p(16), fontWeight: '600' }}
          >
            Add Fire Fighter Manually
          </Button>
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
  rosterItem: {
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
  rosterInfo: {
    flex: 1,
  },
  rosterNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: p(4),
  },
  tagColorDot: {
    width: p(12),
    height: p(12),
    borderRadius: p(6),
    marginRight: p(8),
  },
  rankPill: {
    paddingHorizontal: p(10),
    paddingVertical: p(4),
    borderRadius: p(12),
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: p(24),
  },
  rankPillText: {
    fontSize: p(11),
    fontWeight: '600',
    lineHeight: p(16),
  },
  rosterName: {
    fontWeight: '600',
  },
  rosterDetail: {
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
  modalFooter: {
    padding: p(16),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  addButton: {
    borderRadius: p(12),
  },
});

export default RosterModal;