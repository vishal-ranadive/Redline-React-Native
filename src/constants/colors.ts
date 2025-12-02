// Color mapping for display purposes (convert color name to hex)
export const COLOR_MAP: { [key: string]: string } = {
  red: '#FF4444',
  blue: '#4444FF',
  green: '#44FF44',
  yellow: '#FFFF44',
  orange: '#FF8844',
  purple: '#8844FF',
  pink: '#FF44FF',
  cyan: '#44FFFF',
  lime: '#88FF44',
  teal: '#44FF88',
};

// Helper to get hex color from color name for UI display
export const getColorHex = (colorName?: string | null): string => {
  if (!colorName) return '#CCCCCC';
  const normalized = colorName.toLowerCase().trim();
  return COLOR_MAP[normalized] || colorName || '#CCCCCC';
};

