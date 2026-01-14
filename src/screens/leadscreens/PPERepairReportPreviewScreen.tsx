// src/screens/leadscreens/PPERepairReportPreviewScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Image,
  TouchableOpacity,
  Modal,
} from 'react-native';

import {
  Text,
  Button,
  Icon,
  useTheme,
  Card,
  Divider,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { p } from '../../utils/responsive';
import { leadApi } from '../../services/leadApi';
import { generateRepairReportHTML, generatePDF, downloadPDF, sharePDFOnIOS } from '../../utils/pdfGenerator';
import { requestStoragePermission } from '../../utils/permissions';
import { useThemeStore } from '../../store/themeStore';
import { Alert, Platform } from 'react-native';
import { GEAR_IMAGE_URLS } from '../../constants/gearImages';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PPERepairReportPreview'>;

const PPERepairReportPreviewScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { colors } = useTheme();
  const { theme } = useThemeStore();
  const { width } = useWindowDimensions();
  const isPortrait = width < 600; // Consider portrait if width < 600
  
  const { leadId, leadData } = route.params as any;
  
  const [ppeData, setPpeData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  // Fetch data on mount
  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Call repair endpoints
      console.log('Calling PPE Repair API...');
      const ppeRepairData = await leadApi.getPpeRepair(leadId);
      setPpeData(ppeRepairData);

      // Call Repair Analytics (optional)
      console.log('Calling Repair Analytics API...');
      try {
        const analyticsResult = await leadApi.getRepairAnalytics(leadId);
        setAnalyticsData(analyticsResult);
      } catch (analyticsError: any) {
        console.warn('Repair analytics data not available:', analyticsError?.message);
        setAnalyticsData(null);
      }

    } catch (error) {
      console.error('Error fetching PPE repair data:', error);
      Alert.alert('Error', 'Failed to fetch PPE repair data. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!ppeData) {
      Alert.alert('Error', 'PPE repair data is not available. Please try again.');
      return;
    }

    try {
      // iOS doesn't require storage permission - skip all checks
      if (Platform.OS === 'android') {
        const granted = await requestStoragePermission(true); // show rationale dialog for Android 13+
        if (!granted) {
          Alert.alert(
            'Permission Required',
            'Storage permission is needed to save PDF reports. Please grant storage permission in app settings.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      setIsGeneratingPDF(true);
      
      // Generate HTML from template and data
      console.log('Generating HTML repair report...');
      const htmlContent = generateRepairReportHTML(ppeData, analyticsData, leadData);
      
      // Generate PDF from HTML
      console.log('Generating PDF...');
      const fileName = `PPE_Repair_Report_${leadId}_${Date.now()}`;
      const pdfPath = await generatePDF(htmlContent, fileName);
      
      // Download PDF (saves to appropriate location based on platform)
      console.log('Downloading PDF...');
      const downloadFileName = `PPE_Repair_Report_${leadId}_${Date.now()}.pdf`;
      const downloadedPath = await downloadPDF(pdfPath, downloadFileName);
      
      // On iOS, open share sheet so user can save to Files app or iCloud Drive
      if (Platform.OS === 'ios') {
        try {
          console.log('Opening iOS share sheet...');
          await sharePDFOnIOS(downloadedPath, downloadFileName);
          // Don't show alert immediately on iOS, let the share sheet handle it
        } catch (shareError) {
          console.error('Error opening share sheet:', shareError);
          Alert.alert(
            'PDF Saved',
            `PDF has been saved to your Documents folder. You can access it via the Files app.\n\nPath: ${downloadedPath}`,
            [{ text: 'OK' }]
          );
        }
      } else {
        // Android: Show success message
        Alert.alert(
          'Success',
          `PDF downloaded successfully!\n\nYou can find it in your device's Downloads folder.\n\nFile: ${downloadFileName}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Error generating/downloading PDF:', error);
      Alert.alert(
        'Error',
        `Failed to generate PDF. ${error?.message || 'Please try again.'}`
      );
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.onSurface, fontSize: p(16) }}>
            Loading report data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ppeData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Icon source="alert-circle" size={p(48)} color={colors.error} />
          <Text style={{ marginTop: 16, color: colors.error, fontSize: p(16) }}>
            No PPE repair data available
          </Text>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={{ marginTop: 16 }}
          >
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Get firestation data - try ppeData first, then leadData as fallback
  const firestation = ppeData?.firestation || leadData?.firestation || {};
  const analytics = analyticsData || {};
  const rosters = ppeData?.roster || [];
  const assignedTechnicians = ppeData?.assigned_technicians || [];
  
  // Get technician names
  const technicianNames = assignedTechnicians
    .map((tech: any) => tech.name)
    .join(', ') || 'N/A';

  // Parse address - try location string first, then fall back to individual fields
  const address = firestation?.location || '';
  let addressParts = address ? address.split(',').map((part: string) => part.trim()) : [];
  
  // If location string is empty or doesn't have enough parts, use individual fields from leadData
  if (addressParts.length < 4 && leadData?.firestation) {
    addressParts = [
      leadData.firestation.address || '',
      leadData.firestation.city || '',
      leadData.firestation.state || '',
      leadData.firestation.zip_code || ''
    ].filter(part => part.trim() !== '');
  }
  // Get email - try ppeData first, then leadData (though leadData might not have email)
  const firestationEmail = ppeData?.firestation?.email || leadData?.firestation?.email || '';
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
        <Button
          mode="text"
          compact
          onPress={() => navigation.goBack()}
          contentStyle={{ flexDirection: 'row' }}
        >
          <Icon source="arrow-left" size={p(22)} color={colors.onSurface} />
        </Button>
        <Text style={[styles.headerTitle, { color: colors.onSurface, fontSize: p(18) }]}>
          PPE Repair Report
        </Text>
        <Button
          mode="text"
          compact
          onPress={handleDownloadPDF}
          disabled={isGeneratingPDF}
          contentStyle={{ flexDirection: 'row', gap: p(4) }}
        >
          {isGeneratingPDF ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: p(6) }}>
              <Icon source="file-pdf-box" size={p(24)} color={colors.primary} />
              <Icon source="download" size={p(22)} color={colors.primary} />
            </View>
          )}
        </Button>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Header */}
        <View style={styles.logoContainer}>
          <Image
            source={{ 
              uri: theme === 'dark'
                ? 'https://res.cloudinary.com/dwwykeft2/image/upload/v1765531884/RedLine/gdfwbzg3ejynlcu3kqk3.png'
                : 'https://res.cloudinary.com/dwwykeft2/image/upload/v1765457898/RedLine/wqoaomsleu1egppnvjo6.png'
            }}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </View>

        {/* Report Header */}
        {/* <View style={styles.reportHeader}>
          <Text style={[styles.reportTitle, { color: colors.onSurface, fontSize: p(18) }]}>
            PPE REPAIR REPORT
          </Text>
          <Text style={[styles.reportSubtitle, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
            Lead Information
          </Text>
        </View> */}

        {/* Lead Details */}
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: colors.primary, fontSize: p(18) }]}>
              Lead Information
            </Text>
            <Divider style={{ marginVertical: p(10) }} />
            
            <View style={styles.detailsContainer}>
              {/* Franchise Name with Image */}
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.onSurface, fontSize: p(14) }]}>
                  Franchise Name:
                </Text>
                <View style={styles.franchiseContainer}>
                  {(ppeData?.franchise?.logo || ppeData?.franchise?.image) && (
                    <Image
                      source={{ uri: ppeData?.franchise?.logo || ppeData?.franchise?.image }}
                      style={styles.franchiseImage}
                      resizeMode="contain"
                    />
                  )}
                  <Text style={[styles.detailValue, { color: colors.onSurface, fontSize: p(14) }]}>
                    {ppeData?.franchise?.name || ppeData?.franchise_name || leadData?.franchies?.name || 'N/A'}
                  </Text>
                </View>
              </View>
              {[
                { label: 'Department Name', value: firestation?.name || firestation?.fire_station_name || 'N/A' },
                { label: 'Street', value: addressParts[0] || firestation?.address || 'N/A' },
                { label: 'City', value: addressParts[1] || firestation?.city || 'N/A' },
                { label: 'State', value: addressParts[2] || firestation?.state || 'N/A' },
                { label: 'Zip', value: addressParts[3] || firestation?.zip_code || 'N/A' },
                { label: 'Contact Name (Chief)', value: firestation?.contact || 'N/A' },
                { label: 'Phone', value: firestation?.phone || firestation?.contact || 'N/A' },
                { label: 'Email', value: firestationEmail || 'N/A' },
                { label: 'Repair Date', value: firestation?.inspectionDate || 
                  (leadData?.schedule_date ? new Date(leadData.schedule_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A') },
                { label: 'Assigned Technicians', value: technicianNames },
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

        {/* Analytics Data Warning */}
        {!analyticsData && (
          <Card style={[styles.card, { backgroundColor: '#fff3cd', borderColor: '#ffeaa7', borderWidth: 1 }]}>
            <Card.Content>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: p(12) }}>
                <Icon source="alert-circle" size={p(24)} color="#856404" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.warningTitle, { color: '#856404', fontSize: p(16) }]}>
                    Limited Report Data
                  </Text>
                  <Text style={[styles.warningText, { color: '#856404', fontSize: p(14) }]}>
                    Repair analytics are not available for this lead. The report will show basic information only.
                    You can still download the report, but it will not include repair statistics or gear breakdowns.
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Summary Statistics */}
        {analyticsData && (
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: colors.primary, fontSize: p(18) }]}>
                Repair Summary
              </Text>
              <Divider style={{ marginVertical: p(10) }} />
            
            {/* First Row Container - Primary Stats */}
            <View style={[styles.summaryRowContainer, { backgroundColor: '#fff5f5', borderColor: '#ed2c2a' }]}>
              <Text style={[styles.rowTitle, { color: '#ed2c2a', fontSize: p(14), borderBottomColor: 'rgba(237, 44, 42, 0.3)' }]}>
                Overview & Status
              </Text>
              <View style={[styles.summaryRow, isPortrait && styles.summaryRowPortrait]}>
              <View style={[
                styles.summaryCard, 
                styles.primaryCard, 
                { 
                  borderColor: '#ed2c2a', 
                  backgroundColor: '#fff5f5',
                  width: isPortrait ? '48%' : '23%',
                }
              ]}>
                <View style={styles.iconContainer}>
                  <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>👥</Text>
                </View>
                <Text style={[styles.summaryValue, { color: '#ed2c2a', fontSize: p(22) }]}>
                  {analytics.total_firefighters_serviced || 0}
                </Text>
                <Text style={[styles.summaryLabel, { color: '#991b1b', fontSize: p(11) }]}>
                  Total Firefighters
                </Text>
              </View>

              <View style={[
                styles.summaryCard, 
                styles.primaryCard, 
                { 
                  borderColor: '#ed2c2a', 
                  backgroundColor: '#fff5f5',
                  width: isPortrait ? '48%' : '23%',
                }
              ]}>
                <View style={styles.iconContainer}>
                  <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>🧰</Text>
                </View>
                <Text style={[styles.summaryValue, { color: '#ed2c2a', fontSize: p(22) }]}>
                  {analytics.total_gears || 0}
                </Text>
                <Text style={[styles.summaryLabel, { color: '#991b1b', fontSize: p(11) }]}>
                  Total Gears
                </Text>
              </View>

              <View style={[
                styles.summaryCard, 
                styles.statusCard, 
                { 
                  borderColor: '#10b981', 
                  backgroundColor: '#d1fae5',
                  width: isPortrait ? '48%' : '23%',
                }
              ]}>
                <View style={styles.iconContainer}>
                  <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>✓</Text>
                </View>
                <Text style={[styles.summaryValue, { color: '#059669', fontSize: p(22) }]}>
                  {analytics.total_completed || 0}
                </Text>
                <Text style={[styles.summaryLabel, { color: '#065f46', fontSize: p(11) }]}>
                  Completed
                </Text>
              </View>

              <View style={[
                styles.summaryCard, 
                styles.statusCard, 
                { 
                  borderColor: '#ef4444', 
                  backgroundColor: '#fee2e2',
                  width: isPortrait ? '48%' : '23%',
                }
              ]}>
                <View style={styles.iconContainer}>
                  <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>⚠</Text>
                </View>
                <Text style={[styles.summaryValue, { color: '#dc2626', fontSize: p(22) }]}>
                  {analytics.total_incompetent || 0}
                </Text>
                <Text style={[styles.summaryLabel, { color: '#991b1b', fontSize: p(11) }]}>
                  Incomplete
                </Text>
              </View>
            </View>
            </View>

            {/* Second Row Container - Gear Types */}
            <View style={[styles.summaryRowContainer, { backgroundColor: '#ffffff', borderColor: '#ed2c2a', marginTop: p(16) }]}>
              <Text style={[styles.rowTitle, { color: '#ed2c2a', fontSize: p(14), borderBottomColor: 'rgba(237, 44, 42, 0.3)' }]}>
                Gear Type Breakdown
              </Text>
              <View style={[styles.summaryRow, isPortrait && styles.summaryRowPortrait]}>
              <View style={[
                styles.summaryCard, 
                styles.gearCard, 
                { 
                  borderColor: '#ed2c2a', 
                  backgroundColor: '#ffffff',
                  width: isPortrait ? '48%' : '15%',
                }
              ]}>
                <Image source={{ uri: GEAR_IMAGE_URLS.jacket }} style={styles.gearImage} resizeMode="contain" />
                <Text style={[styles.summaryValue, { color: '#ed2c2a', fontSize: p(22) }]}>
                  {(analytics.jacket_shell || 0) + (analytics.jacket_liner || 0)}
                </Text>
                <Text style={[styles.summaryLabel, { color: '#991b1b', fontSize: p(11) }]}>
                  Jackets
                </Text>
              </View>

              <View style={[
                styles.summaryCard, 
                styles.gearCard, 
                { 
                  borderColor: '#ed2c2a', 
                  backgroundColor: '#ffffff',
                  width: isPortrait ? '48%' : '15%',
                }
              ]}>
                <Image source={{ uri: GEAR_IMAGE_URLS.pants }} style={styles.gearImage} resizeMode="contain" />
                <Text style={[styles.summaryValue, { color: '#ed2c2a', fontSize: p(22) }]}>
                  {(analytics.pant_shell || 0) + (analytics.pant_liner || 0)}
                </Text>
                <Text style={[styles.summaryLabel, { color: '#991b1b', fontSize: p(11) }]}>
                  Pants
                </Text>
              </View>

              <View style={[
                styles.summaryCard, 
                styles.gearCard, 
                { 
                  borderColor: '#ed2c2a', 
                  backgroundColor: '#ffffff',
                  width: isPortrait ? '48%' : '15%',
                }
              ]}>
                <Image source={{ uri: GEAR_IMAGE_URLS.helmet }} style={styles.gearImage} resizeMode="contain" />
                <Text style={[styles.summaryValue, { color: '#ed2c2a', fontSize: p(22) }]}>
                  {analytics.total_helmet || 0}
                </Text>
                <Text style={[styles.summaryLabel, { color: '#991b1b', fontSize: p(11) }]}>
                  Helmets
                </Text>
              </View>

              <View style={[
                styles.summaryCard, 
                styles.gearCard, 
                { 
                  borderColor: '#ed2c2a', 
                  backgroundColor: '#ffffff',
                  width: isPortrait ? '48%' : '15%',
                }
              ]}>
                <Image source={{ uri: GEAR_IMAGE_URLS.gloves }} style={styles.gearImage} resizeMode="contain" />
                <Text style={[styles.summaryValue, { color: '#ed2c2a', fontSize: p(22) }]}>
                  {analytics.total_gloves || 0}
                </Text>
                <Text style={[styles.summaryLabel, { color: '#991b1b', fontSize: p(11) }]}>
                  Gloves
                </Text>
              </View>

              <View style={[
                styles.summaryCard, 
                styles.gearCard, 
                { 
                  borderColor: '#ed2c2a', 
                  backgroundColor: '#ffffff',
                  width: isPortrait ? '48%' : '15%',
                }
              ]}>
                <Image source={{ uri: GEAR_IMAGE_URLS.boots }} style={styles.gearImage} resizeMode="contain" />
                <Text style={[styles.summaryValue, { color: '#ed2c2a', fontSize: p(22) }]}>
                  {analytics.total_boots || 0}
                </Text>
                <Text style={[styles.summaryLabel, { color: '#991b1b', fontSize: p(11) }]}>
                  Boots
                </Text>
              </View>

              <View style={[
                styles.summaryCard, 
                styles.gearCard, 
                { 
                  borderColor: '#ed2c2a', 
                  backgroundColor: '#ffffff',
                  width: isPortrait ? '48%' : '15%',
                }
              ]}>
                <Image source={{ uri: GEAR_IMAGE_URLS.other }} style={styles.gearImage} resizeMode="contain" />
                <Text style={[styles.summaryValue, { color: '#ed2c2a', fontSize: p(22) }]}>
                  {analytics.total_other || 0}
                </Text>
                <Text style={[styles.summaryLabel, { color: '#991b1b', fontSize: p(11) }]}>
                  Other Gear
                </Text>
              </View>
            </View>
            </View>
            </Card.Content>
          </Card>
        )}

        {/* Firefighter & Gear Repairs Section */}
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: colors.primary, fontSize: p(18) }]}>
              Firefighter & Gear Repairs
            </Text>
            <Divider style={{ marginVertical: p(10) }} />
            
            {rosters.length === 0 ? (
              <View style={styles.emptyRosterContainer}>
                <Icon source="account-group" size={p(48)} color={colors.outline} />
                <Text style={[styles.emptyRosterText, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
                  No rosters available
                </Text>
              </View>
            ) : (
              rosters.map((roster: any, rosterIndex: number) => {
                const gears = roster.gears || [];
                
                return (
                  <View key={rosterIndex} style={styles.rosterSection}>
                    <View style={[styles.rosterHeaderWrapper]}>
                      <View style={[styles.rosterHeader, { backgroundColor: '#fee2e2', borderLeftColor: '#ed2c2a' }]}>
                        <View style={styles.rosterHeaderContent}>
                          <Text style={[styles.rosterNameLabel, { color: '#991b1b', fontSize: p(11) }]}>
                            FIREFIGHTER NAME:
                          </Text>
                          <Text style={[styles.rosterName, { color: "#222222", fontSize: p(15), fontWeight: '700' }]}>
                            {roster.name || 'N/A'}
                          </Text>
                        </View>
                        {roster.operation_type && (
                          <View style={[styles.operationBadge, { backgroundColor: '#fee2e2' }]}>
                            <Text style={[styles.operationBadgeText, { color: '#991b1b', fontSize: p(10) }]}>
                              {roster.operation_type.toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    
                    {gears.length === 0 ? (
                      <View style={styles.emptyGearsContainer}>
                        <Text style={[styles.emptyGearsText, { color: colors.onSurfaceVariant, fontSize: p(13) }]}>
                          No gears assigned to this roster member
                        </Text>
                      </View>
                    ) : (
                      // Card-based layout for repairs
                      <View style={styles.gearsCardContainer}>
                        {gears.map((gear: any, gearIndex: number) => {
                          const repair = gear.repair || {};
                          const repairFindings = repair.repair_findings || [];
                          
                          // Calculate total cost
                          const totalCost = repairFindings.reduce((sum: number, finding: any) => {
                            return sum + (parseFloat(finding.repair_subtotal_cost) || 0);
                          }, 0);
                          
                          return (
                            <Card key={gearIndex} style={[styles.gearRepairCard, { backgroundColor: colors.surface, marginTop: gearIndex === 0 ? p(0) : p(12) }]}>
                              <Card.Content>
                                {/* Gear Header */}
                                <View style={styles.gearCardHeader}>
                                  <View style={styles.gearInfo}>
                                    <Text style={[styles.gearCardName, { color: colors.onSurface, fontSize: p(16) }]}>
                                      {gear.gear_name || gear.name || 'N/A'}
                                    </Text>
                                    <Text style={[styles.gearCardSerial, { color: colors.onSurfaceVariant, fontSize: p(12) }]}>
                                      Serial #: {gear.serial_number || 'N/A'}
                                    </Text>
                                  </View>
                                  <Chip 
                                    style={{
                                      backgroundColor: repair.repair_status === 'complete' ? '#d1fae5' : '#fee2e2',
                                    }}
                                    textStyle={{
                                      color: repair.repair_status === 'complete' ? '#059669' : '#dc2626',
                                      fontSize: p(11),
                                      fontWeight: '700',
                                    }}
                                  >
                                    {repair.repair_status || 'N/A'}
                                  </Chip>
                                </View>
                                
                                {/* Repair Findings */}
                                <View style={styles.repairFindingsSection}>
                                  <Text style={[styles.findingsTitle, { color: colors.primary, fontSize: p(14) }]}>
                                    Repair Findings
                                  </Text>
                                  
                                  {repairFindings.length > 0 ? (
                                    repairFindings.map((finding: any, findingIndex: number) => {
                                      const master = finding.repair_finding_master || {};
                                      const findingImages = finding.images || [];
                                      const displayImages = findingImages.filter((img: string) => img && !img.startsWith('file://'));
                                      
                                      return (
                                        <View key={findingIndex} style={[styles.repairFindingItem, { backgroundColor: '#f8fafc' }]}>
                                          <View style={styles.findingHeader}>
                                            <View style={styles.findingNameGroup}>
                                              <Text style={[styles.findingName, { color: colors.onSurface, fontSize: p(13) }]}>
                                                {master.repair_finding_name || 'N/A'}
                                              </Text>
                                              {/* {master.repair_group && (
                                                <Chip 
                                                  style={[styles.findingGroupChip, { backgroundColor: colors.surface }]}
                                                  textStyle={{ fontSize: p(9), color: colors.onSurfaceVariant }}
                                                >
                                                  {master.repair_group}
                                                </Chip>
                                              )} */}
                                            </View>
                                            <View style={styles.findingCostInfo}>
                                              <Text style={[styles.findingQuantity, { color: colors.onSurfaceVariant, fontSize: p(11) }]}>
                                                Qty: {finding.repair_quantity || 0}
                                              </Text>
                                              <Text style={[styles.findingCost, { color: colors.primary, fontSize: p(13), fontWeight: '700' }]}>
                                                ${(finding.repair_subtotal_cost || 0).toFixed(2)}
                                              </Text>
                                            </View>
                                          </View>
                                          
                                          {/* Images for this finding */}
                                          {displayImages.length > 0 ? (
                                            <ScrollView 
                                              horizontal 
                                              showsHorizontalScrollIndicator={false}
                                              style={styles.findingImagesContainer}
                                            >
                                              <View style={styles.findingImagesRow}>
                                                {displayImages.map((img: string, imgIndex: number) => (
                                                  <TouchableOpacity
                                                    key={imgIndex}
                                                    onPress={() => {
                                                      setSelectedImage(img);
                                                      setImagePreviewVisible(true);
                                                    }}
                                                  >
                                                    <Image
                                                      source={{ uri: img }}
                                                      style={styles.findingImageThumbnail}
                                                      resizeMode="cover"
                                                    />
                                                  </TouchableOpacity>
                                                ))}
                                              </View>
                                            </ScrollView>
                                          ) : (
                                            <Text style={[styles.noImagesText, { color: colors.onSurfaceVariant, fontSize: p(11) }]}>
                                              No images for this finding
                                            </Text>
                                          )}
                                        </View>
                                      );
                                    })
                                  ) : (
                                    <Text style={[styles.noFindingsText, { color: colors.onSurfaceVariant, fontSize: p(12) }]}>
                                      No repair findings recorded
                                    </Text>
                                  )}
                                </View>
                                
                                {/* Gear Footer */}
                                <View style={styles.gearCardFooter}>
                                  <View style={[styles.gearTotalCost, { backgroundColor: '#fff5f5' }]}>
                                    <Text style={[styles.totalLabel, { color: '#991b1b', fontSize: p(12) }]}>
                                      Repair Subtotal (USD):
                                    </Text>
                                    <Text style={[styles.totalValue, { color: '#ed2c2a', fontSize: p(18) }]}>
                                      ${totalCost.toFixed(2)}
                                    </Text>
                                  </View>
                                  <View style={[styles.gearTotalCost, { backgroundColor: '#f8fafc', marginTop: p(8) }]}>
                                    <Text style={[styles.totalLabel, { color: '#64748b', fontSize: p(12) }]}>
                                      Spare Gear:
                                    </Text>
                                    <Text style={[styles.totalValue, { color: repair.spare_gear ? '#059669' : '#64748b', fontSize: p(14) }]}>
                                      {repair.spare_gear ? 'Yes' : 'No'}
                                    </Text>
                                  </View>
                                  {repair.remarks && (
                                    <View style={[styles.gearRemarks, { backgroundColor: colors.surfaceVariant }]}>
                                      <Text style={[styles.remarksLabel, { color: colors.onSurfaceVariant, fontSize: p(10) }]}>
                                        Remarks:
                                      </Text>
                                      <Text style={[styles.remarksText, { color: colors.onSurface, fontSize: p(12) }]}>
                                        {repair.remarks}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              </Card.Content>
                            </Card>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </Card.Content>
        </Card>

        {/* Footer Spacing */}
        <View style={{ height: p(100) }} />
      </ScrollView>

      {/* Image Preview Modal */}
      <Modal
        visible={imagePreviewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImagePreviewVisible(false)}
      >
        <View style={styles.imagePreviewModal}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setImagePreviewVisible(false)}
          >
            <Icon source="close" size={p(24)} color={colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.imagePreview}
              resizeMode="contain"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: p(24),
  },
  scrollView: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: p(200),
    height: p(60),
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
  franchiseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: p(8),
    flex: 1,
    justifyContent: 'flex-end',
  },
  franchiseImage: {
    width: p(40),
    height: p(40),
    borderRadius: p(4),
  },
  summaryRowContainer: {
    padding: p(16),
    borderRadius: p(12),
    borderWidth: 2.5,
    marginBottom: p(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  rowTitle: {
    fontSize: p(15),
    fontWeight: '700',
    marginBottom: p(14),
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingBottom: p(8),
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(237, 44, 42, 0.3)',
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: p(10),
    justifyContent: 'flex-start',
  },
  summaryRowPortrait: {
    justifyContent: 'space-between',
  },
  summaryCard: {
    padding: p(14),
    borderRadius: p(10),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: p(8),
  },
  primaryCard: {
    minHeight: p(110),
  },
  statusCard: {
    minHeight: p(110),
  },
  gearCard: {
    minHeight: p(110),
  },
  gearImage: {
    width: p(50),
    height: p(50),
    borderRadius: p(25),
    marginBottom: p(8),
    overflow: 'hidden',
  },
  summaryIcon: {
    marginBottom: p(4),
  },
  iconContainer: {
    width: p(50),
    height: p(50),
    borderRadius: p(25),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: p(8),
  },
  summaryValue: {
    fontSize: p(22),
    fontWeight: '700',
    marginTop: p(6),
    marginBottom: p(4),
  },
  summaryLabel: {
    fontSize: p(11),
    textAlign: 'center',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rosterSection: {
    marginBottom: p(24),
    backgroundColor: '#ffffff',
    borderRadius: p(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  rosterHeaderWrapper: {
    marginBottom: p(0),
  },
  rosterHeader: {
    padding: p(12),
    borderLeftWidth: 4,
    marginBottom: p(0),
    borderRadius: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rosterHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: p(8),
    flex: 1,
  },
  rosterNameLabel: {
    fontSize: p(11),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rosterName: {
    fontSize: p(15),
    fontWeight: '700',
  },
  operationBadge: {
    paddingHorizontal: p(8),
    paddingVertical: p(4),
    borderRadius: p(4),
  },
  operationBadgeText: {
    fontSize: p(10),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  emptyRosterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: p(40),
  },
  emptyRosterText: {
    marginTop: p(12),
    textAlign: 'center',
  },
  emptyGearsContainer: {
    padding: p(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: p(6),
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#fca5a5',
  },
  emptyGearsText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Card-based repair layout styles
  gearsCardContainer: {
    paddingHorizontal: p(12),
    paddingBottom: p(12),
    paddingTop: p(8),
  },
  gearRepairCard: {
    marginBottom: p(0),
    borderRadius: p(8),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  gearCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: p(16),
    paddingBottom: p(12),
    borderBottomWidth: 2,
    borderBottomColor: '#f1f5f9',
  },
  gearInfo: {
    flex: 1,
    marginRight: p(12),
  },
  gearCardName: {
    fontSize: p(16),
    fontWeight: '700',
    marginBottom: p(6),
  },
  gearCardSerial: {
    fontSize: p(12),
    fontWeight: '500',
  },
  repairFindingsSection: {
    marginVertical: p(16),
  },
  findingsTitle: {
    fontSize: p(14),
    fontWeight: '700',
    marginBottom: p(12),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  repairFindingItem: {
    borderRadius: p(8),
    padding: p(12),
    marginBottom: p(12),
    borderLeftWidth: 4,
    borderLeftColor: '#ed2c2a',
    backgroundColor: '#fafbfc',
  },
  findingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: p(10),
    flexWrap: 'wrap',
    gap: p(8),
  },
  findingNameGroup: {
    flex: 1,
    minWidth: p(200),
  },
  findingName: {
    fontSize: p(13),
    fontWeight: '600',
    marginBottom: p(4),
  },
  findingGroupChip: {
    height: p(20),
    marginTop: p(4),
  },
  findingCostInfo: {
    flexDirection: 'row',
    gap: p(12),
    alignItems: 'center',
  },
  findingQuantity: {
    fontSize: p(11),
    fontWeight: '500',
  },
  findingCost: {
    fontSize: p(13),
    fontWeight: '700',
  },
  findingImagesContainer: {
    marginTop: p(10),
    paddingTop: p(10),
    borderTopWidth: 1,
    borderTopColor: '#cbd5e0',
    borderStyle: 'dashed',
  },
  findingImagesRow: {
    flexDirection: 'row',
    gap: p(8),
  },
  findingImageThumbnail: {
    width: p(100),
    height: p(100),
    borderRadius: p(6),
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  noFindingsText: {
    textAlign: 'center',
    padding: p(20),
    fontStyle: 'italic',
    fontSize: p(12),
  },
  gearCardFooter: {
    marginTop: p(16),
    paddingTop: p(12),
    borderTopWidth: 2,
    borderTopColor: '#f1f5f9',
  },
  gearTotalCost: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: p(10),
    borderRadius: p(6),
    marginBottom: p(8),
  },
  totalLabel: {
    fontSize: p(12),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: p(18),
    fontWeight: '700',
  },
  gearSpareGear: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: p(10),
    borderRadius: p(6),
    marginBottom: p(8),
  },
  spareGearLabel: {
    fontSize: p(12),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  spareGearValue: {
    fontSize: p(14),
    fontWeight: '600',
  },
  gearRemarks: {
    padding: p(10),
    borderRadius: p(6),
    borderLeftWidth: 3,
    borderLeftColor: '#cbd5e0',
  },
  remarksLabel: {
    fontSize: p(10),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: p(4),
  },
  remarksText: {
    fontSize: p(12),
    lineHeight: p(18),
  },
  warningTitle: {
    fontWeight: '700',
    marginBottom: p(4),
  },
  warningText: {
    lineHeight: p(20),
  },
  imagePreviewModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewContainer: {
    width: '90%',
    height: '90%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  noImagesText: {
    fontSize: p(11),
    fontStyle: 'italic',
  },
  closeButton: {
    position: 'absolute',
    top: p(40),
    right: p(20),
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: p(20),
    padding: p(8),
  },
});

export default PPERepairReportPreviewScreen;
