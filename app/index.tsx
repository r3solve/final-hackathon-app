import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('🔄 App routing - Loading:', loading, 'User:', user ? user.email : 'None');
    if (!loading) {
      if (user) {
        console.log('✅ User authenticated, navigating to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('❌ No user, navigating to welcome');
        router.replace('/(auth)/welcome');
      }
    }
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  text: {
    fontSize: 18,
    color: '#6B7280',
  },
});