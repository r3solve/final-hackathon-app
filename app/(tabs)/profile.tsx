import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, 
  Shield, 
  CreditCard, 
  Plus, 
  Settings, 
  LogOut, 
  Lock,
  Key,
  Eye,
  EyeOff,
  Users
} from 'lucide-react-native';
import { router } from 'expo-router';
import PINVerificationModal from '@/components/PINVerificationModal';
import { PINManager } from '@/lib/pin-manager';

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const [showPINModal, setShowPINModal] = useState(false);
  const [pinOperation, setPinOperation] = useState<'change' | 'view'>('change');

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const handleChangePIN = () => {
    setPinOperation('change');
    setShowPINModal(true);
  };

  const handleViewPIN = () => {
    setPinOperation('view');
    setShowPINModal(true);
  };

  const handlePINVerificationSuccess = () => {
    if (pinOperation === 'change') {
      // Navigate to PIN change screen or show PIN change form
      Alert.alert(
        'Change PIN',
        'PIN change functionality will be implemented here. For now, please contact support to change your PIN.',
        [{ text: 'OK' }]
      );
    } else if (pinOperation === 'view') {
      // Show PIN information
      Alert.alert(
        'PIN Information',
        'Your PIN is securely stored and cannot be displayed for security reasons. If you forget your PIN, please contact support.',
        [{ text: 'OK' }]
      );
    }
    setShowPINModal(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return 'N/A';
    // Ensure it's in Ghana format
    if (phone.startsWith('+233')) {
      return phone;
    } else if (phone.startsWith('233')) {
      return '+' + phone;
    } else if (phone.startsWith('0')) {
      return '+233' + phone.substring(1);
    }
    return phone;
  };

  const getVerificationStatusColor = () => {
    switch (profile?.verificationStatus) {
      case 'approved':
        return '#22C55E';
      case 'rejected':
        return '#EF4444';
      default:
        return '#F59E0B';
    }
  };

  const getVerificationStatusText = () => {
    switch (profile?.verificationStatus) {
      case 'approved':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  const getDisplayImage = () => {
    if (profile?.profileImageUrl) return profile.profileImageUrl;
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            {getDisplayImage() ? (
              <Image source={{ uri: getDisplayImage()! }} style={styles.avatarImage} />
            ) : (
              <User size={48} color="#22C55E" />
            )}
          </View>
          <Text style={styles.userName}>{profile?.fullName || 'User'}</Text>
          <Text style={styles.userEmail}>{profile?.email || user?.email || 'No email'}</Text>
          
          <View style={styles.verificationBadge}>
            <Shield size={16} color={getVerificationStatusColor()} />
            <Text style={[styles.verificationText, { color: getVerificationStatusColor() }]}>
              {getVerificationStatusText()}
            </Text>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Wallet Balance</Text>
          <Text style={styles.balanceAmount}>
            ₵{profile?.walletBalance ? profile.walletBalance.toFixed(2) : '0.00'}
          </Text>
          
          <TouchableOpacity 
            style={styles.depositButton} 
            onPress={() => router.push('/(tabs)/deposit')}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.depositText}>Deposit Money</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/send')}
            >
              <CreditCard size={24} color="#22C55E" />
              <Text style={styles.actionText}>Send Money</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/transactions')}
            >
              <CreditCard size={24} color="#8B5CF6" />
              <Text style={styles.actionText}>Transactions</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/document-upload')}
            >
              <Shield size={24} color="#F59E0B" />
              <Text style={styles.actionText}>Verification</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/payment-methods')}
            >
              <CreditCard size={24} color="#EF4444" />
              <Text style={styles.actionText}>Payment Methods</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <TouchableOpacity 
            style={styles.settingsCard}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <View style={styles.settingsHeader}>
              <View style={styles.settingsIcon}>
                <Settings size={24} color="#22C55E" />
              </View>
              <View style={styles.settingsInfo}>
                <Text style={styles.settingsTitle}>Profile Settings</Text>
                <Text style={styles.settingsSubtitle}>Edit profile, update image, change password</Text>
              </View>
            </View>
            <View style={styles.settingsArrow}>
              <Text style={styles.settingsArrowText}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Grouped Payments Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Management</Text>
          
          <TouchableOpacity 
            style={styles.groupedPaymentsCard}
            onPress={() => router.push('/(tabs)/grouped-payments')}
          >
            <View style={styles.groupedPaymentsHeader}>
              <View style={styles.groupedPaymentsIcon}>
                <Users size={24} color="#8B5CF6" />
              </View>
              <View style={styles.groupedPaymentsInfo}>
                <Text style={styles.groupedPaymentsTitle}>Grouped Payments</Text>
                <Text style={styles.groupedPaymentsSubtitle}>Create groups for bulk payments and transactions</Text>
              </View>
            </View>
            <View style={styles.groupedPaymentsArrow}>
              <Text style={styles.groupedPaymentsArrowText}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <View style={styles.securityCard}>
            <View style={styles.securityHeader}>
              <View style={styles.securityIcon}>
                <Lock size={24} color="#22C55E" />
              </View>
              <View style={styles.securityInfo}>
                <Text style={styles.securityTitle}>4-Digit PIN</Text>
                <Text style={styles.securitySubtitle}>Secure your account with a PIN</Text>
              </View>
            </View>
            
            <View style={styles.securityActions}>
              <TouchableOpacity 
                style={[styles.securityButton, styles.changeButton]}
                onPress={handleChangePIN}
              >
                <Key size={16} color="#22C55E" />
                <Text style={[styles.securityButtonText, { color: '#22C55E' }]}>Change PIN</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.securityButton, styles.viewButton]}
                onPress={handleViewPIN}
              >
                <Eye size={16} color="#6B7280" />
                <Text style={[styles.securityButtonText, { color: '#6B7280' }]}>PIN Info</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.accountButton} onPress={handleSignOut}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.accountButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* PIN Verification Modal */}
      <PINVerificationModal
        visible={showPINModal}
        onClose={() => setShowPINModal(false)}
        onSuccess={handlePINVerificationSuccess}
        title={pinOperation === 'change' ? 'Change PIN' : 'View PIN Info'}
        subtitle={pinOperation === 'change' 
          ? 'Enter your current PIN to change it' 
          : 'Enter your PIN to view information'
        }
        operation="payment"
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
  },
  profileStat: {
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  profileStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  verificationCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  verificationStatus: {
    marginBottom: 16,
  },
  verificationText: {
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  verificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    marginTop: 2,
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
  },
  depositButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  depositText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 8,
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  infoArrow: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoArrowText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  verificationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1F2937',
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%', // Two buttons per row
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    color: '#1F2937',
    marginTop: 8,
  },
  securityCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  securityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityInfo: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  securitySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  securityActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  securityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  changeButton: {
    backgroundColor: '#E0F2FE',
  },
  viewButton: {
    backgroundColor: '#F3F4F6',
  },
  securityButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 8,
  },
  accountButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsInfo: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  settingsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  settingsArrow: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsArrowText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  groupedPaymentsCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupedPaymentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupedPaymentsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupedPaymentsInfo: {
    flex: 1,
  },
  groupedPaymentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  groupedPaymentsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  groupedPaymentsArrow: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupedPaymentsArrowText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});