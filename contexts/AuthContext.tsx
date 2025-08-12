import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  User,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  collection, 
  getDocs 
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db, Profile } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phoneNumber: string) => Promise<{ error?: string; success?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error?: string; success?: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
  resendVerificationEmail: () => Promise<{ error?: string; success?: boolean }>;
  checkEmailVerification: () => Promise<boolean>;
  canPerformTransactions: () => boolean;
  canReceiveMoney: () => boolean;
  canSendMoney: () => boolean;
  canDeposit: () => boolean;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string; success?: boolean }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 Setting up auth state listener...');
    
    // Load cached profile data on app start
    const loadCachedProfile = async () => {
      try {
        const cachedProfile = await AsyncStorage.getItem('userProfile');
        if (cachedProfile) {
          const parsedProfile = JSON.parse(cachedProfile);
          console.log('📱 Loaded cached profile data:', parsedProfile);
          setProfile(parsedProfile);
        } else {
          console.log('📱 No cached profile data found');
        }
      } catch (error) {
        console.error('❌ Error loading cached profile:', error);
      }
    };

    // Load cached data first
    loadCachedProfile();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔐 Auth state changed:', user ? `User logged in: ${user.email}` : 'No user');
      setUser(user);
      if (user) {
        // Check if email is verified before fetching profile
        if (user.emailVerified) {
          console.log('✅ Email verified, fetching profile...');
          try {
            await fetchProfile(user.uid);
          } catch (error) {
            console.error('❌ Error fetching profile in auth state change:', error);
            setProfile(null);
            setLoading(false);
          }
        } else {
          console.log('⚠️ Email not verified yet');
          setProfile(null);
          setLoading(false);
        }
      } else {
        console.log('🚪 User logged out');
        setProfile(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('🔍 Fetching profile for user:', userId);
      const profileDoc = await getDoc(doc(db, 'profiles', userId));
      
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        console.log('📄 Profile data from Firestore:', data);
        
        // Helper function to safely convert Firestore timestamps
        const safeDate = (timestamp: any) => {
          if (timestamp && typeof timestamp.toDate === 'function') {
            return timestamp.toDate();
          }
          if (timestamp instanceof Date) {
            return timestamp;
          }
          if (timestamp && typeof timestamp === 'string') {
            return new Date(timestamp);
          }
          return new Date();
        };

        const profileData = {
          id: profileDoc.id,
          fullName: data.fullName || '',
          phoneNumber: data.phoneNumber || '',
          email: data.email || '',
          walletBalance: data.walletBalance || 0,
          isVerified: data.isVerified || false,
          emailVerified: data.emailVerified || false,
          ghanaCardNumber: data.ghanaCardNumber || '',
          ghanaCardFrontUrl: data.ghanaCardFrontUrl || '',
          ghanaCardBackUrl: data.ghanaCardBackUrl || '',
          selfieUrl: data.selfieUrl || '',
          verificationStatus: data.verificationStatus || 'pending',
          verificationSubmittedAt: safeDate(data.verificationSubmittedAt),
          verificationVerifiedAt: safeDate(data.verificationVerifiedAt),
          createdAt: safeDate(data.createdAt),
          updatedAt: safeDate(data.updatedAt),
        };
        
        console.log('✅ Processed profile data:', profileData);
        
        // Store profile data in AsyncStorage for persistence
        try {
          await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
          console.log('💾 Profile data saved to AsyncStorage');
        } catch (storageError) {
          console.error('❌ Error saving to AsyncStorage:', storageError);
        }
        
        setProfile(profileData);
        console.log('✅ Profile state updated successfully');
      } else {
        console.log('⚠️ No profile document found for user:', userId);
        setProfile(null);
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phoneNumber: string) => {
    try {
      setLoading(true);
      
      // Check if phone number is already taken
      const phoneQuery = query(
        collection(db, 'profiles'), 
        where('phoneNumber', '==', phoneNumber)
      );
      const phoneSnapshot = await getDocs(phoneQuery);
      
      if (!phoneSnapshot.empty) {
        return { error: 'Phone number is already registered' };
      }

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);
      
      // Create initial profile document (will be updated after email verification)
      const profileData = {
        fullName,
        phoneNumber,
        email,
        walletBalance: 100.00, // Starting balance in GHS
        isVerified: false,
        emailVerified: false,
        verificationStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'profiles', user.uid), profileData);
      
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Sign in user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        return { error: 'Please verify your email before signing in. Check your inbox for the verification link.' };
      }

      // Email is verified, now create/update the profile
      const profileData = {
        fullName: user.displayName || '',
        phoneNumber: '', // Will be updated from existing profile
        email: user.email,
        walletBalance: 100.00, // Starting balance in GHS
        isVerified: false,
        emailVerified: true,
        verificationStatus: 'pending',
        updatedAt: new Date(),
      };

      // Check if profile exists and update it
      const existingProfile = await getDoc(doc(db, 'profiles', user.uid));
      if (existingProfile.exists()) {
        const existingData = existingProfile.data();
        await updateDoc(doc(db, 'profiles', user.uid), {
          ...profileData,
          fullName: existingData.fullName,
          phoneNumber: existingData.phoneNumber,
          walletBalance: existingData.walletBalance,
          createdAt: existingData.createdAt,
        });
        console.log('✅ Updated existing profile for user:', user.uid);
      } else {
        // Create new profile with email verification
        await setDoc(doc(db, 'profiles', user.uid), {
          ...profileData,
          createdAt: new Date(),
        });
        console.log('✅ Created new profile for user:', user.uid);
      }

      // Fetch the updated profile to load it into the app state
      await fetchProfile(user.uid);

      return { success: true };
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Clear cached profile data on logout
      await AsyncStorage.removeItem('userProfile');
      console.log('🗑️ Cleared cached profile data on logout');
    } catch (error) {
      console.error('Error clearing cached profile:', error);
    }
    await firebaseSignOut(auth);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) return { error: 'Not authenticated' };

      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, 'profiles', user.uid), updateData);

      // Refresh profile and update cache
      await fetchProfile(user.uid);
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const resendVerificationEmail = async () => {
    try {
      if (!user) return { error: 'No user signed in' };
      
      await sendEmailVerification(user);
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      if (!email) return { error: 'Email is required' };
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const checkEmailVerification = async () => {
    try {
      if (!user) return false;
      
      // Reload user to get latest email verification status
      await user.reload();
      return user.emailVerified;
    } catch (error) {
      console.error('Error checking email verification:', error);
      return false;
    }
  };

  // Verification check functions
  const canPerformTransactions = () => {
    return !!(profile && profile.isVerified && profile.emailVerified);
  };

  const canReceiveMoney = () => {
    return !!(profile && profile.isVerified && profile.emailVerified);
  };

  const canSendMoney = () => {
    return !!(profile && profile.isVerified && profile.emailVerified);
  };

  const canDeposit = () => {
    return !!(profile && profile.isVerified && profile.emailVerified);
  };

  // Manual profile refresh function
  const refreshProfile = async () => {
    if (user) {
      console.log('🔄 Manually refreshing profile...');
      await fetchProfile(user.uid);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resendVerificationEmail,
    checkEmailVerification,
    canPerformTransactions,
    canReceiveMoney,
    canSendMoney,
    canDeposit,
    refreshProfile,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}