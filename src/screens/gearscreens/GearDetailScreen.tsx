// src/screens/gearscreens/GearDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Linking, Alert, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { 
  Text, 
  Button, 
  Card, 
  Divider, 
  Icon, 
  useTheme,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import RosterModal from '../../components/common/Modal/RosterModal';
import GearHistoryModal from '../../components/common/Modal/GearHistoryModal';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Pagination from '../../components/common/Pagination';
import { useGearStore, GearHistoryItem } from '../../store/gearStore';
import { printTable } from '../../utils/printTable';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';



type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'UpadateInspection'>;


const GearDetailScreen = () => {

    const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const route = useRoute();
  const { gear_id } = route.params as any;
  
  const { currentGear, loading, fetchGearById, updateGear, gearHistory, gearHistoryLoading, gearHistoryPagination, fetchGearHistory } = useGearStore();
  
  const [rosterModalVisible, setRosterModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<GearHistoryItem | null>(null);
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  
  // Detect if device is mobile (width < 600)
  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth < 600;

  console.log("gear_id-Gear-details screen", gear_id);

  // Fetch gear details when component mounts
  useFocusEffect(React.useCallback(() => {
    if (gear_id) {
      fetchGearById(gear_id);
      fetchGearHistory(gear_id, { page: currentHistoryPage, page_size: historyPageSize });
    }
  }, [gear_id, currentHistoryPage, historyPageSize]));

  console.log("currentGear", currentGear)


  const getStatusColor = (status: string) => {
    if (status?.toLowerCase().includes('fail') || status?.toLowerCase().includes('repair')) return '#EA4335';
    if (status?.toLowerCase().includes('pass') || status?.toLowerCase().includes('good')) return '#34A853';
    if (status?.toLowerCase().includes('completed')) return '#34A853';
    if (status?.toLowerCase().includes('attention') || status?.toLowerCase().includes('requires')) return '#FB8C00';
    return colors.onSurfaceVariant;
  };

  const handleRosterSelect = async (roster: any) => {
    if (!currentGear || !gear_id) {
      Alert.alert('Error', 'Gear information not available');
      return;
    }

    const rosterName = roster.roster_name || `${roster.first_name} ${roster.last_name}` || 'this firefighter';
    const isUpdating = !!currentGear.roster;
    const currentRosterName = currentGear.roster 
      ? `${currentGear.roster.first_name} ${currentGear.roster.last_name}`.trim() || 'current firefighter'
      : '';

    // Show confirmation if updating existing roster
    if (isUpdating) {
      Alert.alert(
        'Update Firefighter Assignment',
        `This gear is currently assigned to ${currentRosterName}. Do you want to reassign it to ${rosterName}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Update',
            style: 'default',
            onPress: async () => {
              await performRosterUpdate(roster);
            },
          },
        ]
      );
    } else {
      // No confirmation needed for first-time assignment
      await performRosterUpdate(roster);
    }
  };

  const performRosterUpdate = async (roster: any) => {
    console.log('performRosterUpdate - currentGear:', currentGear);
    console.log('performRosterUpdate - gear_id:', gear_id);
    console.log('performRosterUpdate - roster:', roster);

    if (!currentGear) {
      Alert.alert('Error', 'Gear information not available. Please refresh the page.');
      return;
    }

    if (!gear_id) {
      Alert.alert('Error', 'Gear ID not available. Please refresh the page.');
      return;
    }

    try {
      const rosterId = roster.roster_id || roster.id;
      
      // Build gearData with proper null checks and optional chaining
      const gearData: any = {
        gear_name: currentGear.gear_name,
        serial_number: currentGear.serial_number,
        manufacturer_id: currentGear.manufacturer?.manufacturer_id,
        firestation_id: currentGear.firestation?.id,
        roster_id: rosterId,
        active_status: currentGear.active_status,
      };

      // Add optional fields only if they exist
      if (currentGear.gear_type?.gear_type_id) {
        gearData.gear_type_id = currentGear.gear_type.gear_type_id;
      }
      
      if (currentGear.franchise?.id) {
        gearData.franchise_id = currentGear.franchise.id;
      }
      
      if (currentGear.gear_size) {
        gearData.gear_size = currentGear.gear_size;
      }
      
      if (currentGear.manufacturing_date) {
        gearData.manufacturing_date = currentGear.manufacturing_date;
      }
      
      if (currentGear.remarks) {
        gearData.remarks = currentGear.remarks;
      }

      console.log('performRosterUpdate - gearData:', gearData);

      const updatedGear = await updateGear(gear_id, gearData);
      if (updatedGear) {
        const rosterName = roster.roster_name || `${roster.first_name} ${roster.last_name}` || 'Firefighter';
        Alert.alert('Success', `${rosterName} ${currentGear.roster ? 'updated' : 'assigned'} successfully`);
        setRosterModalVisible(false);
        // Refresh gear data
        fetchGearById(gear_id);
      } else {
        Alert.alert('Error', 'Failed to update gear');
      }
    } catch (error: any) {
      console.error('performRosterUpdate - error:', error);
      Alert.alert('Error', error.message || 'Failed to update gear');
    }
  };

  const handleAddRosterManual = () => {
    Alert.alert('Add Roster', 'Navigate to add roster form');
  };

  const handleUpdateFirefighter = () => {
    setActionModalVisible(false);
    
    Alert.alert(
      'Update Firefighter',
      'Are you sure you want to update the assigned firefighter for this gear?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Update',
          style: 'default',
          onPress: () => {
            setRosterModalVisible(true);
          },
        },
      ]
    );
  };

  const handleRemoveFirefighter = async () => {
    setActionModalVisible(false);
    
    Alert.alert(
      'Remove Firefighter',
      'Are you sure you want to remove this firefighter from the gear?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            console.log('handleRemoveFirefighter - currentGear:', currentGear);
            console.log('handleRemoveFirefighter - gear_id:', gear_id);

            if (!currentGear) {
              Alert.alert('Error', 'Gear information not available. Please refresh the page.');
              return;
            }

            if (!gear_id) {
              Alert.alert('Error', 'Gear ID not available. Please refresh the page.');
              return;
            }

            try {
              // Build gearData with proper null checks and optional chaining
              const gearData: any = {
                gear_name: currentGear.gear_name,
                serial_number: currentGear.serial_number,
                manufacturer_id: currentGear.manufacturer?.manufacturer_id,
                firestation_id: currentGear.firestation?.id,
                roster_id: null,
                active_status: currentGear.active_status,
              };

              // Add optional fields only if they exist
              if (currentGear.gear_type?.gear_type_id) {
                gearData.gear_type_id = currentGear.gear_type.gear_type_id;
              }
              
              if (currentGear.franchise?.id) {
                gearData.franchise_id = currentGear.franchise.id;
              }
              
              if (currentGear.gear_size) {
                gearData.gear_size = currentGear.gear_size;
              }
              
              if (currentGear.manufacturing_date) {
                gearData.manufacturing_date = currentGear.manufacturing_date;
              }
              
              if (currentGear.remarks) {
                gearData.remarks = currentGear.remarks;
              }

              console.log('handleRemoveFirefighter - gearData:', gearData);

              const updatedGear = await updateGear(gear_id, gearData);
              if (updatedGear) {
                Alert.alert('Success', 'Firefighter removed successfully');
                // Refresh gear data
                fetchGearById(gear_id);
              } else {
                Alert.alert('Error', 'Failed to remove firefighter');
              }
            } catch (error: any) {
              console.error('handleRemoveFirefighter - error:', error);
              Alert.alert('Error', error.message || 'Failed to remove firefighter');
            }
          },
        },
      ]
    );
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

        {/* Two-column layout - stacks on mobile */}
        <View style={[styles.columns, isMobile && styles.columnsMobile]}>
          {/* LEFT COLUMN */}
          <View style={styles.column}>
            {/* Assigned Roster */}
            <Card style={[styles.card, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.onSurface, fontSize: p(18) }]}>
                    Assigned Fire Fighter
                  </Text>
                  {currentGear?.roster && (
                    <IconButton
                      icon="dots-vertical"
                      size={p(20)}
                      iconColor={colors.onSurfaceVariant}
                      onPress={() => setActionModalVisible(true)}
                    />
                  )}
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

            {gearHistoryLoading ? (
              <View style={styles.historyLoadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ color: colors.onSurfaceVariant, marginTop: p(8) }}>
                  Loading gear history...
                </Text>
              </View>
            ) : gearHistory.length === 0 ? (
              <View style={styles.noHistoryContainer}>
                <Icon source="clipboard-text-off" size={p(48)} color={colors.onSurfaceVariant} />
                <Text style={[styles.noHistoryText, { color: colors.onSurfaceVariant, fontSize: p(16) }]}>
                  No gear history found
                </Text>
              </View>
            ) : (
              /* Horizontal scrollable table for mobile */
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={styles.tableScrollContainer}
              >
              <View style={styles.tableWrapper}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Date</Text>
                  <Text style={[styles.tableHeaderText, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Status</Text>
                  <Text style={[styles.tableHeaderText, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Cost</Text>
                  <Text style={[styles.tableHeaderText, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Type</Text>
                  <Text style={[styles.tableHeaderText, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Technician</Text>
                  <Text style={[styles.tableHeaderText, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Firefighter</Text>
                  <Text style={[styles.tableHeaderText, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Images</Text>
                  <Text style={[styles.tableHeaderText, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Created</Text>
                  <Text style={[styles.tableHeaderText, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Created By</Text>
                  <Text style={[styles.tableHeaderText, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Updated</Text>
                  <Text style={[styles.tableHeaderText, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>Updated By</Text>
                </View>

                {gearHistory.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setSelectedHistoryItem(item);
                      setHistoryModalVisible(true);
                    }}
                  >
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, { color: colors.onSurface, fontSize: p(12) }]}>
                        {formatDate(item.lead.schedule_date)}
                      </Text>
                      <Text style={[styles.tableCell, { color: getStatusColor(item.repair_status), fontSize: p(12), fontWeight: '600' }]}>
                        {item.repair_status}
                      </Text>
                      <Text style={[styles.tableCell, { color: colors.onSurface, fontSize: p(12) }]}>
                        ${item.repair_cost?.toFixed(2) || '0.00'}
                      </Text>
                      <Text style={[styles.tableCell, { color: colors.onSurface, fontSize: p(12) }]}>
                        {item.record_type}
                      </Text>
                      <Text style={[styles.tableCell, { color: colors.onSurface, fontSize: p(12) }]}>
                        {item.lead.assigned_technicians?.[0]?.name || 'N/A'}
                      </Text>
                      <Text style={[styles.tableCell, { color: colors.onSurface, fontSize: p(12) }]}>
                        {item.gear.roster ? `${item.gear.roster.first_name} ${item.gear.roster.last_name}` : 'N/A'}
                      </Text>
                      <Text style={[styles.tableCell, { color: colors.onSurface, fontSize: p(12) }]}>
                        {item.repair_images?.length || 0}
                      </Text>
                      <Text style={[styles.tableCell, { color: colors.onSurface, fontSize: p(12) }]}>
                        {formatDate(item.created_at)}
                      </Text>
                      <Text style={[styles.tableCell, { color: colors.onSurface, fontSize: p(12) }]}>
                        {item.created_by}
                      </Text>
                      <Text style={[styles.tableCell, { color: colors.onSurface, fontSize: p(12) }]}>
                        {formatDate(item.updated_at)}
                      </Text>
                      <Text style={[styles.tableCell, { color: colors.onSurface, fontSize: p(12) }]}>
                        {item.updated_by}
                      </Text>
                    </View>
                    {index < gearHistory.length - 1 && <Divider />}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            )}

            {/* Pagination */}
            {gearHistory.length > 0 && gearHistoryPagination && (
              <View style={styles.paginationContainer}>
                <Pagination
                  page={currentHistoryPage}
                  total={gearHistoryPagination.total}
                  itemsPerPage={historyPageSize}
                  onPageChange={setCurrentHistoryPage}
                  onItemsPerPageChange={setHistoryPageSize}
                />
              </View>
            )}
          </Card.Content>
        </Card>

        {/* CTA Button */}
        {/* <Button
          mode="contained"
          onPress={() => navigation.navigate('UpadateInspection',{gearId: gear_id, mode:"update"} )}
          buttonColor={colors.primary}
          textColor={colors.surface}
          style={styles.ctaButton}
          icon="clipboard-check"
          labelStyle={{ fontWeight: '700', fontSize: p(16), color: "#fff" }}
          contentStyle={{ paddingVertical: p(8) }}
        >
          START GEAR INSPECTION
        </Button> */}
      </ScrollView>

      {/* Custom Action Modal */}
      <Modal
        visible={actionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActionModalVisible(false)}
        >
          <View style={[styles.actionModalContent, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={styles.actionModalItem}
              onPress={handleUpdateFirefighter}
            >
              <Icon source="account-edit" size={p(24)} color={colors.primary} />
              <Text style={[styles.actionModalText, { color: colors.onSurface }]}>
                Update Firefighter
              </Text>
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity
              style={styles.actionModalItem}
              onPress={handleRemoveFirefighter}
            >
              <Icon source="account-remove" size={p(24)} color={colors.error} />
              <Text style={[styles.actionModalText, { color: colors.error }]}>
                Remove Firefighter
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Roster Modal */}
      <RosterModal
        visible={rosterModalVisible}
        onClose={() => setRosterModalVisible(false)}
        onRosterSelect={handleRosterSelect}
        onAddRosterManual={handleAddRosterManual}
      />

      {/* Gear History Modal */}
      <GearHistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        gearHistoryItem={selectedHistoryItem}
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
  columnsMobile: {
    flexDirection: 'column',
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
  tableScrollContainer: {
    paddingBottom: p(8),
  },
  tableWrapper: {
    minWidth: p(600), // Minimum width to ensure table doesn't get too cramped
  },
  tableHeader: {
    flexDirection: 'row',
    marginBottom: p(8),
  },
  tableHeaderText: {
    minWidth: p(80),
    paddingHorizontal: p(8),
    fontWeight: '600',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: p(8),
  },
  tableCell: {
    minWidth: p(80),
    paddingHorizontal: p(8),
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModalContent: {
    width: '80%',
    borderRadius: p(12),
    elevation: 5,
    overflow: 'hidden',
  },
  actionModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: p(16),
    gap: p(12),
  },
  actionModalText: {
    fontSize: p(16),
    fontWeight: '500',
  },
  historyLoadingContainer: {
    alignItems: 'center',
    paddingVertical: p(32),
  },
  noHistoryContainer: {
    alignItems: 'center',
    paddingVertical: p(32),
  },
  noHistoryText: {
    marginTop: p(16),
    textAlign: 'center',
  },
  paginationContainer: {
    marginTop: p(16),
    paddingHorizontal: p(16),
  },
});

export default GearDetailScreen;