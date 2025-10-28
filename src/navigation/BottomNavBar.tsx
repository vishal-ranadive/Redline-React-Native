import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { p } from '../utils/responsive'; // scaling helper

export default function BottomNavBar() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute();

  const items = [
    { label: 'Home', icon: 'home', screen: 'LeadScreen' },
    { label: 'Settings', icon: 'cog', screen: 'Settings' },
    { label: 'Logout', icon: 'logout', screen: 'Login' },
  ];

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
            onPress={() => {
              if (item.label === 'Logout') {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              } else {
                navigation.navigate(item.screen);
              }
            }}
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
