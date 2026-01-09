import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Card, Text, Avatar, Badge, useTheme } from 'react-native-paper';

const p = (v: number) => v;

type Props = {
  gear: any;
  onPress?: () => void;
};

// Import local gear images
const gearImages: any = {
  Helmet: {
    uri: "https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg?resizeh=250&resizew=250",
  },

  "Fire Jacket": {
    uri: "https://s7d9.scene7.com/is/image/minesafetyappliances/GlobeG-XCELJacket_gxcelJacket?$Home%20Market%20Card$",
  },

  "Fire Gloves": {
    uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFDCux32MFLBioGWbYdOiDfJoCV4sko1-sSQ&s",
  },

  "Fire Boots": {
    uri: "https://www.hacsons.com/wp-content/uploads/2024/08/image-3-1.png",
  },

  Respirator: {
    uri: "https://upload.wikimedia.org/wikipedia/commons/4/4d/SCBA_mask.jpg",
  },

  Harness: {
    uri: "https://cdn11.bigcommerce.com/s-75f06/images/stencil/1280x1280/products/2415/6825/H1210_Front_1000__66058.1590167029.png?c=2",
  },

  "Fire Axe": {
    uri: "https://upload.wikimedia.org/wikipedia/commons/5/56/Firefighter_Axe.jpg",
  },

  "Fire Hose": {
    uri: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Fire_hose_with_nozzle.jpg",
  },

  "Protective Pants": {
    uri: "https://s7d9.scene7.com/is/image/minesafetyappliances/GlobeG-XCELPants_gxcelPants?$Home%20Market%20Card$",
  },

  // "Thermal Imaging Camera": {
  //   uri: "https://upload.wikimedia.org/wikipedia/commons/1/1d/TIC_Fire_Service.jpg",
  // },

  default: {
    uri: "https://img.freepik.com/free-vector/firefighter-tools-equipment_1284-11975.jpg", // neutral default gear icon
  },
};


const GearCard: React.FC<Props> = ({ gear, onPress }) => {

  console.log("gearGearCard",gear)
  const { colors } = useTheme();
  
  // Get the appropriate image based on gear category
const getGearImage = () => {
  // Priority 1: Remote image from API
  if (gear?.gearData?.gear_image_url) {
    return { uri: gear.gearData.gear_image_url };
  }

  // Priority 2: Valid local require()
  if (typeof gear.image === 'number' && gear.image > 1000) {
    return gear.image;
  }

  // Priority 3: Category-based
  return gearImages[gear?.category] || gearImages?.default;
};

  const imageSource = getGearImage();

  return (
    <TouchableOpacity style={styles.wrapper} activeOpacity={0.85} onPress={onPress}>
      <Card style={[styles.card, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <View style={styles.row}>
            {/* Image with proper handling for both local and remote images */}
            <View style={styles.imageContainer}>
              {typeof imageSource === 'number' || imageSource?.uri ? (
                <Image 
                  source={imageSource} 
                  style={styles.image} 
                  resizeMode="cover"
                  defaultSource={gearImages.default} // Fallback for remote images
                />
              ) : (
                <Avatar.Icon 
                  size={p(48)} 
                  icon="hard-hat" 
                  style={{ backgroundColor: colors.primaryContainer }} 
                />
              )}
            </View>
            
            <View style={{ marginLeft: p(12), flex: 1 }}>
              <Text variant="titleMedium" numberOfLines={1} style={styles.gearName}>
                {gear.name}
              </Text>
              <Text variant="bodySmall" numberOfLines={1} style={{ color: colors.onSurfaceVariant }}>
                {gear.category} • {gear.id}
              </Text>
            </View>
            
            {/* Status Badge */}
            {gear.available ? (
              <Badge style={[styles.badge, styles.passBadge]}>Pass</Badge>
            ) : (
              <Badge style={[styles.badge, styles.failBadge]}>Fail</Badge>
            )}
          </View>
          
          {/* Description */}
          {gear.description ? (
            <Text variant="bodySmall" style={[styles.description, { color: colors.onSurfaceVariant }]}>
              {gear.description}
            </Text>
          ) : null}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

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
  imageContainer: {
    width: p(56),
    height: p(56),
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: { 
    width: p(56), 
    height: p(56), 
    borderRadius: p(6),
  },
  gearName: {
    fontWeight: '600',
    marginBottom: p(2),
  },
  description: { 
    marginTop: p(8),
    lineHeight: p(16),
  },
  badge: {
    alignSelf: 'flex-start',
    fontSize: p(10),
    fontWeight: '600',
  },
  passBadge: {
    backgroundColor: '#34A853', // Green for pass/available
  },
  failBadge: {
    backgroundColor: '#EA4335', // Red for fail/unavailable
  },
});

export default GearCard;