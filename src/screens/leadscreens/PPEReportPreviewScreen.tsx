// src/screens/leadscreens/PPEReportPreviewScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
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
import { generateReportHTML, generatePDF, downloadPDF } from '../../utils/pdfGenerator';
import { Alert } from 'react-native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PPEReportPreview'>;

const PPEReportPreviewScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { colors } = useTheme();
  
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
      setIsGeneratingPDF(true);
      
      // Generate HTML from template and data
      console.log('Generating HTML report...');
      const htmlContent = generateReportHTML(ppeData, analyticsData, leadData);
      
      // Generate PDF from HTML
      console.log('Generating PDF...');
      const fileName = `PPE_Inspection_Report_${leadId}_${Date.now()}`;
      const pdfPath = await generatePDF(htmlContent, fileName);
      
      // Download PDF
      console.log('Downloading PDF...');
      const downloadFileName = `PPE_Inspection_Report_${leadId}_${Date.now()}.pdf`;
      const downloadedPath = await downloadPDF(pdfPath, downloadFileName);
      
      Alert.alert(
        'Success',
        'PDF downloaded successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error generating/downloading PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
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
});

export default PPEReportPreviewScreen;

