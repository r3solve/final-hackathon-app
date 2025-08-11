import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { router } from 'expo-router';
import { ArrowUpRight, ArrowDownLeft, Clock, CircleCheck as CheckCircle } from 'lucide-react-native';

interface TransferRequest {
  id: string;
  amount: number;
  status: string;
  createdAt: Date;
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
  const { user } = useAuth();
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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
          amount: data.amount,
          status: data.status,
          createdAt: data.createdAt.toDate(),
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
          amount: data.amount,
          status: data.status,
          createdAt: data.createdAt.toDate(),
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
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'verified':
        return '#3B82F6';
      case 'completed':
        return '#22C55E';
      default:
        return '#6B7280';
    }
  };

  const handleTransferRequestPress = (request: TransferRequest) => {
    if (request.type === 'received' && request.status === 'pending') {
      router.push(`/(tabs)/verify/${request.id}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Activity</Text>
        </View>

        {/* Pending Transfer Requests */}
        {transferRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Transfers</Text>
            <View style={styles.itemsList}>
              {transferRequests.map((request) => (
                <TouchableOpacity
                  key={request.id}
                  style={styles.requestItem}
                  onPress={() => handleTransferRequestPress(request)}
                  disabled={!(request.type === 'received' && request.status === 'pending')}
                >
                  <View style={styles.requestIcon}>
                    <Clock size={16} color={getStatusColor(request.status)} />
                  </View>
                  <View style={styles.requestDetails}>
                    <Text style={styles.requestName}>
                      {request.type === 'sent' 
                        ? `To ${request.recipientName}`
                        : `From ${request.senderName}`
                      }
                    </Text>
                    <Text style={styles.requestStatus}>
                      {request.status === 'pending' && request.type === 'received' 
                        ? 'Tap to verify and approve'
                        : request.status === 'pending'
                        ? 'Waiting for recipient verification'
                        : 'Verified - awaiting approval'
                      }
                    </Text>
                    <Text style={styles.requestDate}>
                      {formatDate(request.createdAt)}
                    </Text>
                  </View>
                  <Text style={styles.requestAmount}>
                    {formatCurrency(request.amount)}
                  </Text>
                </TouchableOpacity>
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
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  requestIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  requestDetails: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  requestStatus: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 2,
    fontWeight: '500',
  },
  requestDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  requestAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
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
});