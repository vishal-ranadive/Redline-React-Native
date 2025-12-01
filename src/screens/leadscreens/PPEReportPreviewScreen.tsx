// src/screens/leadscreens/PPEReportPreviewScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Image,
} from 'react-native';
import {
  Text,
  Button,
  Icon,
  useTheme,
  Card,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { p } from '../../utils/responsive';
import { leadApi } from '../../services/leadApi';
import { generateReportHTML, generatePDF, downloadPDF, sharePDFOnIOS } from '../../utils/pdfGenerator';
import { checkStoragePermission, requestStoragePermission } from '../../utils/permissions';
import { Alert, Platform } from 'react-native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PPEReportPreview'>;

const PPEReportPreviewScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isPortrait = width < 600; // Consider portrait if width < 600
  
  const { leadId, leadData } = route.params as any;
  
  const [ppeData, setPpeData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Call first API: PPE Inspection
      console.log('Calling PPE Inspection API...');
      const ppeInspectionData = await leadApi.getPpeInspection(leadId);
      setPpeData(ppeInspectionData);
      
      // Call second API: Inspection Analytics
      console.log('Calling Inspection Analytics API...');
      const analyticsResult = await leadApi.getInspectionAnalytics(leadId);
      setAnalyticsData(analyticsResult);
      
    } catch (error) {
      console.error('Error fetching report data:', error);
      Alert.alert('Error', 'Failed to fetch report data. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!ppeData || !analyticsData) {
      Alert.alert('Error', 'Report data is not available. Please try again.');
      return;
    }

    try {
      // iOS doesn't require storage permission - skip all checks
      if (Platform.OS === 'ios') {
        // iOS: No permission check needed, proceed directly
      } else {
        // Android: Check and request permission if needed
        try {
          const isGranted = await checkStoragePermission();
          
          // If permission is not granted, request it silently
          if (!isGranted) {
            const granted = await requestStoragePermission(false);
            if (!granted) {
              // Permission was denied - only show alert on Android
              Alert.alert(
                'Permission Required',
                'Storage permission is needed to save PDF reports. Please grant storage permission in app settings.',
                [{ text: 'OK' }]
              );
              return;
            }
          }
        } catch (permissionError) {
          console.error('Error checking storage permission:', permissionError);
          // Don't block download if permission check fails - let it try anyway
        }
      }

      setIsGeneratingPDF(true);
      
      // Generate HTML from template and data
      console.log('Generating HTML report...');
      const htmlContent = generateReportHTML(ppeData, analyticsData, leadData);
      
      // Generate PDF from HTML
      console.log('Generating PDF...');
      const fileName = `PPE_Inspection_Report_${leadId}_${Date.now()}`;
      const pdfPath = await generatePDF(htmlContent, fileName);
      
      // Download PDF (saves to appropriate location based on platform)
      console.log('Downloading PDF...');
      const downloadFileName = `PPE_Inspection_Report_${leadId}_${Date.now()}.pdf`;
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
          `PDF downloaded successfully!\n\nSaved to: Downloads/${downloadFileName}`,
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

  if (!ppeData || !analyticsData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Icon source="alert-circle" size={p(48)} color={colors.error} />
          <Text style={{ marginTop: 16, color: colors.error, fontSize: p(16) }}>
            No report data available
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

  const firestation = ppeData?.firestation || {};
  const analytics = analyticsData || {};

  // Parse address
  const address = firestation?.location || '';
  const addressParts = address.split(',').map((part: string) => part.trim());

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
          PPE Inspection Report
        </Text>
        <Button
          mode="text"
          compact
          onPress={handleDownloadPDF}
          disabled={isGeneratingPDF}
          contentStyle={{ flexDirection: 'row' }}
        >
          {isGeneratingPDF ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Icon source="download" size={p(20)} color={colors.primary} />
              <Text style={{ color: colors.primary, marginLeft: p(4), fontSize: p(14) }}>
                Download PDF
              </Text>
            </>
          )}
        </Button>
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
                { label: 'MEU', value: leadData?.lead?.meu || (ppeData?.meu?.name || 'N/A') },
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
                  width: isPortrait ? '30%' : '13.5%',
                  maxWidth: isPortrait ? '48%' : p(120),
                }
              ]}>
                <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>👥</Text>
                <Text style={[styles.summaryValue, { color: '#ed2c2a', fontSize: p(22) }]}>
                  {analytics['Total_fireFighters_Serviced'] || analytics['Total fireFighters Serviced'] || analytics.total_firefighters_serviced || 0}
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
                  width: isPortrait ? '30%' : '13.5%',
                  maxWidth: isPortrait ? '48%' : p(120),
                }
              ]}>
                <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>🧰</Text>
                <Text style={[styles.summaryValue, { color: '#ed2c2a', fontSize: p(22) }]}>
                  {analytics['Total_Number_of_Gears'] || analytics['Total Number of Gears'] || analytics.total_gears || 0}
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
                  width: isPortrait ? '30%' : '13.5%',
                  maxWidth: isPortrait ? '48%' : p(120),
                }
              ]}>
                <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>✓</Text>
                <Text style={[styles.summaryValue, { color: '#059669', fontSize: p(22) }]}>
                  {analytics['Total_Gear_Passed'] || analytics['Total Gear Passed'] || analytics.total_passed || 0}
                </Text>
                <Text style={[styles.summaryLabel, { color: '#065f46', fontSize: p(11) }]}>
                  Passed
                </Text>
              </View>

              <View style={[
                styles.summaryCard, 
                styles.statusCard, 
                { 
                  borderColor: '#ef4444', 
                  backgroundColor: '#fee2e2',
                  width: isPortrait ? '30%' : '13.5%',
                  maxWidth: isPortrait ? '48%' : p(120),
                }
              ]}>
                <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>✗</Text>
                <Text style={[styles.summaryValue, { color: '#dc2626', fontSize: p(22) }]}>
                  {analytics['Total_Gear_Fail'] || analytics['Total Gear Fail'] || analytics.total_failed || 0}
                </Text>
                <Text style={[styles.summaryLabel, { color: '#991b1b', fontSize: p(11) }]}>
                  Failed
                </Text>
              </View>

              <View style={[
                styles.summaryCard, 
                styles.statusCard, 
                { 
                  borderColor: '#6b7280', 
                  backgroundColor: '#f3f4f6',
                  width: isPortrait ? '30%' : '13.5%',
                  maxWidth: isPortrait ? '48%' : p(120),
                }
              ]}>
                <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>⊗</Text>
                <Text style={[styles.summaryValue, { color: '#4b5563', fontSize: p(22) }]}>
                  {analytics['Total_Gear_OOS'] || analytics['Total Gear OOS'] || analytics.total_oos || 0}
                </Text>
                <Text style={[styles.summaryLabel, { color: '#374151', fontSize: p(11) }]}>
                  Out of Service
                </Text>
              </View>

              <View style={[
                styles.summaryCard, 
                styles.statusCard, 
                { 
                  borderColor: '#f97316', 
                  backgroundColor: '#fed7aa',
                  width: isPortrait ? '30%' : '13.5%',
                  maxWidth: isPortrait ? '48%' : p(120),
                }
              ]}>
                <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>⏰</Text>
                <Text style={[styles.summaryValue, { color: '#ea580c', fontSize: p(22) }]}>
                  {analytics['Total_Gear_Expired'] || analytics['Total Gear Expired'] || analytics.total_expired || 0}
                </Text>
                <Text style={[styles.summaryLabel, { color: '#c2410c', fontSize: p(11) }]}>
                  Expired
                </Text>
              </View>

              <View style={[
                styles.summaryCard, 
                styles.statusCard, 
                { 
                  borderColor: '#eab308', 
                  backgroundColor: '#fef3c7',
                  width: isPortrait ? '30%' : '13.5%',
                  maxWidth: isPortrait ? '48%' : p(120),
                }
              ]}>
                <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>⚠</Text>
                <Text style={[styles.summaryValue, { color: '#ca8a04', fontSize: p(22) }]}>
                  {analytics['Total_Gear_ActionRequired'] || analytics['Total Gear ActionRequired'] || analytics.total_action_required || 0}
                </Text>
                <Text style={[styles.summaryLabel, { color: '#854d0e', fontSize: p(11) }]}>
                  Action Required
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
                  width: isPortrait ? '30%' : '13.5%',
                  maxWidth: isPortrait ? '48%' : p(120),
                }
              ]}>
                <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>🧥</Text>
                <Text style={[styles.summaryValue, { color: '#ed2c2a', fontSize: p(22) }]}>
                  {(analytics.jacket_shell || 0) + (analytics.jacket_liner || 0) || analytics['Total jackets'] || analytics.total_jackets || 0}
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
                  width: isPortrait ? '30%' : '13.5%',
                  maxWidth: isPortrait ? '48%' : p(120),
                }
              ]}>
                <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>👖</Text>
                <Text style={[styles.summaryValue, { color: '#ed2c2a', fontSize: p(22) }]}>
                  {(analytics.pant_shell || 0) + (analytics.pant_liner || 0) || analytics['Total pants'] || analytics.total_pants || 0}
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
                  width: isPortrait ? '30%' : '13.5%',
                  maxWidth: isPortrait ? '48%' : p(120),
                }
              ]}>
                <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>⛑️</Text>
                <Text style={[styles.summaryValue, { color: '#ed2c2a', fontSize: p(22) }]}>
                  {analytics.total_helmet || analytics['Total helmet'] || analytics.total_helmet || 0}
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
                  width: isPortrait ? '30%' : '13.5%',
                  maxWidth: isPortrait ? '48%' : p(120),
                }
              ]}>
                <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>🧢</Text>
                <Text style={[styles.summaryValue, { color: '#ed2c2a', fontSize: p(22) }]}>
                  {analytics.total_hoods || analytics['Total hoods'] || analytics.total_hoods || 0}
                </Text>
                <Text style={[styles.summaryLabel, { color: '#991b1b', fontSize: p(11) }]}>
                  Hoods
                </Text>
              </View>

              <View style={[
                styles.summaryCard, 
                styles.gearCard, 
                { 
                  borderColor: '#ed2c2a', 
                  backgroundColor: '#ffffff',
                  width: isPortrait ? '30%' : '13.5%',
                  maxWidth: isPortrait ? '48%' : p(120),
                }
              ]}>
                <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>🧤</Text>
                <Text style={[styles.summaryValue, { color: '#ed2c2a', fontSize: p(22) }]}>
                  {analytics.total_gloves || analytics['Total gloves'] || analytics.total_gloves || 0}
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
                  width: isPortrait ? '30%' : '13.5%',
                  maxWidth: isPortrait ? '48%' : p(120),
                }
              ]}>
                <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>👢</Text>
                <Text style={[styles.summaryValue, { color: '#ed2c2a', fontSize: p(22) }]}>
                  {analytics.total_boots || analytics['Total boots'] || analytics.total_boots || 0}
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
                  width: isPortrait ? '30%' : '13.5%',
                  maxWidth: isPortrait ? '48%' : p(120),
                }
              ]}>
                <Text style={[styles.summaryIcon, { fontSize: p(32) }]}>📦</Text>
                <Text style={[styles.summaryValue, { color: '#ed2c2a', fontSize: p(22) }]}>
                  {analytics.total_other || analytics['Total other'] || analytics.total_other || 0}
                </Text>
                <Text style={[styles.summaryLabel, { color: '#991b1b', fontSize: p(11) }]}>
                  Other Gear
                </Text>
              </View>
            </View>
            </View>
          </Card.Content>
        </Card>

        {/* Footer Spacing */}
        <View style={{ height: p(100) }} />
      </ScrollView>
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
    justifyContent: 'center',
  },
  summaryCard: {
    minWidth: p(95),
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
  summaryIcon: {
    marginBottom: p(4),
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
});

export default PPEReportPreviewScreen;

