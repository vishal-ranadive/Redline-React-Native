// src/screens/SettingsScreen.tsx
import React from 'react';
import { View, KeyboardAvoidingView, Platform, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, IconButton, Switch, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useThemeStore } from '../../store/themeStore';
import { p } from '../../utils/responsive';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const { theme: appTheme, toggleTheme } = useThemeStore();

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
          <Text
            variant="headlineMedium"
            style={[styles.headerTitle, { color: theme.colors.onBackground }]}
          >
            Settings
          </Text>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text
            variant="titleMedium"
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            Preferences
          </Text>

          <Divider style={{ marginVertical: p(8) }} />

          <View style={styles.preferenceRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconButton
                icon={appTheme === 'dark' ? 'white-balance-sunny' : 'moon-waning-crescent'}
                iconColor={theme.colors.primary}
                size={p(20)}
              />
              <Text style={[styles.preferenceLabel, { color: theme.colors.onBackground }]}>
                {appTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>

            <Switch
              value={appTheme === 'dark'}
              onValueChange={toggleTheme}
              color={theme.colors.primary}
            />
          </View>
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
    padding: p(16),
    paddingTop: p(40),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: p(24),
  },
  headerTitle: {
    fontSize: p(24),
    fontWeight: '600',
  },
  section: {
    marginTop: p(8),
  },
  sectionTitle: {
    fontSize: p(18),
    fontWeight: '600',
    marginBottom: p(6),
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: p(8),
  },
  preferenceLabel: {
    fontSize: p(16),
    marginLeft: p(6),
  },
});
