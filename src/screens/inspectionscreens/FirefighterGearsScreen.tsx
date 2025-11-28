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
import { useInspectionStore } from '../../store/inspectionStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'UpadateInspection'>;

// Different gear images for different gear types
const GEAR_IMAGES = {
  'Helmet': 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg',
  'Gloves': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFDCux32MFLBioGWbYdOiDfJoCV4sko1-sSQ&s',
  'Boots': 'https://www.hacsons.com/wp-content/uploads/2024/08/image-3-1.png',
  'Jacket': 'https://images.unsplash.com/photo-1553062407-98cff3078e9a?w=400&h=400&fit=crop',
  'Mask': 'https://multimedia.3m.com/mws/media/1927020O/3m-scott-av-3000-ht-facepiece-600x600p.jpg',
  'Harness': 'https://www.uviraj.com/images/FBH-EN/U222FBH.jpg',
  'Axe': 'https://png.pngtree.com/element_our/20190528/ourmid/pngtree-a-metal-axe-image_1161001.jpg',
  'Hose': 'https://tirupatiplasto.in/wp-content/upiVBORw0KGgoAAAANSUhEUgAAARMAAAC3CAMAAAAGjUrGAAACRlBMVEXloads/2023/06/fh1.jpg',
  'default': 'https://media.gettyimages.com/id/72542196/photo/firemens-gear-at-firehouse.jpg?s=612x612&w=0&k=20&c=Hha2TRyDvyoN3CYK-Hjp_uWf-Jg1P4oJJVWtY6CP6eU='
};

