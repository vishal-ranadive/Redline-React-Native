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
import { Card } from "react-native-paper";

interface RosterCardSkeletonProps {
  count?: number;
  numColumns?: number;
}

const RosterCardSkeleton: React.FC<RosterCardSkeletonProps> = ({ 
  count = 4,
  numColumns = 2 
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

  const cardWidth = numColumns === 1 ? '100%' : '48%';

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.cardWrapper,
            { width: cardWidth },
          ]}
        >
          <Card
            style={[
              styles.card,
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
                  backgroundColor: colors.primary + "20",
                },
              ]}
            >
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

            {/* Tag Badge Skeleton */}
            <View
              style={[
                styles.tagBadge,
                { backgroundColor: colors.outline + "40" },
              ]}
            />

            {/* Roster Header Skeleton */}
            <View style={styles.headerContainer}>
              <View style={styles.headerRow}>
                <View
                  style={[
                    styles.namePlaceholder,
                    { backgroundColor: colors.outline + "40" },
                  ]}
                />
                <View style={styles.infoContainer}>
                  <View
                    style={[
                      styles.iconPlaceholder,
                      { backgroundColor: colors.outline + "40" },
                    ]}
                  />
                  <View
                    style={[
                      styles.countPlaceholder,
                      { backgroundColor: colors.outline + "40" },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Gears List Skeleton */}
            <View style={styles.gearsListContainer}>
              {Array.from({ length: 3 }).map((_, gearIndex) => (
                <View key={gearIndex} style={styles.gearRowSkeleton}>
                  <View
                    style={[
                      styles.gearNamePlaceholder,
                      { backgroundColor: colors.outline + "40" },
                    ]}
                  />
                  <View
                    style={[
                      styles.gearStatusPlaceholder,
                      { backgroundColor: colors.outline + "40" },
                    ]}
                  />
                </View>
              ))}
            </View>
          </Card>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: p(5),
    paddingTop: p(8),
    justifyContent: "space-between",
  },
  cardWrapper: {
    marginBottom: p(12),
  },
  card: {
    borderRadius: p(8),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: "relative",
    overflow: "hidden",
    minHeight: p(150),
    borderWidth: 1,
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: "60%",
    zIndex: 10,
    opacity: 0.5,
    borderRadius: p(8),
  },
  tagBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: p(30),
    height: p(24),
    borderTopRightRadius: p(8),
    borderBottomLeftRadius: p(10),
    zIndex: 1,
  },
  headerContainer: {
    paddingTop: p(10),
    paddingRight: p(30),
    marginBottom: p(10),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  namePlaceholder: {
    width: "60%",
    height: p(16),
    borderRadius: p(4),
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: p(4),
  },
  iconPlaceholder: {
    width: p(14),
    height: p(14),
    borderRadius: p(7),
  },
  countPlaceholder: {
    width: p(20),
    height: p(12),
    borderRadius: p(4),
  },
  gearsListContainer: {
    gap: p(6),
    paddingHorizontal: p(16),
    paddingBottom: p(10),
  },
  gearRowSkeleton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: p(4),
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  gearNamePlaceholder: {
    flex: 1,
    height: p(12),
    borderRadius: p(4),
    marginRight: p(6),
  },
  gearStatusPlaceholder: {
    width: p(60),
    height: p(12),
    borderRadius: p(4),
  },
});

export default RosterCardSkeleton;

