import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import PINInput from '@/components/PINInput';
import { PINManager } from '@/lib/pin-manager';
import { useAuth } from '@/contexts/AuthContext';

export default function CreatePIN() {
  const { user } = useAuth();
  const [step, setStep] = useState<'first' | 'confirm'>('first');
  const [firstPIN, setFirstPIN] = useState('');
  const [error, setError] = useState('');

  const handleFirstPINComplete = (pin: string) => {
    setFirstPIN(pin);
    setStep('confirm');
    setError('');
  };

  const handleConfirmPINComplete = async (pin: string) => {
    if (pin !== firstPIN) {
      setError('PINs do not match. Please try again.');
      setStep('first');
      setFirstPIN('');
      return;
    }

    if (!user?.uid) {
      setError('User not authenticated. Please sign in again.');
      return;
    }

    try {
      const result = await PINManager.createPIN(user.uid, pin);
      
      if (result.success) {
        Alert.alert(
          'PIN Created Successfully!',
          'Your 4-digit PIN has been set up. You will need to enter this PIN whenever you restart the app or make payments.',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Navigate to the main app
                router.replace('/(tabs)');
              },
            },
          ]
        );
      } else {
        setError(result.error || 'Failed to create PIN. Please try again.');
        setStep('first');
        setFirstPIN('');
      }
    } catch (error) {
      console.error('Error creating PIN:', error);
      setError('An unexpected error occurred. Please try again.');
      setStep('first');
      setFirstPIN('');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel PIN Setup?',
      'You must set up a PIN to use the app securely. Are you sure you want to cancel?',
      [
        {
          text: 'Continue Setup',
          style: 'cancel',
        },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            // Sign out the user if they cancel PIN setup
            // This ensures security
            router.replace('/(auth)/sign-in');
          },
        },
      ]
    );
  };

  const getStepContent = () => {
    if (step === 'first') {
      return {
        title: 'Create Your PIN',
        subtitle: 'Enter a 4-digit PIN to secure your account. You will need this PIN to access the app and make payments.',
        onPINComplete: handleFirstPINComplete,
        showCancel: true,
        onCancel: handleCancel,
        allowShowPIN: true,
      };
    } else {
      return {
        title: 'Confirm Your PIN',
        subtitle: 'Please enter the same PIN again to confirm.',
        onPINComplete: handleConfirmPINComplete,
        showCancel: true,
        onCancel: () => {
          setStep('first');
          setFirstPIN('');
          setError('');
        },
        allowShowPIN: true,
      };
    }
  };

  const stepContent = getStepContent();

  return (
    <SafeAreaView style={styles.container}>
      <PINInput
        {...stepContent}
        error={error}
        showPIN={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
