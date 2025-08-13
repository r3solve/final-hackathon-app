import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { ArrowLeft, DollarSign, Wallet } from 'lucide-react-native';

export default function DepositAmount() {
  const { user, profile } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAmountChange = (text: string) => {
    // Only allow numbers and one decimal point
    const numericValue = text.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    
    setAmount(numericValue);
  };

  const formatCurrency = (value: string) => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(numValue);
  };

  const validateAmount = () => {
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount)) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return false;
    }
    
    if (numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Amount must be greater than 0');
      return false;
    }
    
    if (numAmount > 10000) {
      Alert.alert('Amount Too Large', 'Maximum deposit amount is GHS 10,000');
      return false;
    }
    
    return true;
  };

  const handleContinue = () => {
    if (!validateAmount()) return;
    
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!profile?.email && !user?.email) {
      Alert.alert('Error', 'No email address found. Please check your profile.');
      return;
    }

    setLoading(true);
    
    // Navigate to deposit screen with amount parameter
    router.push({
      pathname: '/(tabs)/deposit',
      params: { amount: amount }
    });
    
    setLoading(false);
  };

  const quickAmounts = [10, 20, 50, 100, 200, 500];

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.title}>Deposit Money</Text>
            <View style={styles.headerRight} />
          </View>

          {/* Amount Input Section */}
          <View style={styles.amountSection}>
            <View style={styles.amountHeader}>
              <Wallet size={32} color="#22C55E" />
              <Text style={styles.amountTitle}>Enter Amount</Text>
              <Text style={styles.amountSubtitle}>
                How much would you like to deposit?
              </Text>
            </View>

            <View style={styles.amountInputContainer}>
              <View style={styles.currencySymbol}>
                <Text style={styles.currencyText}>GHS</Text>
              </View>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                maxLength={10}
                autoFocus
              />
            </View>

            {amount && (
              <Text style={styles.formattedAmount}>
                {formatCurrency(amount)}
              </Text>
            )}
          </View>

          {/* Quick Amount Buttons */}
          <View style={styles.quickAmountsSection}>
            <Text style={styles.quickAmountsTitle}>Quick Amounts</Text>
            <View style={styles.quickAmountsGrid}>
              {quickAmounts.map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  style={[
                    styles.quickAmountButton,
                    amount === quickAmount.toString() && styles.quickAmountButtonActive
                  ]}
                  onPress={() => handleQuickAmount(quickAmount)}
                >
                  <Text style={[
                    styles.quickAmountText,
                    amount === quickAmount.toString() && styles.quickAmountTextActive
                  ]}>
                    GHS {quickAmount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <DollarSign size={20} color="#6B7280" />
              <Text style={styles.infoText}>
                Minimum deposit: GHS 1.00
              </Text>
            </View>
            <View style={styles.infoItem}>
              <DollarSign size={20} color="#6B7280" />
              <Text style={styles.infoText}>
                Maximum deposit: GHS 10,000.00
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!amount || parseFloat(amount) <= 0) && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={loading || !amount || parseFloat(amount) <= 0}
          >
            <Text style={[
              styles.continueButtonText,
              (!amount || parseFloat(amount) <= 0) && styles.continueButtonTextDisabled
            ]}>
              {loading ? 'Processing...' : 'Continue to Payment'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
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
  amountSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginTop: 24,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  amountHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  amountTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
  },
  amountSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    minWidth: 200,
  },
  currencySymbol: {
    paddingRight: 8,
  },
  currencyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6B7280',
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  formattedAmount: {
    fontSize: 18,
    color: '#22C55E',
    fontWeight: '600',
    marginTop: 16,
  },
  quickAmountsSection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  quickAmountsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAmountButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  quickAmountButtonActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  quickAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  quickAmountTextActive: {
    color: '#FFFFFF',
  },
  infoSection: {
    paddingHorizontal: 24,
    marginTop: 32,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  continueButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButtonTextDisabled: {
    color: '#9CA3AF',
  },
});