const statusColorMap: { [key: string]: string } = {
  Pass: '#34A853',
  Repair: '#F9A825',
  Expired: '#ff0303ff',
  'Recommended Out Of Service': '#f15719ff',
  'Corrective Action Required': '#F9A825',
  Fail: '#8B4513',
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

// Types based on API response
type ApiGearInspection = {
  gear_id: number;
  gear_type_id: number;
  gear_usage: any;
  gear_name: string;
  current_inspection: any | null;
  previous_inspection: any | null;
};

type GearCard = {
  gear: ApiGearInspection;
  detail: Gear | null;
  color: string | null;
  gearStatus?: string;
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
  const { roster, leadId } = route.params;
  const { fetchGearById } = useGearStore();
  const { fetchFirefighterGears, firefighterGears, loading: inspectionLoading, error } = useInspectionStore();

  const [gearCards, setGearCards] = useState<GearCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [numberOfItemsPerPage, setNumberOfItemsPerPage] = useState(8);
  const numberOfItemsPerPageList = [4, 8, 12, 16];

  // Get tag color from the first gear's current inspection
  const rosterTagColor = useMemo(() => {
    if (firefighterGears.length > 0 && firefighterGears[0].current_inspection) {
      return normalizeTagColor(firefighterGears[0].current_inspection.tag_color);
    }
    return null;
  }, [firefighterGears]);

  console.log("!leadId || !roster?.id", {leadId ,roster : roster?.id}) 

  const loadGears = useCallback(
    async (refresh = false) => {
      if (!leadId || !roster?.id) {
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
        await fetchFirefighterGears(leadId, roster.id);
      } catch (error) {
        console.error('Error fetching gears:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchFirefighterGears, leadId, roster?.id],
  );

  useEffect(() => {
    loadGears();
  }, [loadGears]);

  useEffect(() => {
    let isMounted = true;
    const buildCards = async () => {
      if (!firefighterGears.length) {
        if (isMounted) {
          setGearCards([]);
        }
        return;
      }

      try {
        const cards = await Promise.all(
          firefighterGears.map(async (gear) => {
            const detail = await fetchGearById(gear.gear_id);

            let gearStatus = '';
            if (gear.current_inspection?.gear_status) {
              gearStatus = gear.current_inspection.gear_status.status;
            }

            let tagColor = null;
            if (gear.current_inspection?.tag_color) {
              tagColor = normalizeTagColor(gear.current_inspection.tag_color);
            }

            return {
              gear,
              detail,
              color: tagColor,
              gearStatus,
            } as GearCard;
          }),
        );

        if (isMounted) {
          setGearCards(cards);
        }
      } catch (err) {
        console.error('Error building gear cards:', err);
      }
    };

    buildCards();

    return () => {
      isMounted = false;
    };
  }, [firefighterGears, fetchGearById]);

  useEffect(() => {
    setPage(0);
  }, [numberOfItemsPerPage, searchQuery, roster?.id]);

  const filteredGears = useMemo(() => {
    if (!searchQuery.trim()) {
      return gearCards;
    }
    const query = searchQuery.toLowerCase();
    return gearCards.filter(({ detail, gear }) => {
      const name = (detail?.gear_name ?? gear.gear_name ?? '').toLowerCase();
      const serial = (detail?.serial_number ?? '').toLowerCase();
      const type = (
        detail?.gear_type?.gear_type ??
        gear.gear_name ??
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
    const gearId = card.detail?.gear_id ?? card.gear.gear_id;
    const inspectionId = card.gear.current_inspection?.inspection_id;
    
    navigation.navigate('UpadateInspection', {
      gearId,
      inspectionId,
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
      const gear = item.gear;
      const tagColor = item.color ?? colors.primary;
      const gearId = detail?.gear_id ?? gear.gear_id;
      const gearName = detail?.gear_name ?? gear.gear_name ?? 'Gear';
      const serialNumber = detail?.serial_number ?? 'N/A';
      const manufacturerName =
        detail?.manufacturer?.manufacturer_name ?? 'Unknown manufacturer';
      const gearTypeName =
        detail?.gear_type?.gear_type ?? gear.gear_name ?? 'Gear';
      const statusColor = item.gearStatus
        ? statusColorMap[item.gearStatus] ?? tagColor
        : '#9E9E9E';

      return (
        <View style={styles.cardWrapper}>
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
                  {item.gearStatus ? (
                    <Chip 
                      mode="outlined" 
                      textStyle={[styles.gearStatusText, { color: '#fff' }]}
                      style={[
                        styles.headerStatusChip,
                        { backgroundColor: statusColor, borderColor: statusColor },
                      ]}
                    >
                      {item.gearStatus}
                    </Chip>
                  ) : (
                    <Chip
                      mode="outlined"
                      textStyle={[styles.gearStatusText, { color: '#fff' }]}
                      style={[
                        styles.headerStatusChip,
                        { backgroundColor: statusColor, borderColor: statusColor },
                      ]}
                    >
                      No Status
                    </Chip>
                  )}
                  {/* <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                    #{gearId}
                  </Text> */}
                </View>

                {/* Gear Image and Basic Info */}
                <View style={styles.gearImageContainer}>
                  <Image
                    source={{
                      uri: getGearImage(detail?.gear_type?.gear_type ?? gear.gear_name ?? null),
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
                      {detail?.gear_type?.gear_type ?? gear.gear_name ?? 'N/A'}
                    </Text>
                  </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Icon source="ruler" size={16} color="#555" />
                  <Text style={{ marginLeft: 6 }}>
                    {detail?.gear_size ?? 'N/A'}
                  </Text>
                </View>
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
        </View>
      );
    },
    [colors, navigation],
  );

  if ((loading || inspectionLoading) && !refreshing) {
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
        keyExtractor={(item) => item.gear.gear_id.toString()}
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
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: p(9),
  },
  cardWrapper: {
    width: '48%',
    marginBottom: p(12),
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 1,
  },
  card: {
    marginHorizontal: 0,
    borderRadius: p(10),
    minHeight: p(280),
    overflow: 'hidden',
  },
  cardTypeText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#555',
    textAlign: 'left',
    paddingRight: p(6),
    maxWidth: '75%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: p(8),
    paddingRight: p(12),
  },
  headerStatusChip: {
    height: p(26),
    alignSelf: 'flex-start',
    marginRight: p(6),
  },
  gearStatusText: {
    fontSize: 11,
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
    marginBottom: p(8),
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