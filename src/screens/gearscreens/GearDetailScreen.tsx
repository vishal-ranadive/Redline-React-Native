// src/screens/gearscreens/GearDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Linking, Alert } from 'react-native';
import { 
  Text, 
  Button, 
  Card, 
  Divider, 
  Icon, 
  useTheme,
  Menu,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import RosterModal from '../../components/common/Modal/RosterModal';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useGearStore } from '../../store/gearStore';
import { printTable } from '../../utils/printTable';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';



type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'UpadateInspection'>;


const GearDetailScreen = () => {

    const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const route = useRoute();
  const { gear_id } = route.params as any;
  
  const { currentGear, loading, fetchGearById } = useGearStore();
  
  const [rosterModalVisible, setRosterModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  console.log("gear_id-Gear-details screen", gear_id);

  // Fetch gear details when component mounts
  useEffect(() => {
    if (gear_id) {
      fetchGearById(gear_id);
    }
  }, [gear_id]);

  // Mock inspection history (keep as is)
  const inspectionHistory = [
    {
      id: 'INSP006',
      date: '2024-05-10',
      critStatus: 'Requires Repair',
      preStatus: 'Requires Attention',
      hydroStatus: 'Failed',
      cost: '$50',
      inspectStatus: 'Cracked visor',
      lead: 'John Smith',
    },
    {
      id: 'INSP005',
      date: '2024-02-12',
      critStatus: 'Pass',
      preStatus: 'Good',
      hydroStatus: 'Pass',
      cost: '$0',
      inspectStatus: 'OK',
      lead: 'John Smith',
    },
  ];

  const getStatusColor = (status: string) => {
    if (status.toLowerCase().includes('fail') || status.toLowerCase().includes('repair')) return '#EA4335';
    if (status.toLowerCase().includes('pass') || status.toLowerCase().includes('good')) return '#34A853';
    if (status.toLowerCase().includes('attention') || status.toLowerCase().includes('requires')) return '#FB8C00';
    return colors.onSurfaceVariant;
  };

  const handleRosterSelect = (roster: any) => {
    console.log("rosterhandleRosterSelect", roster);
    Alert.alert('Success', `Roster assigned to ${roster.roster_name}`);
  };

  const handleAddRosterManual = () => {
    Alert.alert('Add Roster', 'Navigate to add roster form');
  };

  const handleUpdateRoster = () => {
    setRosterModalVisible(true);
    setMenuVisible(false);
  };

  const handleRemoveRoster = () => {
    setMenuVisible(false);
    Alert.alert('Success', 'Roster removed from gear');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // dd/mm/yyyy format
  };
  printTable("currentGear",currentGear)

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.onSurface, marginTop: p(16) }}>Loading gear details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentGear) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Icon source="alert-circle" size={p(48)} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.onSurface }]}>Gear not found</Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Button 
            mode="text" 
            onPress={() => navigation.goBack()}
            compact
          >
            <Icon source="arrow-left" size={p(24)} color={colors.onSurface} />
          </Button>
          <Text style={[styles.title, { color: colors.onSurface, fontSize: p(24) }]}>
            Gear Details
          </Text>
          <View style={{ width: p(24) }} />
        </View>

        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant, fontSize: p(16) }]}>
          Serial: {currentGear.serial_number} | Type: {currentGear.gear_type.gear_type}
        </Text>

        <Divider style={{ marginVertical: p(12) }} />

        {/* Two-column layout */}
        <View style={styles.columns}>
          {/* LEFT COLUMN */}
          <View style={styles.column}>
            {/* Assigned Roster */}
            <Card style={[styles.card, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.onSurface, fontSize: p(18) }]}>
                    Assigned Fire Fighter
                  </Text>
                  {/* Disabled menu button */}
                  <Button 
                    mode="text" 
                    onPress={() => setMenuVisible(true)}
                    compact
                    disabled={true}
                  >
                    <Icon source="dots-vertical" size={p(20)} color={colors.onSurfaceVariant} />
                  </Button>
                </View>
                <Divider style={{ marginBottom: p(12) }} />

                {currentGear.roster ? (
                  <View style={styles.rosterContainer}>
                    <View style={styles.rosterAvatar}>
                      <Icon source="account" size={p(40)} color={colors.primary} />
                    </View>
                    <View style={styles.rosterDetails}>
                      <Text style={[styles.rosterName, { color: colors.onSurface, fontSize: p(18) }]}>
                        {currentGear.roster.first_name} {currentGear.roster.middle_name} {currentGear.roster.last_name}
                      </Text>
                      <Text style={[styles.rosterInfo, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
                        {currentGear.firestation.name}
                      </Text>
                      <Text style={[styles.rosterInfo, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
                        {currentGear.roster.email}
                      </Text>
                      <Text style={[styles.rosterInfo, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
                        {currentGear.roster.phone}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.noRosterContainer}>
                    <Icon source="account-question" size={p(48)} color={colors.onSurfaceVariant} />
                    <Text style={[styles.noRosterText, { color: colors.onSurfaceVariant, fontSize: p(16) }]}>
                      No roster assigned
                    </Text>
                    <Button
                      mode="contained"
                      onPress={() => setRosterModalVisible(true)}
                      buttonColor={colors.primary}
                      textColor={colors.surface}
                      style={styles.assignButton}
                      icon="account-plus"
                      labelStyle={{ fontSize: p(14), fontWeight: '600', color: "#fff" }}
                    >
                      Assign Fire Fighter
                    </Button>
                  </View>
                )}
              </Card.Content>
            </Card>

            {/* Manufacturer Info */}
            <Card style={[styles.card, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <Text style={[styles.cardTitle, { color: colors.onSurface, fontSize: p(18) }]}>
                  Manufacturer Info
                </Text>
                <Divider style={{ marginBottom: p(12) }} />
                
                <View style={styles.infoRow}>
                  <Icon source="factory" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    {currentGear.manufacturer.manufacturer_name}
                  </Text>
                </View>
                
                {currentGear.manufacturer.email && (
                  <View style={styles.infoRow}>
                    <Icon source="email" size={p(18)} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                      {currentGear.manufacturer.email}
                    </Text>
                  </View>
                )}
                
                {currentGear.manufacturer.phone && (
                  <View style={styles.infoRow}>
                    <Icon source="phone" size={p(18)} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                      {currentGear.manufacturer.phone}
                    </Text>
                  </View>
                )}
                
                {currentGear?.manufacturer?.address && (
                  <View style={styles.infoRow}>
                    <Icon source="map-marker" size={p(18)} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                      {currentGear.manufacturer.address}
                    </Text>
                  </View>
                )}
                
                {(currentGear?.manufacturer?.city || currentGear?.manufacturer?.state || currentGear.manufacturer?.country) && (
                  <View style={styles.infoRow}>
                    <Icon source="earth" size={p(18)} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                      {[currentGear?.manufacturer?.city, currentGear.manufacturer?.state, currentGear.manufacturer?.country]
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          </View>

          {/* RIGHT COLUMN */}
          <View style={styles.column}>
            <Card style={[styles.card, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <Text style={[styles.cardTitle, { color: colors.onSurface, fontSize: p(18) }]}>
                  Gear Details
                </Text>
                <Divider style={{ marginBottom: p(12) }} />
                
                <View style={styles.infoRow}>
                  <Icon source="tag" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    {currentGear.gear_type.gear_type}
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Icon source="certificate" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    {currentGear.gear_name}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon source="barcode" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    {currentGear.serial_number}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon source="calendar" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    Manufacturing Date: {formatDate(currentGear.manufacturing_date)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon source="shield-check" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    Status: {currentGear.active_status ? 'Active' : 'Inactive'}
                  </Text>
                </View>

                {/* General Remarks */}
                <View style={styles.infoRow}>
                  <Icon source="note-text" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    Remarks: Gear is in good condition, regular maintenance required.
                  </Text>
                </View>

                {/* Created/Updated Info */}
                <View style={styles.infoRow}>
                  <Icon source="calendar-plus" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    Created: {formatDate(currentGear.created_at)} by {currentGear.created_by}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon source="calendar-edit" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    Updated: {formatDate(currentGear.updated_at)} by {currentGear.updated_by}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Inspection History */}
        <Card style={[styles.fullCard, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: colors.onSurface, fontSize: p(18) }]}>
              Gear History
            </Text>
            <Divider style={{ marginVertical: p(12) }} />
            
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>ID</Text>
              <Text style={[styles.tableHeaderText, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Date</Text>
              <Text style={[styles.tableHeaderText, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Critical</Text>
              <Text style={[styles.tableHeaderText, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Visual</Text>
              <Text style={[styles.tableHeaderText, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Hydro</Text>
              <Text style={[styles.tableHeaderText, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Cost</Text>
              <Text style={[styles.tableHeaderText, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Status</Text>
              <Text style={[styles.tableHeaderText, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Lead</Text>
            </View>

            {inspectionHistory.map((item, index) => (
              <View key={index}>
                <View style={styles.tableRow}>
                  <Text 
                    style={[styles.tableCell, { color: colors.primary, fontSize: p(12) }]}
                    onPress={() => {/* Navigate to inspection details */}}
                  >
                    {item.id}
                  </Text>
                  <Text style={[styles.tableCell, { color: colors.onSurface, fontSize: p(12) }]}>
                    {item.date}
                  </Text>
                  <Text style={[styles.tableCell, { color: getStatusColor(item.critStatus), fontSize: p(12), fontWeight: '600' }]}>
                    {item.critStatus}
                  </Text>
                  <Text style={[styles.tableCell, { color: colors.onSurface, fontSize: p(12) }]}>
                    {item.preStatus}
                  </Text>
                  <Text style={[styles.tableCell, { color: getStatusColor(item.hydroStatus), fontSize: p(12), fontWeight: '600' }]}>
                    {item.hydroStatus}
                  </Text>
                  <Text style={[styles.tableCell, { color: colors.onSurface, fontSize: p(12) }]}>
                    {item.cost}
                  </Text>
                  <Text style={[styles.tableCell, { color: colors.onSurface, fontSize: p(12) }]}>
                    {item.inspectStatus}
                  </Text>
                  <Text style={[styles.tableCell, { color: colors.onSurface, fontSize: p(12) }]}>
                    {item.lead}
                  </Text>
                </View>
                {index < inspectionHistory.length - 1 && <Divider />}
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* CTA Button */}
        <Button
          mode="contained"
          onPress={() => navigation.navigate('UpadateInspection')}
          buttonColor={colors.primary}
          textColor={colors.surface}
          style={styles.ctaButton}
          icon="clipboard-check"
          labelStyle={{ fontWeight: '700', fontSize: p(16), color: "#fff" }}
          contentStyle={{ paddingVertical: p(8) }}
        >
          START GEAR INSPECTION
        </Button>
      </ScrollView>

      {/* Roster Modal */}
      <RosterModal
        visible={rosterModalVisible}
        onClose={() => setRosterModalVisible(false)}
        onRosterSelect={handleRosterSelect}
        onAddRosterManual={handleAddRosterManual}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { 
    padding: p(16),
    paddingBottom: p(32),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: p(8),
  },
  title: { 
    fontWeight: '700',
  },
  subtitle: { 
    marginBottom: p(8),
  },
  columns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: p(12),
  },
  column: { 
    flex: 1,
  },
  card: { 
    marginBottom: p(12), 
    borderRadius: p(12), 
    elevation: 2,
  },
  fullCard: {
    marginTop: p(8),
    borderRadius: p(12),
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: p(8),
  },
  cardTitle: {
    fontWeight: '700',
  },
  rosterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rosterAvatar: {
    width: p(60),
    height: p(60),
    borderRadius: p(30),
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: p(12),
  },
  rosterDetails: {
    flex: 1,
  },
  rosterName: {
    fontWeight: '600',
    marginBottom: p(4),
  },
  rosterInfo: {
    marginBottom: p(2),
  },
  noRosterContainer: {
    alignItems: 'center',
    paddingVertical: p(20),
  },
  noRosterText: {
    marginBottom: p(16),
    textAlign: 'center',
  },
  assignButton: {
    borderRadius: p(8),
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
  tableHeader: {
    flexDirection: 'row',
    marginBottom: p(8),
  },
  tableHeaderText: {
    flex: 1,
    fontWeight: '600',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: p(8),
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
  },
  ctaButton: {
    marginTop: p(20),
    borderRadius: p(12),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: p(32),
  },
  errorText: {
    fontSize: p(18),
    marginBottom: p(16),
    textAlign: 'center',
  },
});

export default GearDetailScreen;