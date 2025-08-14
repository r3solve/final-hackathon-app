import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, DollarSign, CheckCircle, AlertCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import PINVerificationModal from '@/components/PINVerificationModal';

export default function Withdraw() {
  const { user, profile } = useAuth();
  const [amount, setAmount] = useState('');
  const [showPINModal, setShowPINModal] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<'pending' | 'success' | 'failed' | null>(null);

  const handleProceedToWithdraw = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to withdraw.');
      return;
    }
    if (parseFloat(amount) > (profile?.walletBalance || 0)) {
      Alert.alert('Insufficient Balance', 'You do not have enough balance to withdraw this amount.');
      return;
    }
    setShowPINModal(true);
  };

  const handlePINVerificationSuccess = async() => {
    setTransactionStatus('pending');
    try {
        const response = await fetch('https://us-central1-study-clinic-199f9.cloudfunctions.net/transferFunds', {
          method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone: profile?.phoneNumber,
                amount: parseFloat(amount),
                network: "MTN",
            }),
        });
        const data = await response.json();
        if (data.success) {
          setTransactionStatus('success');
          // Optionally, update user's wallet balance in context or state
        } else {
          setTransactionStatus('failed');
          Alert.alert('Withdrawal Failed', data.message || 'Something went wrong. Please try again.');
        }
    } catch (error) {
        setTransactionStatus('failed');
        Alert.alert('Withdrawal Error', 'An error occurred while processing your withdrawal. Please try again later.');
    }
  };

  const handleBackToProfile = () => {
    router.replace('/(tabs)/profile');
  };

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts.length === 2 && parts[1].length > 2) return;
    setAmount(cleaned);
  };

  const formatAmount = (value: string) => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toFixed(2);
  };

  if (transactionStatus === 'success') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle size={80} color="#22C55E" />
          </View>
          <Text style={styles.successTitle}>Withdrawal Successful!</Text>
          <Text style={styles.successSubtitle}>
            Your withdrawal of ₵{formatAmount(amount)} has been processed successfully.
          </Text>
          <Text style={styles.successNote}>
            Redirecting you back to your profile...
          </Text>
          <TouchableOpacity
            style={styles.successButton}
            onPress={handleBackToProfile}
          >
            <Text style={styles.successButtonText}>Go to Profile Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (transactionStatus === 'failed') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <AlertCircle size={64} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>Withdrawal Failed</Text>
          <Text style={styles.errorText}>Something went wrong. Please try again.</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => setTransactionStatus(null)}
          >
            <Text style={styles.errorButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.errorButton, styles.errorButtonSecondary]}
            onPress={handleBackToProfile}
          >
            <Text style={[styles.errorButtonText, styles.errorButtonTextSecondary]}>Back to Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Withdraw Money</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleBackToProfile}
          >
            <Text style={styles.profileButtonText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.amountContainer}>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Current Balance:</Text>
            <Text style={styles.balanceValue}>
              {profile?.walletBalance ? `₵${profile.walletBalance.toFixed(2)}` : '₵0.00'}
            </Text>
          </View>

          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₵</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              autoFocus={true}
              returnKeyType="done"
              onSubmitEditing={handleProceedToWithdraw}
            />
          </View>

          {amount && parseFloat(amount) > 0 && (
            <View style={styles.depositSummary}>
              <Text style={styles.summaryTitle}>Withdrawal Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount:</Text>
                <Text style={styles.summaryValue}>₵{formatAmount(amount)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fee:</Text>
                <Text style={styles.summaryValue}>₵0.00</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total:</Text>
                <Text style={styles.summaryTotal}>₵{formatAmount(amount)}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.proceedButton, !amount || parseFloat(amount) <= 0 ? styles.proceedButtonDisabled : null]}
            onPress={handleProceedToWithdraw}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            <Text style={styles.proceedButtonText}>Proceed to Withdraw</Text>
          </TouchableOpacity>

          <Text style={styles.amountNote}>
            Withdrawals are processed instantly to your linked account.
          </Text>

          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>Need Help?</Text>
            <Text style={styles.helpText}>
              • Minimum withdrawal: ₵1.00{'\n'}
              • Maximum withdrawal: ₵100,000.00{'\n'}
              • No fees for withdrawals{'\n'}
              • Instant processing
            </Text>
            <TouchableOpacity
              style={styles.supportButton}
              onPress={() => {
                Alert.alert(
                  'Contact Support',
                  'For assistance with withdrawals, please contact our support team at support@payflow.com or call +233 XX XXX XXXX',
                  [{ text: 'OK', style: 'default' }]
                );
              }}
            >
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  profileButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  amountContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#22C55E',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginRight: 4,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minWidth: 200,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#22C55E',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  proceedButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 24,
  },
  proceedButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  amountNote: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: 16,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#22C55E',
    marginBottom: 16,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  successNote: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  successButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  errorButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorButtonSecondary: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    borderWidth: 1,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorButtonTextSecondary: {
    color: '#374151',
  },
  depositSummary: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22C55E',
  },
  helpSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  supportButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
  },
  supportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  }})