import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DollarSign, Phone, Shield, Info, CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';

export default function Send() {
  const { user, profile, canSendMoney } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [requireVerification, setRequireVerification] = useState(true);
  const [loading, setLoading] = useState(false);

  // Check if user can send money
  if (!canSendMoney()) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Send Money</Text>
            <Text style={styles.subtitle}>Transfer funds securely to friends and family</Text>
          </View>

          <View style={styles.verificationRequiredCard}>
            <View style={styles.verificationRequiredIcon}>
              <Shield size={48} color="#F59E0B" />
            </View>
            <Text style={styles.verificationRequiredTitle}>Verification Required</Text>
            <Text style={styles.verificationRequiredMessage}>
              You need to complete your identity verification before you can send money. This helps us ensure the security of all transactions.
            </Text>
            <TouchableOpacity
              style={styles.verificationRequiredButton}
              onPress={() => router.push('/(tabs)/document-upload')}
            >
              <Shield size={20} color="#FFFFFF" />
              <Text style={styles.verificationRequiredButtonText}>Complete Verification</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const validateInputs = () => {
    if (!phoneNumber.trim()) return 'Phone number is required';
    if (!amount.trim()) return 'Amount is required';
    
    // Validate Ghana phone number format
    const phoneRegex = /^\+233[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      return 'Please enter a valid Ghana phone number (e.g., +233501234567)';
    }
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return 'Amount must be a positive number';
    if (numAmount > (profile?.walletBalance || 0)) return 'Insufficient funds';
    
    return null;
  };

  const formatPhoneNumber = (text: string) => {
    // Remove all non-digit characters except +
    let cleaned = text.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +233
    if (!cleaned.startsWith('+233')) {
      if (cleaned.startsWith('233')) {
        cleaned = '+' + cleaned;
      } else if (cleaned.startsWith('0')) {
        cleaned = '+233' + cleaned.substring(1);
      } else if (cleaned.startsWith('+')) {
        // Keep as is
      } else {
        cleaned = '+233' + cleaned;
      }
    }
    
    // Limit to +233 + 9 digits
    if (cleaned.length > 13) {
      cleaned = cleaned.substring(0, 13);
    }
    
    return cleaned;
  };

  const handleSendMoney = async () => {
    const validationError = validateInputs();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    if (!user || !profile) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);

    try {
      // Find recipient by phone number
      const recipientQuery = query(
        collection(db, 'profiles'),
        where('phoneNumber', '==', phoneNumber.trim())
      );
      const recipientSnapshot = await getDocs(recipientQuery);

      if (recipientSnapshot.empty) {
        Alert.alert('Error', 'Recipient not found. Please check the phone number.');
        setLoading(false);
        return;
      }

      const recipientDoc = recipientSnapshot.docs[0];
      const recipientData = recipientDoc.data();

      if (recipientDoc.id === user.uid) {
        Alert.alert('Error', 'You cannot send money to yourself');
        setLoading(false);
        return;
      }

      // Create transfer request
      const transferData = {
        senderId: user.uid,
        recipientId: recipientDoc.id,
        amount: parseFloat(amount),
        status: requireVerification ? 'pending' : 'completed',
        requireVerification: requireVerification,
        createdAt: new Date(),
        senderName: profile.fullName,
        recipientName: recipientData.fullName,
        senderPhone: profile.phoneNumber,
        recipientPhone: recipientData.phoneNumber,
      };

      await addDoc(collection(db, 'transferRequests'), transferData);

      // If no verification required, create transaction immediately
      if (!requireVerification) {
        await addDoc(collection(db, 'transactions'), {
          senderId: user.uid,
          recipientId: recipientDoc.id,
          amount: parseFloat(amount),
          type: 'transfer',
          status: 'completed',
          createdAt: new Date(),
          senderName: profile.fullName,
          recipientName: recipientData.fullName,
        });
      }

      const successMessage = requireVerification 
        ? `Your transfer request of ${formatCurrency(parseFloat(amount))} to ${recipientData.fullName} has been sent. They will need to verify their identity before the transfer is completed.`
        : `Successfully sent ${formatCurrency(parseFloat(amount))} to ${recipientData.fullName}. The transfer has been completed immediately.`;

      Alert.alert(
        requireVerification ? 'Transfer Request Sent' : 'Transfer Completed',
        successMessage,
        [{ text: 'OK', onPress: () => {
          setPhoneNumber('');
          setAmount('');
          setRequireVerification(true);
        }}]
      );

    } catch (error: any) {
      console.error('Send money error:', error);
      Alert.alert('Error', 'Failed to send money. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Send Money</Text>
          <Text style={styles.subtitle}>Transfer funds securely to friends and family</Text>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <View style={styles.balanceIcon}>
              <DollarSign size={20} color="#22C55E" />
            </View>
          </View>
          <Text style={styles.balance}>
            {formatCurrency(profile?.walletBalance || 0)}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recipient Phone Number</Text>
            <View style={styles.inputContainer}>
              <Phone size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                placeholder="+233501234567"
                keyboardType="phone-pad"
                maxLength={13}
              />
            </View>
            <Text style={styles.helperText}>
              Enter Ghana phone number starting with +233
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount (GHS)</Text>
            <View style={styles.inputContainer}>
              <DollarSign size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.verificationSection}>
            <View style={styles.verificationHeader}>
              <View style={styles.verificationIcon}>
                <Shield size={20} color={requireVerification ? "#22C55E" : "#9CA3AF"} />
              </View>
              <View style={styles.verificationContent}>
                <Text style={styles.verificationTitle}>Require Identity Verification</Text>
                <Text style={styles.verificationSubtitle}>
                  {requireVerification 
                    ? 'Recipient must verify identity before transfer'
                    : 'Transfer will be completed immediately'
                  }
                </Text>
              </View>
              <Switch
                value={requireVerification}
                onValueChange={setRequireVerification}
                trackColor={{ false: '#E5E7EB', true: '#D1FAE5' }}
                thumbColor={requireVerification ? '#22C55E' : '#9CA3AF'}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendMoney}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Processing...' : 'Send Money'}
            </Text>
          </TouchableOpacity>

          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <Info size={16} color="#3B82F6" />
              <Text style={styles.infoTitle}>How it works</Text>
            </View>
            <View style={styles.infoContent}>
              {requireVerification ? (
                <>
                  <View style={styles.infoRow}>
                    <CheckCircle size={16} color="#22C55E" />
                    <Text style={styles.infoText}>
                      Transfer request is sent to recipient
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <CheckCircle size={16} color="#22C55E" />
                    <Text style={styles.infoText}>
                      Recipient must verify identity with selfie
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <CheckCircle size={16} color="#22C55E" />
                    <Text style={styles.infoText}>
                      Money is transferred after verification
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.infoRow}>
                    <CheckCircle size={16} color="#22C55E" />
                    <Text style={styles.infoText}>
                      Money is transferred immediately
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <CheckCircle size={16} color="#22C55E" />
                    <Text style={styles.infoText}>
                      No verification required
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <CheckCircle size={16} color="#22C55E" />
                    <Text style={styles.infoText}>
                      Instant transfer to recipient
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 32,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  balanceIcon: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
  },
  balance: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22C55E',
    marginTop: 4,
  },
  form: {
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  verificationSection: {
    marginTop: 20,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  verificationIcon: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
  },
  verificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  verificationSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  infoSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  infoContent: {
    //
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
  },
  verificationRequiredCard: {
    backgroundColor: '#FFFBEB',
    marginHorizontal: 24,
    marginBottom: 32,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  verificationRequiredIcon: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FDE68A',
  },
  verificationRequiredTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#92400E',
    marginTop: 16,
    marginBottom: 8,
  },
  verificationRequiredMessage: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    marginBottom: 24,
  },
  verificationRequiredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  verificationRequiredButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});