import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import TrasactionCard from '@/components/TrasactionCard';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  getDoc,
  updateDoc,
  runTransaction,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { router } from 'expo-router';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CircleCheck as CheckCircle, 
  User, 
  MapPin, 
  Camera, 
  XCircle, 
  ArrowRight,
  Shield,
  CreditCard
} from 'lucide-react-native';
import { fetchAllTransactionsByUser, fetchAllTransactionsForUser } from '@/lib/firebase-funcs-';

interface TransferRequest {
  id: string;
  senderId: string;
  recipientId: string;
  amount: number;
  status: 'pending' | 'verified' | 'approved' | 'completed' | 'cancelled';
  verificationSelfieUrl?: string;
  verificationLocation?: {
    latitude: number;
    longitude: number;
    timestamp: number;
  };
  createdAt: Date;
  verifiedAt?: Date;
  completedAt?: Date;
  senderName: string;
  recipientName: string;
  type: 'sent' | 'received';
}

interface Transaction {
  id: string;
  amount: number;
  createdAt: Date;
  senderName: string;
  recipientName: string;
  type: 'sent' | 'received';
}

export default function Transactions() {
  const { user, profile } = useAuth();
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  // const [, setTransactions] = useState<Transaction[]>([]);
  // const [allMyTransactions, setAllMyTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if user can perform transactions
  if (!user?.emailVerified) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Activity</Text>
            <Text style={styles.subtitle}>View your transaction history</Text>
          </View>

          <View style={styles.verificationRequiredCard}>
            <View style={styles.verificationRequiredIcon}>
              <Shield size={48} color="#F59E0B" />
            </View>
            <Text style={styles.verificationRequiredTitle}>Verification Required</Text>
            <Text style={styles.verificationRequiredMessage}>
              You need to complete your identity verification before you can view your transaction history. This helps us ensure the security of all transactions.
            </Text>
            <TouchableOpacity
              style={styles.verificationRequiredButton}
              onPress={() => router.push('/document-upload')}
            >
              <Shield size={20} color="#FFFFFF" />
              <Text style={styles.verificationRequiredButtonText}>Complete Verification</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const fetchData = async () => {
    
    if (!user) return;

    try {
      // Fetch pending transfer requests
      const allPending = await fetchAllTransactionsForUser(user?.uid);
    
      setTransferRequests(allPending)
      // setAllMyTransactions(allPending)
      console.log('Fetched all send requests:', allPending);

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();

    // Set up real-time listener for transfer updates
    if (user) {
      const transfersQuery = query(
        collection(db, 'transferRequests'),
        where('senderId', '==', user.uid),
        
      );

      const unsubscribe = onSnapshot(transfersQuery, (snapshot) => {
        // Refetch data when there are changes
        fetchData();
      });

      return () => unsubscribe();
    }
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#22C55E';
      case 'pending':
        return '#F59E0B';
      case 'verified':
        return '#3B82F6';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'verified':
        return 'Verified';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const handleTransferRequestPress = (request: TransferRequest) => {
    if (request.type === 'received' && request.status === 'pending') {
      // router.push(`/verify/${request.id}`);
    }
  };

  const handleApproveTransfer = async (transfer: TransferRequest) => {
    if (!transfer.verificationSelfieUrl || !transfer.verificationLocation) {
      Alert.alert('Verification Required', 'The recipient must complete their verification before you can approve the transfer.');
      return;
    }

    Alert.alert(
      'Approve Transfer',
      `Are you sure you want to approve the transfer of ${formatCurrency(transfer.amount)} to ${transfer.recipientName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            setLoading(true);
            try {
              await runTransaction(db, async (transaction) => {
                // Get current balances
                const senderDoc = await transaction.get(doc(db, 'profiles', transfer.senderId));
                const recipientDoc = await transaction.get(doc(db, 'profiles', transfer.recipientId));
                
                if (!senderDoc.exists() || !recipientDoc.exists()) {
                  throw new Error('User profiles not found');
                }

                const senderData = senderDoc.data();
                const recipientData = recipientDoc.data();

                // Check if sender has sufficient funds
                if (senderData.walletBalance < transfer.amount) {
                  throw new Error('Insufficient funds');
                }

                // Update balances
                transaction.update(doc(db, 'profiles', transfer.senderId), {
                  walletBalance: senderData.walletBalance - transfer.amount,
                  updatedAt: new Date(),
                });

                transaction.update(doc(db, 'profiles', transfer.recipientId), {
                  walletBalance: recipientData.walletBalance + transfer.amount,
                  updatedAt: new Date(),
                });

                // Update transfer request
                transaction.update(doc(db, 'transferRequests', transfer.id), {
                  status: 'completed',
                  completedAt: new Date(),
                });

                // Create transaction record
                const transactionRef = doc(collection(db, 'transactions'));
                transaction.set(transactionRef, {
                  transferRequestId: transfer.id,
                  senderId: transfer.senderId,
                  recipientId: transfer.recipientId,
                  amount: transfer.amount,
                  description: `Transfer to ${transfer.recipientName}`,
                  createdAt: new Date(),
                });
              });

              Alert.alert(
                'Transfer Completed',
                `Successfully transferred ${formatCurrency(transfer.amount)} to ${transfer.recipientName}`,
                [{ text: 'OK' }]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to complete transfer');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelTransfer = async (transfer: TransferRequest) => {
    Alert.alert(
      'Cancel Transfer',
      `Are you sure you want to cancel the transfer of ${formatCurrency(transfer.amount)} to ${transfer.recipientName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'transferRequests', transfer.id), {
                status: 'cancelled',
                updatedAt: new Date(),
              });
              
              Alert.alert('Transfer Cancelled', 'The transfer request has been cancelled.');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel transfer');
            }
          },
        },
      ]
    );
  };

  const openMap = (location: { latitude: number; longitude: number }) => {
    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    // In a real app, you'd use Linking.openURL(url)
    Alert.alert('Location', `Latitude: ${location.latitude.toFixed(4)}\nLongitude: ${location.longitude.toFixed(4)}\n\nOpen in maps: ${url}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <TouchableOpacity>Pending</TouchableOpacity>
        <TouchableOpacity>Completed</TouchableOpacity>
      </View>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Activity</Text>
          </View>
          <TouchableOpacity
            style={styles.paymentMethodsButton}
            onPress={() => router.push('/payment-methods')}
          >
            <CreditCard size={20} color="#8B5CF6" />
            <Text style={styles.paymentMethodsButtonText}>Payment</Text>
          </TouchableOpacity>
        </View>


        {/* All Transactions */}
        {transferRequests.length > 0 && (
          <View style={{paddingHorizontal: 16}}>
            <Text style={{fontSize: 18, fontWeight: '600', marginBottom: 8}}>All Transactions</Text>
            {transferRequests.map((txn) => (
              <TrasactionCard key={txn.id} transactionData={txn} />
            ))}
          </View>
        )}

        {/* Empty State */}
        {transferRequests.length === 0 && transferRequests.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>You have not made or received any transactions yet.</Text>
          </View>
        )}
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
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  itemsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  recipientPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  status: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
    marginTop: 2,
  },
  transferDetails: {
    marginBottom: 16,
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  verificationSection: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  verificationItems: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  verificationIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  verificationText: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
  },
  selfieContainer: {
    marginBottom: 12,
  },
  selfieLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  selfieImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationContainer: {
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verifyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 12,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 12,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  pendingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 12,
  },
  pendingText: {
    color: '#92400E',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  completedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  verificationRequiredCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 24,
    marginTop: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  verificationRequiredIcon: {
    backgroundColor: '#FEF3C7',
    borderRadius: 24,
    padding: 12,
    marginBottom: 16,
  },
  verificationRequiredTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  verificationRequiredMessage: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    marginBottom: 20,
  },
  verificationRequiredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  verificationRequiredButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  paymentMethodsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  paymentMethodsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
});