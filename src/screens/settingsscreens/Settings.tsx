import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Modal } from 'react-native';
import { Text, useTheme, IconButton, Divider, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { p } from '../../utils/responsive';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

type ThemePreference = 'light' | 'dark' | 'automatic';

const themeOptions: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: 'white-balance-sunny' },
  { value: 'dark', label: 'Dark', icon: 'moon-waning-crescent' },
  { value: 'automatic', label: 'Automatic', icon: 'theme-light-dark' },
];

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const { themePreference, setThemePreference, loadThemePreference } = useThemeStore();
  const { user } = useAuthStore();
  const [permissionsExpanded, setPermissionsExpanded] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const handleOpenProfile = () => {
    navigation.navigate('Profile'); // 👈 navigate to Profile screen
  };

  const handleThemeSelect = async (preference: ThemePreference) => {
    await setThemePreference(preference);
    setThemeModalVisible(false);
  };

  const getCurrentThemeLabel = () => {
    return themeOptions.find(opt => opt.value === themePreference)?.label || 'Automatic';
  };

  const getCurrentThemeIcon = () => {
    return themeOptions.find(opt => opt.value === themePreference)?.icon || 'theme-light-dark';
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
            onPress={() => navigation.goBack()}
          />
          <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>Settings</Text>
        </View>

        {/* Profile Row */}
        <TouchableOpacity onPress={handleOpenProfile} activeOpacity={0.8}>
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <View style={styles.profileRow}>
                <View style={styles.profileLeft}>
                  <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.avatarText}>
                      {(user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.userName, { color: theme.colors.onSurface }]}>
                      {user?.firstName} {user?.lastName}
                    </Text>
                    <Text style={[styles.userEmail, { color: theme.colors.onSurfaceVariant }]}>
                      {user?.email}
                    </Text>
                  </View>
                </View>

                {/* Right Arrow */}
                <IconButton
                  icon="chevron-right"
                  iconColor={theme.colors.outline}
                  size={p(20)}
                />
              </View>
            </Card.Content>
          </Card>
        </TouchableOpacity>

        {/* Preferences Section */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Preferences
            </Text>
            <Divider style={styles.divider} />
            
            {/* Theme Selector */}
            <TouchableOpacity 
              style={styles.preferenceRow}
              onPress={() => setThemeModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.preferenceLabelContainer}>
                <IconButton
                  icon={getCurrentThemeIcon()}
                  iconColor={theme.colors.primary}
                  size={p(18)}
                />
                <View>
                  <Text style={[styles.preferenceLabel, { color: theme.colors.onSurface }]}>
                    Theme
                  </Text>
                  <Text style={[styles.preferenceValue, { color: theme.colors.onSurfaceVariant }]}>
                    {getCurrentThemeLabel()}
                  </Text>
                </View>
              </View>
              <IconButton
                icon="chevron-down"
                iconColor={theme.colors.outline}
                size={p(20)}
              />
            </TouchableOpacity>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Theme Selection Modal */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setThemeModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              Select Theme
            </Text>
            <Divider style={styles.modalDivider} />
            
            {themeOptions.map((option, index) => (
              <React.Fragment key={option.value}>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => handleThemeSelect(option.value)}
                  activeOpacity={0.7}
                >
                  <View style={styles.modalOptionLeft}>
                    <IconButton
                      icon={option.icon}
                      iconColor={theme.colors.primary}
                      size={p(20)}
                    />
                    <Text style={[styles.modalOptionText, { color: theme.colors.onSurface }]}>
                      {option.label}
                    </Text>
                  </View>
                  {themePreference === option.value && (
                    <IconButton
                      icon="check"
                      iconColor={theme.colors.primary}
                      size={p(20)}
                    />
                  )}
                </TouchableOpacity>
                {index < themeOptions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: p(12), paddingTop: p(40), paddingBottom: p(60) },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: p(16) },
  headerTitle: { fontSize: p(20), fontWeight: '600' },
  card: { marginBottom: p(12), borderRadius: p(8) },
  sectionTitle: { fontSize: p(16), fontWeight: '600' },
  divider: { marginVertical: p(8) },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: p(48),
    height: p(48),
    borderRadius: p(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: p(12),
  },
  avatarText: { color: 'white', fontSize: p(16), fontWeight: 'bold' },
  userName: { fontSize: p(16), fontWeight: '600' },
  userEmail: { fontSize: p(12) },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: p(4),
  },
  preferenceLabelContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  preferenceLabel: { fontSize: p(14), marginLeft: p(4), fontWeight: '500' },
  preferenceValue: { fontSize: p(12), marginLeft: p(4) },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: p(20),
  },
  modalContent: {
    width: '90%',
    maxWidth: p(400),
    borderRadius: p(12),
    padding: p(20),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: p(18),
    fontWeight: '600',
    marginBottom: p(8),
  },
  modalDivider: {
    marginBottom: p(12),
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: p(8),
  },
  modalOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalOptionText: {
    fontSize: p(16),
    marginLeft: p(4),
  },
});
