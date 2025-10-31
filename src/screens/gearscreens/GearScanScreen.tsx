import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Text, Button, Icon, Card, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { p } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GearDetail'>;

const GearScanScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { colors } = useTheme();

  const [scanned, setScanned] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const scanAnim = useRef(new Animated.Value(0)).current;

  // Detect orientation dynamically
  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      setOrientation(width > height ? 'landscape' : 'portrait');
    };
    const sub = Dimensions.addEventListener('change', updateOrientation);
    updateOrientation();
    return () => sub.remove();
  }, []);

  // Animate the scan line
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Simulate scan success after 3s
  useEffect(() => {
    const timer = setTimeout(() => {
      setScanned(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Calculate scan frame size based on orientation
  const frameSize = orientation === 'portrait' ? '70%' : '40%';
  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200], // animation height inside frame
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header]}>
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          contentStyle={{ flexDirection: 'row' }}
        >
          <Icon source="arrow-left" size={p(22)} color={colors.onSurface} />
        </Button>
        <Text style={[styles.title, { color: colors.onSurface }]}>Scan Gear</Text>
        <Button mode="text" onPress={() => {}}>
          <Icon source="flash" size={p(22)} color={colors.primary} />
        </Button>
      </View>

      {/* Fake Camera View */}
      <View style={styles.cameraContainer}>
        <Image
          source={require('../../assets/jacketScanning.png')}
          style={styles.cameraImage}
        />
        <View
          style={[
            styles.scanFrame,
            { borderColor: colors.primary, width: frameSize },
          ]}
        >
          {/* Animated Sci-Fi Scan Line */}
          <Animated.View
            style={[
              styles.scanLine,
              {
                backgroundColor: colors.primary,
                transform: [{ translateY }],
              },
            ]}
          />
        </View>
        <Text style={[styles.instruction, { color: colors.onSurface }]}>
          Position barcode/QR inside the frame
        </Text>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        {[
          { label: 'Manual Entry', icon: 'pencil', action: () => {} },
          { label: 'Gallery', icon: 'image', action: () => {} },
          { label: 'Close', icon: 'close', action: () => navigation.goBack() },
        ].map((btn, i) => (
          <Button
            key={i}
            mode="contained"
            icon={btn.icon}
            onPress={btn.action}
            buttonColor={colors.primary}
            textColor={colors.surface}
            labelStyle={{ fontSize: p(14), fontWeight: '600' }}
            style={{ marginHorizontal: p(4), borderRadius: p(10) }}
          >
            {btn.label}
          </Button>
        ))}
      </View>

      {/* Scan Successful Overlay */}
      {scanned && (
        <Card style={[styles.overlay, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Text style={{ fontSize: p(18), fontWeight: 'bold' }}>🎉 Scan Successful!</Text>
            <Text style={{ fontSize: p(14), fontWeight: 'bold' }}>Item: Jacket Shell</Text>
            <Text style={{ fontSize: p(14), fontWeight: 'bold' }}>SN: D39508998</Text>
            <Text style={{ fontSize: p(14), fontWeight: 'bold' }}>Status: PASS ✅</Text>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: p(12),
              }}
            >
              <Button
                mode="contained"
                buttonColor={colors.primary}
                onPress={() => navigation.navigate('GearDetail')}
                labelStyle={{
                  fontSize: p(14),
                  fontWeight: '600',
                }}
              >
                Open Gear
              </Button>
              <Button
                mode="outlined"
                onPress={() => setScanned(false)}
                labelStyle={{
                  fontSize: p(14),
                  fontWeight: '600',
                }}
              >
                Cancel
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: p(12),
    paddingTop: p(10),
  },
  title: { fontSize: p(18), fontWeight: 'bold' },
  cameraContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cameraImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    resizeMode: 'cover',
    opacity: 0.6,
  },
  scanFrame: {
    aspectRatio: 1,
    borderWidth: p(3),
    borderRadius: p(10),
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: p(3),
    borderRadius: p(2),
    opacity: 0.8,
  },
  instruction: { marginTop: p(16), fontSize: p(16) },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: p(20),
    paddingBottom:p(50)
  },
  overlay: {
    position: 'absolute',
    top: '35%',
    left: '10%',
    right: '10%',
    padding: p(16),
    borderRadius: p(10),
    elevation: 10,
  },
});

export default GearScanScreen;
