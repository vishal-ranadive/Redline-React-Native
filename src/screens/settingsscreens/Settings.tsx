import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
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

  const handleOpenProfile = () => {
    navigation.navigate('Profile'); // 👈 navigate to Profile screen
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
      </ScrollView>
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
  },
  preferenceLabelContainer: { flexDirection: 'row', alignItems: 'center' },
  preferenceLabel: { fontSize: p(14), marginLeft: p(4) },
});
