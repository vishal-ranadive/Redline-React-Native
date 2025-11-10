// src/screens/leadscreens/LeadDetailScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import {
  Text,
  Card,
  Button,
  Icon,
  useTheme,
  Divider,
  Badge,
  Dialog,
  Portal,
  ActivityIndicator
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import { useAuthStore } from '../../store/authStore';
import { leadApi } from '../../services/leadApi';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GearScan', 'NestedInspectionFlow'>;
type LeadStatus = 'Ongoing' | 'Completed' | 'Canceled' | 'Rescheduled' | 'Scheduled';

interface Technician {
  id: number;
  name: string;
}

interface LeadDetail {
  id: number;
  odoo: {
    odooId: number;
    contactId: number;
    companyId: number;
    salePersonName: string;
    technicianId: number;
    technicianName: string;
    meu: string;
  };
  franchies: {
    id: number;
    name: string;
  };
  firestation: {
    id: number;
    name: string;
  };
  assignedTechnicians: Technician[];
  type: 'REPAIR' | 'INSPECTION';
  scheduledDate: string;
  status: LeadStatus;
  remarks: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

const LeadDetailScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { colors } = useTheme();
  const { top } = useSafeAreaInsets();
  const { user } = useAuthStore();
  
  const { lead: initialLead } = route.params as any;
  const [lead, setLead] = useState<LeadDetail>(initialLead);
  const [statusDialogVisible, setStatusDialogVisible] = React.useState(false);
  const [technicianDialogVisible, setTechnicianDialogVisible] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [currentStatus, setCurrentStatus] = React.useState<LeadStatus>(initialLead.status);

  // Fetch latest lead data when screen focuses
  useEffect(() => {
    fetchLeadDetail();
  }, []);

