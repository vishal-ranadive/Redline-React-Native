import React, { useState, useEffect, useMemo } from 'react';
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
  DataTable,
} from 'react-native-paper';
import { p } from '../../../utils/responsive';
import { useRosterStore } from '../../../store/rosterStore';
import { useLeadStore } from '../../../store/leadStore';
import useDebounce from '../../../hooks/useDebounce';
import { getColorHex } from '../../../constants/colors';

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
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState(1000);
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [supportedOrientations, setSupportedOrientations] = useState<
    ('portrait' | 'landscape' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right')[]
  >(['portrait', 'landscape']);
  
  // Stores
  const { rosters, loading, fetchRosters, pagination, fetchRostersByFirestation } = useRosterStore();
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

  const numberOfItemsPerPageList = [200, 300, 400, 500];

  // Filter rosters based on search query (client-side filtering)
  const filteredRosters = useMemo(() => {
    if (!searchQuery.trim()) {
      return rosters;
    }
    
    const query = searchQuery.toLowerCase();
    return rosters.filter(roster =>
      (roster.roster_name?.toLowerCase().includes(query) || false) ||
      (roster.email?.toLowerCase().includes(query) || false) ||
      (roster.first_name?.toLowerCase().includes(query) || false) ||
      (roster.last_name?.toLowerCase().includes(query) || false) ||
      (roster.phone?.toLowerCase().includes(query) || false)
    );
  }, [rosters, searchQuery]);

  // Calculate pagination range based on filtered results
  const totalFiltered = filteredRosters.length;
  const from = (page - 1) * numberOfItemsPerPage;
  const to = Math.min(page * numberOfItemsPerPage, totalFiltered);
  const paginatedRosters = filteredRosters.slice(from, to);

  // Fetch all rosters when modal opens (client-side search and pagination)
  useEffect(() => {
    if (visible && currentLead?.firestation?.id && currentLead?.lead_id) {
      // Fetch all rosters - we'll do client-side filtering and pagination
      const searchParams: any = {
        page: 1,
        page_size: 1000, // Fetch a large number to get all rosters
        leadId: currentLead.lead_id, // Pass leadId to get tag_color in response
      };

      fetchRostersByFirestation(currentLead.firestation.id, searchParams);
    }
  }, [visible, currentLead?.firestation?.id, currentLead?.lead_id]);

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setPage(1);
      setNumberOfItemsPerPage(1000);
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
                { backgroundColor: getColorHex(item.tag_color) }
              ]} 
            />
          )}
          <Text style={[styles.rosterName, { color: colors.onSurface, fontSize: p(18) }]}>
            {item.roster_name || 
             (item.first_name && item.last_name ? `${item.first_name} ${item.last_name}`.trim() : '') ||
             'Unknown Firefighter'}
          </Text>
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
            placeholder="Search by name, email..."
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
          ) : filteredRosters.length > 0 ? (
            <>
              <FlatList
                data={paginatedRosters}
                keyExtractor={(item) => item.roster_id.toString()}
                renderItem={renderRosterItem}
                ItemSeparatorComponent={() => <Divider />}
                showsVerticalScrollIndicator={false}
              />
              
              {/* Pagination Controls */}
              {totalFiltered > 0 && (
                <View style={[styles.paginationContainer, { backgroundColor: colors.surface, borderTopColor: colors.outline }]}>
                  <DataTable.Pagination
                    page={page - 1}
                    numberOfPages={Math.ceil(totalFiltered / numberOfItemsPerPage)}
                    onPageChange={(newPage) => setPage(newPage + 1)}
                    label={`${from + 1}-${to} of ${totalFiltered}`}
                    showFastPaginationControls
                    numberOfItemsPerPageList={numberOfItemsPerPageList}
                    numberOfItemsPerPage={numberOfItemsPerPage}
                    onItemsPerPageChange={(newItemsPerPage) => {
                      setNumberOfItemsPerPage(newItemsPerPage);
                      setPage(1); // Reset to first page when page size changes
                    }}
                    selectPageDropdownLabel={'Rows per page'}
                    theme={{
                      colors: {
                        primary: colors.primary,
                        onSurface: colors.onSurface,
                        surface: colors.surface,
                      },
                    }}
                  />
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Icon source="account-search" size={p(64)} color={colors.onSurfaceVariant} />
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant, fontSize: p(18) }]}>
                {searchQuery ? 'No fire fighters found' : 'No fire fighters available'}
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
                {searchQuery ? 'Try a different search term' : 'Add a new fire fighter manually'}
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
            textColor={colors.surface}
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
  paginationContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: p(8),
  },
});

export default RosterModal;