import React from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { Text, useTheme, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { p } from '../../utils/responsive';
import Header from '../../components/common/Header';
import { LeadInfoBanner } from '../../components/common/LeadInfoBanner';

export default function ViewInspectionScreen() {
  const { colors, dark } = useTheme();
  const navigation = useNavigation();

  const FlowCard = ({ title, description, icon, gradient, onPress }: any) => {
    const scaleAnim = new Animated.Value(1);

    const handlePressIn = () => {
      Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
    };
    const handlePressOut = () => {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    };

    return (
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.flowCard, { borderColor: colors.primary }]}
          >
            <View style={styles.cardContent}>
              <View style={[styles.cardIcon, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.icon, { color: colors.primary }]}>{icon}</Text>
              </View>
              <View style={styles.cardText}>
                <Text variant="titleMedium" style={[styles.cardTitle, { color: colors.onSurface }]}>
                  {title}
                </Text>
                <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
                  {description}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, ]}>
      {/* <LinearGradient
        colors={
          dark
            ? [colors.background, '#0b0c10', '#0d1117']
            : ['#f8f9fa', colors.background, '#e3f2fd']
        }
        style={StyleSheet.absoluteFill}
      /> */}
      <LeadInfoBanner />
      <Header title="Choose Inspection Flow" showBackButton={true} />

      <View style={styles.content}>
        <Text
          variant="titleLarge"
          style={[
            styles.title,
            {
              color: colors.primary,
              textShadowColor: colors.primary + '55',
            },
          ]}
        >
          ⚡ Select Inspection Method
        </Text>

        <FlowCard
          title="View by Firefighter"
          description="Inspect gears assigned to firefighters directly"
          icon="🧑‍🚒"
          gradient={[colors.surface, dark ? '#1b2735' : '#f5f5f5']}
          onPress={() => navigation.navigate('FirefighterListScreen' as never)}
        />

        <FlowCard
          title="View by Load"
          description="Drill down by load →  gear to inspect"
          icon="📦"
          gradient={[colors.surface, dark ? '#15202b' : '#eef2f7']}
          onPress={() => navigation.navigate('LoadsScreen' as never)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    padding: p(20),
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: p(30),
    fontWeight: '800',
    letterSpacing: 1,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  flowCard: {
    marginBottom: p(20),
    borderRadius: p(16),
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 4,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: p(16),
  },
  cardIcon: {
    marginRight: p(16),
    width: p(64),
    height: p(64),
    borderRadius: p(32),
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: p(30), textAlign: 'center' },
  cardText: { flex: 1 },
  cardTitle: { fontWeight: '700', marginBottom: p(6) },
});
