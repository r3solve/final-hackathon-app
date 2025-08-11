import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';

interface Transaction {
  id: string;
  amount: number;
  createdAt: Date;
  senderName: string;
  recipientName: string;
  type: 'sent' | 'received';
}

export default function Wallet() {
  const { profile, user } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecentTransactions = async () => {
    if (!user) return;

    try {
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('senderId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const receivedQuery = query(
        collection(db, 'transactions'),
        where('recipientId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(transactionsQuery),
        getDocs(receivedQuery)
      ]);

      const allTransactions: Transaction[] = [];

      // Process sent transactions
      for (const docSnapshot of sentSnapshot.docs) {
        const data = docSnapshot.data();
        const recipientDoc = await getDoc(doc(db, 'profiles', data.recipientId));
        const recipientData = recipientDoc.data();
        
        allTransactions.push({
          id: docSnapshot.id,
          amount: data.amount,
          createdAt: data.createdAt.toDate(),
          senderName: profile?.fullName || '',
          recipientName: recipientData?.fullName || 'Unknown',
          type: 'sent',
        });
      }

      // Process received transactions
      for (const docSnapshot of receivedSnapshot.docs) {
        const data = docSnapshot.data();
        const senderDoc = await getDoc(doc(db, 'profiles', data.senderId));
        const senderData = senderDoc.data();
        
        allTransactions.push({
          id: docSnapshot.id,
          amount: data.amount,
          createdAt: data.createdAt.toDate(),
          senderName: senderData?.fullName || 'Unknown',
          recipientName: profile?.fullName || '',
          type: 'received',
        });
      }

      // Sort by date and take top 5
      allTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setRecentTransactions(allTransactions.slice(0, 5));

    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecentTransactions();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchRecentTransactions();
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
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{profile?.fullName}</Text>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Wallet Balance</Text>
            <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
              {showBalance ? (
                <Eye size={20} color="#6B7280" />
              ) : (
                <EyeOff size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.balance}>
            {showBalance ? formatCurrency(profile?.walletBalance || 0) : '••••••'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Start sending money to see your activity here</Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {recentTransactions.map((transaction) => (
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
  greeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 32,
    padding: 24,
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
  balance: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1F2937',
  },
  section: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
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
  transactionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
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
  transactionDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
});