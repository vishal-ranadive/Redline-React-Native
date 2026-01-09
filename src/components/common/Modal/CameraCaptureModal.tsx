import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { Camera, CameraType, type CameraApi } from 'react-native-camera-kit';
import { useTheme, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../../utils/responsive';
import { requestCameraPermission } from '../../../utils/permissions';

type Props = {
  visible: boolean;
  onClose: () => void;
  onPhotoCaptured: (uri: string) => void;
  requestPermission?: boolean;
};

const CameraCaptureModal: React.FC<Props> = ({ visible, onClose, onPhotoCaptured, requestPermission = true }) => {
  const { colors } = useTheme();
  const cameraRef = useRef<CameraApi | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraMounted, setCameraMounted] = useState(false);
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

  const checkPermissions = useCallback(async () => {
    if (!requestPermission) {
      // If requestPermission is false, assume permission is already granted
      setHasPermission(true);
      return;
    }

    try {
      const isGranted = await requestCameraPermission(true);
      setHasPermission(isGranted);
      if (!isGranted) {
        setError('Camera permission is required to take photos.');
      }
    } catch (permissionError) {
      console.error('Camera permission error:', permissionError);
      setError('Unable to request camera permission.');
      setHasPermission(false);
    }
  }, [requestPermission]);

  // Request iOS permission after camera ref is set
  useEffect(() => {
    if (Platform.OS === 'ios' && visible && cameraMounted && cameraRef.current) {
      const requestIOSPermission = async () => {
        try {
          const authorized = await cameraRef.current?.requestDeviceCameraAuthorization?.();
          setHasPermission(Boolean(authorized));
          if (!authorized) {
            setError('Camera permission is required to take photos.');
          }
        } catch (permissionError) {
          setError('Unable to request camera permission.');
          setHasPermission(false);
        }
      };
      
      // Small delay to ensure camera is fully mounted
      const timer = setTimeout(() => {
        requestIOSPermission();
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [visible, cameraMounted]);

  useEffect(() => {
    if (visible) {
      setError(null);
      setIsProcessing(false);
      setCameraMounted(false);
      checkPermissions();
    } else {
      setHasPermission(false);
      setCameraMounted(false);
    }
  }, [checkPermissions, visible]);

  const handleCapture = async () => {
    if (!cameraRef.current || isProcessing) {
      return;
    }
    setIsProcessing(true);
    try {
      const result = await cameraRef.current.capture();
      if (result?.uri) {
        onPhotoCaptured(result.uri);
        onClose();
      } else {
        setError('Failed to capture photo. Please try again.');
      }
    } catch (captureError) {
      setError('Unable to capture photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      onRequestClose={onClose}
      supportedOrientations={supportedOrientations}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <IconButton icon="close" iconColor={colors.onSurface} size={p(24)} onPress={onClose} />
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Take a Photo</Text>
          <View style={{ width: p(40) }} />
        </View>

        <View style={styles.previewWrapper}>
          {(hasPermission || Platform.OS === 'ios') ? (
            <Camera
              ref={(ref) => {
                cameraRef.current = ref;
                if (ref && Platform.OS === 'ios') {
                  setCameraMounted(true);
                }
              }}
              style={styles.cameraPreview}
              cameraType={CameraType.Back}
              flashMode="off"
              onError={(cameraError: any) => {
                console.log('Camera error:', cameraError);
                if (cameraError?.message?.includes('permission') || cameraError?.code === 'PERMISSION_DENIED') {
                  setHasPermission(false);
                  setError('Camera permission is required to take photos.');
                }
              }}
            />
          ) : (
            <View style={styles.permissionFallback}>
              <Text style={[styles.permissionText, { color: colors.onSurfaceVariant }]}>
                {error ?? 'Requesting camera permission...'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.controls}>
          {isProcessing ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <TouchableOpacity
              style={[styles.captureButton, { borderColor: colors.onSurface }]}
              onPress={handleCapture}
              disabled={!hasPermission}
            >
              <View style={[styles.captureInner, { backgroundColor: colors.primary }]} />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: p(12),
  },
  headerTitle: {
    fontSize: p(18),
    fontWeight: '600',
  },
  previewWrapper: {
    flex: 1,
    marginTop: p(8),
    borderRadius: p(16),
    overflow: 'hidden',
    marginHorizontal: p(12),
  },
  cameraPreview: {
    flex: 1,
  },
  permissionFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: p(24),
  },
  permissionText: {
    textAlign: 'center',
    fontSize: p(14),
  },
  controls: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: p(24),
  },
  captureButton: {
    width: p(80),
    height: p(80),
    borderRadius: p(40),
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: p(58),
    height: p(58),
    borderRadius: p(29),
  },
});

export default CameraCaptureModal;

