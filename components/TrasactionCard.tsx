import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { router } from 'expo-router';
import { Alert } from 'react-native';

const TrasactionCard = ({transactionData}:{transactionData:any}) => {
  const {
    id,
    amount,
    senderPhone,
    senderId,
    recieverId,
    recieverPhone,
    description,
    isApprovedBySender,
    isApprovedByRecipient,
    status,
    createdAt,
    updatedAt,
    verificationSelfieUrl,
    verificationLocation,
  } = transactionData;

  // Get current user from context
  const { user } = require('@/contexts/AuthContext').useAuth();
  const formattedDate = createdAt.toDate().toLocaleString();

  // Determine if transaction is ready for approval
  const canApprove =
    user?.uid === senderId &&
    status === 'verified' &&
    verificationSelfieUrl &&
    verificationLocation;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>{status === 'pending' ? '⏳' : '💸'}</Text>
        </View>
        <View style={{flex: 1, marginLeft: 12}}>
          <Text style={styles.amount}>GH₵ {amount}</Text>
          <Text style={styles.status}>{status === 'pending' ? 'Pending' : status}</Text>
        </View>
      </View>
      <View style={styles.detailsRow}>
        <View style={{flex: 1}}>
          <Text style={styles.label}>Sender</Text>
          <Text style={styles.value}>{senderPhone}</Text>
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.description}>{description}</Text>
          <View>
            {status != 'completed'
              ? <Text style={styles.helpText}>Waiting sender approval</Text>
              : <Text style={styles.helpText}>Transaction completed</Text>}
          </View>
        </View>
      </View>
      <Text style={styles.date}>{formattedDate}</Text>
      <View style={styles.buttonRow}>
        {status === 'completed' ? (
          <Text style={styles.buttonApprove}>Completed</Text>
        ) : canApprove ? (
          <Text
            style={styles.buttonApprove}
            onPress={() => router.push(`/approve/${id}` as any)}
          >
            Approve
          </Text>
        ) : user?.uid === senderId ? (
          <Text style={[{color:"gray"}, { opacity: 0.65 }]}>
            Completed
          </Text>
        ) : (
          <Text
            style={styles.buttonVerify}
            onPress={() => router.push(`/verify/${id}` as any)}
          >
            Verify
          </Text>
        )}
      </View>
    </View>
  );
}

export default TrasactionCard

const styles = StyleSheet.create({
  card: {
    padding: 18,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  amount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
    buttonVerify: {
        backgroundColor: '#10e159ff',
        color: '#fff',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginRight: 10,
        overflow: 'hidden',
        fontWeight: '700',
        textAlign: 'center',
        fontSize: 15,
    },
    buttonApprove: {
    backgroundColor: '#22C55E',
    color: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
    overflow: 'hidden',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 15,
    },
  status: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  value: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
    marginTop: 2,
  },
  approvalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  approval: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },

  buttonCancel: {
    backgroundColor: '#EF4444',
    color: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    overflow: 'hidden',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 15,
  },
});