  const fetchLeadDetail = async () => {
    try {
      setLoading(true);
      const leadDetail = await leadApi.getLeadById(lead.id);

      console.log("leadDetail",leadDetail)
      setLead(leadDetail);
      setCurrentStatus(leadDetail.status);
    } catch (error) {
      console.error('Error fetching lead details:', error);
      Alert.alert('Error', 'Failed to fetch lead details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: LeadStatus) => {
    try {
      setLoading(true);
      await leadApi.updateLeadStatus(lead.id, newStatus);
      setCurrentStatus(newStatus);
      setStatusDialogVisible(false);
      
      // Update local lead state
      setLead(prev => ({
        ...prev,
        status: newStatus
      }));
      
      Alert.alert('Success', 'Lead status updated successfully');
    } catch (error) {
      console.error('Error updating lead status:', error);
      Alert.alert('Error', 'Failed to update lead status');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTechnician = async () => {
    try {
      setLoading(true);
      
      // API call to assign current user as technician
      // This assumes you have an endpoint like POST /api/leads/technician/{lead_id}/
      // You'll need to implement this in your leadApi service
      await leadApi.assignTechnician(lead.id, user?.id!);
      
      // Refresh lead details to get updated technician list
      await fetchLeadDetail();
      setTechnicianDialogVisible(false);
      
      Alert.alert('Success', 'You have been assigned to this lead');
    } catch (error) {
      console.error('Error assigning technician:', error);
      Alert.alert('Error', 'Failed to assign technician');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignTechnician = async (technicianId: number) => {
    try {
      setLoading(true);
      
      // API call to unassign technician
      // You'll need to implement this in your leadApi service
      await leadApi.unassignTechnician(lead.id, technicianId);
      
      // Refresh lead details to get updated technician list
      await fetchLeadDetail();
      
      Alert.alert('Success', 'Technician unassigned successfully');
    } catch (error) {
      console.error('Error unassigning technician:', error);
      Alert.alert('Error', 'Failed to unassign technician');
    } finally {
      setLoading(false);
    }
  };

  // Check if current user is already assigned as technician
  const isCurrentUserAssigned = lead.assignedTechnicians?.some(
    tech => tech.id === user?.id
  );

  // Check if current user can assign themselves (not already assigned and has technician role)
  const canAssignSelf = user && !isCurrentUserAssigned;

  const getStatusColor = useCallback((status: LeadStatus): string => {
    switch (status) {
      case 'Ongoing': return '#FFC107';
      case 'Completed': return '#34A853';
      case 'Canceled': return '#EA4335';
      case 'Rescheduled': return '#1E88E5';
      case 'Scheduled': return '#FB8C00';
      default: return '#9E9E9E';
    }
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.onSurface }}>Loading lead details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 🧭 Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.outline,
          },
        ]}
      >
        <Button
          mode="text"
          compact
          onPress={() => navigation.goBack()}
          contentStyle={{ flexDirection: 'row' }}
          style={{ marginLeft: p(-8) }}
        >
          <Icon source="arrow-left" size={p(22)} color={colors.onSurface} />
        </Button>

        <Text style={[styles.headerTitle, { color: colors.onSurface, fontSize: p(22) }]}>
          Lead #{lead.id}
        </Text>

        {/* Status Badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: p(6) }}>
          <Button
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(currentStatus) },
            ]}
            labelStyle={{
              fontSize: p(14),
              fontWeight: '600',
              color: colors.surface,
            }}
          >
            {currentStatus}
          </Button>

          <Button
            compact
            mode="text"
            onPress={() => setStatusDialogVisible(true)}
            contentStyle={{ paddingHorizontal: 0 }}
          >
            <Icon source="pencil" size={p(20)} color={colors.primary} />
          </Button>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 🏠 Station Banner */}
        <View style={styles.banner}>
          <Image
            source={{
              uri: 'https://media.gettyimages.com/id/182819377/photo/fire-truck.jpg?s=612x612&w=gi&k=20&c=K9QvVmf9qrRmfjjBmxC5yTO1ka4ilSv9ri5Imbs_o3A=',
            }}
            style={styles.bannerImage}
          />
          <View style={styles.bannerOverlayFull} />
          <View style={styles.bannerOverlay}>
            <Text style={[styles.stationName, { color: '#fff', fontSize: p(40) }]}>
              {lead?.firestation?.name}
            </Text>
            <Button
              mode="contained"
              buttonColor={colors.primary}
              style={styles.leadTypeBtn}
              contentStyle={{ paddingHorizontal: p(20), paddingVertical: p(2) }}
              labelStyle={{
                fontSize: p(16),
                fontWeight: '600',
                color: '#fff',
              }}
              icon={lead.type === 'REPAIR' ? 'wrench' : 'clipboard-check-outline'}
            >
              {lead.type === 'REPAIR' ? 'Repair' : 'Inspection'}
            </Button>
          </View>
        </View>

        {/* Lead Details Card */}
        <Card style={[styles.card, 
          { backgroundColor: colors.surface, borderLeftColor: colors.primary, borderLeftWidth: p(3) },
        ]}>
          <Card.Content>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.onSurface, fontSize: p(20), marginBottom: p(10) },
              ]}
            >
              Details
            </Text>
            <Divider style={{ marginBottom: p(10) }} />

