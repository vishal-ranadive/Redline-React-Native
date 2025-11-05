import React, { useState, useEffect } from 'react';
import { View, StyleSheet, PermissionsAndroid, Platform, ActivityIndicator } from 'react-native';
import { Text, Button, Icon, Card, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Camera } from 'react-native-camera-kit';
import { p } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GearDetail', 'AddGear'>;

const GearScanScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [scannedData, setScannedData] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gearDetails, setGearDetails] = useState<any>(null);

  // Request Camera Permission (Android)
  useEffect(() => {
    const requestPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        setHasPermission(true);
      }
    };
    requestPermission();
  }, []);

  // Handle API call when barcode is scanned
  useEffect(() => {
    if (!scannedData) return;

    const fetchGearDetails = async () => {
      setIsLoading(true);
      try {
        // Simulate API delay
        await new Promise((res:any) => setTimeout(res, 2000));

        // Simulated API response based on scanned barcode
        setGearDetails({
          item: 'Jacket Shell',
          sn: scannedData,
          status: 'PASS ✅',
        });
      } catch (err) {
        console.log('API error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGearDetails();
  }, [scannedData]);

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={{ fontSize: p(16), textAlign: 'center' }}>
          Please allow camera access to scan gear.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Button mode="text" onPress={() => navigation.goBack()}>
          <Icon source="arrow-left" size={p(22)} color={colors.onSurface} />
        </Button>
        <Text style={[styles.title, { color: colors.onSurface }]}>Scan Gear</Text>
        <Button mode="text" onPress={() => setFlashOn(!flashOn)}>
          <Icon
            source={flashOn ? 'flash' : 'flash-off'}
            size={p(22)}
            color={flashOn ? colors.primary : colors.onSurface}
          />
        </Button>
      </View>

      {/* Camera View */}
      {!scannedData && !isLoading && (
        <Camera
          style={styles.camera}
          scanBarcode={true}
          showFrame={true}
          laserColor={colors.primary}
          frameColor={colors.primary}
          torchMode={flashOn ? 'on' : 'off'}
          onReadCode={(event: any) => {
            const value = event?.nativeEvent?.codeStringValue;
            if (value) setScannedData(value);
          }}
        />
      )}

      {/* Loader */}
      {isLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: p(12), fontSize: p(16) }}>Fetching gear details...</Text>
        </View>
      )}

      {/* Gear Detail Popup */}
      {gearDetails && !isLoading && (
        <View style={styles.resultContainer}>
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Content>
              <Text style={{ fontSize: p(18), fontWeight: 'bold' }}>🎉 Scan Successful!</Text>
              <Text style={{ fontSize: p(14), marginVertical: p(8) }}>
                Item: {gearDetails.item}
              </Text>
              <Text style={{ fontSize: p(14), marginBottom: p(8) }}>SN: {gearDetails.sn}</Text>
              <Text style={{ fontSize: p(14), marginBottom: p(8) }}>Status: {gearDetails.status}</Text>

              <View style={styles.buttonsRow}>
                <Button
                  mode="contained"
                  buttonColor={colors.primary}
                  onPress={() => navigation.navigate('GearDetail')}
                >
                  Open Gear
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setScannedData(null);
                    setGearDetails(null);
                  }}
                >
                  Scan Again
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        {[
          { label: 'Manual Add Gear', icon: 'pencil', action: () => navigation.navigate('AddGear') },
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: p(20),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: p(12),
    paddingTop: p(10),
  },
  title: { fontSize: p(18), fontWeight: 'bold' },
  camera: { flex: 1, width: '100%' },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: p(20),
  },
  card: {
    width: '90%',
    padding: p(16),
    borderRadius: p(10),
    elevation: 5,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: p(12),
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: p(20),
    paddingBottom: p(40),
  },
});

export default GearScanScreen;

