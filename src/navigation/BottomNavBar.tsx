import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { p } from '../utils/responsive';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

export default function BottomNavBar() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { logout } = useAuthStore();
  // const { resetTheme } = useThemeStore(); // Optional: Add resetTheme to themeStore if needed

  const items = [
    { label: 'Home', icon: 'home', screen: 'LeadScreen' },
    { label: 'Settings', icon: 'cog', screen: 'Settings' },
    { label: 'Logout', icon: 'logout', screen: 'Login' },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ]
    );
  };

  const performLogout = async () => {
    try {
      console.log('🚪 Starting logout process...');
      
      // Clear auth store (now async and clears all stores)
      await logout();
      
      // Clear theme store if you have reset functionality
      // resetTheme();
      
      console.log('✅ All stores cleared, navigating to login');
      
      // Navigate to login screen and reset navigation stack
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Fallback navigation if something goes wrong
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  const handleNavigation = (item: any) => {
    if (item.label === 'Logout') {
      handleLogout();
    } else {
      navigation.navigate(item.screen);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, shadowColor: colors.outline },
      ]}
    >
      {items.map((item) => {
        const active = route.name === item.screen;
        return (
          <TouchableOpacity
            key={item.label}
            style={styles.navItem}
            onPress={() => handleNavigation(item)}
          >
            <View
              style={[
                styles.iconCapsule,
                {
                  backgroundColor: active ? colors.primary : 'transparent',
                  borderColor: active ? colors.primary : colors.outline,
                },
              ]}
            >
              <Icon
                source={item.icon}
                size={p(20)}
                color={active ? colors.onPrimary : colors.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.label,
                  {
                    color: active ? colors.onPrimary : colors.onSurfaceVariant,
                  },
                ]}
              >
                {item.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: p(10),
    borderTopLeftRadius: p(20),
    borderTopRightRadius: p(20),
    elevation: 6,
  },
  navItem: {
    alignItems: 'center',
  },
  iconCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: p(20),
    paddingHorizontal: p(14),
    paddingVertical: p(6),
  },
  label: {
    marginLeft: p(6),
    fontWeight: '600',
    fontSize: p(12),
  },
});