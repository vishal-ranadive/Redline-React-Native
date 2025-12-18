import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Button,
  Icon,
  useTheme,
  TextInput,
  RadioButton,
} from 'react-native-paper';
import { p } from '../../../utils/responsive';
import { useAuthStore } from '../../../store/authStore';
import { leadApi } from '../../../services/leadApi';
import { Franchise } from '../../../services/franchiseApi';
import { Firestation } from '../../../services/firestationApi';
import FranchiseSelectorModal from './FranchiseSelectorModal';
import FirestationSelectorModal from './FirestationSelectorModal';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

interface CreateJobModalProps {
  visible: boolean;
  onClose: () => void;
  onJobCreated: () => void;
}

const CreateJobModal: React.FC<CreateJobModalProps> = ({
  visible,
  onClose,
  onJobCreated,
}) => {
  const { colors } = useTheme();
  const { user } = useAuthStore();

  // Form state
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(null);
  const [selectedFirestation, setSelectedFirestation] = useState<Firestation | null>(null);
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  // Job type state - matches API requirements: 'Repair' | 'Inspection'
  const [jobType, setJobType] = useState<'Repair' | 'Inspection'>('Inspection');
  const [repairCost, setRepairCost] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Modal states
  const [franchiseModalVisible, setFranchiseModalVisible] = useState(false);
  const [firestationModalVisible, setFirestationModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const [supportedOrientations, setSupportedOrientations] = useState<
    ('portrait' | 'landscape' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right')[]
  >(['portrait', 'landscape']);

  // Determine if user is Corporate_Technician
  const isCorporateTechnician = user?.role === 'Corporate_Technician';

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
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
      }
    } else {
      // Reset form when closing
      setSelectedFranchise(null);
      setSelectedFirestation(null);
      setScheduleDate(null);
      setJobType('Inspection');
      setRepairCost('');
    }
  }, [visible, isCorporateTechnician, user]);

  const handleFranchiseSelect = (franchise: Franchise) => {
    setSelectedFranchise(franchise);
    // Reset firestation when franchise changes
    setSelectedFirestation(null);
  };

  const handleFirestationSelect = (firestation: Firestation) => {
    setSelectedFirestation(firestation);
  };

  const handleDateConfirm = (date: Date) => {
    setScheduleDate(date);
    setDatePickerVisible(false);
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
              onJobCreated();
              onClose();
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
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
        supportedOrientations={supportedOrientations}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.onSurface, fontSize: p(20) }]}>
              Create Job
            </Text>
            <Button mode="text" onPress={onClose}>
              <Icon source="close" size={p(22)} color={colors.onSurface} />
            </Button>
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
                  <TouchableOpacity
                    style={[styles.selectorButton, { borderColor: colors.outline }]}
                    onPress={() => setFranchiseModalVisible(true)}
                  >
                    <Text
                      style={[
                        styles.selectorText,
                        {
                          color: selectedFranchise ? colors.onSurface : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {selectedFranchise ? selectedFranchise.franchise_name : 'Select Franchise'}
                    </Text>
                    <Icon source="chevron-down" size={p(20)} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Firestation Selection */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>
                  Fire Station *
                </Text>
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
                        color: selectedFirestation ? colors.onSurface : colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {selectedFirestation ? selectedFirestation.fire_station_name : 'Select Fire Station'}
                  </Text>
                  <Icon source="chevron-down" size={p(20)} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
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
          <View style={[styles.modalFooter, { backgroundColor: colors.surface }]}>
            <Button
              mode="outlined"
              onPress={onClose}
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
        </View>
      </Modal>

      {/* Franchise Selector Modal */}
      <FranchiseSelectorModal
        visible={franchiseModalVisible}
        onClose={() => setFranchiseModalVisible(false)}
        onFranchiseSelect={handleFranchiseSelect}
      />

      {/* Firestation Selector Modal */}
      <FirestationSelectorModal
        visible={firestationModalVisible}
        onClose={() => setFirestationModalVisible(false)}
        onFirestationSelect={handleFirestationSelect}
        franchiseId={selectedFranchise?.franchise_id || null}
      />

      {/* Date Picker Modal */}
      <DateTimePickerModal
        isVisible={datePickerVisible}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={() => setDatePickerVisible(false)}
        date={scheduleDate || new Date()}
        minimumDate={new Date()} // Don't allow past dates
        themeVariant={colors.background === '#000000' ? 'dark' : 'light'}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: p(16),
    paddingVertical: p(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontWeight: '700',
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
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: p(16),
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
});

export default CreateJobModal;
