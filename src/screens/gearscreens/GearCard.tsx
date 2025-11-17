// src/components/GearCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';

interface GearCardProps {
  gear: any;
  onPress: () => void;
  showDetails?: boolean;
}

export const GearCard: React.FC<GearCardProps> = ({
  gear,
  onPress,
  showDetails = false,
}) => {
  const getGearTypeDisplay = () => {
    if (!gear.gear_type) return 'Unknown Type';
    return gear.gear_type.gear_type || 'Unknown Type';
  };

  const getStatusColor = () => {
    return gear.active_status ? '#34C759' : '#FF3B30';
  };

  const getStatusText = () => {
    return gear.active_status ? 'Active' : 'Inactive';
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.gearName} numberOfLines={1}>
            {gear.gear_name}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>
        <Text style={styles.gearType}>{getGearTypeDisplay()}</Text>
      </View>

      {/* Basic Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Serial No:</Text>
          <Text style={styles.infoValue}>{gear.serial_number}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Manufacturer:</Text>
          <Text style={styles.infoValue}>
            {gear.manufacturer?.manufacturer_name || 'Unknown'}
          </Text>
        </View>
      </View>

      {/* Detailed Info Section - Conditionally Rendered */}
      {showDetails && (
        <>
          {/* Firefighter Info */}
          {gear.roster && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Assigned To</Text>
              <Text style={styles.detailValue}>
                {gear.roster.first_name} {gear.roster.last_name}
              </Text>
              {gear.roster.email && (
                <Text style={styles.detailSubValue}>{gear.roster.email}</Text>
              )}
            </View>
          )}

          {/* Location Info */}
          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Fire Station</Text>
              <Text style={styles.detailValue}>
                {gear.firestation?.name || 'Unknown'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Franchise</Text>
              <Text style={styles.detailValue}>
                {gear.franchise?.name || 'Unknown'}
              </Text>
            </View>
          </View>

          {/* Dates */}
          <View style={styles.detailGrid}>
            {gear.manufacturing_date && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Manufactured</Text>
                <Text style={styles.detailValue}>
                  {new Date(gear.manufacturing_date).toLocaleDateString()}
                </Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Last Updated</Text>
              <Text style={styles.detailValue}>
                {new Date(gear.updated_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.gearId}>Gear ID: {gear.gear_id}</Text>
        <Text style={styles.updatedBy}>Updated by: {gear.updated_by}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    marginBottom: 12,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  gearName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  gearType: {
    fontSize: 14,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoSection: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  detailSubValue: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  detailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  gearId: {
    fontSize: 12,
    color: '#999',
  },
  updatedBy: {
    fontSize: 12,
    color: '#999',
  },
});

export default GearCard;