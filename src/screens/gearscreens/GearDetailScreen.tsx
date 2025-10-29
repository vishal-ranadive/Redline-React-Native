// src/screens/gearscreens/GearDetailScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Linking, Alert } from 'react-native';
import { 
  Text, 
  Button, 
  Card, 
  Divider, 
  Icon, 
  useTheme,
  Menu,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import RosterModal from '../../components/common/RosterModal';

interface Roster {
  roster_id: number;
  firestation: {
    firestation_id: number;
    fire_station_name: string;
  };
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  phone: string;
  active_status: boolean;
  roster_name: string;
}

const GearDetailScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [rosterModalVisible, setRosterModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [assignedRoster, setAssignedRoster] = useState<Roster | null>(null);

  // Mock data
  const manufacturer = {
    name: 'MSA Safety',
    country: 'USA',
    website: 'https://www.msasafety.com',
  };

  const gear = {
    id: 'GEAR-001',
    type: 'Jacket',
    name: 'Jacket Bunker Coat',
    serial: 'JCKT-4567, HLMNT-4666',
    model: 'Bunker Coat Pro',
    year: 2023,
    status: 'In Service',
    notes: 'Tear near right elbow, reflective tape needs cleaning.',
    lastInspection: '2024-05-10',
    nextInspection: '2024-08-10',
  };

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

  const handleRosterSelect = (roster: Roster) => {
    setAssignedRoster(roster);
    Alert.alert('Success', `Roster assigned to ${roster.roster_name}`);
  };

  const handleAddRosterManual = () => {
    // Navigate to Add Roster screen or show form
    Alert.alert('Add Roster', 'Navigate to add roster form');
  };

  const handleUpdateRoster = () => {
    setRosterModalVisible(true);
    setMenuVisible(false);
  };

  const handleRemoveRoster = () => {
    setAssignedRoster(null);
    setMenuVisible(false);
    Alert.alert('Success', 'Roster removed from gear');
  };

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
          Serial: {gear.serial} | Model: {gear.model} | Year: {gear.year}
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
                    Assigned Roster
                  </Text>
                  <Menu
                    visible={menuVisible}
                    onDismiss={() => setMenuVisible(false)}
                    anchor={
                      <Button 
                        mode="text" 
                        onPress={() => setMenuVisible(true)}
                        compact
                      >
                        <Icon source="dots-vertical" size={p(20)} color={colors.onSurface} />
                      </Button>
                    }
                  >
                    <Menu.Item 
                      onPress={handleUpdateRoster} 
                      title="Update Roster" 
                      leadingIcon="account-edit"
                    />
                    {assignedRoster && (
                      <Menu.Item 
                        onPress={handleRemoveRoster} 
                        title="Remove Roster" 
                        leadingIcon="account-remove"
                      />
                    )}
                  </Menu>
                </View>
                <Divider style={{ marginBottom: p(12) }} />

                {assignedRoster ? (
                  <View style={styles.rosterContainer}>
                    <View style={styles.rosterAvatar}>
                      <Icon source="account" size={p(40)} color={colors.primary} />
                    </View>
                    <View style={styles.rosterDetails}>
                      <Text style={[styles.rosterName, { color: colors.onSurface, fontSize: p(18) }]}>
                        {assignedRoster.roster_name}
                      </Text>
                      <Text style={[styles.rosterInfo, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
                        {assignedRoster.firestation.fire_station_name}
                      </Text>
                      <Text style={[styles.rosterInfo, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
                        {assignedRoster.email}
                      </Text>
                      <Text style={[styles.rosterInfo, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
                        {assignedRoster.phone}
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
                      labelStyle={{ fontSize: p(14), fontWeight: '600' }}
                    >
                      Assign Roster
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
                    {manufacturer.name}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon source="map-marker" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    {manufacturer.country}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon source="web" size={p(18)} color={colors.primary} />
                  <Text
                    style={[styles.infoText, { color: colors.primary, fontSize: p(16) }]}
                    onPress={() => Linking.openURL(manufacturer.website)}
                  >
                    Visit Website
                  </Text>
                </View>
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
                    {gear.type}
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Icon source="certificate" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    {gear.name}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon source="barcode" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    {gear.serial}
                  </Text>
                  <Icon source="camera" size={p(16)} color={colors.primary} />
                </View>

                {/* Gear Images */}
                <View style={styles.imagesContainer}>
                  <Text style={[styles.imagesTitle, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
                    Gear Images:
                  </Text>
                  <View style={styles.imagesRow}>
                    {[require('../../assets/jacket1.png'),
                      require('../../assets/jacket2.png'),
                      require('../../assets/jacket3.png')].map((img, idx) => (
                      <Image key={idx} source={img} style={styles.thumbSmall} />
                    ))}
                    <Button mode="outlined" compact icon="plus" style={styles.addImageBtn}>
                      Add
                    </Button>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Icon source="calendar-check" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    Last Inspection: {gear.lastInspection}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon source="calendar-alert" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    Next Inspection: {gear.nextInspection}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Icon source="clipboard-text" size={p(18)} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.onSurface, fontSize: p(16) }]}>
                    Notes: {gear.notes}
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
          onPress={() => {/* Start inspection logic */}}
          buttonColor={colors.primary}
          textColor={colors.surface}
          style={styles.ctaButton}
          icon="clipboard-check"
          labelStyle={{ fontWeight: '700', fontSize: p(16) }}
          contentStyle={{ paddingVertical: p(8) }}
        >
          START INSPECTION
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
  imagesContainer: {
    marginTop: p(8),
    marginBottom: p(12),
  },
  imagesTitle: {
    marginBottom: p(8),
    fontWeight: '600',
  },
  imagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: p(8),
  },
  thumbSmall: {
    width: p(60),
    height: p(60),
    borderRadius: p(8),
  },
  addImageBtn: {
    height: p(60),
    width: p(60),
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
});

export default GearDetailScreen;