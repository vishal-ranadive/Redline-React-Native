// src/screens/settingsscreens/UpdateProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  useTheme,
  IconButton,
  TextInput,
  Button,
  Card,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuthStore } from '../../store/authStore';
import { p } from '../../utils/responsive';
import Toast from 'react-native-toast-message';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'UpdateProfile'>;

export default function UpdateProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const { user, updateProfile } = useAuthStore(); // We'll add updateProfile to store later

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactPhone: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [changesMade, setChangesMade] = useState(false);

  // Initialize form with current user data
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        contactPhone: user.contactPhone || '',
      });
    }
  }, [user]);

  // Check if changes were made
  useEffect(() => {
    if (user) {
      const hasChanges =
        formData.firstName !== user.firstName ||
        formData.lastName !== user.lastName ||
        formData.email !== user.email ||
        formData.contactPhone !== user.contactPhone;
      setChangesMade(hasChanges);
    }
  }, [formData, user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
            Toast.show({
              type: 'error',
              text1: 'First name and last name are required',
            });
      return;
    }

    if (!formData.email.trim()) {

        Toast.show({
              type: 'error',
              text1: 'Email is required',
            });
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement actual API call
      console.log('Updating profile with:', formData);
      
      // Simulate API call
    //   await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update in store (we'll implement this in authStore)
      // await updateProfile(formData);
      
            Toast.show({
              type: 'success',
              text1: 'Profile updated successfully!',
            });
      navigation.goBack();
    } catch (error: any) {
      console.error('Profile update error:', error);
    //   toast.show(, { type: 'error' });
                Toast.show({
              type: 'success',
              text1: error.message || 'Failed to update profile',
            });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (changesMade) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const getUserInitials = () => {
    if (!user?.firstName && !user?.lastName) return 'U';
    return `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            iconColor={theme.colors.primary}
            size={p(28)}
            onPress={handleCancel}
          />
          <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
            Edit Profile
          </Text>
          <View style={styles.headerRight}>
            {isLoading && <ActivityIndicator size="small" color={theme.colors.primary} />}
          </View>
        </View>

        {/* Profile Card */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            {/* Profile Preview */}
            <View style={styles.profilePreview}>
              <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.avatarText}>{getUserInitials()}</Text>
              </View>
              <View style={styles.previewText}>
                <Text style={[styles.previewName, { color: theme.colors.onSurface }]}>
                  {formData.firstName} {formData.lastName}
                </Text>
                <Text style={[styles.previewEmail, { color: theme.colors.onSurfaceVariant }]}>
                  {formData.email}
                </Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* Form Fields */}
            <View style={styles.form}>
              <View style={styles.nameRow}>
                <TextInput
                  label="First Name"
                  value={formData.firstName}
                  onChangeText={(value) => handleInputChange('firstName', value)}
                  mode="outlined"
                  style={[styles.input, styles.halfInput]}
                  theme={{ fonts: { bodyLarge: { fontSize: p(14) } } }}
                  disabled={isLoading}
                />
                <TextInput
                  label="Last Name"
                  value={formData.lastName}
                  onChangeText={(value) => handleInputChange('lastName', value)}
                  mode="outlined"
                  style={[styles.input, styles.halfInput]}
                  theme={{ fonts: { bodyLarge: { fontSize: p(14) } } }}
                  disabled={isLoading}
                />
              </View>

              <TextInput
                label="Email"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                theme={{ fonts: { bodyLarge: { fontSize: p(14) } } }}
                disabled={isLoading}
              />

              <TextInput
                label="Phone Number"
                value={formData.contactPhone}
                onChangeText={(value) => handleInputChange('contactPhone', value)}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.input}
                theme={{ fonts: { bodyLarge: { fontSize: p(14) } } }}
                disabled={isLoading}
              />

              {/* Read-only Fields */}
              <View style={styles.readOnlySection}>
                <Text style={[styles.readOnlyLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Additional Information
                </Text>
                <View style={styles.readOnlyRow}>
                  <Text style={[styles.readOnlyField, { color: theme.colors.onSurfaceVariant }]}>
                    User ID:
                  </Text>
                  <Text style={[styles.readOnlyValue, { color: theme.colors.onSurface }]}>
                    {user?.id}
                  </Text>
                </View>
                <View style={styles.readOnlyRow}>
                  <Text style={[styles.readOnlyField, { color: theme.colors.onSurfaceVariant }]}>
                    Role:
                  </Text>
                  <Text style={[styles.readOnlyValue, { color: theme.colors.onSurface }]}>
                    {user?.role?.replace('ROLE_', '')}
                  </Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={handleCancel}
            style={[styles.button, styles.cancelButton]}
            labelStyle={{ fontSize: p(14) }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={[styles.button, styles.saveButton]}
            labelStyle={{ fontSize: p(14) }}
            loading={isLoading}
            disabled={isLoading || !changesMade}
          >
            Save Changes
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: p(12),
    paddingTop: p(40),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: p(16),
  },
  headerTitle: {
    fontSize: p(20),
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: p(8),
  },
  headerRight: {
    width: p(28),
  },
  card: {
    marginBottom: p(16),
    borderRadius: p(8),
  },
  profilePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: p(12),
  },
  avatar: {
    width: p(56),
    height: p(56),
    borderRadius: p(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: p(12),
  },
  avatarText: {
    color: 'white',
    fontSize: p(18),
    fontWeight: 'bold',
  },
  previewText: {
    flex: 1,
  },
  previewName: {
    fontSize: p(18),
    fontWeight: '600',
    marginBottom: p(2),
  },
  previewEmail: {
    fontSize: p(14),
  },
  divider: {
    marginVertical: p(12),
  },
  form: {
    gap: p(12),
  },
  nameRow: {
    flexDirection: 'row',
    gap: p(12),
  },
  input: {
    flex: 1,
  },
  halfInput: {
    flex: 1,
  },
  readOnlySection: {
    marginTop: p(8),
  },
  readOnlyLabel: {
    fontSize: p(14),
    fontWeight: '600',
    marginBottom: p(8),
  },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: p(6),
  },
  readOnlyField: {
    fontSize: p(13),
    fontWeight: '500',
  },
  readOnlyValue: {
    fontSize: p(13),
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    gap: p(12),
    marginTop: p(8),
  },
  button: {
    flex: 1,
    borderRadius: p(6),
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    // Uses default contained style
  },
});