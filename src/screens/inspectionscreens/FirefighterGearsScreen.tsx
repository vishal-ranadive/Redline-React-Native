import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Icon, useTheme, Chip, DataTable, TextInput, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import Header from '../../components/common/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGearStore, type Gear } from '../../store/gearStore';
import { type FirefighterRoster, type FirefighterGearSummary } from '../../store/inspectionStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'UpadateInspection'>;

// Different gear images for different gear types
const GEAR_IMAGES = {
  'Helmet': 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
  'Gloves': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFDCux32MFLBioGWbYdOiDfJoCV4sko1-sSQ&s',
  'Boots': 'https://www.hacsons.com/wp-content/uploads/2024/08/image-3-1.png',
  'Jacket': 'https://images.unsplash.com/photo-1553062407-98cff3078e9a?w=400&h=400&fit=crop',
  'Mask': 'https://multimedia.3m.com/mws/media/1927020O/3m-scott-av-3000-ht-facepiece-600x600p.jpg',
  'Harness': 'https://www.uviraj.com/images/FBH-EN/U222FBH.jpg',
  'Axe': 'data:image/png;base64,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',
  'Hose': 'https://tirupatiplasto.in/wp-content/upiVBORw0KGgoAAAANSUhEUgAAARMAAAC3CAMAAAAGjUrGAAACRlBMVEXloads/2023/06/fh1.jpg',
  'default': 'https://media.gettyimages.com/id/72542196/photo/firemens-gear-at-firehouse.jpg?s=612x612&w=0&k=20&c=Hha2TRyDvyoN3CYK-Hjp_uWf-Jg1P4oJJVWtY6CP6eU='
};

// Function to get appropriate image based on gear type
const getGearImage = (gearType: string | null) => {
  if (!gearType) return GEAR_IMAGES.default;
  
  const type = gearType.toLowerCase();
  if (type.includes('helmet')) return GEAR_IMAGES.Helmet;
  if (type.includes('glove')) return GEAR_IMAGES.Gloves;
  if (type.includes('boot')) return GEAR_IMAGES.Boots;
  if (type.includes('jacket')) return GEAR_IMAGES.Jacket;
  if (type.includes('mask')) return GEAR_IMAGES.Mask;
  if (type.includes('harness')) return GEAR_IMAGES.Harness;
  if (type.includes('axe')) return GEAR_IMAGES.Axe;
  if (type.includes('hose')) return GEAR_IMAGES.Hose;
  
  return GEAR_IMAGES.default;
};

type GearCard = {
  summary: FirefighterGearSummary;
  detail: Gear | null;
  color: string | null;
};

const normalizeTagColor = (color?: string | null) => {
  if (!color) {
    return null;
  }
  const trimmed = color.trim();
  if (!trimmed) {
    return null;
  }
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed.toLowerCase();
};

