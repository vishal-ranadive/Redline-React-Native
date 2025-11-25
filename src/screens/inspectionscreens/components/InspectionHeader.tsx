// src/screens/inspectionscreens/components/InspectionHeader.tsx

import { useNavigation, useRoute } from "@react-navigation/native";
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
import { Text, Icon, IconButton, Menu, useTheme, Divider } from "react-native-paper";
import Header from "../../../components/common/Header";

// Enable smooth animation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const InspectionHeader = ({ gear, roster }: any) => {
  const { colors } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const navigation = useNavigation<any>();
  const route = useRoute();

  const [menuVisible, setMenuVisible] = useState(false);

  const toggleCollapse = () => {
    LayoutAnimation.easeInEaseOut();
    setIsCollapsed(!isCollapsed);
  };

  const handleUpdate = () => {
    Alert.alert("Update Firefighter", "You tapped update firefighter.");
  };

  const handleRemove = () => {
    Alert.alert("Remove Firefighter", "You tapped remove firefighter.");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>

      {/* SCREEN TITLE */}


      <Header title="Update Gear Inspection" />


      {/* COLLAPSIBLE HEADER */}
      <TouchableOpacity style={styles.headerRow} onPress={toggleCollapse} activeOpacity={0.8}>
        
        <View style={styles.leftRow}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
            <Icon source="account" size={26} color={colors.primary} />
          </View>

          <View>
            <Text style={[styles.name, { color: colors.onSurface }]}>
              {roster ? `${roster.first_name} ${roster.last_name}` : "Unassigned"}
            </Text>
            <Text style={[styles.detail, { color: colors.onSurfaceVariant }]}>
              {gear?.gear_type?.gear_type} • {gear?.serial_number}
            </Text>
          </View>
        </View>

        {/* Expand / Collapse Icon */}
        <Icon
          source={isCollapsed ? "chevron-down" : "chevron-up"}
          size={26}
          color={colors.primary}   // RED ICON
        />
      </TouchableOpacity>

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
                      iconColor={colors.primary}  // RED
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

  screenTitle: {
    fontSize: 22,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
  },

  leftRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
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
