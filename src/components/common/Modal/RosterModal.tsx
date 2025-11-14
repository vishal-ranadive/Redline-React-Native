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
import { useRosterStore } from '../../../store/rosterStore';
import { useLeadStore } from '../../../store/leadStore';
import  useDebounce  from '../../../hooks/useDebounce';

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
  const debouncedSearch = useDebounce(searchQuery, 500);
  
  // Stores
  const { rosters, loading, fetchRosters } = useRosterStore();
  const { currentLead } = useLeadStore();

  // Filter rosters based on search query
  const filteredRosters = rosters.filter(roster =>
    searchQuery.trim() === '' ? true :
    roster.roster_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    roster.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (roster.first_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (roster.last_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Fetch rosters with search
  useEffect(() => {
    if (visible) {
      const searchParams: any = {};
      
      if (debouncedSearch.trim()) {
        searchParams.first_name = debouncedSearch;
        searchParams.email = debouncedSearch;
      }

      // Optionally filter by current lead's firestation
      // if (currentLead?.firestation?.id) {
      //   searchParams.firestation_id = currentLead.firestation.id;
      // }

      fetchRosters(searchParams);
    }
  }, [visible, debouncedSearch]);

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
    }
  }, [visible]);

  const handleRosterSelect = (roster: any) => {
    onRosterSelect(roster);
    onClose();
  };

  const handleAddManual = () => {
    onClose();
    onAddRosterManual();
  };

  const renderRosterItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.rosterItem, { backgroundColor: colors.surface }]}
      onPress={() => handleRosterSelect(item)}
    >
      <View style={styles.rosterInfo}>
        <Text style={[styles.rosterName, { color: colors.onSurface, fontSize: p(18) }]}>
          {item.roster_name}
        </Text>
        <Text style={[styles.rosterDetail, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
          {item.firestation?.name || 'Unknown Station'}
        </Text>
        <Text style={[styles.rosterDetail, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
          {item.email} • {item.phone}
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
            <FlatList
              data={filteredRosters}
              keyExtractor={(item) => item.roster_id.toString()}
              renderItem={renderRosterItem}
              ItemSeparatorComponent={() => <Divider />}
              showsVerticalScrollIndicator={false}
            />
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
  rosterInfo: {
    flex: 1,
  },
  rosterName: {
    fontWeight: '600',
    marginBottom: p(4),
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