import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  User
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
          console.log('📱 Loaded cached profile data');
          setProfile(parsedProfile);
        }
      } catch (error) {
        console.error('Error loading cached profile:', error);
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
          await fetchProfile(user.uid);
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
      const profileDoc = await getDoc(doc(db, 'profiles', userId));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        const profileData = {
          id: profileDoc.id,
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
          email: data.email,
          walletBalance: data.walletBalance,
          isVerified: data.isVerified || false,
          emailVerified: data.emailVerified || false,
          ghanaCardFrontUrl: data.ghanaCardFrontUrl,
          ghanaCardBackUrl: data.ghanaCardBackUrl,
          selfieUrl: data.selfieUrl,
          verificationStatus: data.verificationStatus || 'pending',
          verificationSubmittedAt: data.verificationSubmittedAt?.toDate(),
          verificationVerifiedAt: data.verificationVerifiedAt?.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        };
        
        // Store profile data in AsyncStorage for persistence
        await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
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
      } else {
        // Create new profile with email verification
        await setDoc(doc(db, 'profiles', user.uid), {
          ...profileData,
          createdAt: new Date(),
        });
      }

      return { success: true };
    } catch (error: any) {
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