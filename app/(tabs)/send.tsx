import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
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
import { DollarSign, Phone } from 'lucide-react-native';

export default function Send() {
  const { user, profile } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const validateInputs = () => {
    if (!phoneNumber.trim()) return 'Phone number is required';
    if (!amount.trim()) return 'Amount is required';
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return 'Amount must be a positive number';
    if (numAmount > (profile?.walletBalance || 0)) return 'Insufficient funds';
    
    return null;
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
        where('phoneNumber', '==', phoneNumber)
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
      await addDoc(collection(db, 'transferRequests'), {
        senderId: user.uid,
        recipientId: recipientDoc.id,
        amount: parseFloat(amount),
        status: 'pending',
        createdAt: new Date(),
      });

      Alert.alert(
        'Transfer Request Sent',
        `Your transfer request of $${amount} to ${recipientData.fullName} has been sent. They will need to verify their identity before the transfer is completed.`,
        [{ text: 'OK', onPress: () => {
          setPhoneNumber('');
          setAmount('');
        }}]
      );

    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Send Money</Text>
          <Text style={styles.subtitle}>Transfer funds securely to friends and family</Text>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
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
                onChangeText={setPhoneNumber}
                placeholder="+1 (555) 123-4567"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount</Text>
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

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendMoney}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Sending Request...' : 'Send Money'}
            </Text>
          </TouchableOpacity>

          <View style={styles.info}>
            <Text style={styles.infoText}>
              The recipient will need to verify their identity with a selfie and location before the transfer is completed.
            </Text>
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
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
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
  info: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 20,
  },
});