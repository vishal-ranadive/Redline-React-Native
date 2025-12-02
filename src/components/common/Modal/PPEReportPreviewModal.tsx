// src/components/common/Modal/PPEReportPreviewModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Text,
  Button,
  Icon,
  useTheme,
  Card,
  Divider,
  Badge,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../../utils/responsive';

interface PPEReportPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  onGeneratePDF: () => void;
  ppeData: any;
  analyticsData: any;
  leadData: any;
  isLoadingPDF?: boolean;
}

const PPEReportPreviewModal: React.FC<PPEReportPreviewModalProps> = ({
  visible,
  onClose,
  onGeneratePDF,
  ppeData,
  analyticsData,
  leadData,
  isLoadingPDF = false,
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

  if (!ppeData || !analyticsData) {
    return null;
  }

  const firestation = ppeData?.firestation || {};
  const rosters = ppeData?.roster || [];
  const analytics = analyticsData || {};

  // Parse address
  const address = firestation?.location || '';
  const addressParts = address.split(',').map((part: string) => part.trim());

  // Get status color
  const getStatusColor = (status: string) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('pass')) return '#10b981';
    if (statusLower.includes('fail')) return '#ef4444';
    if (statusLower.includes('expired')) return '#f97316';
    if (statusLower.includes('oos') || statusLower.includes('out of service')) return '#6b7280';
    if (statusLower.includes('action') || statusLower.includes('corrective')) return '#eab308';
    return '#6b7280';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
      supportedOrientations={supportedOrientations}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
          <Button
            mode="text"
            compact
            onPress={onClose}
            contentStyle={{ flexDirection: 'row' }}
          >
            <Icon source="arrow-left" size={p(22)} color={colors.onSurface} />
          </Button>
          <Text style={[styles.headerTitle, { color: colors.onSurface, fontSize: p(18) }]}>
            PPE Inspection Report Preview
          </Text>
          <View style={{ width: p(50) }} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Report Header */}
          <View style={styles.reportHeader}>
            <Text style={[styles.reportTitle, { color: colors.onSurface, fontSize: p(24) }]}>
              PPE INSPECTION REPORT
            </Text>
            <Text style={[styles.reportSubtitle, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
              Appointment Information
            </Text>
          </View>

          {/* Appointment Details */}
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: colors.primary, fontSize: p(18) }]}>
                Appointment Details
              </Text>
              <Divider style={{ marginVertical: p(10) }} />
              
              <View style={styles.detailsContainer}>
                {[
                  { label: 'Franchise Name', value: ppeData?.franchise_name || leadData?.franchies?.name || 'N/A' },
                  { label: 'MEU', value: leadData?.lead?.meu || 'N/A' },
                  { label: 'Department Name', value: firestation?.name || 'N/A' },
                  { label: 'Street', value: addressParts[0] || 'N/A' },
                  { label: 'City', value: addressParts[1] || 'N/A' },
                  { label: 'State', value: addressParts[2] || 'N/A' },
                  { label: 'Zip', value: addressParts[3] || 'N/A' },
                  { label: 'Contact Name (Chief)', value: firestation?.contact || 'N/A' },
                  { label: 'Phone', value: firestation?.contact || 'N/A' },
                  { label: 'Email', value: firestation?.email || 'N/A' },
                  { label: 'Inspection Date', value: firestation?.inspectionDate || 
                    (leadData?.schedule_date ? new Date(leadData.schedule_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A') },
                ].map((item, index) => (
                  <View key={index} style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.onSurface, fontSize: p(14) }]}>
                      {item.label}:
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.onSurface, fontSize: p(14) }]}>
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* Summary Statistics */}
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: colors.primary, fontSize: p(18) }]}>
                Inspection Summary
              </Text>
              <Divider style={{ marginVertical: p(10) }} />
              
              <View style={styles.summaryGrid}>
                {/* Primary Stats */}
                <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                  <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>👥</Text>
                  <Text style={[styles.summaryValue, { color: colors.primary, fontSize: p(20) }]}>
                    {analytics['Total fireFighters Serviced'] || analytics.total_firefighters_serviced || 0}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant, fontSize: p(10) }]}>
                    Total Firefighters Serviced
                  </Text>
                </View>

                <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                  <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>🧰</Text>
                  <Text style={[styles.summaryValue, { color: colors.primary, fontSize: p(20) }]}>
                    {analytics['Total Number of Gears'] || analytics.total_gears || 0}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant, fontSize: p(10) }]}>
                    Total Number of Gears
                  </Text>
                </View>

                <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                  <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>✨</Text>
                  <Text style={[styles.summaryValue, { color: colors.primary, fontSize: p(20) }]}>
                    {analytics['Total Specialized Cleaned Gear'] || analytics.total_specialized_cleaned || 0}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant, fontSize: p(10) }]}>
                    Specialized Cleaned Gear
                  </Text>
                </View>

                {/* Status Stats */}
                <View style={[styles.summaryCard, { backgroundColor: '#d1fae5', borderColor: '#10b981' }]}>
                  <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>✓</Text>
                  <Text style={[styles.summaryValue, { color: '#059669', fontSize: p(20) }]}>
                    {analytics['Total Gear Passed'] || analytics.total_passed || 0}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: '#6b7280', fontSize: p(10) }]}>
                    Passed
                  </Text>
                </View>

                <View style={[styles.summaryCard, { backgroundColor: '#fee2e2', borderColor: '#ef4444' }]}>
                  <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>✗</Text>
                  <Text style={[styles.summaryValue, { color: '#dc2626', fontSize: p(20) }]}>
                    {analytics['Total Gear Fail'] || analytics.total_failed || 0}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: '#6b7280', fontSize: p(10) }]}>
                    Failed
                  </Text>
                </View>

                <View style={[styles.summaryCard, { backgroundColor: '#f3f4f6', borderColor: '#6b7280' }]}>
                  <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>⊗</Text>
                  <Text style={[styles.summaryValue, { color: '#4b5563', fontSize: p(20) }]}>
                    {analytics['Total Gear OOS'] || analytics.total_oos || 0}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: '#6b7280', fontSize: p(10) }]}>
                    Out of Service
                  </Text>
                </View>

                <View style={[styles.summaryCard, { backgroundColor: '#fed7aa', borderColor: '#f97316' }]}>
                  <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>⏰</Text>
                  <Text style={[styles.summaryValue, { color: '#ea580c', fontSize: p(20) }]}>
                    {analytics['Total Gear Expired'] || analytics.total_expired || 0}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: '#6b7280', fontSize: p(10) }]}>
                    Expired
                  </Text>
                </View>

                <View style={[styles.summaryCard, { backgroundColor: '#fef3c7', borderColor: '#eab308' }]}>
                  <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>⚠</Text>
                  <Text style={[styles.summaryValue, { color: '#ca8a04', fontSize: p(20) }]}>
                    {analytics['Total Gear ActionRequired'] || analytics.total_action_required || 0}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: '#6b7280', fontSize: p(10) }]}>
                    Action Required
                  </Text>
                </View>

                {/* Gear Type Breakdown */}
                <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                  <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>🧥</Text>
                  <Text style={[styles.summaryValue, { color: colors.primary, fontSize: p(20) }]}>
                    {analytics['Total jackets'] || analytics.total_jackets || 0}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant, fontSize: p(10) }]}>
                    Jackets
                  </Text>
                </View>

                <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                  <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>👖</Text>
                  <Text style={[styles.summaryValue, { color: colors.primary, fontSize: p(20) }]}>
                    {analytics['Total pants'] || analytics.total_pants || 0}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant, fontSize: p(10) }]}>
                    Pants
                  </Text>
                </View>

                <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                  <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>⛑️</Text>
                  <Text style={[styles.summaryValue, { color: colors.primary, fontSize: p(20) }]}>
                    {analytics['Total helmet'] || analytics.total_helmet || 0}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant, fontSize: p(10) }]}>
                    Helmets
                  </Text>
                </View>

                <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                  <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>🧢</Text>
                  <Text style={[styles.summaryValue, { color: colors.primary, fontSize: p(20) }]}>
                    {analytics['Total hoods'] || analytics.total_hoods || 0}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant, fontSize: p(10) }]}>
                    Hoods
                  </Text>
                </View>

                <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                  <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>🧤</Text>
                  <Text style={[styles.summaryValue, { color: colors.primary, fontSize: p(20) }]}>
                    {analytics['Total gloves'] || analytics.total_gloves || 0}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant, fontSize: p(10) }]}>
                    Gloves
                  </Text>
                </View>

                <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                  <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>👢</Text>
                  <Text style={[styles.summaryValue, { color: colors.primary, fontSize: p(20) }]}>
                    {analytics['Total boots'] || analytics.total_boots || 0}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant, fontSize: p(10) }]}>
                    Boots
                  </Text>
                </View>

                <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                  <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>📦</Text>
                  <Text style={[styles.summaryValue, { color: colors.primary, fontSize: p(20) }]}>
                    {analytics['Total other'] || analytics.total_other || 0}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant, fontSize: p(10) }]}>
                    Other Gear
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Roster & Gear Assignments */}
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: colors.primary, fontSize: p(18) }]}>
                Roster & Gear Assignments
              </Text>
              <Divider style={{ marginVertical: p(10) }} />
              
              {rosters.map((roster: any, rosterIndex: number) => (
                <View key={roster.id || rosterIndex} style={styles.rosterSection}>
                  <View style={[styles.rosterHeader, { backgroundColor: '#fee2e2', borderLeftColor: colors.primary }]}>
                    <Text style={[styles.rosterNameLabel, { color: '#991b1b', fontSize: p(10) }]}>
                      ROSTER NAME:
                    </Text>
                    <Text style={[styles.rosterName, { color: colors.onSurface, fontSize: p(14) }]}>
                      {roster.name || 'N/A'}
                    </Text>
                    {roster.operation_type && (
                      <Badge style={{ marginLeft: p(8), backgroundColor: '#991b1b' }}>
                        {roster.operation_type}
                      </Badge>
                    )}
                  </View>

                  {roster.gears && roster.gears.length > 0 ? (
                    <View style={styles.gearsTable}>
                      <View style={[styles.gearsTableHeader, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.gearsTableHeaderText, { color: '#fff', fontSize: p(10) }]}>
                          Name
                        </Text>
                        <Text style={[styles.gearsTableHeaderText, { color: '#fff', fontSize: p(10) }]}>
                          Serial Number
                        </Text>
                        <Text style={[styles.gearsTableHeaderText, { color: '#fff', fontSize: p(10) }]}>
                          Status
                        </Text>
                      </View>
                      {roster.gears.map((gear: any, gearIndex: number) => (
                        <View 
                          key={gear.id || gearIndex} 
                          style={[
                            styles.gearsTableRow,
                            gearIndex % 2 === 0 && { backgroundColor: '#fef2f2' }
                          ]}
                        >
                          <Text style={[styles.gearsTableCell, { color: colors.onSurface, fontSize: p(12) }]}>
                            {gear.name || 'N/A'}
                          </Text>
                          <Text style={[styles.gearsTableCell, { color: colors.onSurface, fontSize: p(12) }]}>
                            {gear.serial_number || 'N/A'}
                          </Text>
                          <Badge 
                            style={{ 
                              backgroundColor: getStatusColor(gear.gear_status || gear.status),
                              alignSelf: 'flex-start'
                            }}
                          >
                            {gear.gear_status || gear.status || 'N/A'}
                          </Badge>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.noGears}>
                      <Text style={[styles.noGearsText, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
                        No gears assigned to this roster member
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </Card.Content>
          </Card>

          {/* Footer Spacing */}
          <View style={{ height: p(100) }} />
        </ScrollView>

        {/* Generate PDF Button */}
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.outline }]}>
          <Button
            mode="contained"
            onPress={onGeneratePDF}
            disabled={isLoadingPDF}
            loading={isLoadingPDF}
            icon="file-pdf-box"
            style={styles.generateButton}
            contentStyle={{ paddingVertical: p(8) }}
            labelStyle={{ fontSize: p(16), fontWeight: '600' }}
          >
            {isLoadingPDF ? 'Generating PDF...' : 'Generate PDF'}
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: p(16),
    paddingVertical: p(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: p(18),
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  reportHeader: {
    alignItems: 'center',
    paddingVertical: p(20),
    borderBottomWidth: 3,
    borderBottomColor: '#ed2c2a',
    marginBottom: p(20),
  },
  reportTitle: {
    fontSize: p(24),
    fontWeight: '700',
    marginBottom: p(8),
  },
  reportSubtitle: {
    fontSize: p(14),
    fontWeight: '500',
  },
  card: {
    marginHorizontal: p(14),
    marginBottom: p(12),
    borderRadius: p(10),
    elevation: 2,
  },
  sectionTitle: {
    fontSize: p(18),
    fontWeight: '700',
    marginBottom: p(4),
  },
  detailsContainer: {
    gap: p(8),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: p(6),
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  detailLabel: {
    fontSize: p(14),
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    fontSize: p(14),
    fontWeight: '400',
    flex: 1,
    textAlign: 'right',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: p(10),
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '30%',
    minWidth: p(100),
    padding: p(12),
    borderRadius: p(8),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIcon: {
    marginBottom: p(4),
  },
  summaryValue: {
    fontSize: p(20),
    fontWeight: '700',
    marginBottom: p(4),
  },
  summaryLabel: {
    fontSize: p(10),
    textAlign: 'center',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  rosterSection: {
    marginBottom: p(20),
  },
  rosterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: p(10),
    borderLeftWidth: 4,
    marginBottom: p(10),
    borderRadius: p(4),
  },
  rosterNameLabel: {
    fontSize: p(10),
    fontWeight: '600',
    textTransform: 'uppercase',
    marginRight: p(8),
  },
  rosterName: {
    fontSize: p(14),
    fontWeight: '700',
    flex: 1,
  },
  gearsTable: {
    borderRadius: p(8),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  gearsTableHeader: {
    flexDirection: 'row',
    padding: p(10),
    gap: p(8),
  },
  gearsTableHeaderText: {
    fontSize: p(10),
    fontWeight: '700',
    textTransform: 'uppercase',
    flex: 1,
  },
  gearsTableRow: {
    flexDirection: 'row',
    padding: p(10),
    alignItems: 'center',
    gap: p(8),
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  gearsTableCell: {
    fontSize: p(12),
    flex: 1,
  },
  noGears: {
    padding: p(20),
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: p(8),
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#fca5a5',
  },
  noGearsText: {
    fontSize: p(14),
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: p(16),
    paddingVertical: p(12),
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  generateButton: {
    borderRadius: p(8),
  },
});

export default PPEReportPreviewModal;