            <View style={styles.tableContainer}>
              {[
                { icon: 'calendar', label: 'Appointment Date', value: formatDate(lead.scheduledDate) },
                { icon: 'office-building', label: 'Department', value: lead?.firestation?.name },
                { icon: lead.type === 'REPAIR' ? 'wrench' : 'magnify', label: 'Lead Type', value: lead.type === 'REPAIR' ? 'Repair' : 'Inspection' },
                { icon: 'check-circle', label: 'Lead Status', value: currentStatus },
              ].map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <View style={styles.tableCellLeft}>
                    <Icon source={item.icon} size={p(16)} color={colors.primary} />
                    <Text
                      style={[
                        styles.tableLabel,
                        { color: colors.onSurface, fontSize: p(18)},
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.tableValue,
                      { color: colors.onSurface, fontSize: p(18) },
                    ]}
                    numberOfLines={1}
                  >
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Sales Person Info */}
        <Card style={[
          styles.card, 
          { backgroundColor: colors.surface, borderLeftColor: colors.primary, borderLeftWidth: p(3) },
        ]}>
          <Card.Content>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.onSurface, fontSize: p(20), marginBottom: p(10) },
              ]}
            >
              Sales Information
            </Text>
            <Divider style={{ marginBottom: p(10) }} />

            <View style={styles.tableContainer}>
              {[
                { icon: 'account', label: 'Sales Person', value: lead?.odoo?.salePersonName },
                { icon: 'identifier', label: 'MEU', value: lead?.odoo?.meu },
              ].map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <View style={styles.tableCellLeft}>
                    <Icon source={item.icon} size={p(16)} color={colors.primary} />
                    <Text
                      style={[
                        styles.tableLabel,
                        { color: colors.onSurface, fontSize: p(18)},
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.tableValue,
                      { color: colors.onSurface, fontSize: p(18) },
                    ]}
                    numberOfLines={1}
                  >
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* 🧑‍🔧 Technician Info */}
        <Card
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderLeftColor: colors.primary, borderLeftWidth: p(3) },
          ]}
        >
          <Card.Content>
            <View style={styles.technicianHeader}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface, fontSize: p(20) }]}>
                Assigned Technicians
              </Text>
              {canAssignSelf && (
                <Button
                  mode="contained"
                  compact
                  onPress={() => setTechnicianDialogVisible(true)}
                  icon="account-plus"
                  style={styles.assignButton}
                >
                  Assign to Me
                </Button>
              )}
            </View>
            <Divider style={{ marginVertical: p(6) }} />

            {lead.assignedTechnicians?.length > 0 ? (
              lead.assignedTechnicians.map((tech, index) => (
                <View
                  key={tech.id}
                  style={[styles.techCard, { borderColor: colors.outline }]}
                >
                  <View style={styles.techInfo}>
                    <Icon source="account-wrench" size={p(18)} color={colors.primary} />
                    <Text style={[styles.techText, {fontSize: p(18)}]}>
                      {tech.name} (ID: {tech.id})
                      {tech.id === user?.id && (
                        <Text style={{ color: colors.primary, fontWeight: 'bold' }}> • You</Text>
                      )}
                    </Text>
                  </View>
                  {tech.id === user?.id && (
                    <Button
                      mode="text"
                      compact
                      onPress={() => handleUnassignTechnician(tech.id)}
                      textColor={colors.error}
                    >
                      Unassign
                    </Button>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyTechnicians}>
                <Icon source="account-wrench" size={p(24)} color={colors.outline} />
                <Text style={{ color: colors.outline, marginTop: 8 }}>
                  No technicians assigned
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* 📝 Remarks */}
        <Card style={[styles.card, { backgroundColor: colors.surface, borderLeftColor: colors.primary, borderLeftWidth: p(3) }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: colors.onSurface , fontSize: p(20)}]}>
              Remarks
            </Text>
            <Divider style={{ marginVertical: p(6) }} />
            <View style={styles.remarksBox}>
              <Icon source="clipboard-text" size={p(18)} color={colors.primary} />
              <Text style={[styles.remarksText, { color: colors.onSurface, fontSize: p(18) }]}>
                {lead.remarks || 'No remarks available.'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.outline,
            },
          ]}
        >
          {[
            { label: 'Scan Gear', icon: 'barcode-scan', action: () => navigation.navigate('GearScan') },
            { label: 'Search Gear', icon: 'magnify', action: () => navigation.navigate('GearSearch') },
            { label: 'Add Gear', icon: 'plus-circle-outline', action: () => navigation.navigate('AddGear') },
            {
              label: lead.type === 'REPAIR' ? 'View Repairs' : 'View Inspections',
              icon: lead.type === 'REPAIR' ? 'wrench' : 'clipboard-check-outline',
              action: () => navigation.navigate('LoadsScreen'),
            },
          ].map((action, i) => (
            <Button
              key={i}
              mode="outlined"
              onPress={() => action.action && action.action()}
              buttonColor={colors.primary}
              textColor={colors.onSurface}
              labelStyle={{
                fontSize: p(14),
                fontWeight: '600',
                color: '#fff',
              }}
              style={{ borderColor: colors.outline, borderRadius: p(10), elevation: 12 }}
              icon={action.icon}
              elevation={4}
            >
              {action.label}
            </Button>
          ))}
        </View>
      </ScrollView>

      {/* Status Update Dialog */}
      <Portal>
        <Dialog
          visible={statusDialogVisible}
          onDismiss={() => setStatusDialogVisible(false)}
        >
          <Dialog.Title>Update Lead Status</Dialog.Title>
          <Dialog.Content>
            {[
              { status: 'Ongoing', icon: 'progress-clock' },
              { status: 'Completed', icon: 'check-circle' },
              { status: 'Canceled', icon: 'close-circle' },
              { status: 'Rescheduled', icon: 'calendar-refresh' },
              { status: 'Scheduled', icon: 'calendar-check' },
            ].map(({ status, icon }) => (
              <Button
                key={status}
                icon={icon}
                mode={currentStatus === status ? 'contained-tonal' : 'text'}
                onPress={() => handleStatusUpdate(status as LeadStatus)}
                style={{
                  marginVertical: p(4),
                  alignSelf: 'flex-start',
                }}
                contentStyle={{
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                }}
                labelStyle={{
                  fontSize: p(16),
                  textAlign: 'left',
                }}
              >
                {status}
              </Button>
            ))}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setStatusDialogVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Assign Technician Dialog */}
      <Portal>
        <Dialog
          visible={technicianDialogVisible}
          onDismiss={() => setTechnicianDialogVisible(false)}
        >
          <Dialog.Title>Assign Technician</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to assign yourself as a technician to this lead?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setTechnicianDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleAssignTechnician} mode="contained">
              Assign Me
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

