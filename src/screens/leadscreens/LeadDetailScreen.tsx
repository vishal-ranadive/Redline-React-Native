// src/screens/leadscreens/LeadDetailScreen.tsx
import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
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
  Dialog, Portal
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GearScan'>;
type LeadStatus = 'Ongoing' | 'Completed' | 'Canceled' | 'Rescheduled' | 'Scheduled';

const LeadDetailScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { colors } = useTheme();
  const { top } = useSafeAreaInsets();
  const { lead } = route.params as any;
  const [statusDialogVisible, setStatusDialogVisible] = React.useState(false);
  const [currentStatus, setCurrentStatus] = React.useState<LeadStatus>(lead.status);

  console.log("leadleadleadlead", lead)


  const handleStatusUpdate = (newStatus: LeadStatus) => {
  setCurrentStatus(newStatus);
  setStatusDialogVisible(false);
  // Optionally: trigger API call here to persist update
  // updateLeadStatus(lead.id, newStatus)
};


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
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 🧭 Header */}
      <View
        style={[
          styles.header,
          {
            marginTop: top + p(4),
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
          style={{ marginLeft: p(-8),  }}
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
              uri:
                'https://media.gettyimages.com/id/182819377/photo/fire-truck.jpg?s=612x612&w=gi&k=20&c=K9QvVmf9qrRmfjjBmxC5yTO1ka4ilSv9ri5Imbs_o3A=',
            }}
            style={styles.bannerImage}
          />
           <View style={styles.bannerOverlayFull} />
          <View style={styles.bannerOverlay}>
            <Text style={[styles.stationName, { color: '#fff', fontSize: p(40) }]}>
              {lead.station}
            </Text>
            <Button
              mode="contained"
              buttonColor={colors.primary}
              textColor="#fff"
              style={[styles.leadTypeBtn,]}
              contentStyle={{ paddingHorizontal: p(20), paddingVertical: p(4) }}
              labelStyle={{
                fontSize: p(16),
                fontWeight: '600',
                color: colors.surface,
              }}
            >
              {lead.leadType}
            </Button>
          </View>
        </View>



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
              {/* item.leadType === 'Repair' ? 'wrench' : 'magnify */}
              {[
                { icon: 'calendar', label: 'Appointment Date', value: lead.appointmentDate },
                { icon: 'office-building', label: 'Department', value: lead.department },
                { icon: lead.leadType === 'Repair' ? 'wrench' : 'magnify', label: 'Lead Type', value: lead.leadType },
                { icon: 'check-circle', label: 'Lead Status', value: currentStatus },
                // { icon: 'account', label: 'Name', value: lead.name },
                // { icon: 'phone', label: 'Phone', value: lead.phone },
                // { icon: 'email', label: 'Email', value: lead.email },
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
              Generated By
            </Text>
            <Divider style={{ marginBottom: p(10) }} />

            <View style={styles.tableContainer}>
              {[
                { icon: 'account', label: 'Name', value: lead.name },
                { icon: 'phone', label: 'Phone', value: lead.phone },
                { icon: 'email', label: 'Email', value: lead.email },
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
        {lead.technicianDetails?.length > 0 && (
          <Card
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderLeftColor: colors.primary, borderLeftWidth: p(3) },
            ]}
          >
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: colors.onSurface, fontSize: p(20) }]}>
                Technician Assigned
              </Text>
              <Divider style={{ marginVertical: p(6) }} />

              {lead.technicianDetails.map((tech: any, index: number) => (
                <View
                  key={index}
                  style={[styles.techCard, { borderColor: colors.outline }]}
                >
                  <Icon source="account-wrench" size={p(18)} color={colors.primary} />
                  <Text style={[styles.techText, {fontSize: p(18)}]}>
                    {tech.name} (ID: {tech.id})
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* 📝 Remarks */}
        <Card style={[styles.card, { backgroundColor: colors.surface, borderLeftColor: colors.primary, borderLeftWidth: p(3) },]}>
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
          { label: 'Scan Gear', icon: 'barcode-scan' , action: () => navigation.navigate('GearScan')},
          { label: 'Search Gear', icon: 'magnify',action: () => navigation.navigate('GearSearch') },
          { label: 'Add Gear', icon: 'plus-circle-outline',action: () => navigation.navigate('GearScan') },
          {
            label: lead.leadType === 'Repair' ? 'View Repairs' : 'View Inspections',
            icon: lead.leadType === 'Repair' ? 'wrench' : 'clipboard-check-outline',
            action: () => navigation.navigate('GroupInspections'),
          },
        ].map((action, i) => (
          <Button
            key={i}
            // mode="text"
                  mode="outlined" // You can change to "contained" or "outlined"
      onPress={() => action.action && action.action()}
      buttonColor={colors.primary}
            
            textColor={colors.surface}
            labelStyle={{
              fontSize: p(14),
              fontWeight: '600',
            }}
            style={{  borderColor: colors.outline, borderRadius: p(10), elevation: 12, }}
            icon={action.icon}
            // contentStyle={{ flexDirection: 'row', paddingVertical: p(2) , paddingHorizontal: p(0)}}
          >
           <>{action.label}</>
          </Button>
        ))}
        
      </View>
      </ScrollView>

      {/* ⚙️ Footer Action Bar */}


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
                  alignSelf: 'flex-start', // ✅ only as wide as content
                }}
                contentStyle={{
                  flexDirection: 'row',
                  justifyContent: 'flex-start', // ✅ align icon + label left
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


    </SafeAreaView>
  );
};

export default LeadDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    // paddingVertical: p(2),
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)', // dark semi-transparent overlay
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: p(6),
  },
  detailText: {
    fontSize: p(13),
    marginLeft: p(6),
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
  borderColor: 'rgba(0,0,0,0.08)', // subtle line for separation (optional)
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

  techCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: p(8),
    padding: p(8),
    marginBottom: p(6),
  },
  techText: {
    fontSize: p(13),
    marginLeft: p(8),
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
    // borderTopWidth: 1,
    paddingVertical: p(12),
    marginBottom:p(26)
  },
});
