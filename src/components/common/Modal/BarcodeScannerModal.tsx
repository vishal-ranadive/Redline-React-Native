import React, { useState, useEffect } from 'react';
import { View, StyleSheet, PermissionsAndroid, Platform, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { Text, Button, Icon, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'react-native-camera-kit';
import { p } from '../../../utils/responsive';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onBarcodeScanned: (barcode: string) => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  visible,
  onClose,
  onBarcodeScanned
}) => {
  const { colors } = useTheme();
  const [hasPermission, setHasPermission] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [supportedOrientations, setSupportedOrientations] = useState<
    ('portrait' | 'landscape' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right')[]
  >(['portrait', 'landscape']);

  // Lock to current orientation when modal opens
  useEffect(() => {
    if (visible) {
      const { width, height } = Dimensions.get('window');
      const isLandscape = width > height;
      setSupportedOrientations(
        isLandscape
          ? ['landscape', 'landscape-left', 'landscape-right']
          : ['portrait', 'portrait-upside-down']
      );
    }
  }, [visible]);

  // Request Camera Permission
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
    
    if (visible) {
      requestPermission();
      setScannedData(null);
      setIsLoading(false);
    }
  }, [visible]);

  const handleBarcodeScan = (event: any) => {
    const value = event?.nativeEvent?.codeStringValue;
    if (value && !scannedData) {
      setScannedData(value);
      setIsLoading(true);
      
      // Simulate processing delay
      setTimeout(() => {
        setIsLoading(false);
        onBarcodeScanned(value);
        onClose();
      }, 1500);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      supportedOrientations={supportedOrientations}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Button mode="text" onPress={onClose}>
            <Icon source="arrow-left" size={p(22)} color={colors.onSurface} />
          </Button>
          <Text style={[styles.title, { color: colors.onSurface }]}>Scan Barcode</Text>
          <Button mode="text" onPress={() => setFlashOn(!flashOn)}>
            <Icon
              source={flashOn ? 'flash' : 'flash-off'}
              size={p(22)}
              color={flashOn ? colors.primary : colors.onSurface}
            />
          </Button>
        </View>

        {/* Permission Message */}
        {!hasPermission && (
          <View style={styles.permissionContainer}>
            <Text style={{ fontSize: p(16), textAlign: 'center' }}>
              Please allow camera access to scan barcode.
            </Text>
          </View>
        )}

        {/* Camera View */}
        {hasPermission && !scannedData && !isLoading && (
          <Camera
            style={styles.camera}
            scanBarcode={true}
            showFrame={true}
            laserColor={colors.primary}
            frameColor={colors.primary}
            torchMode={flashOn ? 'on' : 'off'}
            onReadCode={handleBarcodeScan}
          />
        )}

        {/* Loader */}
        {isLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: p(12), fontSize: p(16) }}>Processing barcode...</Text>
          </View>
        )}

        {/* Bottom Buttons */}
        <View style={styles.bottomButtons}>
          <Button
            mode="outlined"
            onPress={onClose}
            style={styles.bottomButton}
          >
            Cancel
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
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
  bottomButtons: {
    padding: p(20),
  },
  bottomButton: {
    borderRadius: p(10),
  },
});

export default BarcodeScannerModal;