export default LeadDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: p(26),
    paddingVertical: p(8),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: p(16),
    fontWeight: '700',
  },
  statusBadge: {
    alignSelf: 'center',
    fontSize: p(20),
    fontWeight: '700',
    paddingHorizontal: p(6),
  },
  banner: {
    marginBottom: p(12),
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: p(180),
    borderBottomLeftRadius: p(12),
    borderBottomRightRadius: p(12),
  },
  bannerOverlayFull: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: p(12),
    left: p(16),
  },
  stationName: {
    fontSize: p(22),
    fontWeight: '800',
  },
  leadTypeBtn: {
    marginTop: p(6),
    borderRadius: p(8),
    alignSelf: 'flex-start',
  },
  card: {
    marginHorizontal: p(14),
    borderRadius: p(10),
    marginBottom: p(12),
    elevation: 2,
  },
  sectionTitle: {
    fontSize: p(15),
    fontWeight: '700',
    marginBottom: p(4),
  },
  tableContainer: {
    width: '100%',
    flexDirection: 'column',
    gap: p(6),
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: p(4),
    borderBottomWidth: 0.4,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  tableCellLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tableLabel: {
    fontSize: p(20),
    fontWeight: '600',
    marginLeft: p(8),
  },
  tableValue: {
    flex: 1,
    fontSize: p(20),
    fontWeight: '500',
    textAlign: 'left',
  },
  technicianHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignButton: {
    borderRadius: p(8),
  },
  techCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: p(8),
    padding: p(8),
    marginBottom: p(6),
  },
  techInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  techText: {
    fontSize: p(13),
    marginLeft: p(8),
  },
  emptyTechnicians: {
    alignItems: 'center',
    padding: p(16),
  },
  remarksBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  remarksText: {
    fontSize: p(13),
    marginLeft: p(8),
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingVertical: p(12),
    marginHorizontal: p(10),
    borderRadius: p(12),
    marginBottom: p(26),
  },
});