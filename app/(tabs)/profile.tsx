import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { 
  User, 
  Phone, 
  Mail, 
  LogOut, 
  Wallet, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Clock,
  XCircle,
  CreditCard,
  Plus
} from 'lucide-react-native';

export default function Profile() {
  const { profile, user, signOut, canPerformTransactions } = useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
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

  const getVerificationStatus = () => {
    if (!profile) return { status: 'unknown', text: 'Unknown', color: '#6B7280', icon: Shield };
    
    switch (profile.verificationStatus) {
      case 'verified':
        return { status: 'verified', text: 'Verified', color: '#22C55E', icon: CheckCircle };
      case 'submitted':
        return { status: 'submitted', text: 'Under Review', color: '#F59E0B', icon: Clock };
      case 'rejected':
        return { status: 'rejected', text: 'Rejected', color: '#EF4444', icon: XCircle };
      default:
        return { status: 'pending', text: 'Not Verified', color: '#6B7280', icon: AlertCircle };
    }
  };

  const verificationInfo = getVerificationStatus();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Manage your account and verification</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <User size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.name}>{profile?.fullName}</Text>
          <Text style={styles.joinDate}>
            Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GH', {
              month: 'long',
              year: 'numeric'
            }) : 'N/A'}
          </Text>
          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>{profile?.verificationStatus === 'verified' ? 'Verified' : 'Unverified'}</Text>
              <Text style={styles.profileStatLabel}>Status</Text>
            </View>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>{profile?.phoneNumber ? 'Active' : 'Inactive'}</Text>
              <Text style={styles.profileStatLabel}>Phone</Text>
            </View>
          </View>
        </View>

        {/* Verification Status Card */}
        <View style={styles.verificationCard}>
          <View style={styles.verificationHeader}>
            <verificationInfo.icon size={24} color={verificationInfo.color} />
            <Text style={styles.verificationTitle}>Verification Status</Text>
          </View>
          
          <View style={styles.verificationStatus}>
            <Text style={[styles.verificationText, { color: verificationInfo.color }]}>
              {verificationInfo.text}
            </Text>
          </View>

          {verificationInfo.status === 'pending' && (
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={() => router.push('/(tabs)/document-upload')}
            >
              <Shield size={20} color="#FFFFFF" />
              <Text style={styles.verifyButtonText}>Complete Verification</Text>
            </TouchableOpacity>
          )}

          {verificationInfo.status === 'rejected' && (
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={() => router.push('/(tabs)/document-upload')}
            >
              <Shield size={20} color="#FFFFFF" />
              <Text style={styles.verifyButtonText}>Resubmit Verification</Text>
            </TouchableOpacity>
          )}

          {verificationInfo.status === 'submitted' && (
            <Text style={styles.verificationMessage}>
              Your verification documents are under review. This usually takes 24-48 hours.
            </Text>
          )}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Wallet size={20} color="#22C55E" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Wallet Balance</Text>
              <Text style={styles.infoValue}>
                {formatCurrency(profile?.walletBalance || 0)}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Phone size={20} color="#3B82F6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{formatPhoneNumber(profile?.phoneNumber || '')}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Mail size={20} color="#A855F7" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Shield size={20} color={verificationInfo.color} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Identity Verification</Text>
              <Text style={[styles.infoValue, { color: verificationInfo.color }]}>
                {verificationInfo.text}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => router.push('/(tabs)/payment-methods')}
          >
            <View style={styles.infoIcon}>
              <CreditCard size={20} color="#8B5CF6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Payment Methods</Text>
              <Text style={styles.infoValue}>Manage accounts</Text>
            </View>
            <View style={styles.infoArrow}>
              <Text style={styles.infoArrowText}>›</Text>
            </View>
          </TouchableOpacity>

          {profile?.ghanaCardNumber && (
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Shield size={20} color="#22C55E" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ghana Card Number</Text>
                <Text style={styles.infoValue}>
                  {profile.ghanaCardNumber}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.depositButton} 
            onPress={() => router.push('/(tabs)/deposit')}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.depositText}>Deposit Money</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
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
});