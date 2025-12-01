// src/screens/leadscreens/LeadDetailScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, TouchableOpacity, LayoutAnimation, Modal, Linking, Platform, RefreshControl } from 'react-native';
import Pdf from 'react-native-pdf';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
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
  ActivityIndicator,
  TextInput
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import { useAuthStore } from '../../store/authStore';
import { leadApi } from '../../services/leadApi';
import useFormattedDate from '../../hooks/useFormattedDate';
import { printTable } from '../../utils/printTable';

// Status management
import { 
  getStatusesByType, 
  isValidStatusForType,
  getStatusColor,
  formatStatus,
  type LeadStatus 
} from '../../constants/leadStatuses';
import { useLeadStore } from '../../store/leadStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GearScan', 'NestedInspectionFlow' >;

interface Technician {
  id: number;
  name: string;
}

interface LeadDetail {
  lead_id: number;
  lead: {
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
    address?: string
  };
  assigned_technicians: Technician[];
  type: 'REPAIR' | 'INSPECTION';
  schedule_date: string;
  lead_status: LeadStatus;
  remarks: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

/**
 * Get water hardness category based on ppm value
 */
const getWaterHardnessCategory = (ppm: number): string => {
  if (ppm <= 25) return 'Soft';
  if (ppm <= 75) return 'Still Soft';
  if (ppm <= 150) return 'Hard';
  if (ppm <= 250) return 'Hard';
  return 'Very Hard';
};

/**
 * Get color for water hardness category
 */
const getHardnessColor = (category: string): string => {
  switch (category) {
    case 'Soft':
      return '#4CAF50'; // Green
    case 'Still Soft':
      return '#8BC34A'; // Light Green
    case 'Hard':
      return '#FF9800'; // Orange
    case 'Very Hard':
      return '#F44336'; // Red
    default:
      return '#757575'; // Gray
  }
};

/**
 * LeadDetailScreen - Detailed view for a single lead
 * Handles both Repair and Inspection leads with dynamic status management
 */
const LeadDetailScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { colors } = useTheme();
  const { top } = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { fetchLeadById, currentLead } = useLeadStore();

  
  const { lead: initialLead } = route.params as any;
  printTable("initialLead",initialLead)
  const [lead, setLead] = useState<LeadDetail>(initialLead);
  const [statusDialogVisible, setStatusDialogVisible] = React.useState(false);
  const [technicianDialogVisible, setTechnicianDialogVisible] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [currentStatus, setCurrentStatus] = React.useState<LeadStatus>(initialLead?.lead_status);

  // Water hardness state
  const [showHardnessInput, setShowHardnessInput] = useState(false);
  const [hardnessValue, setHardnessValue] = useState(() => {
    // Initialize from initialLead if available, handling null and float numbers
    if (initialLead?.water_hardness !== null && initialLead?.water_hardness !== undefined) {
      return typeof initialLead.water_hardness === 'number' 
        ? initialLead.water_hardness.toString() 
        : String(initialLead.water_hardness);
    }
    return '';
  });
  const [isEditingHardness, setIsEditingHardness] = useState(false);

  // Remarks editing state
  const [isEditingRemarks, setIsEditingRemarks] = useState(false);
  const [remarksValue, setRemarksValue] = useState(initialLead?.remarks || '');

  // PDF preview state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  /**
   * Get available statuses based on lead type
   * Uses the constants system for dynamic status management
   */
  const availableStatuses = useMemo(() => {
    return getStatusesByType(lead.type);
  }, [lead.type]);

  // Get current water hardness category and color
  const currentHardnessCategory = useMemo(() => {
    const ppm = parseFloat(hardnessValue) || 0;
    console.log("ppmppmppmppm", ppm)
    return getWaterHardnessCategory(ppm);
  }, [hardnessValue]);

  const currentHardnessColor = useMemo(() => {
    return getHardnessColor(currentHardnessCategory);
  }, [currentHardnessCategory]);

