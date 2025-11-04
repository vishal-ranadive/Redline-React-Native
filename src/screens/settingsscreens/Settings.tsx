// src/screens/settingsscreens/Settings.tsx
import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, IconButton, Switch, Divider, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { p } from '../../utils/responsive';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const { theme: appTheme, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const [permissionsExpanded, setPermissionsExpanded] = useState(false);

  const handleEditProfile = () => {
    console.log('Navigate to Update Profile');
      navigation.navigate('UpdateProfile');
  };

  const togglePermissions = () => {
    setPermissionsExpanded(!permissionsExpanded);
  };

  const getUserInitials = () => {
    if (!user?.firstName && !user?.lastName) return 'U';
    return `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`.toUpperCase();
  };

  // Compact permission grouping
  const groupPermissions = () => {
    if (!user?.permissions) return {};
    
    const groups: { [key: string]: string[] } = {};
    
    user.permissions.forEach(permission => {
      const action = permission.split('_')[0]; // VIEW, CREATE, UPDATE, DELETE
      const resource = permission.split('_')[1] || 'Other';
      
      if (!groups[resource]) {
        groups[resource] = [];
      }
      groups[resource].push(action);
    });
    
    return groups;
  };

  const permissionGroups = groupPermissions();

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
          <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
            Settings
          </Text>
        </View>

        {/* Profile Section */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Profile
              </Text>
              <IconButton
                icon="pencil"
                iconColor={theme.colors.primary}
                size={p(18)}
                onPress={handleEditProfile}
              />
            </View>

            <Divider style={styles.divider} />

            <View style={styles.profileInfo}>
              <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.avatarText}>{getUserInitials()}</Text>
              </View>

              <View style={styles.userDetails}>
                <Text style={[styles.userName, { color: theme.colors.onSurface }]}>
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text style={[styles.userEmail, { color: theme.colors.onSurfaceVariant }]}>
                  {user?.email}
                </Text>
                <Text style={[styles.userRole, { color: theme.colors.primary }]}>
                  {user?.role?.replace('ROLE_', '')}
                </Text>
              </View>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Phone
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                  {user?.contactPhone || 'N/A'}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Status
                </Text>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusDot, { backgroundColor: user?.status ? '#4CAF50' : '#f44336' }]} />
                  <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                    {user?.status ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Preferences Section */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Preferences
            </Text>
            <Divider style={styles.divider} />

            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLabelContainer}>
                <IconButton
                  icon={appTheme === 'dark' ? 'white-balance-sunny' : 'moon-waning-crescent'}
                  iconColor={theme.colors.primary}
                  size={p(18)}
                />
                <Text style={[styles.preferenceLabel, { color: theme.colors.onSurface }]}>
                  {appTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </Text>
              </View>
              <Switch
                value={appTheme === 'dark'}
                onValueChange={toggleTheme}
                color={theme.colors.primary}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Permissions Section - Compact */}
        {user?.permissions && user.permissions.length > 0 && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                    Permissions
                  </Text>
                  <Text style={[styles.permissionsCount, { color: theme.colors.onSurfaceVariant }]}>
                    {user.permissions.length} total • {Object.keys(permissionGroups).length} categories
                  </Text>
                </View>
                <IconButton
                  icon={permissionsExpanded ? 'chevron-up' : 'chevron-down'}
                  iconColor={theme.colors.primary}
                  size={p(20)}
                  onPress={togglePermissions}
                />
              </View>

              {permissionsExpanded && (
                <View style={styles.permissionsContent}>
                  <Divider style={styles.divider} />
                  <View style={styles.permissionsGrid}>
                    {Object.entries(permissionGroups).map(([resource, actions]) => (
                      <View key={resource} style={styles.permissionGroup}>
                        <Text style={[styles.permissionCategory, { color: theme.colors.primary }]}>
                          {resource}
                        </Text>
                        <Text style={[styles.permissionActions, { color: theme.colors.onSurface }]}>
                          {actions.join(', ')}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </Card.Content>
          </Card>
        )}
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
    paddingBottom: p(60),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: p(16),
  },
  headerTitle: {
    fontSize: p(20),
    fontWeight: '600',
  },
  card: {
    marginBottom: p(12),
    borderRadius: p(8),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: p(4),
  },
  sectionTitle: {
    fontSize: p(16),
    fontWeight: '600',
  },
  divider: {
    marginVertical: p(8),
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: p(12),
  },
  avatar: {
    width: p(48),
    height: p(48),
    borderRadius: p(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: p(12),
  },
  avatarText: {
    color: 'white',
    fontSize: p(16),
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: p(16),
    fontWeight: '600',
    marginBottom: p(2),
  },
  userEmail: {
    fontSize: p(12),
    marginBottom: p(2),
  },
  userRole: {
    fontSize: p(11),
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: p(11),
    marginBottom: p(2),
    fontWeight: '500',
  },
  detailValue: {
    fontSize: p(12),
    fontWeight: '400',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: p(6),
    height: p(6),
    borderRadius: p(3),
    marginRight: p(6),
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferenceLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceLabel: {
    fontSize: p(14),
    marginLeft: p(4),
  },
  permissionsCount: {
    fontSize: p(11),
    marginTop: p(2),
  },
  permissionsContent: {
    marginTop: p(4),
  },
  permissionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  permissionGroup: {
    width: '48%',
    marginBottom: p(8),
    padding: p(6),
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: p(4),
  },
  permissionCategory: {
    fontSize: p(12),
    fontWeight: '600',
    marginBottom: p(2),
    textTransform: 'capitalize',
  },
  permissionActions: {
    fontSize: p(10),
    fontWeight: '400',
  },
});