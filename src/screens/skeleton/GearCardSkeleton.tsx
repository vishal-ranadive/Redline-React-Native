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

interface GearCardSkeletonProps {
  count?: number;
}

const GearCardSkeleton: React.FC<GearCardSkeletonProps> = ({ count = 3 }) => {
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

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
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

          {/* Status Chip Skeleton */}
          <View style={styles.headerRow}>
            <View
              style={[
                styles.statusChip,
                { backgroundColor: colors.outline + "40" },
              ]}
            />
          </View>

          {/* Gear Emoji Skeleton */}
          <View style={styles.emojiContainer}>
            <View
              style={[
                styles.emojiPlaceholder,
                { backgroundColor: colors.outline + "40" },
              ]}
            />
          </View>

          {/* Gear Details Skeleton */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View
                style={[
                  styles.iconPlaceholder,
                  { backgroundColor: colors.outline + "40" },
                ]}
              />
              <View
                style={[
                  styles.labelPlaceholder,
                  { backgroundColor: colors.outline + "40" },
                ]}
              />
              <View
                style={[
                  styles.valuePlaceholder,
                  { backgroundColor: colors.outline + "40" },
                ]}
              />
            </View>
            <View style={styles.detailRow}>
              <View
                style={[
                  styles.iconPlaceholder,
                  { backgroundColor: colors.outline + "40" },
                ]}
              />
              <View
                style={[
                  styles.labelPlaceholder,
                  { backgroundColor: colors.outline + "40" },
                ]}
              />
              <View
                style={[
                  styles.valuePlaceholder,
                  { backgroundColor: colors.outline + "40" },
                ]}
              />
            </View>
            <View style={styles.detailRow}>
              <View
                style={[
                  styles.iconPlaceholder,
                  { backgroundColor: colors.outline + "40" },
                ]}
              />
              <View
                style={[
                  styles.labelPlaceholder,
                  { backgroundColor: colors.outline + "40" },
                ]}
              />
              <View
                style={[
                  styles.valuePlaceholder,
                  { backgroundColor: colors.outline + "40" },
                ]}
              />
            </View>
            <View style={styles.detailRow}>
              <View
                style={[
                  styles.iconPlaceholder,
                  { backgroundColor: colors.outline + "40" },
                ]}
              />
              <View
                style={[
                  styles.labelPlaceholder,
                  { backgroundColor: colors.outline + "40" },
                ]}
              />
              <View
                style={[
                  styles.valuePlaceholder,
                  { backgroundColor: colors.outline + "40" },
                ]}
              />
            </View>
          </View>

          {/* Inspection Section Skeleton */}
          <View style={styles.inspectionSection}>
            <View
              style={[
                styles.sectionTitlePlaceholder,
                { backgroundColor: colors.outline + "40" },
              ]}
            />
            <View style={styles.detailRow}>
              <View
                style={[
                  styles.iconPlaceholder,
                  { backgroundColor: colors.outline + "40" },
                ]}
              />
              <View
                style={[
                  styles.labelPlaceholder,
                  { backgroundColor: colors.outline + "40" },
                ]}
              />
              <View
                style={[
                  styles.valuePlaceholder,
                  { backgroundColor: colors.outline + "40" },
                ]}
              />
            </View>
            <View style={styles.detailRow}>
              <View
                style={[
                  styles.iconPlaceholder,
                  { backgroundColor: colors.outline + "40" },
                ]}
              />
              <View
                style={[
                  styles.labelPlaceholder,
                  { backgroundColor: colors.outline + "40" },
                ]}
              />
              <View
                style={[
                  styles.valuePlaceholder,
                  { backgroundColor: colors.outline + "40" },
                ]}
              />
            </View>
          </View>

          {/* Button Skeleton */}
          <View
            style={[
              styles.buttonPlaceholder,
              { backgroundColor: colors.outline + "40" },
            ]}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: p(10),
    paddingTop: p(8),
  },
  card: {
    borderRadius: p(10),
    padding: p(12),
    marginBottom: p(12),
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    borderWidth: 1,
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: "60%",
    zIndex: 10,
    opacity: 0.5,
    borderRadius: p(10),
  },
  tagBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: p(30),
    height: p(24),
    borderTopRightRadius: p(10),
    borderBottomLeftRadius: p(10),
    zIndex: 1,
  },
  headerRow: {
    flexDirection: "row",
    marginBottom: p(8),
  },
  statusChip: {
    width: p(100),
    height: p(26),
    borderRadius: p(13),
  },
  emojiContainer: {
    alignItems: "center",
    marginBottom: p(8),
  },
  emojiPlaceholder: {
    width: p(64),
    height: p(64),
    borderRadius: p(32),
  },
  detailsContainer: {
    marginBottom: p(10),
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: p(4),
  },
  iconPlaceholder: {
    width: p(14),
    height: p(14),
    borderRadius: p(7),
    marginRight: p(6),
  },
  labelPlaceholder: {
    width: p(60),
    height: p(11),
    borderRadius: p(4),
    marginRight: p(4),
  },
  valuePlaceholder: {
    flex: 1,
    height: p(11),
    borderRadius: p(4),
  },
  inspectionSection: {
    marginTop: p(10),
    marginBottom: p(8),
    paddingTop: p(8),
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  sectionTitlePlaceholder: {
    width: p(120),
    height: p(14),
    borderRadius: p(4),
    marginBottom: p(6),
  },
  buttonPlaceholder: {
    width: "100%",
    height: p(36),
    borderRadius: p(8),
    marginTop: p(8),
  },
});

export default GearCardSkeleton;

