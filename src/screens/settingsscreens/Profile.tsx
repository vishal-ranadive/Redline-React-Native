import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Avatar,
  Text,
  List,
  Divider,
  Button,
  useTheme,
  Surface,
} from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/common/Header';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type ProfileNavProp = NativeStackNavigationProp<RootStackParamList, 'UpdateProfile'>;

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileNavProp>();
  const { user, fetchProfile } = useAuthStore();
  const { colors } = useTheme();

  React.useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id);
    }
  }, [user?.id]);

  if (!user) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text variant="bodyLarge">No user data available.</Text>
      </View>
    );
  }

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Profile" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header section */}
        <View style={styles.header}>
          <Avatar.Text
            size={80}
            label={user.firstName?.[0]?.toUpperCase() || '?'}
            style={{ backgroundColor: colors.primary }}
          />
          <Text variant="headlineSmall" style={[styles.name, { color: colors.onBackground }]}>
            {fullName || 'Unnamed User'}
          </Text>
          <Text variant="bodyMedium" style={[styles.email, { color: colors.onSurfaceVariant }]}>
            {user.email}
          </Text>
        </View>

        {/* Profile info section */}
        <Surface style={[styles.card, { backgroundColor: colors.surface }]}>

          <Divider />
          <List.Item
            title="Role"
            description={user.role || '—'}
            left={(props) => <List.Icon {...props} icon="briefcase-outline" />}
          />
          <Divider />
          <List.Item
            title="Corporate"
            description={user.corporateName || '—'}
            left={(props) => <List.Icon {...props} icon="office-building-outline" />}
          />
          <Divider />
          <List.Item
            title="Franchise"
            description={user.franchiseName || '—'}
            left={(props) => <List.Icon {...props} icon="store-outline" />}
          />
          <Divider />
          {user.firestationName && (
            <>
              <List.Item
                title="Fire Station"
                description={user.firestationName}
                left={(props) => <List.Icon {...props} icon="fire-truck" />}
              />
              <Divider />
            </>
          )}
          <List.Item
            title="Address"
            description={`${user.address || ''}, ${user.city || ''}, ${user.state || ''}, ${user.zipCode || ''}`}
            left={(props) => <List.Icon {...props} icon="map-marker-outline" />}
          />
          <Divider />
          <List.Item
            title="Phone"
            description={user.contactPhone || '—'}
            left={(props) => <List.Icon {...props} icon="phone-outline" />}
          />
          <Divider />
          <List.Item
            title="Status"
            description={user.status ? 'Active' : 'Inactive'}
            left={(props) => <List.Icon {...props} icon="check-decagram-outline" />}
          />
          <Divider />
          <List.Item
            title="Last Login"
            description={user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '—'}
            left={(props) => <List.Icon {...props} icon="clock-outline" />}
          />
        </Surface>

        {/* Edit Profile button */}
        <Button
          mode="contained"
          style={[styles.editButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('UpdateProfile')}
        >
          Edit Profile
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    marginTop: 8,
    fontWeight: '600',
  },
  email: {
    opacity: 0.7,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  editButton: {
    marginTop: 24,
    borderRadius: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
