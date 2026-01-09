// src/components/common/ImageEditor.tsx
import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { Text, IconButton, Button, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Point {
  x: number;
  y: number;
}

interface PathData {
  points: Point[];
  color: string;
  strokeWidth: number;
  isEraser: boolean;
}

interface ImageEditorProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  onSave: (editedImageUri: string) => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({
  visible,
  imageUri,
  onClose,
  onSave,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [paths, setPaths] = useState<PathData[]>([]);
  const [history, setHistory] = useState<PathData[][]>([]); // For redo functionality
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const strokeWidth = 4; // Fixed stroke width
  const strokeColor = '#FF0000'; // Red color only
  const containerRef = useRef<View>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      // Reset all state
      setPaths([]);
      setHistory([]);
      setCurrentPath([]);
      setImageLoaded(false);
      setImageError(false);
    }
  }, [visible, imageUri]);

  const handleTouchStart = useCallback(
    (event: any) => {
      const { locationX, locationY } = event.nativeEvent;
      setIsDrawing(true);
      setCurrentPath([{ x: locationX, y: locationY }]);
    },
    [],
  );

  const handleTouchMove = useCallback(
    (event: any) => {
      if (!isDrawing) return;

      const { locationX, locationY } = event.nativeEvent;
      setCurrentPath((prev) => [...prev, { x: locationX, y: locationY }]);
    },
    [isDrawing],
  );

  const handleTouchEnd = useCallback(() => {
    if (currentPath.length > 0) {
      const newPath: PathData = {
        points: [...currentPath],
        color: strokeColor,
        strokeWidth: strokeWidth,
        isEraser: false,
      };
      setPaths((prev) => {
        const newPaths = [...prev, newPath];
        // Save to history for redo
        setHistory([]); // Clear redo history when new action is performed
        return newPaths;
      });
    }
    setCurrentPath([]);
    setIsDrawing(false);
  }, [currentPath]);

  const handleUndo = useCallback(() => {
    if (paths.length > 0) {
      setPaths((prev) => {
        const newPaths = prev.slice(0, -1);
        // Save current state to history for redo
        setHistory((prevHistory) => [prev, ...prevHistory]);
        return newPaths;
      });
    }
  }, [paths]);

  const handleRedo = useCallback(() => {
    if (history.length > 0) {
      setHistory((prevHistory) => {
        const [nextState, ...rest] = prevHistory;
        setPaths(nextState);
        return rest;
      });
    }
  }, [history]);

  const handleClear = useCallback(() => {
    Alert.alert(
      'Clear All',
      'Are you sure you want to clear all drawings?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setHistory([]);
            setPaths([]);
            setCurrentPath([]);
          },
        },
      ],
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!containerRef.current) {
      Alert.alert('Error', 'Unable to capture image');
      return;
    }

    if (!imageLoaded) {
      Alert.alert('Please wait', 'Image is still loading. Please wait a moment and try again.');
      return;
    }

    try {
      // Add a small delay to ensure everything is rendered
      await new Promise<void>(resolve => setTimeout(() => resolve(), 100));
      
      const uri = await captureRef(containerRef.current, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      // The captured URI should work directly, but we can use it as-is
      // react-native-view-shot already handles file paths correctly
      onSave(uri);

      // Reset state
      setPaths([]);
      setHistory([]);
      setCurrentPath([]);
      setImageLoaded(false);
      setImageError(false);
      onClose();
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'Failed to save edited image');
    }
  }, [onSave, onClose, imageLoaded]);

  const handleClose = useCallback(() => {
    Alert.alert(
      'Discard Changes?',
      'Are you sure you want to close without saving?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setPaths([]);
            setHistory([]);
            setCurrentPath([]);
            setImageLoaded(false);
            setImageError(false);
            onClose();
          },
        },
      ],
    );
  }, [onClose]);

  // Generate SVG path string from points (smooth lines)
  const generatePathString = (points: Point[]): string => {
    if (points.length === 0) return '';
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;
    }

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      if (i === 1) {
        path += ` L ${curr.x} ${curr.y}`;
      } else {
        // Use quadratic bezier for smooth curves
        const midX = (prev.x + curr.x) / 2;
        const midY = (prev.y + curr.y) / 2;
        path += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`;
      }
    }

    // Add the last point
    const last = points[points.length - 1];
    path += ` L ${last.x} ${last.y}`;

    return path;
  };

  const combinedPath = isDrawing && currentPath.length > 0
    ? [...paths, { points: currentPath, color: strokeColor, strokeWidth: strokeWidth, isEraser: false }]
    : paths;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
      presentationStyle="fullScreen"
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Top safe area */}
        <View style={{ height: Math.max(insets.top, 0), backgroundColor: colors.background }} />
        
        <View style={{ flex: 1 }}>
        {/* Header - Prevent touch events from reaching canvas */}
        <View 
          style={[styles.header, { backgroundColor: colors.surface }]}
          pointerEvents="box-none"
        >
          <View style={styles.headerContent} pointerEvents="auto">
            <IconButton
              icon="close"
              size={24}
              onPress={handleClose}
              iconColor={colors.onSurface}
            />
            <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
              Edit Image
            </Text>
            <View style={styles.headerRight}>
              <IconButton
                icon="undo"
                size={24}
                onPress={handleUndo}
                disabled={paths.length === 0}
                iconColor={paths.length === 0 ? colors.onSurfaceDisabled : colors.onSurface}
              />
              <IconButton
                icon="redo"
                size={24}
                onPress={handleRedo}
                disabled={history.length === 0}
                iconColor={history.length === 0 ? colors.onSurfaceDisabled : colors.onSurface}
              />
              <IconButton
                icon="delete-outline"
                size={24}
                onPress={handleClear}
                disabled={paths.length === 0}
                iconColor={paths.length === 0 ? colors.onSurfaceDisabled : colors.onSurface}
              />
            </View>
          </View>
        </View>

        {/* Drawing Canvas */}
        <View
          ref={containerRef}
          style={styles.canvasContainer}
          collapsable={false}
        >
          <View 
            style={styles.imageContainer}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <View
              style={[
                styles.imageWrapper,
                { backgroundColor: '#000000' },
              ]}
            >
              {imageError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>Failed to load image</Text>
                  <Text style={styles.errorSubtext}>Please try again</Text>
                </View>
              ) : (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.imagePlaceholder}
                  resizeMode="contain"
                  onLoad={() => {
                    setImageLoaded(true);
                    setImageError(false);
                  }}
                  onError={(error) => {
                    console.error('Image load error:', error);
                    setImageLoaded(false);
                    setImageError(true);
                  }}
                />
              )}
            </View>
            <Svg
              style={StyleSheet.absoluteFill}
              width={SCREEN_WIDTH}
              height={SCREEN_HEIGHT - 200}
              pointerEvents="none"
            >
              {combinedPath.map((pathData, index) => {
                const pathString = generatePathString(pathData.points);
                if (!pathString) return null;

                return (
                  <Path
                    key={index}
                    d={pathString}
                    stroke={pathData.color}
                    strokeWidth={pathData.strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    opacity={pathData.isEraser ? 1 : 1}
                  />
                );
              })}
            </Svg>
          </View>
        </View>

        {/* Instruction Note */}
        <View 
          style={[styles.instructionContainer, { backgroundColor: colors.surface }]}
          pointerEvents="none"
        >
          <Text style={[styles.instructionText, { color: colors.onSurfaceVariant }]}>
            You can draw on image
          </Text>
        </View>

        {/* Save Button - Prevent touch events from reaching canvas */}
        <View 
          style={[
            styles.footer, 
            { 
              backgroundColor: colors.surface,
              paddingBottom: Math.max(insets.bottom, 12),
            }
          ]}
          pointerEvents="box-none"
          onLayout={() => {
            // Force layout recalculation
          }}
        >
          <View style={styles.footerContent} pointerEvents="auto">
            <Button
              mode="outlined"
              onPress={handleClose}
              style={styles.footerButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.footerButton}
            >
              Save
            </Button>
          </View>
        </View>
        </View>
        
        {/* Bottom safe area */}
        <View style={{ height: Math.max(insets.bottom, 0), backgroundColor: colors.surface }} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  imageWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
  },
  instructionContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    zIndex: 10,
  },
  instructionText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    zIndex: 10,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default ImageEditor;

