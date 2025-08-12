import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import PINInput from '@/components/PINInput';
import { PINManager } from '@/lib/pin-manager';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyPIN() {
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);

  useEffect(() => {
    checkLockoutStatus();
    const interval = setInterval(checkLockoutStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkLockoutStatus = async () => {
    try {
      const attempts = await PINManager.getRemainingAttempts();
      const lockoutTime = await PINManager.getLockoutTimeRemaining();
      
      setRemainingAttempts(attempts);
      setIsLockedOut(attempts === 0);
      setLockoutTimeRemaining(lockoutTime);
    } catch (error) {
      console.error('Error checking lockout status:', error);
    }
  };

  const handlePINComplete = async (pin: string) => {
    if (isLockedOut) {
      return;
    }

    try {
      const result = await PINManager.verifyPIN(pin);
      
      if (result.success) {
        // PIN is correct - navigate to main app
        router.replace('/(tabs)');
      } else {
        setError(result.error || 'Incorrect PIN');
        checkLockoutStatus(); // Update attempts count
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Sign Out?',
      'You must enter your PIN to access the app. Would you like to sign out instead?',
      [
        {
          text: 'Continue',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            // Sign out the user
            router.replace('/(auth)/sign-in');
          },
        },
      ]
    );
  };

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getSubtitle = () => {
    if (isLockedOut) {
      return `Too many failed attempts. Please wait ${formatTime(lockoutTimeRemaining)} before trying again.`;
    }
    
    if (remainingAttempts < 3) {
      return `Incorrect PIN. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`;
    }
    
    return 'Enter your 4-digit PIN to access the app.';
  };

  return (
    <SafeAreaView style={styles.container}>
      <PINInput
        title="Enter Your PIN"
        subtitle={getSubtitle()}
        onPINComplete={handlePINComplete}
        onCancel={handleCancel}
        showCancel={true}
        error={error}
        showPIN={false}
        allowShowPIN={false}
      />
      
      {isLockedOut && (
        <View style={styles.lockoutContainer}>
          <Text style={styles.lockoutText}>
            Account temporarily locked
          </Text>
          <Text style={styles.lockoutSubtext}>
            Time remaining: {formatTime(lockoutTimeRemaining)}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  lockoutContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  lockoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
  },
  lockoutSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
