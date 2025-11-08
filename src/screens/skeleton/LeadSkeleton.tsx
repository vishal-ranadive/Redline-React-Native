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

interface LeadCardSkeletonProps {
  isDark?: boolean;
}

const LeadCardSkeleton: React.FC<LeadCardSkeletonProps> = ({ isDark = false }) => {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const isPortrait = height >= width;
  const numColumns = isPortrait ? 2 : 3;

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
      {Array.from({ length: 6 }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.card,
            {
              width: `${100 / numColumns - 4}%`,
              backgroundColor: colors.surface,
              shadowColor: colors.primary,
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

          {/* Skeleton structure */}
          <View style={styles.row}>
            <View
              style={[styles.block, { width: "50%", height: 20, backgroundColor: colors.outline }]}
            />
            <View
              style={[styles.block, { width: 40, height: 20, backgroundColor: colors.outline }]}
            />
          </View>
          <View style={[styles.block, { width: "80%", height: 14, backgroundColor: colors.outline }]} />
          <View style={[styles.block, { width: "70%", height: 14, backgroundColor: colors.outline }]} />
          <View style={[styles.block, { width: "90%", height: 14, backgroundColor: colors.outline }]} />
          <View
            style={[
              styles.block,
              {
                width: 60,
                height: 24,
                borderRadius: 12,
                alignSelf: "flex-end",
                backgroundColor: colors.outline,
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  card: {
    borderRadius: 12,
    padding: 12,
    margin: 4,
    overflow: "hidden",
    elevation: 2,
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  block: {
    borderRadius: 6,
    marginBottom: 6,
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: "60%",
    zIndex: 10,
    opacity: 0.5,
    borderRadius: 12,
  },
});

export default LeadCardSkeleton;
