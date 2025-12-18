// src/screens/repairscreens/components/RepairHeader.tsx
import { useNavigation } from "@react-navigation/native";
import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Dimensions,
} from "react-native";
import { Text, Icon, IconButton, useTheme, Button } from "react-native-paper";
import Header from "../../../components/common/Header";

// Enable smooth animation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface RepairHeaderProps {
  gear: any;
  roster: any;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  scrollY: any;
  onHistoryPress?: () => void;
}

export const RepairHeader: React.FC<RepairHeaderProps> = ({
  gear,
  roster,
  isCollapsed,
  onToggleCollapse,
  scrollY,
  onHistoryPress
}) => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isMobile = screenWidth < 600;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription.remove();
  }, []);

  const toggleCollapse = () => {
    LayoutAnimation.easeInEaseOut();
    onToggleCollapse();
  };

  const handleHistoryPress = () => {
    if (onHistoryPress) {
      onHistoryPress();
    } else if (gear?.gear_id) {
      navigation.navigate('GearDetail', { gear_id: gear.gear_id });
    }
  };

  // Format manufacturing date
  const formatManufacturingDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const screenTitle = 'Repair Details';

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>

      {/* SCREEN TITLE */}
      <View style={styles.headerWithHistory}>
        <Header title={screenTitle} />
      </View>

      {/* COLLAPSIBLE HEADER */}
      {isMobile ? (
        /* MOBILE LAYOUT */
        <>
          {/* Firefighter Info - Full Width */}
          <TouchableOpacity
            style={styles.mobileGearRow}
            onPress={toggleCollapse}
            activeOpacity={0.8}
          >
            <View style={styles.gearInfo}>
              <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
                <Icon source="account" size={26} color={colors.primary} />
              </View>

              <View style={styles.gearDetails}>
                <Text style={[styles.name, { color: colors.onSurface }]} numberOfLines={1}>
                  {roster?.first_name && roster?.last_name
                    ? `${roster.first_name} ${roster.middle_name ? roster.middle_name + ' ' : ''}${roster.last_name}`
                    : roster?.first_name || roster?.last_name || 'Unnamed Firefighter'
                  }
                </Text>
                <Text style={[styles.detail, { color: colors.onSurfaceVariant }]}>
                  {roster?.email ?? "-"} • {gear?.firestation?.name ?? "-"}
                </Text>
              </View>

              {/* Expand / Collapse Icon */}
              <Icon
                source={isCollapsed ? "chevron-down" : "chevron-up"}
                size={26}
                color={colors.primary}
              />
            </View>
          </TouchableOpacity>

          {/* Gear History Button - Below Gear Info */}
          <View style={styles.mobileBottomRow}>
            <Button
              mode="outlined"
              onPress={handleHistoryPress}
              icon="history"
              style={styles.mobileHistoryButton}
              compact
            >
              Gear History
            </Button>
          </View>
        </>
      ) : (
        /* TABLET/iPAD LAYOUT - All in one line */
        <View style={styles.tabletSingleRow}>
          {/* Firefighter Info */}
          <TouchableOpacity
            style={styles.tabletGearSection}
            onPress={toggleCollapse}
            activeOpacity={0.8}
          >
            <View style={styles.gearInfo}>
              <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
                <Icon source="account" size={26} color={colors.primary} />
              </View>

              <View style={styles.gearDetails}>
                <Text style={[styles.name, { color: colors.onSurface }]} numberOfLines={1}>
                  {roster?.first_name && roster?.last_name
                    ? `${roster.first_name} ${roster.middle_name ? roster.middle_name + ' ' : ''}${roster.last_name}`
                    : roster?.first_name || roster?.last_name || 'Unnamed Firefighter'
                  }
                </Text>
                <Text style={[styles.detail, { color: colors.onSurfaceVariant }]}>
                  {roster?.email ?? "-"} • {gear?.firestation?.name ?? "-"}
                </Text>
              </View>

              {/* Expand / Collapse Icon */}
              <Icon
                source={isCollapsed ? "chevron-down" : "chevron-up"}
                size={26}
                color={colors.primary}
              />
            </View>
          </TouchableOpacity>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Gear History Button */}
          <Button
            mode="outlined"
            onPress={handleHistoryPress}
            icon="history"
            style={styles.tabletHistoryButton}
            compact
          >
            Gear History
          </Button>
        </View>
      )}

      {/* EXPANDED CONTENT */}
      {!isCollapsed && (
        <View style={[styles.expandedCard, { borderTopColor: colors.outline }]}>

          <View style={styles.infoRow}>

            {/* LEFT — ROSTER/FIREFIGHTER INFO */}
            <View style={styles.infoCard}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Firefighter</Text>

              {roster ? (
                <>
                  <View style={styles.rowItem}>
                    <Icon source="account" size={18} color={colors.primary} />
                    <Text style={[styles.value, { color: colors.onSurface }]} numberOfLines={1}>
                      {roster.first_name && roster.last_name
                        ? `${roster.first_name} ${roster.middle_name ? roster.middle_name + ' ' : ''}${roster.last_name}`
                        : roster.first_name || roster.last_name || 'Unnamed'
                      }
                    </Text>
                  </View>

                  <View style={styles.rowItem}>
                    <Icon source="email" size={18} color={colors.primary} />
                    <Text style={[styles.value, { color: colors.onSurface }]} numberOfLines={1}>
                      {roster.email ?? "-"}
                    </Text>
                  </View>

                  <View style={styles.rowItem}>
                    <Icon source="phone" size={18} color={colors.primary} />
                    <Text style={[styles.value, { color: colors.onSurface }]} numberOfLines={1}>
                      {roster.phone ?? "-"}
                    </Text>
                  </View>

                  <View style={styles.rowItem}>
                    <Icon source="office-building" size={18} color={colors.primary} />
                    <Text style={[styles.value, { color: colors.onSurface }]}>
                      {gear?.firestation?.name ?? "-"}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={[styles.value, { color: colors.onSurfaceVariant }]}>Not assigned</Text>
              )}
            </View>

            {/* RIGHT — GEAR DETAILS */}
            <View style={styles.infoCard}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Gear Details</Text>

              <View style={styles.rowItem}>
                <Icon source="format-list-text" size={18} color={colors.primary} />
                <Text style={[styles.value, { color: colors.onSurface }]}>
                  {gear?.gear_type?.gear_type ?? "-"}
                </Text>
              </View>

              <View style={styles.rowItem}>
                <Icon source="barcode" size={18} color={colors.primary} />
                <Text style={[styles.value, { color: colors.onSurface }]}>
                  {gear?.serial_number ?? "-"}
                </Text>
              </View>

              {/* MANUFACTURING DATE */}
              <View style={styles.rowItem}>
                <Icon source="calendar" size={18} color={colors.primary} />
                <Text style={[styles.value, { color: colors.onSurface }]}>
                  MFG: {formatManufacturingDate(gear?.manufacturing_date)}
                </Text>
              </View>

              <View style={styles.rowItem}>
                <Icon source="factory" size={18} color={colors.primary} />
                <Text style={[styles.value, { color: colors.onSurface }]}>
                  {gear?.manufacturer?.manufacturer_name || "-"}
                </Text>
              </View>

              <View style={styles.rowItem}>
                <Icon source="map-marker" size={18} color={colors.primary} />
                <Text style={[styles.value, { color: colors.onSurface }]}>
                  {gear?.firestation?.name || "-"}
                </Text>
              </View>
            </View>
          </View>

        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    zIndex: 99,
    elevation: 10,
    paddingBottom: 6,
  },
  headerWithHistory: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  // Mobile Layout Styles
  mobileGearRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  mobileBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  mobileHistoryButton: {
    minWidth: 120,
  },
  // Tablet/iPad Layout Styles
  tabletSingleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  tabletGearSection: {
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
  tabletHistoryButton: {
    minWidth: 140,
    marginLeft: 8,
  },
  gearInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  gearDetails: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  detail: {
    fontSize: 12,
  },
  expandedCard: {
    padding: 16,
    borderTopWidth: 1,
  },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  infoCard: {
    flex: 1,
    minWidth: "48%",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  value: {
    fontSize: 14,
  },
});
