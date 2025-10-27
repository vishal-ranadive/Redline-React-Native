// src/utils/responsive.ts
import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH = 393; // iPhone 14 Pro width
const BASE_HEIGHT = 852;

export const p = (size: number) => {
  const widthRatio = SCREEN_WIDTH / BASE_WIDTH;
  const heightRatio = SCREEN_HEIGHT / BASE_HEIGHT;
  const ratio = Math.sqrt(widthRatio * heightRatio);

  let scaledSize = size * ratio;

  const isTablet = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) >= 600;
  // if (isTablet) scaledSize *= 0.92;
  if (isTablet) {
  const maxScale = 4; // was 1.25
  scaledSize = Math.min(maxScale * size, scaledSize);
} else {
  const minScale = 0.85;
  const maxScale = 1.25;
  scaledSize = Math.max(minScale * size, Math.min(maxScale * size, scaledSize));
}


  const minScale = 0.85;
  const maxScale = 1.25;
  scaledSize = Math.max(minScale * size, Math.min(maxScale * size, scaledSize));

  if (size === 1 && scaledSize < 1) {
    return Platform.select({ ios: 0.33, android: 0.5, default: 1 });
  }

  console.log(`
  🧭 Responsive Debug
  ---------------------------
  Device Size: ${SCREEN_WIDTH} x ${SCREEN_HEIGHT}
  Base Size: ${BASE_WIDTH} x ${BASE_HEIGHT}
  Ratios: width=${widthRatio.toFixed(2)}, height=${heightRatio.toFixed(2)}
  Combined Ratio: ${ratio.toFixed(2)}
  isTablet: ${isTablet}
  Original Size: ${size}
  Scaled Size: ${scaledSize.toFixed(2)}
  `);

  return Math.round(scaledSize);
};
