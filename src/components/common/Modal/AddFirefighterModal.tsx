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
  TextInput,
  Button,
  Icon,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { p } from '../../../utils/responsive';
import { useRosterStore } from '../../../store/rosterStore';
import { useLeadStore } from '../../../store/leadStore';

interface AddFirefighterModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RANK_OPTIONS = [
  'Firefighter',
  'Crew Manager',
  'Watch Manager',
  'Station Manager',
  'Group Manager',
  'Area Manager',
  'Assistant Chief Fire Officer',
  'Deputy Chief',
  'Chief Fire Officer',
];

const AddFirefighterModal: React.FC<AddFirefighterModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { colors } = useTheme();
  const { createRoster, loading } = useRosterStore();
  const { currentLead } = useLeadStore();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    rank: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rankPickerVisible, setRankPickerVisible] = useState(false);
  const [supportedOrientations, setSupportedOrientations] = useState<
    ('portrait' | 'landscape' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right')[]
  >(['portrait', 'landscape']);

  // Lock to current orientation when modal opens
  useEffect(() => {
    if (visible) {
      const { width, height } = Dimensions.get('window');
      const isLandscape = width > height;
      setSupportedOrientations(
        isLandscape
          ? ['landscape', 'landscape-left', 'landscape-right']
          : ['portrait', 'portrait-upside-down']
      );
    }
  }, [visible]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!currentLead?.firestation?.id || !currentLead?.franchise?.id) {
      Alert.alert('Error', 'Unable to determine firestation or franchise');
      return;
    }

    const rosterData: any = {
      firestation_id: currentLead.firestation.id,
      franchise_id: currentLead.franchise.id,
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      active_status: true,
      rank: formData.rank.trim(),
    };

    const success = await createRoster(rosterData);
    
    if (success) {
      Alert.alert('Success', 'Firefighter added successfully');
      resetForm();
      onSuccess();
      onClose();
    } else {
      Alert.alert('Error', 'Failed to add firefighter');
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      rank: '',
    });
    setErrors({});
    setRankPickerVisible(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
      supportedOrientations={supportedOrientations}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.onSurface, fontSize: p(20) }]}>
            Add New Fire Fighter
          </Text>
          <Button mode="text" onPress={handleClose}>
            <Icon source="close" size={p(22)} color={colors.onSurface} />
          </Button>
        </View>

        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
          {/* Form */}
          <View style={styles.formContainer}>
            <TextInput
              label="First Name"
              value={formData.first_name}
              onChangeText={(value) => handleInputChange('first_name', value)}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="account" />}
            />

            <TextInput
              label="Last Name *"
              value={formData.last_name}
              onChangeText={(value) => handleInputChange('last_name', value)}
              style={styles.input}
              mode="outlined"
              error={!!errors.last_name}
              left={<TextInput.Icon icon="account" />}
            />
            {errors.last_name && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.last_name}
              </Text>
            )}

            <TextInput
              label="Email *"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              style={styles.input}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!errors.email}
              left={<TextInput.Icon icon="email" />}
            />
            {errors.email && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.email}
              </Text>
            )}

            <TextInput
              label="Phone"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              style={styles.input}
              mode="outlined"
              keyboardType="phone-pad"
              left={<TextInput.Icon icon="phone" />}
            />

            <TextInput
              label="Rank"
              value={formData.rank}
              onChangeText={(value) => handleInputChange('rank', value)}
              onFocus={() => setRankPickerVisible(true)}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="account-star" />}
              right={
                <TextInput.Icon
                  icon="menu-down"
                  onPress={() => setRankPickerVisible(true)}
                />
              }
            />

            <Text style={[styles.noteText, { color: colors.onSurfaceVariant }]}>
              * Required fields
            </Text>

            <Text style={[styles.firestationText, { color: colors.onSurfaceVariant }]}>
              Firestation: {currentLead?.firestation?.name || 'Not specified'}
            </Text>
          </View>
        </ScrollView>

        {/* Rank Picker Modal */}
        <Modal
          transparent
          visible={rankPickerVisible}
          animationType="fade"
          onRequestClose={() => setRankPickerVisible(false)}
          supportedOrientations={supportedOrientations}
          statusBarTranslucent={true}
        >
          <TouchableOpacity
            style={styles.rankPickerOverlay}
            activeOpacity={1}
            onPress={() => setRankPickerVisible(false)}
          >
            <View
              style={[styles.rankPickerModal, { backgroundColor: colors.surface }]}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
            >
              <View style={[styles.rankPickerHeader, { borderBottomColor: colors.outline }]}>
                <Text style={[styles.rankPickerTitle, { color: colors.onSurface }]}>
                  Select Rank
                </Text>
                <Button mode="text" onPress={() => setRankPickerVisible(false)}>
                  <Icon source="close" size={p(22)} color={colors.onSurface} />
                </Button>
              </View>

              <ScrollView style={styles.rankPickerScroll}>
                {RANK_OPTIONS.map((rank) => (
                  <TouchableOpacity
                    key={rank}
                    style={[
                      styles.rankOption,
                      {
                        backgroundColor:
                          formData.rank === rank
                            ? colors.primaryContainer
                            : 'transparent',
                        borderBottomColor: colors.outline,
                      },
                    ]}
                    onPress={() => {
                      handleInputChange('rank', rank);
                      setRankPickerVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.rankOptionText,
                        {
                          color:
                            formData.rank === rank
                              ? colors.onPrimaryContainer
                              : colors.onSurface,
                        },
                      ]}
                    >
                      {rank}
                    </Text>
                    {formData.rank === rank && (
                      <Icon
                        source="check"
                        size={p(20)}
                        color={colors.onPrimaryContainer}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Footer */}
        <View style={[styles.modalFooter, { backgroundColor: colors.surface }]}>
          <Button
            mode="outlined"
            onPress={handleClose}
            style={[styles.button, styles.cancelButton]}
            labelStyle={styles.buttonLabel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={[styles.button, styles.submitButton]}
            labelStyle={styles.buttonLabel}
            disabled={loading}
            icon={loading ? () => <ActivityIndicator size={16} color={colors.surface} /> : 'check'}
          >
            {loading ? 'Adding...' : 'Add New Fire Fighter'}
          </Button>
        </View>
      </View>
    </Modal>
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
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  formContainer: {
    padding: p(16),
  },
  input: {
    marginBottom: p(12),
  },
  errorText: {
    fontSize: p(12),
    marginTop: p(-8),
    marginBottom: p(12),
    marginLeft: p(4),
  },
  noteText: {
    fontSize: p(12),
    marginBottom: p(16),
    fontStyle: 'italic',
  },
  firestationText: {
    fontSize: p(14),
    textAlign: 'center',
    marginBottom: p(8),
  },
  modalFooter: {
    flexDirection: 'row',
    padding: p(16),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: p(12),
  },
  button: {
    flex: 1,
    borderRadius: p(12),
  },
  cancelButton: {
    borderWidth: 1,
  },
  submitButton: {
    // Uses primary color by default
  },
  buttonLabel: {
    fontSize: p(14),
    fontWeight: '600',
  },
  rankPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: p(16),
  },
  rankPickerModal: {
    width: '100%',
    maxWidth: p(400),
    borderRadius: p(12),
    maxHeight: '80%',
  },
  rankPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: p(16),
    paddingVertical: p(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rankPickerTitle: {
    fontSize: p(18),
    fontWeight: '700',
  },
  rankPickerScroll: {
    maxHeight: p(400),
  },
  rankOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: p(16),
    paddingVertical: p(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rankOptionText: {
    fontSize: p(15),
    flex: 1,
  },
});

export default AddFirefighterModal;