import React from 'react';
import { View, StyleSheet, TouchableOpacity,Image } from 'react-native';
import { Card, Text, Avatar, Badge, useTheme } from 'react-native-paper';
import { GearItem } from '../types/gears';


const p = (v: number) => v;

type Props = {
  gear: GearItem;
  onPress?: () => void;
};

const GearCard: React.FC<Props> = ({ gear, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={styles.wrapper} activeOpacity={0.85} onPress={onPress}>
      <Card style={[styles.card, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <View style={styles.row}>
             {gear.image ? (
              <Image source={{ uri: gear.image }} style={styles.image} resizeMode="cover" />
            ) : (
              <Avatar.Icon size={48} icon="hard-hat" style={{ backgroundColor: colors.primaryContainer }} />
            )}
            <View style={{ marginLeft: p(12), flex: 1 }}>
              <Text variant="titleMedium">{gear.name}</Text>
              <Text variant="bodySmall" numberOfLines={1} style={{ color: colors.onSurfaceVariant }}>{gear.category} • {gear.id}</Text>
            </View>
            {gear.available && <Badge style={{ backgroundColor: '#01fc09ff', alignSelf: 'flex-start' }}>Pass</Badge>}
            {!gear.available && <Badge style={{ backgroundColor: '#ff2200ff', alignSelf: 'flex-start' }}>Fail</Badge>}
          </View>
          {gear.description ? <Text variant="bodySmall" style={{ marginTop: p(8) }}>{gear.description}</Text> : null}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, margin: 6, minWidth: 150 },
  card: { borderRadius: p(10), paddingVertical: p(6) },
  row: { flexDirection: 'row', alignItems: 'center' },
  image: { width: 56, height: 56, borderRadius: 6, backgroundColor: '#eee' }, // <-- added
});

export default GearCard;