export default function FirefighterGearsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'FirefighterGearsScreen'>>();
  const { roster } = route.params;
  const { fetchGearById } = useGearStore();

  const [gearCards, setGearCards] = useState<GearCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState(8);
  const numberOfItemsPerPageList = [4, 8, 12, 16];

  const rosterTagColor = useMemo(
    () => normalizeTagColor(roster?.gear?.[0]?.tag_color),
    [roster],
  );

  const loadGears = useCallback(
    async (refresh = false) => {
      if (!roster?.gear?.length) {
        setGearCards([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const cards = await Promise.all(
          roster.gear.map(async (summary) => {
            const detail = await fetchGearById(summary.id);
            return {
              summary,
              detail,
              color: normalizeTagColor(summary.tag_color),
            } as GearCard;
          }),
        );
        setGearCards(cards);
      } catch (error) {
        console.error('Error fetching gears:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchGearById, roster],
  );

  useEffect(() => {
    loadGears();
  }, [loadGears]);

  useEffect(() => {
    setPage(0);
  }, [numberOfItemsPerPage, searchQuery, roster?.id]);

  const filteredGears = useMemo(() => {
    if (!searchQuery.trim()) {
      return gearCards;
    }
    const query = searchQuery.toLowerCase();
    return gearCards.filter(({ detail, summary }) => {
      const name = (detail?.gear_name ?? summary.gear_name ?? '').toLowerCase();
      const serial = (detail?.serial_number ?? '').toLowerCase();
      const type = (
        detail?.gear_type?.gear_type ??
        summary.type?.name ??
        ''
      ).toLowerCase();
      return name.includes(query) || serial.includes(query) || type.includes(query);
    });
  }, [gearCards, searchQuery]);

  const totalItems = filteredGears.length;
  const from = page * numberOfItemsPerPage;
  const to = Math.min(from + numberOfItemsPerPage, totalItems);
  const currentGears = filteredGears.slice(from, to);

  const handleUpdateGear = (card: GearCard) => {
    const gearId = card.detail?.gear_id ?? card.summary.id;
    navigation.navigate('UpadateInspection', {
      gearId,
      mode: 'update',
      firefighter: roster,
      tagColor: card.color ?? undefined,
      colorLocked: true,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (id: string) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
    ];
    const index = parseInt(id) % colors.length;
    return colors[index];
  };

  // Filter gears based on search
  const handleRefresh = useCallback(() => {
    setPage(0);
    loadGears(true);
  }, [loadGears]);

  /**
   * Render individual gear card
   */
  const renderGear = useCallback(
    ({ item }: { item: GearCard }) => {
      const detail = item.detail;
      const summary = item.summary;
      const tagColor = item.color ?? colors.primary;
      const gearId = detail?.gear_id ?? summary.id;
      const gearName = detail?.gear_name ?? summary.gear_name ?? 'Gear';
      const serialNumber = detail?.serial_number ?? 'N/A';
      const manufacturerName =
        detail?.manufacturer?.manufacturer_name ?? 'Unknown manufacturer';
      const gearTypeName =
        detail?.gear_type?.gear_type ?? summary.type?.name ?? 'Gear';

      return (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleUpdateGear(item)}
          style={[styles.card, styles.shadow, { borderColor: colors.outline }]}
        >
          <View style={[styles.cardTagBadge, { backgroundColor: tagColor }]} />
          <Card style={{ backgroundColor: colors.surface }}>
            <Card.Content>
              {/* Card Header with Gear ID and Type */}
              <View style={styles.cardHeader}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                  #{gearId}
                </Text>
                <Text
                  variant="titleMedium"
                  style={{ fontWeight: 'bold', fontSize: 12, color: '#555' }}
                  numberOfLines={1}
                >
                  {gearTypeName}
                </Text>
              </View>

              {/* Gear Image and Basic Info */}
              <View style={styles.gearImageContainer}>
                <Image
                  source={{
                    uri: getGearImage(detail?.gear_type?.gear_type ?? summary.type?.name ?? null),
                  }}
                  style={styles.gearImage}
                  resizeMode="cover"
                />
              </View>

              {/* Gear Details */}
              <View style={styles.gearDetails}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Icon source="barcode" size={16} color="#555" />
                  <Text style={{ marginLeft: 6, fontSize: 14, fontWeight: '600' }}>
                    {serialNumber}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Icon source="hard-hat" size={16} color="#555" />
                  <Text style={{ marginLeft: 6 }} numberOfLines={1}>
                    {gearName}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Icon source="factory" size={16} color="#555" />
                  <Text style={{ marginLeft: 6 }} numberOfLines={1}>
                    {manufacturerName}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Icon source="tag-outline" size={16} color="#555" />
                  <Text style={{ marginLeft: 6 }}>
                    {detail?.gear_type?.gear_type ?? summary.type?.name ?? 'N/A'}
                  </Text>
                </View>

                {detail?.gear_size && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Icon source="ruler" size={16} color="#555" />
                    <Text style={{ marginLeft: 6 }}>{detail.gear_size}</Text>
                  </View>
                )}
              </View>

              {/* Update Button */}
              <Button
                mode="contained"
                onPress={() => handleUpdateGear(item)}
                icon="clipboard-edit-outline"
                style={styles.updateButton}
                contentStyle={styles.updateButtonContent}
                buttonColor={tagColor}
              >
                Update
              </Button>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      );
    },
    [colors, navigation],
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header 
          title={`${roster.name}'s Gears`}
          showBackButton={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="bodyMedium" style={{ marginTop: p(16) }}>Loading gears...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title={`${roster.name}'s Gears`}
        showBackButton={true}
      />

      {/* Firefighter Info Card */}
      <Card style={[styles.firefighterInfoCard, { backgroundColor: colors.surface }]}>
        {rosterTagColor && (
          <View style={[styles.rosterTagBadge, { backgroundColor: rosterTagColor }]} />
        )}
        <Card.Content>
          <View style={styles.firefighterHeader}>
            {/* Left: Profile Avatar and Name/Email */}
            <View style={styles.leftSection}>
              <View style={[styles.avatar, { backgroundColor: getAvatarColor(String(roster.id)) }]}>
                <Text style={styles.avatarText}>{getInitials(roster.name)}</Text>
              </View>
              <View style={styles.nameEmailContainer}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold', fontSize: p(14) }}>
                  {roster.name}
                </Text>
                <Text style={{ fontSize: p(12), color: '#666' }} numberOfLines={1}>
                  {roster.email || 'firefighter@station.com'}
                </Text>
              </View>
            </View>

            {/* Right: Total Gears Count */}
            <View style={styles.rightSection}>
              <View style={styles.gearCountContainer}>
                <Icon source="tools" size={p(20)} color={colors.primary} />
                <Text style={styles.gearCountText}>{gearCards.length}</Text>
                <Text style={styles.gearLabel}>Total Gears</Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* 🔍 Search Section */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          mode="outlined"
          placeholder="Search by gear name, serial number, or type"
          value={searchQuery}
          onChangeText={setSearchQuery}
          left={<TextInput.Icon icon="magnify" />}
          style={styles.searchInput}
          dense
        />
      </View>

      {/* Gears Grid - Two Columns */}
      <FlatList
        data={currentGears}
        renderItem={renderGear}
        keyExtractor={(item) => item.summary.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon source="package-variant-closed" size={64} color={colors.outline} />
            <Text variant="titleMedium" style={{ marginTop: 16, color: colors.outline }}>
              No Gears Found
            </Text>
            <Text variant="bodyMedium" style={{ color: colors.outline, textAlign: 'center', marginTop: 8 }}>
              {searchQuery
                ? 'Try adjusting your search criteria' 
                : 'No gears assigned to this roster'
              }
            </Text>
          </View>
        }
      />

      {/* Pagination */}
      <View style={[styles.paginationContainer, { backgroundColor: colors.surface, borderTopColor: colors.outline }]}>
        <DataTable.Pagination
          page={page}
          numberOfPages={Math.ceil(filteredGears.length / numberOfItemsPerPage)}
          onPageChange={newPage => setPage(newPage)}
          label={`${from + 1}-${to} of ${filteredGears.length}`}
          showFastPaginationControls
          numberOfItemsPerPageList={numberOfItemsPerPageList}
          numberOfItemsPerPage={numberOfItemsPerPage}
          onItemsPerPageChange={setNumberOfItemsPerPage}
          selectPageDropdownLabel={'Gears per page'}
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
  firefighterInfoCard: {
    margin: p(14),
    marginBottom: p(8),
    borderRadius: p(8),
    elevation: 1,
    overflow: 'hidden',
  },
  firefighterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    alignItems: 'flex-end',
  },
  gearCountContainer: {
    alignItems: 'center',
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
  searchContainer: {
    paddingHorizontal: p(14),
    paddingTop: p(8),
    paddingBottom: p(8),
  },
  searchInput: {
    marginBottom: p(8),
  },
  grid: {
    paddingBottom: p(100),
    paddingHorizontal: p(5),
    gap: p(10),
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: p(10),
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 1,
  },
  card: {
    flex: 1,
    margin: p(1),
    borderRadius: p(10),
    minHeight: p(260),
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTagBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: p(30),
    height: p(24),
    borderTopRightRadius: p(10),
    borderBottomLeftRadius: p(10),
    zIndex: 1,
  },
  rosterTagBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: p(30),
    height: p(24),
    borderTopRightRadius: p(8),
    borderBottomLeftRadius: p(10),
    zIndex: 1,
  },
  gearImageContainer: {
    alignItems: 'center',
  },
  gearImage: {
    width: p(80),
    height: p(80),
    borderRadius: p(8),
  },
  gearDetails: {
    marginBottom: p(12),
  },
  updateButton: {
    borderRadius: p(8),
  },
  updateButtonContent: {
    paddingVertical: p(4),
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
});