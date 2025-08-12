import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user, canPerformTransactions } = useAuth();
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if user can perform transactions
  if (!canPerformTransactions()) {
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

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch pending transfer requests
      const sentRequestsQuery = query(
        collection(db, 'transferRequests'),
        where('senderId', '==', user.uid),
        where('status', 'in', ['pending', 'verified']),
        orderBy('createdAt', 'desc')
      );

      const receivedRequestsQuery = query(
        collection(db, 'transferRequests'),
        where('recipientId', '==', user.uid),
        where('status', 'in', ['pending', 'verified']),
        orderBy('createdAt', 'desc')
      );

      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentRequestsQuery),
        getDocs(receivedRequestsQuery)
      ]);

      const allRequests: TransferRequest[] = [];

      // Process sent requests
      for (const docSnapshot of sentSnapshot.docs) {
        const data = docSnapshot.data();
        const recipientDoc = await getDoc(doc(db, 'profiles', data.recipientId));
        const recipientData = recipientDoc.data();
        
        allRequests.push({
          id: docSnapshot.id,
          senderId: data.senderId,
          recipientId: data.recipientId,
          amount: data.amount,
          status: data.status,
          verificationSelfieUrl: data.verificationSelfieUrl,
          verificationLocation: data.verificationLocation,
          createdAt: data.createdAt.toDate(),
          verifiedAt: data.verifiedAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
          senderName: '',
          recipientName: recipientData?.fullName || 'Unknown',
          type: 'sent',
        });
      }

      // Process received requests
      for (const docSnapshot of receivedSnapshot.docs) {
        const data = docSnapshot.data();
        const senderDoc = await getDoc(doc(db, 'profiles', data.senderId));
        const senderData = senderDoc.data();
        
        allRequests.push({
          id: docSnapshot.id,
          senderId: data.senderId,
          recipientId: data.recipientId,
          amount: data.amount,
          status: data.status,
          verificationSelfieUrl: data.verificationSelfieUrl,
          verificationLocation: data.verificationLocation,
          createdAt: data.createdAt.toDate(),
          verifiedAt: data.verifiedAt?.toDate(),
          completedAt: data.completedAt?.toDate(),
          senderName: senderData?.fullName || 'Unknown',
          recipientName: '',
          type: 'received',
        });
      }

      setTransferRequests(allRequests);

      // Fetch completed transactions
      const sentTransactionsQuery = query(
        collection(db, 'transactions'),
        where('senderId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const receivedTransactionsQuery = query(
        collection(db, 'transactions'),
        where('recipientId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const [sentTxSnapshot, receivedTxSnapshot] = await Promise.all([
        getDocs(sentTransactionsQuery),
        getDocs(receivedTransactionsQuery)
      ]);

      const allTransactions: Transaction[] = [];

      // Process sent transactions
      for (const docSnapshot of sentTxSnapshot.docs) {
        const data = docSnapshot.data();
        const recipientDoc = await getDoc(doc(db, 'profiles', data.recipientId));
        const recipientData = recipientDoc.data();
        
        allTransactions.push({
          id: docSnapshot.id,
          amount: data.amount,
          createdAt: data.createdAt.toDate(),
          senderName: '',
          recipientName: recipientData?.fullName || 'Unknown',
          type: 'sent',
        });
      }

      // Process received transactions
      for (const docSnapshot of receivedTxSnapshot.docs) {
        const data = docSnapshot.data();
        const senderDoc = await getDoc(doc(db, 'profiles', data.senderId));
        const senderData = senderDoc.data();
        
        allTransactions.push({
          id: docSnapshot.id,
          amount: data.amount,
          createdAt: data.createdAt.toDate(),
          senderName: senderData?.fullName || 'Unknown',
          recipientName: '',
          type: 'received',
        });
      }

      setTransactions(allTransactions);

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
        where('status', 'in', ['pending', 'verified'])
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
      router.push(`/(tabs)/verify/${request.id}`);
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
            onPress={() => router.push('/(tabs)/payment-methods')}
          >
            <CreditCard size={20} color="#8B5CF6" />
            <Text style={styles.paymentMethodsButtonText}>Payment</Text>
          </TouchableOpacity>
        </View>

        {/* Pending Transfer Requests */}
        {transferRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Transfers</Text>
            <View style={styles.itemsList}>
              {transferRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <View style={styles.recipientInfo}>
                      <View style={styles.avatar}>
                        <User size={20} color="#6B7280" />
                      </View>
                      <View>
                        <Text style={styles.recipientName}>
                          {request.type === 'sent' 
                            ? request.recipientName
                            : request.senderName
                          }
                        </Text>
                        <Text style={styles.recipientPhone}>
                          {request.type === 'sent' ? 'Recipient' : 'Sender'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.amountContainer}>
                      <Text style={styles.amount}>{formatCurrency(request.amount)}</Text>
                      <Text style={styles.status}>
                        {request.status === 'pending' ? 'Pending Verification' : 'Verified'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.transferDetails}>
                    <Text style={styles.dateText}>
                      Requested: {formatDate(request.createdAt)}
                    </Text>
                    
                    {request.verifiedAt && (
                      <Text style={styles.dateText}>
                        Verified: {formatDate(request.verifiedAt)}
                      </Text>
                    )}
                  </View>

                  {request.status === 'verified' && request.type === 'sent' && (
                    <View style={styles.verificationSection}>
                      <Text style={styles.verificationTitle}>Recipient Verification</Text>
                      
                      <View style={styles.verificationItems}>
                        <View style={styles.verificationItem}>
                          <View style={styles.verificationIcon}>
                            <Camera size={16} color="#22C55E" />
                          </View>
                          <Text style={styles.verificationText}>Selfie Verified</Text>
                        </View>
                        
                        <View style={styles.verificationItem}>
                          <View style={styles.verificationIcon}>
                            <MapPin size={16} color="#22C55E" />
                          </View>
                          <Text style={styles.verificationText}>Location Captured</Text>
                        </View>
                      </View>

                      {request.verificationSelfieUrl && (
                        <View style={styles.selfieContainer}>
                          <Text style={styles.selfieLabel}>Recipient's Selfie:</Text>
                          <Image 
                            source={{ uri: request.verificationSelfieUrl }} 
                            style={styles.selfieImage}
                          />
                        </View>
                      )}

                      {request.verificationLocation && (
                        <TouchableOpacity 
                          style={styles.locationContainer}
                          onPress={() => openMap(request.verificationLocation!)}
                        >
                          <Text style={styles.locationLabel}>Recipient's Location:</Text>
                          <View style={styles.locationInfo}>
                            <MapPin size={16} color="#3B82F6" />
                            <Text style={styles.locationText}>
                              {request.verificationLocation.latitude.toFixed(4)}, {request.verificationLocation.longitude.toFixed(4)}
                            </Text>
                            <ArrowRight size={16} color="#3B82F6" />
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  <View style={styles.actions}>
                    {request.type === 'received' && request.status === 'pending' ? (
                      <TouchableOpacity
                        style={styles.verifyButton}
                        onPress={() => handleTransferRequestPress(request)}
                      >
                        <Text style={styles.verifyButtonText}>Verify & Approve</Text>
                      </TouchableOpacity>
                    ) : request.type === 'sent' && request.status === 'verified' ? (
                      <TouchableOpacity
                        style={[styles.approveButton, loading && styles.buttonDisabled]}
                        onPress={() => handleApproveTransfer(request)}
                        disabled={loading}
                      >
                        <CheckCircle size={20} color="#FFFFFF" />
                        <Text style={styles.approveButtonText}>
                          {loading ? 'Processing...' : 'Approve Transfer'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.pendingStatus}>
                        <Clock size={16} color="#F59E0B" />
                        <Text style={styles.pendingText}>
                          {request.status === 'pending' ? 'Waiting for recipient verification...' : 'Waiting for approval...'}
                        </Text>
                      </View>
                    )}
                    
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => handleCancelTransfer(request)}
                    >
                      <XCircle size={20} color="#EF4444" />
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Completed Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No completed transactions</Text>
              <Text style={styles.emptySubtext}>Your completed transfers will appear here</Text>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {transactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View style={styles.transactionIcon}>
                    {transaction.type === 'sent' ? (
                      <ArrowUpRight size={16} color="#EF4444" />
                    ) : (
                      <ArrowDownLeft size={16} color="#22C55E" />
                    )}
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionName}>
                      {transaction.type === 'sent' 
                        ? `To ${transaction.recipientName}`
                        : `From ${transaction.senderName}`
                      }
                    </Text>
                    <View style={styles.completedStatus}>
                      <CheckCircle size={14} color="#22C55E" />
                      <Text style={styles.completedText}>Completed</Text>
                    </View>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.createdAt)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      { color: transaction.type === 'sent' ? '#EF4444' : '#22C55E' }
                    ]}
                  >
                    {transaction.type === 'sent' ? '-' : '+'}
                    {formatCurrency(transaction.amount)}
                  </Text>
                </View>
              ))}
            </View>
          )}
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