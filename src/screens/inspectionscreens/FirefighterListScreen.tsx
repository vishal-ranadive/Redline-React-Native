import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Icon, useTheme, TextInput, DataTable, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Header from '../../components/common/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLeadStore } from '../../store/leadStore';
import { inspectionApi } from '../../services/inspectionApi';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FirefighterGearsScreen'>;

type Firefighter = {
  id: number;
  name: string;
  email: string;
  total_gear_scan_count: number;
  tag_color: string;
};

export default function FirefighterListScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const { currentLead } = useLeadStore();

  const [rosters, setRosters] = useState<Firefighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const currentLeadId = currentLead?.lead_id;
  const MANUAL_LEAD_ID = 101;
  const effectiveLeadId = currentLeadId ?? MANUAL_LEAD_ID;

  useFocusEffect(
    useCallback(() => {
      fetchRosters(effectiveLeadId);
    }, [effectiveLeadId]),
  );

  const fetchRosters = async (leadId: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await inspectionApi.getInspectionRosters(leadId);
      const apiRosters: Firefighter[] = Array.isArray(response?.roster)
        ? response.roster
        : [];

      if (apiRosters.length) {
        setRosters(apiRosters);
      } else {
        // Fallback dummy data if API returns empty
        setRosters([
          { id: 8, name: 'John Doe', email: 'admin@.com', total_gear_scan_count: 3, tag_color: 'red' },
          { id: 9, name: 'John Doe', email: 'admin@.com', total_gear_scan_count: 3, tag_color: 'green' },
          { id: 10, name: 'John Doe', email: 'admin@.com', total_gear_scan_count: 3, tag_color: 'yellow' },
          { id: 11, name: 'John Doe', email: 'admin@.com', total_gear_scan_count: 3, tag_color: 'black' },
        ]);
      }
    } catch (e: any) {
      console.error('Error fetching inspection rosters:', e);
      setError('Failed to load firefighters. Showing sample data.');
      // Fallback to dummy data on error
      setRosters([
        { id: 8, name: 'John Doe', email: 'admin@.com', total_gear_scan_count: 3, tag_color: 'red' },
        { id: 9, name: 'John Doe', email: 'admin@.com', total_gear_scan_count: 3, tag_color: 'green' },
        { id: 10, name: 'John Doe', email: 'admin@.com', total_gear_scan_count: 3, tag_color: 'yellow' },
        { id: 11, name: 'John Doe', email: 'admin@.com', total_gear_scan_count: 3, tag_color: 'black' },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredFirefighters = useMemo(() => {
    if (!searchQuery.trim()) {
      return rosters;
    }
    const query = searchQuery.toLowerCase();
    return rosters.filter((roster) => {
      const nameMatch = roster.name?.toLowerCase().includes(query);
      const emailMatch = roster.email?.toLowerCase().includes(query);
      return nameMatch || emailMatch;
    });
  }, [rosters, searchQuery]);

  const totalCount = filteredFirefighters.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage) || 1);
  const paginatedFirefighters = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredFirefighters.slice(startIndex, endIndex);
  }, [filteredFirefighters, page, itemsPerPage]);

  useEffect(() => {
    setPage(1);
  }, [itemsPerPage, searchQuery]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRosters(effectiveLeadId);
  }, [effectiveLeadId]);

  const handleViewGears = (roster: Firefighter) => {
    navigation.navigate('FirefighterGearsScreen', { roster ,leadId:currentLead.lead_id });
  };

  const getInitials = (name: string) => {
    if (!name) {
      return '?';
    }
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (id: number) => {
    const palette = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
    ];
    const index = Math.abs(id) % palette.length;
    return palette[index];
  };

  const getTagColor = (roster: Firefighter) => {
    const rawColor = roster.tag_color?.trim();
    if (!rawColor) {
      return null;
    }

    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(rawColor)) {
      return rawColor;
    }

    return rawColor.toLowerCase();
  };

  /**
   * Render individual firefighter row
   */
  const renderFirefighter = ({ item }: { item: Firefighter }) => {
    const tagColor = getTagColor(item);
    return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => handleViewGears(item)}
      style={[styles.firefighterRow, { backgroundColor: colors.surface }]}
    > 
      {tagColor && (
        <View style={[styles.tagBadge, { backgroundColor: tagColor }]} />
      )}
      {/* Left: Profile Avatar and Name/Email */}
      <View style={styles.leftSection}>
        <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.id) }]}>
          <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
        </View>
        <View style={styles.nameEmailContainer}>
          <Text variant="titleMedium" style={{ fontWeight: 'bold', fontSize: p(14) }}>
            {item.name}
          </Text>
          <Text style={{ fontSize: p(12), color: '#666' }} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
      </View>

      {/* Right: Total Scanned Gears and Arrow */}
      <View style={styles.rightSection}>
        <View style={styles.gearCountContainer}>
          <Icon source="tools" size={p(16)} color={colors.primary} />
          <Text style={styles.gearCountText}>{item.total_gear_scan_count ?? 0}</Text>
          <Text style={styles.gearLabel}>Total Scanned Gears</Text>
        </View>
        <Icon source="chevron-right" size={p(20)} color="#666" />
      </View>
    </TouchableOpacity> 
  );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Firefighters" showBackButton={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="bodyMedium" style={{ marginTop: p(16) }}>Loading firefighters...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Firefighters" showBackButton={true} />

      {/* 🔍 Search Section */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          mode="outlined"
          placeholder="Search by email or name"
          value={searchQuery}
          onChangeText={setSearchQuery}
          left={<TextInput.Icon icon="magnify" />}
          style={styles.searchInput}
          dense
        />
      </View>

    

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: colors.errorContainer }]}>
          <Icon source="alert-circle" size={20} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        </View>
      )}

      {/* Firefighters List - Horizontal Rows */}
      <FlatList
        data={paginatedFirefighters}
        renderItem={renderFirefighter}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Icon source="account-search" size={64} color={colors.outline} />
              <Text variant="titleMedium" style={{ marginTop: 16, color: colors.outline }}>
                {error ? 'No roster available' : 'No Firefighters Found'}
              </Text>
              <Text variant="bodyMedium" style={{ color: colors.outline, textAlign: 'center', marginTop: 8 }}>
                {error ?? (searchQuery ? 'Try adjusting your search criteria' : 'No firefighters available')}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Pagination */}
      <View style={[styles.paginationContainer, { backgroundColor: colors.surface, borderTopColor: colors.outline }]}>
        <DataTable.Pagination
          page={page - 1}
          numberOfPages={totalPages}
          onPageChange={newPage => setPage(newPage + 1)}
          label={`${
            totalCount === 0 ? 0 : (page - 1) * itemsPerPage + 1
          }-${totalCount === 0 ? 0 : Math.min(page * itemsPerPage, totalCount)} of ${totalCount}`}
          showFastPaginationControls
          numberOfItemsPerPageList={[10, 20, 30]}
          numberOfItemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          selectPageDropdownLabel={'Firefighters per page'}
          theme={{
            colors: {
              primary: colors.primary,
              onSurface: colors.onSurface,
              surface: colors.surface,
            },
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: p(10) 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: p(14),
    paddingTop: p(8),
    paddingBottom: p(8),
  },
  searchInput: {
    marginBottom: p(8),
  },
  listContainer: {
    paddingBottom: p(100),
    flexGrow: 1,
  },
  firefighterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: p(12),
    marginHorizontal: p(14),
    marginBottom: p(8),
    borderRadius: p(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: p(40),
    height: p(40),
    borderRadius: p(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: p(12),
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: p(14),
  },
  nameEmailContainer: {
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: p(8),
  },
  gearCountContainer: {
    alignItems: 'center',
    marginRight: p(8),
  },
  gearCountText: {
    fontSize: p(16),
    fontWeight: 'bold',
    marginTop: p(2),
  },
  gearLabel: {
    fontSize: p(10),
    color: '#666',
    marginTop: p(2),
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    marginBottom: p(65),
    borderTopWidth: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: p(14),
    marginBottom: p(8),
    borderRadius: p(8),
    paddingHorizontal: p(12),
    paddingVertical: p(8),
    gap: p(8),
  },
  errorText: {
    flex: 1,
    fontSize: p(12),
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: p(14),
    marginBottom: p(8),
    borderRadius: p(8),
    paddingHorizontal: p(12),
    paddingVertical: p(8),
    gap: p(8),
  },
  infoText: {
    flex: 1,
    fontSize: p(12),
  },
  tagBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: p(30),
    height: p(24),
    borderTopRightRadius: p(8),
    borderBottomLeftRadius: p(10),
  },
});