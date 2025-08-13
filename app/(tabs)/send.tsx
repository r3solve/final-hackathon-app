import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft,  User, Phone, DollarSign, Send } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import PINVerificationModal from '@/components/PINVerificationModal';

export default function SendScreen() {
  const { profile } = useAuth();
  const [recipientPhone, setRecipientPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [showPINModal, setShowPINModal] = useState(false);

  const handleSendMoney = () => {
    if (!recipientPhone.trim()) {
      Alert.alert('Error', 'Please enter recipient phone number');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const amountValue = parseFloat(amount);
    if (amountValue < 1) {
      Alert.alert('Error', 'Minimum amount is ₵1.00');
      return;
    }

    if (amountValue > 10000) {
      Alert.alert('Error', 'Maximum amount is ₵10,000.00');
      return;
    }

    if (profile && amountValue > profile.walletBalance) {
      Alert.alert('Insufficient Balance', 'You do not have enough balance to send this amount');
      return;
    }

    // Show PIN verification modal
    setShowPINModal(true);
  };

  const handlePINVerificationSuccess = () => {
    // PIN verified successfully - proceed with money transfer
    Alert.alert(
      'Transfer Successful!',
      `You have successfully sent ₵${parseFloat(amount).toFixed(2)} to ${recipientPhone}`,
      [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setRecipientPhone('');
            setAmount('');
            setNote('');
            // Navigate back to profile
            router.back();
          },
        },
      ]
    );
  };

  const handleBackToProfile = () => {
    router.back();
  };

  const formatAmount = (value: string) => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toFixed(2);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToProfile}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Send Money</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            ₵{profile?.walletBalance ? profile.walletBalance.toFixed(2) : '0.00'}
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Recipient Details</Text>
          
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Phone size={20} color="#6B7280" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Recipient phone number"
              value={recipientPhone}
              onChangeText={setRecipientPhone}
              keyboardType="phone-pad"
              autoFocus={true}
            />
          </View>

          <Text style={styles.inputNote}>
            Enter the phone number of the person you want to send money to
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Transfer Amount</Text>
          
          <View style={styles.amountInputContainer}>
            <View style={styles.currencyIcon}>
              <DollarSign size={24} color="#22C55E" />
            </View>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.inputNote}>
            Minimum: ₵1.00 | Maximum: ₵10,000.00
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Note (Optional)</Text>
          
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <User size={20} color="#6B7280" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Add a note for this transfer"
              value={note}
              onChangeText={setNote}
              multiline={true}
              numberOfLines={3}
            />
          </View>
        </View>

        {amount && parseFloat(amount) > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Transfer Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Recipient:</Text>
              <Text style={styles.summaryValue}>{recipientPhone}</Text>
            </View>
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
            {note && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Note:</Text>
                <Text style={styles.summaryValue}>{note}</Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!recipientPhone.trim() || !amount || parseFloat(amount) <= 0) && styles.sendButtonDisabled
          ]}
          onPress={handleSendMoney}
          disabled={!recipientPhone.trim() || !amount || parseFloat(amount) <= 0}
        >
          <Send  color="#FFFFFF" />
          <Text style={styles.sendButtonText}>Send Money</Text>
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Important Information</Text>
          <Text style={styles.infoText}>
            • Transfers are instant and cannot be reversed{'\n'}
            • Make sure you have the correct phone number{'\n'}
            • No fees for transfers{'\n'}
            • Recipient will receive an SMS notification
          </Text>
        </View>
      </ScrollView>

      {/* PIN Verification Modal */}
      <PINVerificationModal
        visible={showPINModal}
        onClose={() => setShowPINModal(false)}
        onSuccess={handlePINVerificationSuccess}
        title="Verify Your PIN"
        subtitle="Enter your 4-digit PIN to confirm this transfer"
        amount={amount}
        operation="send"
      />
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
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  balanceCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 24,
    marginTop: 24,
    marginBottom: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#22C55E',
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  currencyIcon: {
    marginRight: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  inputNote: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22C55E',
  },
  sendButton: {
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 32,
    gap: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});