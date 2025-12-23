import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import {
  Text,
  Button,
  Icon,
  useTheme,
  TextInput,
  RadioButton,
  Portal,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { p } from '../../utils/responsive';
import { useAuthStore } from '../../store/authStore';
import { leadApi } from '../../services/leadApi';
import { Franchise } from '../../services/franchiseApi';
import { Firestation, firestationApi } from '../../services/firestationApi';
import FranchiseSelectorModal from '../../components/common/Modal/FranchiseSelectorModal';
import FirestationSelectorModal from '../../components/common/Modal/FirestationSelectorModal';
import { Calendar } from 'react-native-calendars';

const CreateJobScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { user } = useAuthStore();

  // Form state
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(null);
  const [selectedFirestation, setSelectedFirestation] = useState<any | null>(null);
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  // Job type state - matches API requirements: 'Repair' | 'Inspection'
  const [jobType, setJobType] = useState<'Repair' | 'Inspection'>('Inspection');
  const [repairCost, setRepairCost] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Modal states
  const [franchiseModalVisible, setFranchiseModalVisible] = useState(false);
  const [firestationModalVisible, setFirestationModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [screenWidth, setScreenWidth] = useState<number>(Dimensions.get('window').width);

  const [supportedOrientations, setSupportedOrientations] = useState<
    ('portrait' | 'landscape' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right')[]
  >(['portrait', 'landscape']);

  // Determine if user is Corporate_Technician
  const isCorporateTechnician = user?.role === 'Corporate_Technician';

  // Determine if device is mobile (typically < 600px width)
  const isMobile = screenWidth < 600;

  // Get screen height for modal sizing - reactive to dimension changes
  const modalHeight = useMemo(() => {
    const screenHeight = Dimensions.get('window').height;
    return screenHeight * 0.8; // 80% of screen height
  }, []);

  // Effect for handling screen orientation and size changes
  useEffect(() => {
    const updateLayout = () => {
      const { width } = Dimensions.get('window');
      setScreenWidth(width);
    };

    const subscription = Dimensions.addEventListener('change', updateLayout);
    return () => subscription.remove();
  }, []);

  // Reset form when screen opens
  useEffect(() => {
    const { width, height } = Dimensions.get('window');
    const isLandscape = width > height;
    setSupportedOrientations(
      isLandscape
        ? ['landscape', 'landscape-left', 'landscape-right']
        : ['portrait', 'portrait-upside-down']
    );

    // Pre-fill franchise if user is not Corporate_Technician
    if (!isCorporateTechnician && user?.franchiseId) {
      setSelectedFranchise({
        franchise_id: user.franchiseId,
        corporate: {
          corporate_id: user.corporateId || 0,
          corporate_name: user.corporateName || '',
        },
        franchise_name: user.franchiseName || '',
        email: null,
        phone: null,
        address: user.address || '',
        city: user.city || '',
        zip_code: user.zipCode || '',
        state: user.state || '',
        country: '',
        latitude: null,
        longitude: null,
        active_status: true,
        is_deleted: false,
        created_at: '',
        updated_at: null,
        created_by: '',
        updated_by: null,
      });

      // Automatically fetch firestations for the pre-selected franchise
      fetchFirestationsForFranchise(user.franchiseId);
    }
  }, [isCorporateTechnician, user]);

  // Function to fetch firestations for a franchise
  const fetchFirestationsForFranchise = async (franchiseId: number) => {
    try {
      console.log('🔄 Fetching firestations for franchise:', franchiseId);
      const response = await firestationApi.getFirestationsByFranchise(franchiseId, {
        page: 1,
        page_size: 10
      });

      if (response.status) {
        console.log('✅ Firestations fetched successfully:', response.firestations.length, 'firestations');
        // The FirestationSelectorModal will handle fetching when opened,
        // but this pre-loads the data and logs for debugging
      } else {
        console.error('❌ Failed to fetch firestations:', response.message);
      }
    } catch (error: any) {
      console.error('❌ Error fetching firestations:', error);
    }
  };

  const handleFranchiseSelect = (franchise: Franchise) => {
    setSelectedFranchise(franchise);
    // Reset firestation when franchise changes
    setSelectedFirestation(null);

    // Fetch firestations for the selected franchise
    fetchFirestationsForFranchise(franchise.franchise_id);
  };

  const handleFirestationSelect = (firestation: Firestation) => {
    setSelectedFirestation(firestation);
  };

  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString();
  };

  const validateForm = () => {
    if (!selectedFranchise) {
      Alert.alert('Error', 'Please select a franchise');
      return false;
    }
    if (!selectedFirestation) {
      Alert.alert('Error', 'Please select a fire station');
      return false;
    }
    if (!scheduleDate) {
      Alert.alert('Error', 'Please select a schedule date');
      return false;
    }
    if (jobType === 'Repair' && (!repairCost || parseFloat(repairCost) <= 0)) {
      Alert.alert('Error', 'Please enter a valid repair cost');
      return false;
    }
    return true;
  };

  const handleCreateJob = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const jobData = {
        franchise_id: selectedFranchise!.franchise_id,
        firestation_id: selectedFirestation!.firestation_id,
        schedule_date: scheduleDate!.toISOString().split('T')[0], // Format as YYYY-MM-DD
        type: jobType,
        ...(jobType === 'Repair' && { repair_cost: parseFloat(repairCost) }),
      };

      console.log('🔄 Creating job with data:', jobData);
      const response = await leadApi.createLead(jobData);

      if (response) {
        Alert.alert('Success', 'Job created successfully!', [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]);
      }
    } catch (error: any) {
      console.error('❌ Error creating job:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create job. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Button mode="text" onPress={() => navigation.goBack()}>
          <Icon source="arrow-left" size={p(22)} color={colors.onSurface} />
        </Button>
        <Text style={[styles.headerTitle, { color: colors.onSurface, fontSize: p(20) }]}>
          Create Job
        </Text>
        <View style={{ width: p(48) }} /> {/* Spacer for centering */}
      </View>

      {/* Form Content */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Franchise Selection */}
          {isCorporateTechnician && (
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>
                Franchise *
              </Text>
              {selectedFranchise ? (
                <View style={[styles.selectedFranchiseContainer, { backgroundColor: colors.surface }]}>
                  <View style={[styles.franchiseItem]}>
                    <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
                        {selectedFranchise.franchise_name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.franchiseInfo}>
                      <Text style={[styles.franchiseName, { color: colors.onSurface, fontSize: p(18) }]}>
                        {selectedFranchise.franchise_name}
                      </Text>
                      <Text style={[styles.franchiseDetail, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
                        {selectedFranchise.corporate.corporate_name}
                      </Text>
                      <Text style={[styles.franchiseDetail, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
                        {selectedFranchise.city}, {selectedFranchise.state} {selectedFranchise.zip_code}
                      </Text>
                      <Text style={[styles.franchiseDetail, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
                        {selectedFranchise.address}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.changeButton}
                      onPress={() => setFranchiseModalVisible(true)}
                    >
                      <Icon source="pencil" size={p(20)} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.selectorButton, { borderColor: colors.outline }]}
                  onPress={() => setFranchiseModalVisible(true)}
                >
                  <Text
                    style={[
                      styles.selectorText,
                      {
                        color: colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    Select Franchise
                  </Text>
                  <Icon source="chevron-down" size={p(20)} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Firestation Selection */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>
              Fire Station *
            </Text>
            {selectedFirestation ? (
              <View style={[styles.selectedFirestationContainer, { backgroundColor: colors.surface }]}>
                <View style={[styles.firestationItem]}>
                  <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
                      {selectedFirestation.fire_station_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.firestationInfo}>
                    <Text style={[styles.firestationName, { color: colors.onSurface, fontSize: p(18) }]}>
                      {selectedFirestation.fire_station_name}
                    </Text>
                    <Text style={[styles.firestationDetail, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
                      {selectedFirestation.city}, {selectedFirestation.state}
                    </Text>
                    <Text style={[styles.firestationDetail, { color: colors.onSurfaceVariant, fontSize: p(14) }]}>
                      {selectedFirestation.address}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changeButton}
                    onPress={() => {
                      if (!selectedFranchise && isCorporateTechnician) {
                        Alert.alert('Error', 'Please select a franchise first');
                        return;
                      }
                      setFirestationModalVisible(true);
                    }}
                  >
                    <Icon source="pencil" size={p(20)} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.selectorButton, { borderColor: colors.outline }]}
                onPress={() => {
                  if (!selectedFranchise && isCorporateTechnician) {
                    Alert.alert('Error', 'Please select a franchise first');
                    return;
                  }
                  setFirestationModalVisible(true);
                }}
              >
                <Text
                  style={[
                    styles.selectorText,
                    {
                      color: colors.onSurfaceVariant,
                    },
                  ]}
                >
                  Select Fire Station
                </Text>
                <Icon source="chevron-down" size={p(20)} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            )}
          </View>

          {/* Schedule Date */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>
              Schedule Date *
            </Text>
            <TouchableOpacity
              style={[styles.selectorButton, { borderColor: colors.outline }]}
              onPress={() => setDatePickerVisible(true)}
            >
              <Text
                style={[
                  styles.selectorText,
                  {
                    color: scheduleDate ? colors.onSurface : colors.onSurfaceVariant,
                  },
                ]}
              >
                {scheduleDate ? formatDateForDisplay(scheduleDate) : 'Select Date'}
              </Text>
              <Icon source="calendar" size={p(20)} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Job Type */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>
              Job Type *
            </Text>
            <View style={styles.radioContainer}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setJobType('Inspection')}
              >
                <RadioButton
                  value="Inspection"
                  status={jobType === 'Inspection' ? 'checked' : 'unchecked'}
                  onPress={() => setJobType('Inspection')}
                  color={colors.primary}
                />
                <Text style={[styles.radioLabel, { color: colors.onSurface }]}>
                  Inspection
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setJobType('Repair')}
              >
                <RadioButton
                  value="Repair"
                  status={jobType === 'Repair' ? 'checked' : 'unchecked'}
                  onPress={() => setJobType('Repair')}
                  color={colors.primary}
                />
                <Text style={[styles.radioLabel, { color: colors.onSurface }]}>
                  Repair
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Repair Cost - Only show for Repair type */}
          {jobType === 'Repair' && (
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>
                Repair Cost *
              </Text>
              <TextInput
                mode="outlined"
                placeholder="Enter repair cost"
                value={repairCost}
                onChangeText={setRepairCost}
                keyboardType="numeric"
                style={styles.textInput}
                activeOutlineColor={colors.primary}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.surface }]}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
          textColor={colors.onSurface}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleCreateJob}
          loading={loading}
          disabled={loading}
          buttonColor={colors.primary}
          textColor={colors.onPrimary}
          style={styles.createButton}
        >
          Create Job
        </Button>
      </View>

      {/* Franchise Selector Modal */}
      <Portal>
        <FranchiseSelectorModal
          visible={franchiseModalVisible}
          onClose={() => setFranchiseModalVisible(false)}
          onFranchiseSelect={handleFranchiseSelect}
        />
      </Portal>

      {/* Firestation Selector Modal */}
      <Portal>
        <FirestationSelectorModal
          visible={firestationModalVisible}
          onClose={() => setFirestationModalVisible(false)}
          onFirestationSelect={handleFirestationSelect}
          franchiseId={selectedFranchise?.franchise_id || null}
        />
      </Portal>

      {/* Date Picker Modal */}
      <Portal>
        <Modal
          visible={datePickerVisible}
          onDismiss={() => setDatePickerVisible(false)}
          contentContainerStyle={[
            styles.datePickerModalContainer,
            isMobile && styles.datePickerModalContainerMobile,
            {
              backgroundColor: colors.surface,
              height: isMobile ? '70%' : '60%',
            },
          ]}
        >
          <SafeAreaView style={[styles.datePickerSafeArea, { backgroundColor: colors.surface }]}>
            {/* Modal Header */}
            <View style={[styles.datePickerModalHeader, { borderBottomColor: colors.outline }]}>
              <Text variant="titleLarge" style={{ fontWeight: 'bold', color: colors.onSurface }}>
                Select Date
              </Text>
              <Button
                mode="text"
                onPress={() => setDatePickerVisible(false)}
                icon="close"
                textColor={colors.onSurface}
                style={styles.datePickerModalCloseButton}
              >
                Close
              </Button>
            </View>

            {/* Calendar */}
            <View style={styles.datePickerCalendarContainer}>
              <Calendar
                current={scheduleDate ? scheduleDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                markedDates={scheduleDate ? {
                  [scheduleDate.toISOString().split('T')[0]]: {
                    selected: true,
                    selectedColor: colors.primary,
                    selectedTextColor: colors.onPrimary,
                  }
                } : {}}
                onDayPress={(day) => {
                  const selectedDate = new Date(day.dateString);
                  setScheduleDate(selectedDate);
                  setDatePickerVisible(false);
                }}
                monthFormat={'MMMM yyyy'}
                theme={{
                  backgroundColor: colors.surface,
                  calendarBackground: colors.surface,
                  textSectionTitleColor: colors.onSurface,
                  selectedDayBackgroundColor: colors.primary,
                  selectedDayTextColor: colors.onPrimary,
                  todayTextColor: colors.primary,
                  dayTextColor: colors.onSurface,
                  textDisabledColor: colors.outline,
                  dotColor: colors.primary,
                  selectedDotColor: colors.onPrimary,
                  arrowColor: colors.primary,
                  monthTextColor: colors.onSurface,
                  indicatorColor: colors.primary,
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 14,
                }}
                style={styles.calendar}
              />
            </View>

            {/* Modal Footer */}
            <View style={[styles.datePickerModalFooter, { borderTopColor: colors.outline }]}>
              <Button
                mode="text"
                onPress={() => {
                  setScheduleDate(null);
                  setDatePickerVisible(false);
                }}
                textColor={colors.error}
                disabled={!scheduleDate}
              >
                Clear
              </Button>
              <Button
                mode="contained"
                onPress={() => setDatePickerVisible(false)}
                buttonColor={colors.primary}
                textColor={colors.onPrimary}
              >
                Done
              </Button>
            </View>
          </SafeAreaView>
        </Modal>
      </Portal>
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
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  formContainer: {
    padding: p(16),
  },
  fieldContainer: {
    marginBottom: p(20),
  },
  fieldLabel: {
    fontSize: p(16),
    fontWeight: '600',
    marginBottom: p(8),
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: p(12),
    borderWidth: 1,
    borderRadius: p(8),
    backgroundColor: 'transparent',
  },
  selectorText: {
    fontSize: p(16),
    flex: 1,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: p(16),
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioLabel: {
    fontSize: p(16),
    marginLeft: p(8),
  },
  textInput: {
    backgroundColor: 'transparent',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: p(16),
    paddingBottom: p(80),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  cancelButton: {
    flex: 1,
    marginRight: p(8),
  },
  createButton: {
    flex: 1,
    marginLeft: p(8),
  },
  selectedFranchiseContainer: {
    borderRadius: p(8),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  franchiseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: p(16),
  },
  selectedFirestationContainer: {
    borderRadius: p(8),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  firestationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: p(16),
  },
  avatar: {
    width: p(44),
    height: p(44),
    borderRadius: p(22),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: p(12),
  },
  avatarText: {
    fontSize: p(18),
    fontWeight: '600',
  },
  franchiseInfo: {
    flex: 1,
  },
  franchiseName: {
    fontWeight: '600',
    marginBottom: p(4),
  },
  franchiseDetail: {
    marginBottom: p(2),
  },
  firestationInfo: {
    flex: 1,
  },
  firestationName: {
    fontWeight: '600',
    marginBottom: p(4),
  },
  firestationDetail: {
    marginBottom: p(2),
  },
  changeButton: {
    padding: p(8),
    borderRadius: p(4),
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  datePickerModalContainer: {
    margin: p(20),
    borderRadius: p(16),
    width: p(600),
    alignSelf: 'center',
    display: 'flex',
    flexDirection: 'column',
  },
  datePickerModalContainerMobile: {
    margin: p(10),
    width: '95%',
  },
  datePickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: p(16),
    borderBottomWidth: 1,
  },
  datePickerModalCloseButton: {
    marginLeft: 'auto',
  },
  datePickerCalendarContainer: {
    flex: 1,
    padding: p(16),
    justifyContent: 'center',
  },
  datePickerModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: p(16),
    borderTopWidth: 1,
  },
  calendar: {
    borderRadius: p(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  datePickerSafeArea: {
    flex: 1,
  },
});

export default CreateJobScreen;