  // Update remarks value when lead data changes
  useEffect(() => {
    setRemarksValue(lead?.remarks || '');
  }, [lead?.remarks]);

  /**
   * Fetch detailed lead information from API
   */
  const fetchLeadDetail = useCallback(async (isRefreshing = false) => {
    try {
      const leadId = lead?.lead_id || initialLead?.lead_id;
      if (!leadId) {
        console.error('No lead ID available');
        return;
      }

      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const leadDetail:any = await fetchLeadById(leadId);
      printTable('Lead Details', leadDetail);
      if(leadDetail){
        setLead(leadDetail);
        setCurrentStatus(leadDetail?.lead_status);
        // Update water hardness value if available (handle null and float numbers)
        if (leadDetail.water_hardness !== null && leadDetail.water_hardness !== undefined) {
          const hardnessValue = typeof leadDetail.water_hardness === 'number' 
            ? leadDetail.water_hardness.toString() 
            : String(leadDetail.water_hardness);
          setHardnessValue(hardnessValue);
        } else {
          // Reset to empty string if null or undefined
          setHardnessValue('');
        }
      }
      printTable("currentLead",currentLead)
    } catch (error) {
      console.error('Error fetching lead details:', error);
      Alert.alert('Error', 'Failed to fetch lead details');
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [lead?.lead_id, initialLead?.lead_id]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchLeadDetail();
    }, [fetchLeadDetail])
  );

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    fetchLeadDetail(true);
  }, [fetchLeadDetail]);

  /**
   * Update lead status with validation
   */
  const handleStatusUpdate = async (newStatus: LeadStatus) => {
    try {
      // Validate if the status is valid for this lead type
      if (!isValidStatusForType(newStatus, lead.type)) {
        Alert.alert('Error', `Invalid status for ${lead.type.toLowerCase()} lead`);
        return;
      }

      setLoading(true);
      await leadApi.updateLead(lead.lead_id, {status: newStatus});
      setCurrentStatus(newStatus);
      setStatusDialogVisible(false);
      
      // Update local lead state
      setLead(prev => ({
        ...prev,
        lead_status: newStatus
      }));
      
      // Check if status is completed and call additional APIs
      const isCompleted = newStatus === 'Completed' || newStatus === 'RepairComplete';
      if (isCompleted) {
        await handleCompletedStatusApis();
      } else {
        Alert.alert('Success', 'Job status updated successfully');
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      Alert.alert('Error', 'Failed to update lead status');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle API calls when status is changed to completed
   */
  const handleCompletedStatusApis = async () => {
    try {
      setIsLoadingPdf(true);
      
      // Call first API: PPE Inspection
      console.log('Calling PPE Inspection API...');
      await leadApi.getPpeInspection(lead.lead_id);
      
      // Call second API: Inspection Analytics
      console.log('Calling Inspection Analytics API...');
      await leadApi.getInspectionAnalytics(lead.lead_id);
      
      // Simulate third API call to get PDF URL
      console.log('Fetching PDF URL...');
      const pdfUrlResult = await leadApi.getInspectionPdf(lead.lead_id);
      
      // Set PDF URL and show preview
      setPdfUrl(pdfUrlResult);
      setPdfModalVisible(true);
      
      Alert.alert('Success', 'Job status updated successfully. PDF report is ready.');
    } catch (error) {
      console.error('Error calling completion APIs:', error);
      Alert.alert('Warning', 'Status updated but failed to generate PDF report. Please try again later.');
    } finally {
      setIsLoadingPdf(false);
    }
  };

  /**
   * Open PDF in external browser
   */
  const handleOpenPdfExternal = async () => {
    if (pdfUrl) {
      try {
        const supported = await Linking.canOpenURL(pdfUrl);
        if (supported) {
          await Linking.openURL(pdfUrl);
        } else {
          Alert.alert('Error', 'Cannot open PDF URL');
        }
      } catch (error) {
        console.error('Error opening PDF:', error);
        Alert.alert('Error', 'Failed to open PDF');
      }
    }
  };

  /**
   * Update lead remarks
   */
  const handleUpdateRemarks = async () => {
    try {
      setLoading(true);
      
      await leadApi.updateLead(lead.lead_id, { remarks: remarksValue, status: currentStatus } );
      
      // Update local lead state
      setLead(prev => ({
        ...prev,
        remarks: remarksValue
      }));
      
      setIsEditingRemarks(false);
      Alert.alert('Success', 'Remarks updated successfully');
    } catch (error) {
      console.error('Error updating remarks:', error);
      Alert.alert('Error', 'Failed to update remarks');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancel remarks editing
   */
  const handleCancelRemarksEdit = () => {
    setRemarksValue(lead?.remarks || '');
    setIsEditingRemarks(false);
  };

  /**
   * Assign current user as technician to this lead
   */
  const handleAssignTechnician = async () => {
    try {
      setLoading(true);
      
      // API call to assign current user as technician
      await leadApi.assignTechnician(lead.lead_id, user?.id!);
      
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

  /**
   * Unassign technician from lead
   */
  const handleUnassignTechnician = async (technicianId: number) => {
    try {
      setLoading(true);
      
      // API call to unassign technician
      await leadApi.unassignTechnician(lead.lead_id, technicianId);
      
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

  /**
   * Save water hardness value
   */
  const handleSaveHardness = async () => {
    try {
      const ppm = parseFloat(hardnessValue);
      
      if (isNaN(ppm) || ppm < 0) {
        Alert.alert('Error', 'Please enter a valid positive number for water hardness');
        return;
      }

      setLoading(true);
      
      // API call to save water hardness
      await leadApi.updateLead(lead.lead_id, { water_hardness: ppm ,status: currentStatus});
      
      setIsEditingHardness(false);
      setShowHardnessInput(false);
      
      Alert.alert('Success', 'Water hardness saved successfully');
    } catch (error) {
      console.error('Error saving water hardness:', error);
      Alert.alert('Error', 'Failed to save water hardness');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Start editing water hardness
   */
  const handleEditHardness = () => {
    setIsEditingHardness(true);
    setShowHardnessInput(true);
  };

  /**
   * Cancel editing water hardness
   */
  const handleCancelEditHardness = () => {
    setIsEditingHardness(false);
    setShowHardnessInput(false);
    // Reset to previous value if needed, or keep current
  };

  // Check if current user is already assigned as technician
  const isCurrentUserAssigned = lead.assigned_technicians?.some(
    tech => tech.id === user?.id
  );

  // Check if current user can assign themselves (not already assigned and has technician role)
  const canAssignSelf = user && !isCurrentUserAssigned;

  // Loading state
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
      {/* Header with Back Button and Status */}
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
          Job #{lead.lead_id}
        </Text>

        {/* Status Badge with Edit Button */}
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
            {formatStatus(currentStatus)}
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
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Station Banner with Image */}
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

        {/* Job Details Card */}
        <Card style={[styles.card, 
          { backgroundColor: colors.surface, borderLeftColor: colors.primary, borderLeftWidth: p(3) },
        ]}>
          <Card.Content>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.onSurface, fontSize: p(16), marginBottom: p(10) },
              ]}
            >
              Details
            </Text>
            <Divider style={{ marginBottom: p(10) }} />

            <View style={styles.tableContainer}>
              {[
                { icon: 'calendar', label: 'Appointment Date', value: useFormattedDate(lead.schedule_date) },
                { icon: 'office-building', label: 'Department', value: lead?.firestation?.name },
                // { icon: 'office-building', label: 'Department', value:'Sarasota County Fire Department'},
                { icon: lead.type === 'REPAIR' ? 'wrench' : 'magnify', label: 'Job Type', value: lead.type === 'REPAIR' ? 'Repair' : 'Inspection' },
                { icon: 'check-circle', label: 'Job Status', value: formatStatus(currentStatus) },
                { icon: 'truck', label: 'MEU', value: lead?.lead?.meu },
                { icon: 'map-marker', label: 'Address', value: lead?.firestation?.address },
              ].map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <View style={styles.tableCellLeft}>
                    <Icon source={item.icon} size={p(16)} color={colors.primary} />
                    <Text
                      style={[
                        styles.tableLabel,
                        { color: colors.onSurface, fontSize: p(14)},
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.tableValue,
                      { color: colors.onSurface, fontSize: p(14) },
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

        {/* Technician Information */}
        <Card
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderLeftColor: colors.primary, borderLeftWidth: p(3) },
          ]}
        >
          <Card.Content>
            <View style={styles.technicianHeader}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface, fontSize: p(16) }]}>
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

            {/* Technician List */}
            {(lead?.lead?.technicianName || lead.assigned_technicians?.length > 0) ? (
              <>
                {/* Odoo Technician */}
                {lead?.lead?.technicianName && (
                  <View style={[styles.techCard, { borderColor: colors.outline }]}>
                    <View style={styles.techInfo}>
                      <Icon source="account-wrench" size={p(18)} color={colors.primary} />
                      <Text style={[styles.techText, { fontSize: p(14) }]}>
                        {lead.lead.technicianName}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Assigned Technicians */}
                {lead.assigned_technicians?.length > 0 && (
                  lead.assigned_technicians.map((tech, index) => {
                    // Skip duplicate if same as Odoo tech name
                    if (tech.name === lead?.lead?.technicianName) return null;

                    return (
                      <View
                        key={tech.id}
                        style={[styles.techCard, { borderColor: colors.outline }]}
                      >
                        <View style={styles.techInfo}>
                          <Icon source="account-wrench" size={p(18)} color={colors.primary} />
                          <Text style={[styles.techText, { fontSize: p(14) }]}>
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
                            textColor={colors.primary}
                          >
                            Unassign
                          </Button>
                        )}
                      </View>
                    );
                  })
                )}
              </>
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

        {/* Water Hardness Section */}
        <Card
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderLeftColor: colors.primary, borderLeftWidth: p(3) },
          ]}
        >
          <Card.Content>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface, fontSize: p(16) }]}>
                Water Hardness <Text style={[styles.sectionTitle, { color: "gray", fontSize: p(12) }]}>(Must be below 60 ppm. Over 60 ppm needs treatment)</Text>
              </Text>

              {/* Display current hardness or edit button */}
              {!isEditingHardness ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleEditHardness}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: p(6),
                  }}
                >
                  <Text style={{ color: currentHardnessColor, fontWeight: '700', fontSize: p(14) }}>
                    {hardnessValue ? `${hardnessValue} ppm (${currentHardnessCategory})` : ''}
                  </Text>
                  <Icon
                    source="pencil"
                    size={p(20)}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: p(8) }}>
                  <Button
                    mode="text"
                    compact
                    onPress={handleCancelEditHardness}
                    textColor={colors.error}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    compact
                    onPress={handleSaveHardness}
                    disabled={!hardnessValue}
                  >
                    Save
                  </Button>
                </View>
              )}
            </View>

            {/* Expandable input field */}
            {(showHardnessInput || isEditingHardness) && (
              <View style={{ marginTop: p(16) }}>
                <TextInput
                  label="Water Hardness (ppm)"
                  value={hardnessValue}
                  onChangeText={setHardnessValue}
                  keyboardType="numeric"
                  mode="outlined"
                  placeholder="Enter ppm value (0-425+)"
                  style={{ fontSize: p(16) }}
                  right={
                    <TextInput.Affix text="ppm" />
                  }
                />
                
                {/* Hardness scale guide */}
                <View style={styles.hardnessGuide}>
                  <Text style={[styles.guideTitle, { color: colors.onSurface }]}>
                    Hardness Scale:
                  </Text>
                  <View style={styles.guideItems}>
                    <View style={styles.guideItem}>
                      <View style={[styles.colorDot, { backgroundColor: '#4CAF50' }]} />
                      <Text style={[styles.guideText, { color: colors.onSurface }]}>0-25 ppm: Soft</Text>
                    </View>
                    <View style={styles.guideItem}>
                      <View style={[styles.colorDot, { backgroundColor: '#8BC34A' }]} />
                      <Text style={[styles.guideText, { color: colors.onSurface }]}>26-75 ppm: Still Soft</Text>
                    </View>
                    <View style={styles.guideItem}>
                      <View style={[styles.colorDot, { backgroundColor: '#FF9800' }]} />
                      <Text style={[styles.guideText, { color: colors.onSurface }]}>76-250 ppm: Hard</Text>
                    </View>
                    <View style={styles.guideItem}>
                      <View style={[styles.colorDot, { backgroundColor: '#F44336' }]} />
                      <Text style={[styles.guideText, { color: colors.onSurface }]}>251+ ppm: Very Hard</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Remarks Section */}
        <Card style={[styles.card, { backgroundColor: colors.surface, borderLeftColor: colors.primary, borderLeftWidth: p(3) }]}>
          <Card.Content>
            <View style={styles.remarksHeader}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface, fontSize: p(16) }]}>
                Remarks
              </Text>
              {!isEditingRemarks ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsEditingRemarks(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: p(6),
                  }}
                >
                 
                  <Icon
                    source="pencil"
                    size={p(20)}
                    color={colors.primary}
                  />
                </TouchableOpacity>

              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: p(8) }}>
                  <Button
                    mode="text"
                    compact
                    onPress={handleCancelRemarksEdit}
                    textColor={colors.error}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    compact
                    onPress={handleUpdateRemarks}
                    disabled={!remarksValue.trim()}
                  >
                    Save
                  </Button>
                </View>
              )}
            </View>
            <Divider style={{ marginVertical: p(6) }} />
            
            {!isEditingRemarks ? (
              <View style={styles.remarksBox}>
                <Icon source="clipboard-text" size={p(18)} color={colors.primary} />
                <Text style={[styles.remarksText, { color: colors.onSurface, fontSize: p(14) }]}>
                  {lead.remarks || 'No remarks available.'}
                </Text>
              </View>
            ) : (
              <TextInput
                label="Remarks"
                value={remarksValue}
                onChangeText={setRemarksValue}
                mode="outlined"
                multiline
                numberOfLines={4}
                placeholder="Enter remarks..."
                style={{ fontSize: p(16) }}
              />
            )}
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
            // { label: 'Start Inspection', icon: 'barcode-scan', action: () => navigation.navigate('GearScan') },
            { label: 'Start Inspection', icon: 'barcode-scan',  action:() => navigation.navigate('FirefighterFlow', {}) },
            {
              label: lead.type === 'REPAIR' ? 'View Repairs' : 'View Inspections',
              icon: lead.type === 'REPAIR' ? 'wrench' : 'clipboard-check-outline',
              action: () => navigation.navigate('ViewInspectionScreen'),
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
              style={{
                      flex: 1,             // ← Makes buttons wider automatically
                marginHorizontal: p(6), // ← Keeps them close, not too wide
                 borderColor: colors.outline, borderRadius: p(10), elevation: 12 }}
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
          <Dialog.Title>Update Job Status</Dialog.Title>
          <Dialog.Content>
            {/* Dynamically generated status options based on lead type */}
            {availableStatuses.map(({ status, icon, label }:any) => (
              <Button
                key={status}
                icon={icon}
                mode={currentStatus === status ? 'contained-tonal' : 'text'}
                onPress={() => handleStatusUpdate(status)}
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
                {label}
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

      {/* PDF Preview Modal */}
      <Modal
        visible={pdfModalVisible}
        animationType="slide"
        onRequestClose={() => setPdfModalVisible(false)}
        transparent={false}
      >
        <SafeAreaView style={[styles.pdfModalContainer, { backgroundColor: colors.background }]}>
          {/* PDF Modal Header */}
          <View style={[styles.pdfModalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
            <Button
              mode="text"
              compact
              onPress={() => setPdfModalVisible(false)}
              contentStyle={{ flexDirection: 'row' }}
            >
              <Icon source="arrow-left" size={p(22)} color={colors.onSurface} />
            </Button>
            <Text style={[styles.pdfModalTitle, { color: colors.onSurface, fontSize: p(18) }]}>
              Inspection Report
            </Text>
            <Button
              mode="text"
              compact
              onPress={handleOpenPdfExternal}
              contentStyle={{ flexDirection: 'row' }}
            >
              <Icon source="open-in-new" size={p(22)} color={colors.primary} />
            </Button>
          </View>

          {/* PDF Content */}
          {isLoadingPdf ? (
            <View style={styles.pdfLoadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 16, color: colors.onSurface }}>Loading PDF...</Text>
            </View>
          ) : pdfUrl ? (
            <View style={styles.pdfContainer}>
              <Pdf
                source={{
                  uri: pdfUrl,
                  cache: true,
                  method: 'GET',
                  // iOS-specific: Add headers if needed for authentication
                  ...(Platform.OS === 'ios' && {
                    headers: {},
                  }),
                }}
                style={styles.pdf}
                onLoadComplete={(numberOfPages) => {
                  console.log(`PDF loaded with ${numberOfPages} pages`);
                }}
                onPageChanged={(page, numberOfPages) => {
                  console.log(`Current page: ${page} of ${numberOfPages}`);
                }}
                onError={(error) => {
                  console.error('PDF error: ', error);
                  // Platform-specific error handling
                  if (Platform.OS === 'ios') {
                    console.log('iOS PDF error details:', JSON.stringify(error, null, 2));
                  }
                  // Try opening in external browser as fallback
                  Alert.alert(
                    'Error Loading PDF',
                    'Failed to load PDF in viewer. Would you like to open it in your browser?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Open in Browser', onPress: handleOpenPdfExternal },
                    ]
                  );
                }}
                onLoadProgress={(percent) => {
                  console.log(`PDF loading progress: ${percent}%`);
                }}
                enablePaging={true}
                horizontal={false}
                spacing={10}
                enableAnnotationRendering={true}
                fitPolicy={0}
                // iOS-specific: Enable single page mode for better performance
                {...(Platform.OS === 'ios' && {
                  singlePage: false,
                  page: 1,
                })}
              />
            </View>
          ) : (
            <View style={styles.pdfLoadingContainer}>
              <Text style={{ color: colors.onSurface }}>No PDF available</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

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
  remarksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginHorizontal: p(40),
    borderRadius: p(12),
    marginBottom: p(46),
    gap: p(8),
  },
  footerButton: {
    flexGrow: 1,                 // ← Allows auto width based on screen
    minWidth: '48%',             // ← Mobile: full width; Tablet: side by side
    borderRadius: p(10),
    elevation: 4,
  },

  hardnessGuide: {
    marginTop: p(16),
    padding: p(12),
    borderRadius: p(8),
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  guideTitle: {
    fontSize: p(14),
    fontWeight: '600',
    marginBottom: p(8),
  },
  guideItems: {
    gap: p(6),
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: p(8),
  },
  colorDot: {
    width: p(12),
    height: p(12),
    borderRadius: p(6),
  },
  guideText: {
    fontSize: p(12),
  },
  pdfModalContainer: {
    flex: 1,
  },
  pdfModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: p(16),
    paddingVertical: p(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pdfModalTitle: {
    fontSize: p(18),
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  pdfContainer: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    width: '100%',
  },
  pdfLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfFallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: p(24),
  },
  pdfFallbackText: {
    fontSize: p(18),
    fontWeight: '600',
    marginTop: p(16),
    textAlign: 'center',
  },
  pdfFallbackSubtext: {
    fontSize: p(14),
    marginTop: p(8),
    textAlign: 'center',
  },
});

export default LeadDetailScreen;