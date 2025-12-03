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

const LeadDetailSkeleton: React.FC = () => {
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

  const renderShimmerOverlay = (style: any) => (
    <Animated.View
      style={[
        styles.shimmerOverlay,
        animatedShimmerStyle,
        style,
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
  );

  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
        <View style={[styles.backButton, { backgroundColor: colors.outline + "40" }]} />
        <View style={[styles.headerTitle, { backgroundColor: colors.outline + "40" }]} />
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: colors.outline + "40" }]} />
          <View style={[styles.editButton, { backgroundColor: colors.outline + "40" }]} />
        </View>
      </View>

      {/* Banner Skeleton */}
      <View style={styles.banner}>
        {renderShimmerOverlay(styles.bannerShimmer)}
        <View style={[styles.bannerImage, { backgroundColor: colors.outline + "40" }]} />
        <View style={styles.bannerOverlay}>
          <View style={styles.bannerContent}>
            <View style={[styles.stationName, { backgroundColor: colors.outline + "40" }]} />
            <View style={[styles.leadTypeBtn, { backgroundColor: colors.outline + "40" }]} />
          </View>
          <View style={[styles.completeButton, { backgroundColor: colors.outline + "40" }]} />
        </View>
      </View>

      {/* Details Card Skeleton */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
        {renderShimmerOverlay(styles.cardShimmer)}
        <View style={styles.cardContent}>
          <View style={[styles.sectionTitle, { backgroundColor: colors.outline + "40" }]} />
          <View style={[styles.divider, { backgroundColor: colors.outline + "20" }]} />
          
          {/* Table Rows */}
          {Array.from({ length: 6 }).map((_, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.tableCellLeft}>
                <View style={[styles.iconPlaceholder, { backgroundColor: colors.outline + "40" }]} />
                <View style={[styles.tableLabel, { backgroundColor: colors.outline + "40" }]} />
              </View>
              <View style={[styles.tableValue, { backgroundColor: colors.outline + "40" }]} />
            </View>
          ))}
        </View>
      </View>

      {/* Technician Card Skeleton */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
        {renderShimmerOverlay(styles.cardShimmer)}
        <View style={styles.cardContent}>
          <View style={styles.technicianHeader}>
            <View style={[styles.sectionTitle, { backgroundColor: colors.outline + "40" }]} />
            <View style={[styles.assignButton, { backgroundColor: colors.outline + "40" }]} />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.outline + "20" }]} />
          
          {/* Technician Cards */}
          {Array.from({ length: 2 }).map((_, index) => (
            <View key={index} style={[styles.techCard, { borderColor: colors.outline + "40" }]}>
              <View style={styles.techInfo}>
                <View style={[styles.iconPlaceholder, { backgroundColor: colors.outline + "40" }]} />
                <View style={[styles.techText, { backgroundColor: colors.outline + "40" }]} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Water Hardness Card Skeleton */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
        {renderShimmerOverlay(styles.cardShimmer)}
        <View style={styles.cardContent}>
          <View style={styles.hardnessHeader}>
            <View style={styles.hardnessTitleContainer}>
              <View style={[styles.sectionTitle, { backgroundColor: colors.outline + "40", width: p(120) }]} />
              <View style={[styles.subtitle, { backgroundColor: colors.outline + "30", width: p(200) }]} />
            </View>
            <View style={[styles.hardnessValue, { backgroundColor: colors.outline + "40" }]} />
          </View>
        </View>
      </View>

      {/* Remarks Card Skeleton */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
        {renderShimmerOverlay(styles.cardShimmer)}
        <View style={styles.cardContent}>
          <View style={styles.remarksHeader}>
            <View style={[styles.sectionTitle, { backgroundColor: colors.outline + "40" }]} />
            <View style={[styles.editButton, { backgroundColor: colors.outline + "40" }]} />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.outline + "20" }]} />
          <View style={styles.remarksBox}>
            <View style={[styles.iconPlaceholder, { backgroundColor: colors.outline + "40" }]} />
            <View style={styles.remarksTextContainer}>
              <View style={[styles.remarksLine, { backgroundColor: colors.outline + "40" }]} />
              <View style={[styles.remarksLine, { backgroundColor: colors.outline + "40", width: "80%" }]} />
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons Skeleton */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
        <View style={[styles.footerButton, { backgroundColor: colors.outline + "40" }]} />
        <View style={[styles.footerButton, { backgroundColor: colors.outline + "40" }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: "60%",
    zIndex: 10,
    opacity: 0.5,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: p(26),
    paddingVertical: p(8),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: p(40),
    height: p(40),
    borderRadius: p(20),
  },
  headerTitle: {
    width: p(100),
    height: p(22),
    borderRadius: p(4),
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: p(6),
  },
  statusBadge: {
    width: p(80),
    height: p(32),
    borderRadius: p(16),
  },
  editButton: {
    width: p(32),
    height: p(32),
    borderRadius: p(16),
  },
  // Banner
  banner: {
    marginBottom: p(12),
    position: "relative",
    height: p(180),
    borderRadius: p(12),
    overflow: "hidden",
  },
  bannerShimmer: {
    borderRadius: p(12),
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerOverlay: {
    position: "absolute",
    bottom: p(12),
    left: p(16),
    right: p(16),
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  bannerContent: {
    flex: 1,
  },
  stationName: {
    width: p(200),
    height: p(40),
    borderRadius: p(4),
    marginBottom: p(6),
  },
  leadTypeBtn: {
    width: p(100),
    height: p(32),
    borderRadius: p(8),
  },
  completeButton: {
    width: p(120),
    height: p(36),
    borderRadius: p(8),
  },
  // Card
  card: {
    marginHorizontal: p(14),
    borderRadius: p(10),
    marginBottom: p(12),
    elevation: 2,
    overflow: "hidden",
    borderLeftWidth: p(3),
  },
  cardShimmer: {
    borderRadius: p(10),
  },
  cardContent: {
    padding: p(16),
  },
  sectionTitle: {
    width: p(140),
    height: p(16),
    borderRadius: p(4),
    marginBottom: p(10),
  },
  divider: {
    height: 1,
    marginBottom: p(10),
  },
  // Table
  tableRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingVertical: p(4),
    marginBottom: p(6),
  },
  tableCellLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: p(8),
  },
  iconPlaceholder: {
    width: p(16),
    height: p(16),
    borderRadius: p(8),
  },
  tableLabel: {
    width: p(120),
    height: p(14),
    borderRadius: p(4),
  },
  tableValue: {
    flex: 1,
    height: p(14),
    borderRadius: p(4),
    maxWidth: p(150),
  },
  // Technician
  technicianHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: p(6),
  },
  assignButton: {
    width: p(120),
    height: p(32),
    borderRadius: p(8),
  },
  techCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: p(8),
    padding: p(8),
    marginBottom: p(6),
  },
  techInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: p(8),
  },
  techText: {
    width: p(150),
    height: p(14),
    borderRadius: p(4),
  },
  // Water Hardness
  hardnessHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hardnessTitleContainer: {
    flex: 1,
    gap: p(4),
  },
  subtitle: {
    height: p(12),
    borderRadius: p(4),
    marginTop: p(4),
  },
  hardnessValue: {
    width: p(120),
    height: p(20),
    borderRadius: p(4),
  },
  // Remarks
  remarksHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: p(6),
  },
  remarksBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: p(8),
  },
  remarksTextContainer: {
    flex: 1,
    gap: p(6),
  },
  remarksLine: {
    height: p(12),
    borderRadius: p(4),
    marginBottom: p(4),
  },
  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: p(12),
    marginHorizontal: p(40),
    borderRadius: p(12),
    marginBottom: p(46),
    gap: p(8),
  },
  footerButton: {
    flex: 1,
    height: p(48),
    borderRadius: p(10),
  },
});

export default LeadDetailSkeleton;

