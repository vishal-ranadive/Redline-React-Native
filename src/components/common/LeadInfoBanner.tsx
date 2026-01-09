// src/components/common/LeadInfoBanner.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Icon, useTheme } from 'react-native-paper';
import { useLeadStore } from '../../store/leadStore';
import { useNavigation } from '@react-navigation/native';
import { p } from '../../utils/responsive';
import { formatStatus, getStatusColor } from '../../constants/leadStatuses';

export const LeadInfoBanner: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { currentLead } = useLeadStore();

  if (!currentLead) {
    return null;
  }

  const normalizedLeadType: 'REPAIR' | 'INSPECTION' = 
    currentLead.type?.toUpperCase() === 'REPAIR' ? 'REPAIR' : 'INSPECTION';

  const handlePress = () => {
    (navigation as any).navigate('LeadDetail', { lead: currentLead });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={[
        styles.banner,
        {
          backgroundColor: colors.surfaceVariant || colors.surface,
          borderBottomColor: colors.outline,
        },
      ]}
    >
      <View style={styles.bannerContent}>
        {/* Left Section - Job Info */}
        <View style={styles.leftSection}>
          <View style={styles.row}>
            <Icon source="briefcase-outline" size={p(12)} color={colors.onSurfaceVariant} />
            <Text style={[styles.jobId, { color: colors.onSurface }]}>
              #{currentLead.lead_id}
            </Text>
            <View style={[styles.dot, { backgroundColor: colors.outline }]} />
            <Text 
              style={[styles.stationName, { color: colors.onSurfaceVariant }]}
              numberOfLines={1}
            >
              {currentLead.firestation?.name || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Right Section - Type & Status */}
        <View style={styles.rightSection}>
          <View style={[styles.badge, { backgroundColor: colors.primaryContainer }]}>
            <Icon 
              source={normalizedLeadType === 'REPAIR' ? 'wrench' : 'clipboard-check-outline'} 
              size={p(10)} 
              color={colors.onPrimaryContainer} 
            />
            <Text style={[styles.badgeText, { color: colors.onPrimaryContainer }]}>
              {normalizedLeadType === 'REPAIR' ? 'Repair' : 'Inspection'}
            </Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentLead.lead_status) }]}>
            <Text style={[styles.statusText, { color: '#fff' }]}>
              {formatStatus(currentLead.lead_status)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: p(12),
    paddingVertical: p(6),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flex: 1,
    marginRight: p(8),
  },
  rightSection: {
    flexDirection: 'row',
    gap: p(6),
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: p(6),
  },
  jobId: {
    fontSize: p(11),
    fontWeight: '600',
  },
  stationName: {
    fontSize: p(10),
    flex: 1,
  },
  dot: {
    width: p(3),
    height: p(3),
    borderRadius: p(1.5),
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: p(6),
    paddingVertical: p(2),
    borderRadius: p(4),
    gap: p(4),
  },
  badgeText: {
    fontSize: p(9),
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: p(6),
    paddingVertical: p(2),
    borderRadius: p(4),
  },
  statusText: {
    fontSize: p(9),
    fontWeight: '600',
  },
});

