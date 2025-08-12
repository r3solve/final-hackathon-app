import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PINInput from './PINInput';
import { PINManager } from '@/lib/pin-manager';

interface PINVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string;
  subtitle?: string;
  amount?: string;
  operation: 'deposit' | 'send' | 'payment';
}

export default function PINVerificationModal({
  visible,
  onClose,
  onSuccess,
  title,
  subtitle,
  amount,
  operation,
}: PINVerificationModalProps) {
  const [error, setError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);

  useEffect(() => {
    if (visible) {
      checkLockoutStatus();
      setError('');
    }
  }, [visible]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (visible && isLockedOut) {
      interval = setInterval(checkLockoutStatus, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [visible, isLockedOut]);

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
        // PIN is correct - proceed with operation
        onSuccess();
        onClose();
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
      'Cancel Operation?',
      `Are you sure you want to cancel this ${operation}?`,
      [
        {
          text: 'Continue',
          style: 'cancel',
        },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: onClose,
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
    
    return subtitle || `Enter your PIN to confirm this ${operation}`;
  };

  const getTitle = () => {
    if (amount) {
      return `${title} - ₵${amount}`;
    }
    return title;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <PINInput
          title={getTitle()}
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
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
