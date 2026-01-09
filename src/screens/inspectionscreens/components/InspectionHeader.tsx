// src/screens/inspectionscreens/components/InspectionHeader.tsx
import { useNavigation } from "@react-navigation/native";
import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
  Dimensions,
} from "react-native";
import { Text, Icon, IconButton, Menu, useTheme, Button } from "react-native-paper";
import Header from "../../../components/common/Header";
import { getColorHex } from "../../../constants/colors";
import RosterModal from "../../../components/common/Modal/RosterModal";
import AddFirefighterModal from "../../../components/common/Modal/AddFirefighterModal";
import { useGearStore } from "../../../store/gearStore";
import { useLeadStore } from "../../../store/leadStore";

// Enable smooth animation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface InspectionHeaderProps {
  gear: any;
  roster: any;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  scrollY: any;
  tagColor?: string;
  isColorLocked?: boolean;
  onHistoryPress?: () => void;
  onColorPickerOpen?: () => void;
  mode: 'create' | 'update';
  onRosterUpdate?: () => void;
}

export const InspectionHeader: React.FC<InspectionHeaderProps> = ({ 
  gear, 
  roster, 
  isCollapsed, 
  onToggleCollapse, 
  scrollY,
  tagColor,
  isColorLocked = false,
  onHistoryPress,
  onColorPickerOpen,
  mode,
  onRosterUpdate
}) => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const [menuVisible, setMenuVisible] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isMobile = screenWidth < 600;
  const [rosterModalVisible, setRosterModalVisible] = useState(false);
  const [addFirefighterModalVisible, setAddFirefighterModalVisible] = useState(false);
  const { updateGear } = useGearStore();
  const { currentLead } = useLeadStore();

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription.remove();
  }, []);

  const rosterName = useMemo(() => {
    if (!roster) {
      return "Unassigned";
    }
    if (roster.name) {
      return roster.name;
    }
    const parts = [
      roster.first_name,
      roster.middle_name,
      roster.last_name,
    ].filter((part) => typeof part === "string" && part.trim().length > 0);

    return parts.length > 0 ? parts.join(" ") : "Unassigned";
  }, [roster]);

  const rosterEmail = roster?.email ?? roster?.email_address ?? "-";
  const rosterPhone = roster?.phone ?? roster?.phone_number ?? "-";
  
  // Handle station which could be an object or string
  const getStationName = (station: any): string => {
    if (!station) return "-";
    if (typeof station === "string") return station;
    if (typeof station === "object" && station.name) return station.name;
    return "-";
  };
  const rosterStation = getStationName(roster?.station ?? roster?.firestation);

  const toggleCollapse = () => {
    LayoutAnimation.easeInEaseOut();
    onToggleCollapse();
  };

  const handleHistoryPress = () => {
    if (onHistoryPress) {
      onHistoryPress();
    } else if (gear?.gear_id) {
      navigation.navigate('GearDetail', { gearId: gear.gear_id });
    }
  };

  const handleColorButtonPress = () => {
    if (!isColorLocked && onColorPickerOpen) {
      onColorPickerOpen();
    }
  };

  // Roster update function - updates gear's roster_id
  const performRosterUpdate = async (selectedRoster: any | null) => {
    if (!gear?.gear_id) {
      Alert.alert('Error', 'Gear information not available');
      return;
    }

    try {
      const rosterId = selectedRoster ? (selectedRoster.roster_id || selectedRoster.id) : null;
      
      // Build gearData with all current gear properties
      const gearData: any = {
        gear_name: gear.gear_name,
        serial_number: gear.serial_number,
        manufacturer_id: gear.manufacturer?.manufacturer_id,
        firestation_id: gear.firestation?.id,
        roster_id: rosterId, // null to remove, or roster ID to assign/update
        active_status: gear.active_status,
      };

      // Add optional fields
      if (gear.gear_type?.gear_type_id) {
        gearData.gear_type_id = gear.gear_type.gear_type_id;
      }
      if (gear.franchise?.id) {
        gearData.franchise_id = gear.franchise.id;
      }
      if (gear.gear_size) {
        gearData.gear_size = gear.gear_size;
      }
      if (gear.manufacturing_date) {
        gearData.manufacturing_date = gear.manufacturing_date;
      }
      if (gear.remarks) {
        gearData.remarks = gear.remarks;
      }

      const updatedGear = await updateGear(gear.gear_id, gearData);
      
      if (updatedGear) {
        // Call parent callback to refresh gear data
        if (onRosterUpdate) {
          await onRosterUpdate();
        }
        
        const rosterName = selectedRoster 
          ? (selectedRoster.roster_name || `${selectedRoster.first_name} ${selectedRoster.last_name}` || 'Firefighter')
          : '';
        const message = selectedRoster 
          ? `${rosterName} ${roster ? 'updated' : 'assigned'} successfully`
          : 'Firefighter assignment removed successfully';
        
        Alert.alert('Success', message);
        setRosterModalVisible(false);
        setMenuVisible(false);
      } else {
        Alert.alert('Error', 'Failed to update gear assignment');
      }
    } catch (error: any) {
      console.error('performRosterUpdate error:', error);
      Alert.alert('Error', error.message || 'Failed to update gear assignment');
    }
  };

  const handleRosterSelect = async (selectedRoster: any) => {
    setRosterModalVisible(false);
    await performRosterUpdate(selectedRoster);
  };

  const handleUpdate = () => {
    setMenuVisible(false);
    setRosterModalVisible(true);
  };

  const handleRemove = () => {
    setMenuVisible(false);
    const currentRosterName = rosterName !== "Unassigned" ? rosterName : 'this firefighter';
    Alert.alert(
      'Remove Firefighter',
      `Are you sure you want to remove the firefighter assignment from this gear?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await performRosterUpdate(null);
          },
        },
      ]
    );
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

  // const screenTitle = mode === 'create' ? 'Create Inspection' : 'Update Inspection';
  const screenTitle = 'Inspection Details';

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
            style={styles.mobileFirefighterRow} 
            onPress={toggleCollapse} 
            activeOpacity={0.8}
          >
            <View style={styles.firefighterInfo}>
              <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
                <Icon source="account" size={26} color={colors.primary} />
              </View>

              <View style={styles.firefighterDetails}>
                <Text style={[styles.name, { color: colors.onSurface }]} numberOfLines={1}>
                  {rosterName}
                </Text>
                <Text style={[styles.detail, { color: colors.onSurfaceVariant }]}>
                  {gear?.gear_type?.gear_type ?? "-"} • {gear?.serial_number ?? "-"}
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

          {/* Color Button and Gear History - Same Row Below Firefighter */}
          <View style={styles.mobileBottomRow}>
            {tagColor ? (
              <Button
                mode="outlined"
                icon="pencil"
                onPress={handleColorButtonPress}
                disabled={isColorLocked}
                style={[styles.colorButton, { backgroundColor: getColorHex(tagColor), flex: 1, marginRight: 8 }]}
                labelStyle={styles.colorButtonLabel}
                contentStyle={styles.colorButtonContent}
              >
                <Text
                  style={{
                    textShadowColor: 'rgba(0,0,0,0.3)',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 2,
                    fontWeight: '600',
                    fontSize: 14,
                    color: "white"
                  }}
                >
                  {isColorLocked ? "Color Locked" : "Change Color"}
                </Text>
              </Button>
            ) : (
              <Button
                mode="outlined"
                onPress={handleColorButtonPress}
                icon="palette"
                style={[styles.colorButton, { flex: 1, marginRight: 8 }]}
                labelStyle={styles.colorButtonLabel}
              >
                Select Color
              </Button>
            )}
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
            style={styles.tabletFirefighterSection} 
            onPress={toggleCollapse} 
            activeOpacity={0.8}
          >
            <View style={styles.firefighterInfo}>
              <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
                <Icon source="account" size={26} color={colors.primary} />
              </View>

              <View style={styles.firefighterDetails}>
                <Text style={[styles.name, { color: colors.onSurface }]} numberOfLines={1}>
                  {rosterName}
                </Text>
                <Text style={[styles.detail, { color: colors.onSurfaceVariant }]}>
                  {gear?.gear_type?.gear_type ?? "-"} • {gear?.serial_number ?? "-"}
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

          {/* Color Button */}
          {tagColor ? (
            <Button
              mode="outlined"
              icon="pencil"
              onPress={handleColorButtonPress}
              disabled={isColorLocked}
              style={[styles.colorButton, { backgroundColor: getColorHex(tagColor) }]}
              labelStyle={styles.colorButtonLabel}
              contentStyle={styles.colorButtonContent}
            >
              <Text
                style={{
                  textShadowColor: 'rgba(0,0,0,0.3)',
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 2,
                  fontWeight: '600',
                  fontSize: 14,
                  color: "white"
                }}
              >
                {isColorLocked ? "Color Locked" : "Change Color"}
              </Text>
            </Button>
          ) : (
            <Button
              mode="outlined"
              onPress={handleColorButtonPress}
              icon="palette"
              style={styles.colorButton}
              labelStyle={styles.colorButtonLabel}
            >
              Select Color
            </Button>
          )}

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
            
            {/* LEFT — FIREFIGHTER */}
            <View style={styles.infoCard}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Firefighter</Text>

                <View style={styles.headerActions}>
                  <Button
                    mode="text"
                    onPress={handleUpdate}
                    icon={roster ? "account-edit" : "account-plus"}
                    textColor={colors.primary}
                    labelStyle={{ fontSize: 12, fontWeight: '600' }}
                    contentStyle={{ flexDirection: 'row-reverse' }}
                    compact
                  >
                    {roster ? "Update Firefighter" : "Assign Firefighter"}
                  </Button>
                  
                  {roster && (
                    <Menu
                      visible={menuVisible}
                      onDismiss={() => setMenuVisible(false)}
                      anchor={
                        <IconButton
                          icon="dots-vertical"
                          size={22}
                          iconColor={colors.primary}
                          onPress={() => setMenuVisible(true)}
                        />
                      }
                    >
                      <Menu.Item
                        onPress={handleRemove}
                        title="Remove Firefighter"
                        leadingIcon="delete"
                      />
                    </Menu>
                  )}
                </View>
              </View>

                {roster ? (
                <>
                  <View style={styles.rowItem}>
                    <Icon source="account" size={18} color={colors.primary} />
                    <Text style={[styles.value, { color: colors.onSurface }]} numberOfLines={1}>
                      {rosterName}
                    </Text>
                  </View>

                  <View style={styles.rowItem}>
                    <Icon source="email" size={18} color={colors.primary} />
                    <Text style={[styles.value, { color: colors.onSurface }]} numberOfLines={1}>
                      {rosterEmail}
                    </Text>
                  </View>

                  <View style={styles.rowItem}>
                    <Icon source="phone" size={18} color={colors.primary} />
                    <Text style={[styles.value, { color: colors.onSurface }]} numberOfLines={1}>
                      {rosterPhone}
                    </Text>
                  </View>

                  <View style={styles.rowItem}>
                    <Icon source="office-building" size={18} color={colors.primary} />
                    <Text style={[styles.value, { color: colors.onSurface }]} numberOfLines={1}>
                      {rosterStation}
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

              {/* MANUFACTURING DATE - NEW */}
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

      {/* Roster Modals */}
      <RosterModal
        visible={rosterModalVisible}
        onClose={() => setRosterModalVisible(false)}
        onRosterSelect={handleRosterSelect}
        onAddRosterManual={() => {
          setRosterModalVisible(false);
          setAddFirefighterModalVisible(true);
        }}
      />

      <AddFirefighterModal
        visible={addFirefighterModalVisible}
        onClose={() => setAddFirefighterModalVisible(false)}
        onSuccess={async (newRoster) => {
          setAddFirefighterModalVisible(false);
          await performRosterUpdate(newRoster);
        }}
      />
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
  mobileFirefighterRow: {
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
  tabletFirefighterSection: {
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
  tabletHistoryButton: {
    minWidth: 140,
    marginLeft: 8,
  },
  tagColorBar: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    marginTop: 8,
  },
  tagColorText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  firefighterInfo: {
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
  firefighterDetails: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  detail: {
    fontSize: 12,
  },
  colorButton: {
    borderRadius: 8,
    minWidth: 120,
  },
  colorButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  colorButtonContent: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: 40,
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
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