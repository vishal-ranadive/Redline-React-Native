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

interface InspectionFormSkeletonProps {
  isMobile?: boolean;
}

const InspectionFormSkeleton: React.FC<InspectionFormSkeletonProps> = ({ 
  isMobile = false 
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

  const renderCard = (key: string) => (
    <View
      key={key}
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

      {/* Card Title Skeleton */}
      <View
        style={[
          styles.cardTitle,
          { backgroundColor: colors.outline + "40" },
        ]}
      />

      {/* Field Label Skeleton */}
      <View
        style={[
          styles.fieldLabel,
          { backgroundColor: colors.outline + "40" },
        ]}
      />

      {/* Input Field Skeleton */}
      <View
        style={[
          styles.inputField,
          { backgroundColor: colors.outline + "40" },
        ]}
      />

      {/* Another Field Label */}
      <View
        style={[
          styles.fieldLabel,
          { backgroundColor: colors.outline + "40", marginTop: p(16) },
        ]}
      />

      {/* Button/Selector Skeleton */}
      <View
        style={[
          styles.buttonField,
          { backgroundColor: colors.outline + "40" },
        ]}
      />
    </View>
  );

  const renderImageCard = () => (
    <View
      key="images"
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.outline,
        },
      ]}
    >
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

      {/* Card Title */}
      <View
        style={[
          styles.cardTitle,
          { backgroundColor: colors.outline + "40" },
        ]}
      />

      {/* Images Grid */}
      <View style={styles.imagesGrid}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.imagePlaceholder,
              { backgroundColor: colors.outline + "40" },
            ]}
          />
        ))}
        <View
          style={[
            styles.imagePlaceholder,
            styles.addImagePlaceholder,
            { backgroundColor: colors.outline + "20", borderColor: colors.outline + "60" },
          ]}
        />
      </View>
    </View>
  );

  const renderHeaderSkeleton = () => (
    <View
      style={[
        styles.headerSkeleton,
        {
          backgroundColor: colors.surface,
          borderColor: colors.outline,
        },
      ]}
    >
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

      {isMobile ? (
        /* Mobile Header Layout */
        <>
          {/* Firefighter Row - Full Width */}
          <View style={styles.mobileHeaderRow}>
            <View style={[styles.headerAvatar, { backgroundColor: colors.outline + "40" }]} />
            <View style={styles.headerDetails}>
              <View style={[styles.headerName, { backgroundColor: colors.outline + "40" }]} />
              <View style={[styles.headerDetail, { backgroundColor: colors.outline + "40" }]} />
            </View>
            <View style={[styles.headerChevron, { backgroundColor: colors.outline + "40" }]} />
          </View>
          {/* Color and History Row */}
          <View style={styles.mobileHeaderBottomRow}>
            <View style={[styles.headerButton, { backgroundColor: colors.outline + "40", flex: 1, marginRight: 8 }]} />
            <View style={[styles.headerButton, { backgroundColor: colors.outline + "40", minWidth: 120 }]} />
          </View>
        </>
      ) : (
        /* Tablet/iPad Header Layout - All in one line */
        <View style={styles.tabletHeaderRow}>
          {/* Firefighter Section */}
          <View style={styles.tabletHeaderFirefighter}>
            <View style={[styles.headerAvatar, { backgroundColor: colors.outline + "40" }]} />
            <View style={styles.headerDetails}>
              <View style={[styles.headerName, { backgroundColor: colors.outline + "40" }]} />
              <View style={[styles.headerDetail, { backgroundColor: colors.outline + "40" }]} />
            </View>
            <View style={[styles.headerChevron, { backgroundColor: colors.outline + "40" }]} />
          </View>
          {/* Spacer */}
          <View style={styles.headerSpacer} />
          {/* Color Button */}
          <View style={[styles.headerButton, { backgroundColor: colors.outline + "40", minWidth: 140 }]} />
          {/* History Button */}
          <View style={[styles.headerButton, { backgroundColor: colors.outline + "40", minWidth: 140, marginLeft: 8 }]} />
        </View>
      )}
    </View>
  );

  if (isMobile) {
    // Mobile Layout - Single Column
    return (
      <View style={styles.container}>
        {renderHeaderSkeleton()}
        {renderCard("service")}
        {renderCard("hydro")}
        {renderCard("findings")}
        {renderImageCard()}
        {renderCard("status")}
      </View>
    );
  }

  // Tablet Layout - Two Columns
  return (
    <View style={styles.container}>
      {renderHeaderSkeleton()}
      <View style={styles.row}>
        {/* Left Column */}
        <View style={styles.col}>
          {renderCard("service")}
          {renderCard("status")}
          {renderCard("remarks")}
        </View>

        {/* Right Column */}
        <View style={styles.col}>
          {renderCard("hydro")}
          {renderCard("findings")}
          {renderImageCard()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: p(14),
    paddingTop: p(8),
  },
  row: {
    flexDirection: "row",
  },
  col: {
    flex: 1,
    marginRight: p(8),
  },
  card: {
    borderRadius: p(12),
    padding: p(16),
    marginBottom: p(12),
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: "60%",
    zIndex: 10,
    opacity: 0.5,
    borderRadius: p(12),
  },
  cardTitle: {
    width: p(140),
    height: p(16),
    borderRadius: p(4),
    marginBottom: p(16),
  },
  fieldLabel: {
    width: p(100),
    height: p(14),
    borderRadius: p(4),
    marginBottom: p(8),
  },
  inputField: {
    width: "100%",
    height: p(48),
    borderRadius: p(8),
    marginBottom: p(16),
  },
  buttonField: {
    width: "100%",
    height: p(48),
    borderRadius: p(8),
    marginBottom: p(16),
  },
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: p(8),
  },
  imagePlaceholder: {
    width: p(80),
    height: p(80),
    borderRadius: p(8),
  },
  addImagePlaceholder: {
    borderWidth: 1,
    borderStyle: "dashed",
  },
  // Header Skeleton Styles
  headerSkeleton: {
    borderRadius: p(12),
    padding: p(16),
    marginBottom: p(12),
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
  },
  mobileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: p(12),
  },
  mobileHeaderBottomRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabletHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabletHeaderFirefighter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerAvatar: {
    width: p(44),
    height: p(44),
    borderRadius: p(22),
    marginRight: p(12),
  },
  headerDetails: {
    flex: 1,
  },
  headerName: {
    width: p(150),
    height: p(16),
    borderRadius: p(4),
    marginBottom: p(6),
  },
  headerDetail: {
    width: p(200),
    height: p(12),
    borderRadius: p(4),
  },
  headerChevron: {
    width: p(26),
    height: p(26),
    borderRadius: p(13),
    marginLeft: p(12),
  },
  headerSpacer: {
    flex: 1,
  },
  headerButton: {
    height: p(40),
    borderRadius: p(8),
  },
});

export default InspectionFormSkeleton;

