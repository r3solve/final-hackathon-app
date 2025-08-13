import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const TrasactionCard = ({transactionData}:{transactionData:any}) => {
  const {
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
  } = transactionData;

  const formattedDate = createdAt ? new Date(createdAt).toLocaleString() : '';

  const handleApprove = () => {
    // TODO: Implement approve logic (e.g., update Firestore)
    console.log('Approve pressed for transaction:', transactionData);
  };

  const handleCancel = () => {
    // TODO: Implement cancel logic (e.g., update Firestore)
    console.log('Cancel pressed for transaction:', transactionData);
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.amount}>${amount}</Text>
        <Text style={styles.status}>{status === 'pending' ? 'Pending' : status}</Text>
      </View>
      <Text style={styles.info}>Sender: {senderPhone}</Text>
      <Text style={styles.info}>Recipient: {recieverPhone}</Text>
      <Text style={styles.info}>Description: {description}</Text>
      <Text style={styles.info}>Approved by Sender: {isApprovedBySender ? 'Yes' : 'No'}</Text>
      <Text style={styles.info}>Approved by Recipient: {isApprovedByRecipient ? 'Yes' : 'No'}</Text>
      <Text style={styles.date}>{formattedDate}</Text>
      {status === 'pending' && (
        <View style={styles.buttonRow}>
          <Text style={styles.buttonApprove} onPress={handleApprove}>Approve</Text>
          <Text style={styles.buttonCancel} onPress={handleCancel}>Cancel</Text>
        </View>
      )}
    </View>
  );
}

export default TrasactionCard

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  status: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  info: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  date: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  buttonApprove: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginRight: 8,
    overflow: 'hidden',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonCancel: {
    backgroundColor: '#F44336',
    color: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    overflow: 'hidden',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});