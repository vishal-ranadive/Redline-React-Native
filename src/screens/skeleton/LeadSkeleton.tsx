import React from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { useTheme } from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { p } from "../../utils/responsive";

interface LeadCardSkeletonProps {
  isMobile?: boolean;
  numColumns?: number;
  count?: number;
}

const LeadCardSkeleton: React.FC<LeadCardSkeletonProps> = ({ 
  isMobile = false,
  numColumns = 1,
  count = 6
}) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const shimmer = useSharedValue(0);

  React.useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1600 }), -1, false);
  }, []);

  const animatedShimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmer.value, [0, 1], [-width, width]);
    return {
      transform: [{ translateX }],
    };
  });

  // Group cards into rows for multi-column layout
  const cards = Array.from({ length: count });
  const rows = [];
  for (let i = 0; i < cards.length; i += numColumns) {
    rows.push(cards.slice(i, i + numColumns));
  }

  return (
    <View style={[styles.container, isMobile ? styles.containerMobile : styles.containerTablet]}>
      {rows.map((row, rowIndex) => (
        <View 
          key={rowIndex} 
          style={[styles.row, numColumns > 1 && styles.rowMultiColumn]}
        >
          {row.map((_, cardIndex) => {
            const index = rowIndex * numColumns + cardIndex;
            return (
              <View
                key={index}
                style={[
                  styles.card,
                  { width: isMobile ? '100%' : '48%' },
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.outline,
                  },
                ]}
              >
          {/* Moving shimmer band */}
          <Animated.View
            style={[
              styles.shimmerOverlay,
              animatedShimmerStyle,
              {
                backgroundColor: colors.primary + "20", // faint tint of primary
              },
            ]}
          >
            {/* Inner gradient illusion */}
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: "transparent",
                  shadowColor: "#ffffff",
                  shadowOffset: { width: 40, height: 0 },
                  shadowOpacity: 0.9,
                  shadowRadius: 50,
                },
              ]}
            />
          </Animated.View>

                {/* Skeleton structure matching actual card */}
                {/* Card Header - Job ID and Status */}
                <View style={styles.cardHeader}>
                  <View
                    style={[styles.block, { width: p(80), height: p(18), backgroundColor: colors.outline + "40" }]}
                  />
                  <View style={styles.statusRow}>
                    <View
                      style={[styles.statusDot, { backgroundColor: colors.outline + "40" }]}
                    />
                    <View
                      style={[styles.block, { width: p(60), height: p(16), backgroundColor: colors.outline + "40" }]}
                    />
                  </View>
                </View>

                {/* Lead Details */}
                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <View
                      style={[styles.iconPlaceholder, { backgroundColor: colors.outline + "40" }]}
                    />
                    <View
                      style={[styles.block, { width: p(120), height: p(14), backgroundColor: colors.outline + "40" }]}
                    />
                  </View>
                  <View style={styles.detailRow}>
                    <View
                      style={[styles.iconPlaceholder, { backgroundColor: colors.outline + "40" }]}
                    />
                    <View
                      style={[styles.block, { width: p(150), height: p(14), backgroundColor: colors.outline + "40" }]}
                    />
                  </View>
                  <View style={styles.detailRow}>
                    <View
                      style={[styles.iconPlaceholder, { backgroundColor: colors.outline + "40" }]}
                    />
                    <View
                      style={[styles.block, { width: p(180), height: p(14), backgroundColor: colors.outline + "40" }]}
                    />
                  </View>
                  <View style={styles.detailRow}>
                    <View
                      style={[styles.iconPlaceholder, { backgroundColor: colors.outline + "40" }]}
                    />
                    <View
                      style={[styles.block, { width: p(140), height: p(14), backgroundColor: colors.outline + "40" }]}
                    />
                  </View>
                </View>

                {/* Order Type Badge (for desktop) or absolute positioned (for mobile) */}
                {!isMobile && (
                  <View style={styles.badgeContainer}>
                    <View
                      style={[styles.badge, { backgroundColor: colors.outline + "40" }]}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: p(8),
  },
  containerMobile: {
    paddingHorizontal: p(5),
  },
  containerTablet: {
    paddingHorizontal: p(5),
  },
  row: {
    marginBottom: p(12),
  },
  rowMultiColumn: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: p(6),
  },
  card: {
    borderRadius: p(10),
    padding: p(12),
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: p(8),
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: p(6),
  },
  statusDot: {
    width: p(8),
    height: p(8),
    borderRadius: p(4),
  },
  detailsContainer: {
    marginBottom: p(8),
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: p(6),
    gap: p(6),
  },
  iconPlaceholder: {
    width: p(18),
    height: p(18),
    borderRadius: p(9),
  },
  badgeContainer: {
    alignItems: "flex-end",
    marginTop: p(8),
  },
  badge: {
    width: p(80),
    height: p(24),
    borderRadius: p(15),
  },
  block: {
    borderRadius: p(4),
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: "60%",
    zIndex: 10,
    opacity: 0.5,
    borderRadius: p(10),
  },
});

export default LeadCardSkeleton;
