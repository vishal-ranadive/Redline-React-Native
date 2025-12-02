import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Text, Icon, useTheme } from 'react-native-paper';
import { p } from '../../../utils/responsive';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  onPickCamera: () => void;
  onPickGallery: () => void;
  title?: string;
  subtitle?: string;
};

const ImageSourcePickerModal: React.FC<Props> = ({
  visible,
  onDismiss,
  onPickCamera,
  onPickGallery,
  title = 'Add Image',
  subtitle = 'Choose how you want to add the image',
}) => {
  const { colors } = useTheme();
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

  if (!visible) return null;

  return (
    <Modal 
      transparent 
      animationType="fade" 
      visible={visible} 
      onRequestClose={onDismiss}
      supportedOrientations={supportedOrientations}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>{subtitle}</Text>

        <View style={styles.actionsWrapper}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.actionCard, { borderColor: colors.outline }]}
            onPress={onPickCamera}
          >
            <View style={[styles.iconWrapper, { backgroundColor: colors.primaryContainer }]}>
              <Icon source="camera" size={p(26)} color={colors.primary} />
            </View>
            <Text style={[styles.actionTitle, { color: colors.onSurface }]}>Use Camera</Text>
            <Text style={[styles.actionHint, { color: colors.onSurfaceVariant }]}>
              Take a new photo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.actionCard, { borderColor: colors.outline }]}
            onPress={onPickGallery}
          >
            <View style={[styles.iconWrapper, { backgroundColor: colors.primaryContainer }]}>
              <Icon source="image-multiple" size={p(26)} color={colors.primary} />
            </View>
            <Text style={[styles.actionTitle, { color: colors.onSurface }]}>Choose Gallery</Text>
            <Text style={[styles.actionHint, { color: colors.onSurfaceVariant }]}>
              Pick from device
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    left: p(20),
    right: p(20),
    bottom: p(40),
    borderRadius: p(20),
    padding: p(20),
    elevation: 10,
  },
  title: {
    fontSize: p(18),
    fontWeight: '600',
  },
  subtitle: {
    fontSize: p(13),
    marginTop: p(4),
  },
  actionsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: p(20),
    gap: p(12),
  },
  actionCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: p(16),
    paddingVertical: p(16),
    alignItems: 'center',
  },
  iconWrapper: {
    width: p(56),
    height: p(56),
    borderRadius: p(28),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: p(12),
  },
  actionTitle: {
    fontSize: p(15),
    fontWeight: '600',
  },
  actionHint: {
    fontSize: p(12),
    marginTop: p(4),
    textAlign: 'center',
  },
});

export default ImageSourcePickerModal;

