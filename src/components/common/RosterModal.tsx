// src/components/common/RosterModal.tsx
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
import { p } from '../../utils/responsive';

interface Firestation {
  firestation_id: number;
  fire_station_name: string;
}

interface Roster {
  roster_id: number;
  firestation: Firestation;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  phone: string;
  active_status: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
  roster_name: string;
}

interface ApiResponse {
  status: boolean;
  message: string;
  rosters: Roster[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
  };
}

interface RosterModalProps {
  visible: boolean;
  onClose: () => void;
  onRosterSelect: (roster: Roster) => void;
  onAddRosterManual: () => void;
}

// Mock API function - replace with actual API call
const fetchRostersFromAPI = async (): Promise<ApiResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: true,
        message: "Rosters fetched successfully",
        rosters: [
          {
            roster_id: 1,
            firestation: {
              firestation_id: 2,
              fire_station_name: "Community Volunteer Fire Department"
            },
            first_name: "Guardado",
            middle_name: "",
            last_name: "F",
            email: "Guardado.f@example.com",
            phone: "1234567810",
            active_status: true,
            is_deleted: false,
            created_at: "2025-10-24T15:37:57.860189Z",
            updated_at: "2025-10-24T15:39:44.434618Z",
            created_by: null,
            updated_by: null,
            roster_name: "Guardado A. F."
          },
          {
            roster_id: 3,
            firestation: {
              firestation_id: 10,
              fire_station_name: "Downtown township Station 3"
            },
            first_name: "Johny",
            middle_name: "A.",
            last_name: "Don",
            email: "john.don22@example.com",
            phone: "1234567810",
            active_status: true,
            is_deleted: false,
            created_at: "2025-10-24T17:07:39.464219Z",
            updated_at: "2025-10-24T17:07:39.464235Z",
            created_by: null,
            updated_by: null,
            roster_name: "Johny A. Don"
          }
        ],
        pagination: {
          page: 1,
          page_size: 10,
          total: 2
        }
      });
    }, 1000);
  });
};

const RosterModal: React.FC<RosterModalProps> = ({
  visible,
  onClose,
  onRosterSelect,
  onAddRosterManual,
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [filteredRosters, setFilteredRosters] = useState<Roster[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch rosters from API
  const fetchRosters = async () => {
    try {
      setLoading(true);
      const response = await fetchRostersFromAPI();
      const activeRosters = response.rosters.filter(
        (roster: Roster) => roster.active_status && !roster.is_deleted
      );
      setRosters(activeRosters);
      setFilteredRosters(activeRosters);
    } catch (error) {
      console.error('Error fetching rosters:', error);
      Alert.alert('Error', 'Failed to fetch rosters');
    } finally {
      setLoading(false);
    }
  };

  // Filter rosters based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRosters(rosters);
    } else {
      const filtered = rosters.filter(roster =>
        roster.roster_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        roster.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        roster.firestation.fire_station_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRosters(filtered);
    }
  }, [searchQuery, rosters]);

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      fetchRosters();
      setSearchQuery('');
    }
  }, [visible]);

  const handleRosterSelect = (roster: Roster) => {
    onRosterSelect(roster);
    onClose();
  };

  const handleAddManual = () => {
    onClose();
    onAddRosterManual();
  };

  const renderRosterItem = ({ item }: { item: Roster }) => (
    <TouchableOpacity
      style={[styles.rosterItem, { backgroundColor: colors.surface }]}
      onPress={() => handleRosterSelect(item)}
    >
      <View style={styles.rosterInfo}>
        <Text style={[styles.rosterName, { color: colors.onSurface, fontSize: p(18) }]}>
          {item.roster_name}
        </Text>
        <Text style={[styles.rosterDetail, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
          {item.firestation.fire_station_name}
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
            Select Roster
          </Text>
          <Button mode="text" onPress={onClose}>
            <Icon source="close" size={p(22)} color={colors.onSurface} />
          </Button>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search by name, email, or station..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchBar}
            icon="magnify"
            inputStyle={{ fontSize: p(16) }}
          />
        </View>

        {/* Roster List */}
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
                Loading rosters...
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
                {searchQuery ? 'No rosters found' : 'No rosters available'}
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
                {searchQuery ? 'Try a different search term' : 'Add a new roster manually'}
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
            Add Roster Manually
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