import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DollarSign, CreditCard, Banknote, Wallet, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

export default function Deposit() {
  const { user, profile, updateProfile } = useAuth();
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'bank' | 'mobile'>('card');
  const [loading, setLoading] = useState(false);

  const validateInputs = () => {
    if (!amount.trim()) return 'Amount is required';
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return 'Amount must be a positive number';
    if (numAmount > 10000) return 'Maximum deposit amount is GH₵10,000';
    if (numAmount < 1) return 'Minimum deposit amount is GH₵1';
    
    return null;
  };

  const handleDeposit = async () => {
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
      const depositAmount = parseFloat(amount);
      const newBalance = (profile.walletBalance || 0) + depositAmount;

      // Create deposit record
      await addDoc(collection(db, 'deposits'), {
        userId: user.uid,
        amount: depositAmount,
        method: selectedMethod,
        status: 'completed',
        createdAt: new Date(),
      });

      // Update wallet balance
      const result = await updateProfile({
        walletBalance: newBalance,
      });

      if (result.error) {
        Alert.alert('Error', result.error);
        return;
      }

      Alert.alert(
        'Deposit Successful',
        `Successfully deposited ${formatCurrency(depositAmount)} to your wallet. Your new balance is ${formatCurrency(newBalance)}.`,
        [{ text: 'OK', onPress: () => {
          setAmount('');
          router.back();
        }}]
      );

    } catch (error: any) {
      Alert.alert('Error', error.message);
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

  const quickAmounts = [10, 25, 50, 100, 200, 500];

  const PaymentMethod = ({ 
    method, 
    title, 
    subtitle, 
    icon: Icon, 
    isSelected 
  }: {
    method: 'card' | 'bank' | 'mobile';
    title: string;
    subtitle: string;
    icon: any;
    isSelected: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.methodCard, isSelected && styles.methodCardSelected]}
      onPress={() => setSelectedMethod(method)}
    >
      <View style={[styles.methodIcon, isSelected && styles.methodIconSelected]}>
        <Icon size={24} color={isSelected ? '#FFFFFF' : '#6B7280'} />
      </View>
      <View style={styles.methodInfo}>
        <Text style={[styles.methodTitle, isSelected && styles.methodTitleSelected]}>
          {title}
        </Text>
        <Text style={[styles.methodSubtitle, isSelected && styles.methodSubtitleSelected]}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Deposit Money</Text>
            <Text style={styles.subtitle}>Add funds to your wallet securely</Text>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balance}>
            {formatCurrency(profile?.walletBalance || 0)}
          </Text>
        </View>

        <View style={styles.form}>
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

          <View style={styles.quickAmounts}>
            <Text style={styles.quickAmountsLabel}>Quick Amounts</Text>
            <View style={styles.quickAmountsGrid}>
              {quickAmounts.map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  style={styles.quickAmountButton}
                  onPress={() => setAmount(quickAmount.toString())}
                >
                                     <Text style={styles.quickAmountText}>
                     GH₵{quickAmount}
                   </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.methodGroup}>
            <Text style={styles.label}>Payment Method</Text>
            <PaymentMethod
              method="card"
              title="Credit/Debit Card"
              subtitle="Instant deposit"
              icon={CreditCard}
              isSelected={selectedMethod === 'card'}
            />
            <PaymentMethod
              method="bank"
              title="Bank Transfer"
              subtitle="1-2 business days"
              icon={Banknote}
              isSelected={selectedMethod === 'bank'}
            />
            <PaymentMethod
              method="mobile"
              title="Mobile Money"
              subtitle="Instant deposit"
              icon={Wallet}
              isSelected={selectedMethod === 'mobile'}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleDeposit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Processing...' : 'Deposit Money'}
            </Text>
          </TouchableOpacity>

          <View style={styles.info}>
            <Text style={styles.infoText}>
              Deposits are processed securely. Card and mobile money deposits are instant, while bank transfers may take 1-2 business days.
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
  backButton: {
    position: 'absolute',
    top: 20,
    left: 24,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    marginTop: 60,
    alignItems: 'center',
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
    marginBottom: 24,
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
  quickAmounts: {
    marginBottom: 24,
  },
  quickAmountsLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  methodGroup: {
    marginBottom: 24,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  methodCardSelected: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  methodIconSelected: {
    backgroundColor: '#22C55E',
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  methodTitleSelected: {
    color: '#22C55E',
  },
  methodSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  methodSubtitleSelected: {
    color: '#059669',
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
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});
