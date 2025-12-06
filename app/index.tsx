import React, { useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // ✅ Works in all versions
  useEffect(() => {
    const redirectUri = AuthSession.makeRedirectUri({
      native: 'your.app://redirect', // fallback for native apps
    });
    console.log('✅ Your Expo Redirect URI:', redirectUri);
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/auth');
      } else {
        switch (user.role) {
          case 'customer':
            router.replace('/customer');
            break;
          default:
            router.replace('/auth');
        }
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
