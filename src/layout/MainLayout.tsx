import React from 'react';
import { View, StyleSheet } from 'react-native';
import BottomNavBar from '../navigation/BottomNavBar';
import { useRoute } from '@react-navigation/native';

type Props = {
  children: React.ReactNode;
};

export default function MainLayout({ children }: Props) {
  const route = useRoute();

  // Screens where the bottom nav should be hidden
  const hideBottomNav = [ 'Login', 'ForgotPassword', 'ResetPassword'];

  return (
    <View style={styles.container}>
      <View style={styles.content}>{children}</View>
      {!hideBottomNav.includes(route.name) && <BottomNavBar />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
});
