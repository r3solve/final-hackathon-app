import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Users, DollarSign, Trash2, Edit3, UserPlus, Send } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

interface GroupMember {
  id: string;
  name: string;
  phoneNumber: string;
  amount: number;
}

interface PaymentGroup {
  id: string;
  name: string;
  description: string;
  members: GroupMember[];
  totalAmount: number;
  createdAt: Date;
  createdBy: string;
}

export default function GroupedPayments() {
  const { user, profile } = useAuth();
  const [groups, setGroups] = useState<PaymentGroup[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<PaymentGroup | null>(null);
  
  // Create group form state
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  
  // Add member form state
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberAmount, setMemberAmount] = useState('');

  const handleBackToProfile = () => {
    router.back();
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    const newGroup: PaymentGroup = {
      id: Date.now().toString(),
      name: groupName.trim(),
      description: groupDescription.trim(),
      members: [],
      totalAmount: 0,
      createdAt: new Date(),
      createdBy: user?.uid || '',
    };

    setGroups(prev => [newGroup, ...prev]);
    setGroupName('');
    setGroupDescription('');
    setShowCreateModal(false);
    
    Alert.alert('Success', 'Group created successfully!');
  };

  const handleAddMember = () => {
    if (!memberName.trim() || !memberPhone.trim() || !memberAmount.trim()) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    const amount = parseFloat(memberAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!selectedGroup) return;

    const newMember: GroupMember = {
      id: Date.now().toString(),
      name: memberName.trim(),
      phoneNumber: memberPhone.trim(),
      amount: amount,
    };

    const updatedGroup = {
      ...selectedGroup,
      members: [...selectedGroup.members, newMember],
      totalAmount: selectedGroup.totalAmount + amount,
    };

    setGroups(prev => prev.map(group => 
      group.id === selectedGroup.id ? updatedGroup : group
    ));

    setMemberName('');
    setMemberPhone('');
    setMemberAmount('');
    setShowAddMemberModal(false);
    setSelectedGroup(null);
    
    Alert.alert('Success', 'Member added successfully!');
  };

  const handleDeleteGroup = (groupId: string) => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setGroups(prev => prev.filter(group => group.id !== groupId));
          },
        },
      ]
    );
  };

  const handleSendGroupPayment = (group: PaymentGroup) => {
    if (group.members.length === 0) {
      Alert.alert('Error', 'Group has no members to send payments to');
      return;
    }

    Alert.alert(
      'Send Group Payment',
      `Send payments to ${group.members.length} members for a total of ₵${group.totalAmount.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            // Here you would implement the actual payment logic
            Alert.alert('Success', 'Group payments sent successfully!');
          },
        },
      ]
    );
  };

  const renderGroupCard = ({ item }: { item: PaymentGroup }) => (
    <View style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupDescription}>{item.description}</Text>
        </View>
        <View style={styles.groupActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedGroup(item);
              setShowAddMemberModal(true);
            }}
          >
            <UserPlus size={16} color="#22C55E" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteGroup(item.id)}
          >
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.groupStats}>
        <View style={styles.statItem}>
          <Users size={16} color="#6B7280" />
          <Text style={styles.statText}>{item.members.length} members</Text>
        </View>
        <View style={styles.statItem}>
          <DollarSign size={16} color="#6B7280" />
          <Text style={styles.statText}>₵{item.totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      {item.members.length > 0 && (
        <View style={styles.membersSection}>
          <Text style={styles.membersTitle}>Members:</Text>
          {item.members.map((member, index) => (
            <View key={member.id} style={styles.memberItem}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberPhone}>{member.phoneNumber}</Text>
              </View>
              <Text style={styles.memberAmount}>₵{member.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.groupFooter}>
        <Text style={styles.groupDate}>
          Created {item.createdAt.toLocaleDateString()}
        </Text>
        <TouchableOpacity
          style={styles.sendPaymentButton}
          onPress={() => handleSendGroupPayment(item)}
          disabled={item.members.length === 0}
        >
          <Send size={16} color="#FFFFFF" />
          <Text style={styles.sendPaymentButtonText}>Send Payments</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToProfile}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Grouped Payments</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Users size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Groups Yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first payment group to start managing group transactions
          </Text>
          <TouchableOpacity
            style={styles.createFirstButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.createFirstButtonText}>Create First Group</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroupCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.groupsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Group Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create New Group</Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleCreateGroup}
            >
              <Text style={styles.modalSaveButtonText}>Create</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Group Name *</Text>
              <TextInput
                style={styles.input}
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Enter group name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={groupDescription}
                onChangeText={setGroupDescription}
                placeholder="Enter group description (optional)"
                multiline={true}
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalInfo}>
              <Text style={styles.modalInfoText}>
                • You can add members after creating the group{'\n'}
                • Each member can have different payment amounts{'\n'}
                • Groups help organize payments for events, bills, or shared expenses
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        visible={showAddMemberModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAddMemberModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Member</Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleAddMember}
            >
              <Text style={styles.modalSaveButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Member Name *</Text>
              <TextInput
                style={styles.input}
                value={memberName}
                onChangeText={setMemberName}
                placeholder="Enter member name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={memberPhone}
                onChangeText={setMemberPhone}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Payment Amount *</Text>
              <TextInput
                style={styles.input}
                value={memberAmount}
                onChangeText={setMemberAmount}
                placeholder="Enter amount"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalInfo}>
              <Text style={styles.modalInfoText}>
                • Member will receive payment notification{'\n'}
                • Amount will be added to group total{'\n'}
                • You can edit or remove members later
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  createButton: {
    backgroundColor: '#22C55E',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createFirstButton: {
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  createFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  groupsList: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  groupCard: {
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
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  groupInfo: {
    flex: 1,
    marginRight: 16,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  groupActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  membersSection: {
    marginBottom: 16,
  },
  membersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 6,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  memberPhone: {
    fontSize: 12,
    color: '#6B7280',
  },
  memberAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  groupDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  sendPaymentButton: {
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  sendPaymentButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalSaveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalSaveButtonText: {
    fontSize: 16,
    color: '#22C55E',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalInfo: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  modalInfoText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
  },
});
