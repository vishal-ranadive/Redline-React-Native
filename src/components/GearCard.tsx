import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Card, Text, Badge, useTheme } from 'react-native-paper';
import { Icon } from "react-native-paper";

const p = (v: number) => v;

type Props = {
  gear: any;
  onPress?: () => void;
};

/* ---------------------------------------------------------
   1. Gear Type → Image + Icon Mapping
--------------------------------------------------------- */
const GEAR_ASSETS: any = {
  helmet: {
    image: "https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg?resizeh=250&resizew=250",
    icon: "shield-helmet",
  },
  jacket: {
    image: "https://s7d9.scene7.com/is/image/minesafetyappliances/GlobeG-XCELJacket_gxcelJacket?$Home%20Market%20Card$",
    icon: "tshirt-crew",
  },
  gloves: {
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFDCux32MFLBioGWbYdOiDfJoCV4sko1-sSQ&s",
    icon: "hand-back-right",
  },
  boots: {
    image: "https://www.hacsons.com/wp-content/uploads/2024/08/image-3-1.png",
    icon: "shoe-print",
  },
  respirator: {
    image: "https://upload.wikimedia.org/wikipedia/commons/4/4d/SCBA_mask.jpg",
    icon: "gas-mask",
  },
  harness: {
    image: "https://cdn11.bigcommerce.com/s-75f06/images/stencil/1280x1280/products/2415/6825/H1210_Front_1000__66058.1590167029.png",
    icon: "seatbelt",
  },
  hose: {
    image: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Fire_hose_with_nozzle.jpg",
    icon: "water-pump",
  },
  pants: {
    image: "https://s7d9.scene7.com/is/image/minesafetyappliances/GlobeG-XCELPants_gxcelPants?$Home%20Market%20Card$",
    icon: "shoe-cleat",
  },

  default: {
    image: "https://img.freepik.com/free-vector/firefighter-tools-equipment_1284-11975.jpg",
    icon: "fire",
  },
};

/* ---------------------------------------------------------
   2. Normalize API Gear Types
--------------------------------------------------------- */
const normalizeGearType = (value: string | null) => {
  if (!value) return "default";
  const v = value.toLowerCase();

  if (v.includes("helmet")) return "helmet";
  if (v.includes("jacket")) return "jacket";
  if (v.includes("glove")) return "gloves";
  if (v.includes("boot")) return "boots";
  if (v.includes("pant")) return "pants";
  if (v.includes("resp") || v.includes("mask")) return "respirator";
  if (v.includes("harness")) return "harness";
  if (v.includes("hose")) return "hose";

  return "default";
};

/* ---------------------------------------------------------
   3. GearCard Component
--------------------------------------------------------- */
const GearCard: React.FC<Props> = ({ gear, onPress }) => {
  const { colors } = useTheme();

  const typeKey = normalizeGearType(gear?.gear_type?.gear_type);
  const asset = GEAR_ASSETS[typeKey] || GEAR_ASSETS.default;

  return (
    <TouchableOpacity style={styles.wrapper} activeOpacity={0.85} onPress={onPress}>
      <Card style={[styles.card, { backgroundColor: colors.surface }]}>

        <Card.Content>
          <View style={styles.row}>

            {/* Gear Image */}
            <Image
              source={{ uri: asset.image }}
              style={styles.image}
              resizeMode="cover"
            />

            {/* Text + Icon */}
            <View style={{ marginLeft: p(12), flex: 1 }}>
              
              <View style={styles.titleRow}>
              {/* <Icon
                source={asset.icon}
                size={18}
                color="#00A1E0"
                // style={{ marginRight: p(6) }}
              /> */}

                <Text variant="titleMedium" numberOfLines={1} style={styles.gearName}>
                  {gear.gear_name}
                </Text>
              </View>

              <Text
                variant="bodySmall"
                numberOfLines={1}
                style={{ color: colors.onSurfaceVariant }}
              >
                {gear?.gear_type?.gear_type || "Unknown Type"}
              </Text>
              <View style={styles.titleRow}>
                  <Icon
                    source={"barcode"}
                    size={18}
                    color="#00A1E0"
                    // style={{ marginRight: p(6) }}
                  />

                <Text variant="titleMedium" numberOfLines={1} style={styles.gearName}>
                  {gear.serial_number}
                </Text>
              </View>
            </View>

            {/* Status Badge */}
            {gear.available ? (
              <Badge style={[styles.badge, styles.passBadge]}>Pass</Badge>
            ) : (
              <Badge style={[styles.badge, styles.failBadge]}>Fail</Badge>
            )}

          </View>
        </Card.Content>

      </Card>
    </TouchableOpacity>
  );
};

/* ---------------------------------------------------------
   4. Styles
--------------------------------------------------------- */
const styles = StyleSheet.create({
  wrapper: { 
    flex: 1, 
    margin: p(6),
    minWidth: p(150),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  card: { 
    borderRadius: p(10), 
    paddingVertical: p(6),
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  image: { 
    width: p(56), 
    height: p(56), 
    borderRadius: p(8),
    backgroundColor: "#F0F4F8",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  gearName: {
    fontWeight: '600',
    marginBottom: p(2),
  },
  badge: {
    alignSelf: 'flex-start',
    fontSize: p(10),
    fontWeight: '600',
  },
  passBadge: {
    backgroundColor: '#34A853',
  },
  failBadge: {
    backgroundColor: '#EA4335',
  },
});

export default GearCard;
