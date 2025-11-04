// src\components\common\AuthGuard.tsx
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback = null 
}) => {
  const { accessToken, isLoading } = useAuthStore();

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Show children if authenticated, fallback if not
  return accessToken ? <>{children}</> : <>{fallback}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});