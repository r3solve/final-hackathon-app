import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { PINManager } from '@/lib/pin-manager';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Onboarding from './onboarding';

function RootLayoutNav() {
  const { user, loading, hasPIN, pinVerified } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Show splash for 3 seconds
    const splashTimer = setTimeout(async () => {
      setShowSplash(false);
      // Check if user has seen onboarding
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        if (!hasSeenOnboarding) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setShowOnboarding(true);
      }
    }, 3000);

    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    if (!loading && user && !showSplash && !showOnboarding) {
      // Check if user has a PIN
      if (hasPIN && !pinVerified) {
        // User has PIN but hasn't verified it - redirect to PIN verification
        router.replace('/(auth)/verify-pin');
      } else if (!hasPIN) {
        // User doesn't have PIN - redirect to PIN creation
        router.replace('/(auth)/create-pin');
      }
    }
  }, [user, loading, hasPIN, pinVerified, showSplash, showOnboarding]);

  if (loading || showSplash) {
    return null; // Show loading screen or splash
  }

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="document-upload" options={{ title: 'Documents', headerShown: false }} />
        <Stack.Screen name="verify/[id]" options={{  title: 'Verify Transaction' }} />
        <Stack.Screen name="approve/[id]" options={{ title: 'Approve Transaction' }} />
        
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}