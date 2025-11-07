import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, Icon, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { p } from '../../utils/responsive';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  rightElement?: React.ReactNode;
  statusBadge?: string;
  statusColor?: string;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = true,
  rightElement,
  statusBadge,
  statusColor = '#FFC107',
}) => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.outline,
        },
      ]}
    >
      <View style={styles.leftSection}>
        {showBackButton && (
          <Button
            mode="text"
            compact
            onPress={() => navigation.goBack()}
            contentStyle={{ flexDirection: 'row' }}
            style={{ marginLeft: p(-8) }}
          >
            <Icon source="arrow-left" size={p(22)} color={colors.onSurface} />
          </Button>
        )}
      </View>

      <Text style={[styles.headerTitle, { color: colors.onSurface, fontSize: p(22) }]}>
        {title}
      </Text>

      <View style={styles.rightSection}>
        {statusBadge ? (
          <Button
            style={[styles.statusBadge, { backgroundColor: statusColor }]}
            labelStyle={{
              fontSize: p(14),
              fontWeight: '600',
              color: colors.surface,
            }}
          >
            {statusBadge}
          </Button>
        ) : (
          rightElement
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: p(26),
    paddingVertical: p(8),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: p(16),
    fontWeight: '700',
    textAlign: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statusBadge: {
    fontSize: p(20),
    fontWeight: '700',
    paddingHorizontal: p(6),
  },
});

export default Header;