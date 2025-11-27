// src/screens/inspectionscreens/components/InspectionHeader.tsx
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from "react-native";
import { Text, Icon, IconButton, Menu, useTheme, Button } from "react-native-paper";
import Header from "../../../components/common/Header";

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
  mode 
}) => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const [menuVisible, setMenuVisible] = useState(false);

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

  const handleUpdate = () => {
    Alert.alert("Update Firefighter", "You tapped update firefighter.");
  };

  const handleRemove = () => {
    Alert.alert("Remove Firefighter", "You tapped remove firefighter.");
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

  const screenTitle = mode === 'create' ? 'Create Inspection' : 'Update Inspection';

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>

      {/* SCREEN TITLE WITH HISTORY BUTTON */}
      <View style={styles.headerWithHistory}>
        <Header title={screenTitle} />
        <Button 
          mode="outlined" 
          onPress={handleHistoryPress}
          icon="history"
          style={styles.historyButton}
          compact
        >
          Gear History
        </Button>
      </View>

      {/* TAG COLOR DISPLAY */}
      {/* {tagColor && (
        <View style={[styles.tagColorBar, { backgroundColor: tagColor }]}>
          <Text style={styles.tagColorText}>
            {isColorLocked ? "🔒 Color Locked" : "Selected Color"}
          </Text>
        </View>
      )} */}

      {/* COLLAPSIBLE HEADER */}
      <View style={styles.headerRow}>

                {/* RIGHT SIDE - FIREFIGHTER INFO WITH COLLAPSE */}
        <TouchableOpacity 
          style={styles.rightSection} 
          onPress={toggleCollapse} 
          activeOpacity={0.8}
        >
          <View style={styles.firefighterInfo}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
              <Icon source="account" size={26} color={colors.primary} />
            </View>

            <View style={styles.firefighterDetails}>
              <Text style={[styles.name, { color: colors.onSurface }]}>
                {roster ? `${roster.first_name} ${roster.last_name}` : "Unassigned"}
              </Text>
              <Text style={[styles.detail, { color: colors.onSurfaceVariant }]}>
                {gear?.gear_type?.gear_type} • {gear?.serial_number}
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


        {/* LEFT SIDE - COLOR BUTTON */}
        <View style={styles.leftSection}>
          {tagColor ? (
            <Button
              mode="outlined"
              icon="pencil"
              onPress={handleColorButtonPress}
              disabled={isColorLocked}
              style={[styles.colorButton, { backgroundColor: tagColor }]}
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
        </View>


      </View>

      {/* EXPANDED CONTENT */}
      {!isCollapsed && (
        <View style={[styles.expandedCard, { borderTopColor: colors.outline }]}>

          <View style={styles.infoRow}>
            
            {/* LEFT — FIREFIGHTER */}
            <View style={styles.infoCard}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Firefighter</Text>

                {/* MENU BUTTON */}
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
                    onPress={handleUpdate}
                    title="Update Firefighter"
                    leadingIcon="account-edit"
                  />
                  <Menu.Item
                    onPress={handleRemove}
                    title="Remove Firefighter"
                    leadingIcon="delete"
                  />
                </Menu>
              </View>

              {roster ? (
                <>
                  <View style={styles.rowItem}>
                    <Icon source="account" size={18} color={colors.primary} />
                    <Text style={[styles.value, { color: colors.onSurface }]}>
                      {roster.first_name} {roster.middle_name ?? ""} {roster.last_name}
                    </Text>
                  </View>

                  <View style={styles.rowItem}>
                    <Icon source="email" size={18} color={colors.primary} />
                    <Text style={[styles.value, { color: colors.onSurface }]}>{roster.email}</Text>
                  </View>

                  <View style={styles.rowItem}>
                    <Icon source="phone" size={18} color={colors.primary} />
                    <Text style={[styles.value, { color: colors.onSurface }]}>{roster.phone}</Text>
                  </View>

                  <View style={styles.rowItem}>
                    <Icon source="office-building" size={18} color={colors.primary} />
                    <Text style={[styles.value, { color: colors.onSurface }]}>{roster.station}</Text>
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
                  {gear?.gear_type?.gear_type}
                </Text>
              </View>

              <View style={styles.rowItem}>
                <Icon source="barcode" size={18} color={colors.primary} />
                <Text style={[styles.value, { color: colors.onSurface }]}>{gear?.serial_number}</Text>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  historyButton: {
    position: "absolute",
    right: 10,
    marginRight: 0,
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  leftSection: {
    // flex: 1,
    // marginRight: 12,width:"30%"
    width:"30%"
  },
  rightSection: {
    // flex: 2,
    width:"30%"
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