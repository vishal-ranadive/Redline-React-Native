import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Text,
  Icon,
  useTheme,
  Card,
  Divider,
  Button,
} from 'react-native-paper';
import { p } from '../../../utils/responsive';
import { GearHistoryItem } from '../../../store/gearStore';
import { formatDateMMDDYYYY } from '../../../utils/dateUtils';

interface GearHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  gearHistoryItem: GearHistoryItem | null;
}

const GearHistoryModal: React.FC<GearHistoryModalProps> = ({
  visible,
  onClose,
  gearHistoryItem,
}) => {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;
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

  const formatDate = (dateString: string) => {
    return formatDateMMDDYYYY(dateString) || 'N/A';
  };

  const formatCurrency = (amount: number) => {
    return `$${amount?.toFixed(2) || '0.00'}`;
  };

  const getStatusColor = (status: string) => {
    if (status?.toLowerCase().includes('fail') || status?.toLowerCase().includes('repair') || status?.toLowerCase().includes('incomplete')) return '#EA4335';
    if (status?.toLowerCase().includes('pass') || status?.toLowerCase().includes('good') || status?.toLowerCase().includes('complete')) return '#34A853';
    if (status?.toLowerCase().includes('attention') || status?.toLowerCase().includes('requires')) return '#FB8C00';
    return colors.onSurfaceVariant;
  };

  if (!gearHistoryItem) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      supportedOrientations={supportedOrientations}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[styles.modalContent, { backgroundColor: colors.surface, height: screenWidth > 600 ? '80%' : '90%' }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.onSurface, fontSize: p(20) }]}>
              Gear History Details
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon source="close" size={p(24)} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <Divider style={{ marginBottom: p(16) }} />

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled={true}
          >
            {/* History Information */}
            <Card style={[styles.card, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <Text style={[styles.cardTitle, { color: colors.onSurface, fontSize: p(18) }]}>
                  History Information
                </Text>
                <Divider style={{ marginBottom: p(12) }} />

                <View style={styles.infoRow}>
                  <Icon source="tag" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    Repair ID: {gearHistoryItem.repair_id}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon source="calendar" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    Schedule Date: {formatDate(gearHistoryItem.lead.schedule_date)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon source="shield-check" size={p(18)} color={getStatusColor(gearHistoryItem.repair_status)} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16), fontWeight: '600' }]}>
                    Status: {gearHistoryItem.repair_status}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon source="cash" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    Cost: {formatCurrency(gearHistoryItem.repair_cost)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon source="package-variant" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    Quantity: {gearHistoryItem.repair_quantity}
                  </Text>
                </View>

                {gearHistoryItem.spare_gear && (
                  <View style={styles.infoRow}>
                    <Icon source="package-variant-closed" size={p(18)} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                      Spare Gear Used
                    </Text>
                  </View>
                )}

                {gearHistoryItem.remarks && (
                  <View style={styles.infoRow}>
                    <Icon source="note-text" size={p(18)} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                      Remarks: {gearHistoryItem.remarks}
                    </Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Icon source="calendar-plus" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    Created: {formatDate(gearHistoryItem.created_at)} by {gearHistoryItem.created_by}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon source="calendar-edit" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    Updated: {formatDate(gearHistoryItem.updated_at)} by {gearHistoryItem.updated_by}
                  </Text>
                </View>
              </Card.Content>
            </Card>

            {/* Lead Information */}
            <Card style={[styles.card, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <Text style={[styles.cardTitle, { color: colors.onSurface, fontSize: p(18) }]}>
                  Lead Information
                </Text>
                <Divider style={{ marginBottom: p(12) }} />

                <View style={styles.infoRow}>
                  <Icon source="account-tie" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    Lead ID: {gearHistoryItem.lead.lead_id}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon source="office-building" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    Franchise: {gearHistoryItem.lead.franchise.franchise_name}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon source="fire-truck" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    Fire Station: {gearHistoryItem.lead.firestation.fire_station_name}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon source="clipboard-check" size={p(18)} color={getStatusColor(gearHistoryItem.lead.lead_status)} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16), fontWeight: '600' }]}>
                    Lead Status: {gearHistoryItem.lead.lead_status}
                  </Text>
                </View>

                {gearHistoryItem.lead.assigned_technicians && gearHistoryItem.lead.assigned_technicians.length > 0 && (
                  <View style={styles.infoRow}>
                    <Icon source="account-group" size={p(18)} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                      Technicians: {gearHistoryItem.lead.assigned_technicians.map(tech => tech.name).join(', ')}
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>

            {/* Gear Information */}
            <Card style={[styles.card, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <Text style={[styles.cardTitle, { color: colors.onSurface, fontSize: p(18) }]}>
                  Gear Information
                </Text>
                <Divider style={{ marginBottom: p(12) }} />

                <View style={styles.infoRow}>
                  <Icon source="tag" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    Gear Name: {gearHistoryItem.gear.gear_name}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon source="barcode" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    Serial Number: {gearHistoryItem.gear.serial_number}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon source="cog" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    Type: {gearHistoryItem.gear.gear_type.gear_type}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon source="factory" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    Manufacturer: {gearHistoryItem.gear.manufacturer.manufacturer_name}
                  </Text>
                </View>

                {gearHistoryItem.gear.roster && (
                  <View style={styles.infoRow}>
                    <Icon source="account" size={p(18)} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                      Assigned to: {gearHistoryItem.gear.roster.first_name} {gearHistoryItem.gear.roster.last_name}
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>

            {/* Images Section - Repair or Inspection */}
            {(() => {
              const isRepair = gearHistoryItem.record_type === 'REPAIR';
              const isInspection = gearHistoryItem.record_type === 'INSPECTION';
              const repairImages = gearHistoryItem.repair_images || [];
              const inspectionImages = gearHistoryItem.inspection_images || [];
              const images = isRepair ? repairImages : isInspection ? inspectionImages : [];
              const hasImages = images.length > 0;
              const imageTitle = isRepair ? 'Repair Images' : isInspection ? 'Inspection Images' : 'History Images';

              return (
                <Card style={[styles.card, { backgroundColor: colors.surface }]}>
                  <Card.Content>
                    <Text style={[styles.cardTitle, { color: colors.onSurface, fontSize: p(18) }]}>
                      {imageTitle}
                    </Text>
                    <Divider style={{ marginBottom: p(12) }} />

                    {hasImages ? (
                      <View style={styles.imagesContainer}>
                        {images.map((imageUrl: string, index: number) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.imageWrapper}
                            onPress={() => {
                              // Handle image preview - you can implement image viewer here
                              Alert.alert('Image Preview', 'Image preview functionality can be implemented here');
                            }}
                          >
                            <Image
                              source={{ uri: imageUrl }}
                              style={styles.image}
                              resizeMode="cover"
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.noImagesContainer}>
                        <Icon source="image-off" size={p(48)} color={colors.onSurfaceVariant} />
                        <Text style={[styles.noImagesText, { color: colors.onSurfaceVariant, fontSize: p(16) }]}>
                          No images available
                        </Text>
                        <Text style={[styles.noImagesSubtext, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
                          {isRepair 
                            ? 'No repair images were captured for this record.' 
                            : isInspection 
                            ? 'No inspection images were captured for this record.'
                            : 'No images are available for this record.'}
                        </Text>
                      </View>
                    )}
                  </Card.Content>
                </Card>
              );
            })()}
          </ScrollView>

          {/* Close Button */}
          <View style={styles.footer}>
            <Button
              mode="contained"
              onPress={onClose}
              buttonColor={colors.primary}
              textColor={colors.surface}
              style={styles.closeModalButton}
            >
              Close
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: p(20),
  },
  modalContent: {
    width: '100%',
    maxWidth: p(800),
    borderRadius: p(12),
    elevation: 5,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: p(16),
    paddingBottom: p(8),
  },
  title: {
    fontWeight: '700',
  },
  closeButton: {
    padding: p(4),
  },
  card: {
    marginBottom: p(12),
    borderRadius: p(8),
    elevation: 2,
  },
  cardTitle: {
    fontWeight: '700',
    marginBottom: p(8),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: p(10),
    gap: p(8),
  },
  infoText: {
    flex: 1,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: p(8),
  },
  imageWrapper: {
    width: p(100),
    height: p(100),
    borderRadius: p(8),
    overflow: 'hidden',
    elevation: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImagesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: p(32),
    paddingHorizontal: p(16),
  },
  noImagesText: {
    marginTop: p(16),
    fontWeight: '600',
    textAlign: 'center',
  },
  noImagesSubtext: {
    marginTop: p(8),
    textAlign: 'center',
    opacity: 0.7,
  },
  footer: {
    padding: p(16),
    paddingTop: p(8),
  },
  closeModalButton: {
    borderRadius: p(8),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: p(16),
  },
});

export default GearHistoryModal;
