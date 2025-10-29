// ...existing code...
import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Card, Text, useTheme, Chip, Avatar } from 'react-native-paper';
import { GroupInspectionItem } from '../types/Inspection';


const p = (v: number) => v;

type Props = {
  item: GroupInspectionItem;
  onPress?: () => void;
};

export default function InspectionCard({ item, onPress }: Props) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.touch}>
      <Card style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.backdrop }]}>
        <Card.Content style={styles.content}>
          <View style={styles.left}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
            ) : (
              <Avatar.Icon size={72} icon="hard-hat" style={{ backgroundColor: colors.primaryContainer }} />
            )}

            <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
              <Text variant="labelLarge" style={styles.countText}>{item.count}</Text>
              <Text variant="labelSmall" style={styles.countLabel}>pcs</Text>
            </View>
          </View>

          <View style={styles.body}>
            <Text variant="titleMedium" numberOfLines={1} style={{ color: colors.onSurface }}>{item.title}</Text>

            <Text variant="bodySmall" numberOfLines={1} style={{ color: colors.onSurfaceVariant, marginTop: 4 }}>
              {item.station} • {item.inspector ?? 'Unassigned'}
            </Text>

            {item.date ? (
              <Text variant="bodySmall" style={{ color: colors.tertiary, marginTop: 6 }}>
                {item.date}
              </Text>
            ) : null}

            <View style={styles.chipsRow}>
              <Chip mode="flat" style={[styles.chip, { backgroundColor: colors.primaryContainer }]} textStyle={{ color: colors.onPrimaryContainer }}>
                {`${item.count} items`}
              </Chip>
              <Chip mode="outlined" style={styles.chip} compact>
                {item.station}
              </Chip>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touch: { marginVertical: 8, marginHorizontal: 12 },
  card: {
    borderRadius: p(14),
    elevation: 4,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  content: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingRight: 12 },
  left: { width: 92, alignItems: 'center', justifyContent: 'center' },
  image: { width: 72, height: 72, borderRadius: 10, backgroundColor: '#eee' },
  countBadge: {
    position: 'absolute',
    right: -6,
    top: -6,
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  countText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  countLabel: { color: '#fff', fontSize: 10, lineHeight: 12 },
  body: { flex: 1, paddingLeft: 12, justifyContent: 'center' },
  chipsRow: { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  chip: { marginRight: 8, height: 32, justifyContent: 'center' },
});