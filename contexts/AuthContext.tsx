import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut, signInWithEmailAndPassword, sendEmailVerification, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { PINManager } from '@/lib/pin-manager';
import { Profile } from '@/types/env';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  pinVerified: boolean;
  hasPIN: boolean;
  canPerformTransactions:any,
  canSendMoney: any,
  canReceiveMoney: any,
  canDeposit :any,
  refreshProfile:any,
  signOut: () => Promise<void>;
  checkPINStatus: () => Promise<void>;
  setPINVerified: (verified: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ success?: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success?: boolean; error?: string }>;
  resendVerificationEmail: () => Promise<{ success?: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinVerified, setPINVerified] = useState(false);
  const [hasPIN, setHasPIN] = useState(false);

  // Sign up function
  const signUp = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;
      if (currentUser && !currentUser.emailVerified) {
        await sendEmailVerification(currentUser);
        return { success: true, error: 'Please verify your email. A verification link has been sent.' };
      }
      return { success: true };
    } catch (err: any) {
      console.error(err);
      return { error: err.message || 'Failed to sign up' };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userHasPIN = await PINManager.hasPIN();
        setHasPIN(userHasPIN);

        if (userHasPIN) {
          const synced = await PINManager.syncPINFromFirebase(user.uid);
          if (synced) {
            setHasPIN(true);
          }
        }

        const profileRef = doc(db, 'users', user.uid);
        const profileUnsubscribe = onSnapshot(profileRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setProfile({
              fullName: data.fullName || '',
              email: data.email || user.email || '',
              phoneNumber: data.phoneNumber || '',
              walletBalance: data.walletBalance || 0,
              isVerified: data.isVerified || false,
              verificationStatus: data.verificationStatus || 'pending',
              profileImageUrl: data.profileImageUrl || undefined,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            });
          } else {
            const defaultProfile: Profile = {
              fullName: user.displayName || '',
              email: user.email || '',
              phoneNumber: '',
              walletBalance: 0,
              isVerified: false,
              verificationStatus: 'pending',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            setProfile(defaultProfile);
          }
        });
        return () => profileUnsubscribe();
      } else {
        setProfile(null);
        setPINVerified(false);
        setHasPIN(false);
      }
    
    });
    setLoading(false);
    return unsubscribe;
  }, []);


  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;
      
      if (currentUser && !currentUser.emailVerified) {
        await sendEmailVerification(currentUser);
        return { error: 'Please verify your email. A verification link has been sent.' };
      }
  

      return { success: true };
    } catch (err: any) {
      console.error(err);
      return { error: err.message || 'Failed to sign in' };
    }
  };

  // Checks if user can perform any transaction (basic verification)
  const canPerformTransactions = () => {
    return !!profile && profile.verificationStatus === "approved";
  };

  // Checks if user can send money
  const canSendMoney = () => {
    return canPerformTransactions() && (profile?.walletBalance ?? 0) > 0;
  };

  // Checks if user can receive money
  const canReceiveMoney = () => {
    return canPerformTransactions();
  };

  // Checks if user can deposit money
  const canDeposit = () => {
    return canPerformTransactions();
  };

  // Refreshes the profile from Firestore
  const refreshProfile = async () => {
    if (!user) return;
    try {
      const profileRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(profileRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({
          fullName: data.fullName || '',
          email: data.email || user.email || '',
          phoneNumber: data.phoneNumber || '',
          walletBalance: data.walletBalance || 0,
          isVerified: data.isVerified || false,
          verificationStatus: data.verificationStatus || 'pending',
          profileImageUrl: data.profileImageUrl || undefined,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const resendVerificationEmail = async () => {
    try {
      if (!auth.currentUser) {
        return { error: 'No user is signed in' };
      }

      await sendEmailVerification(auth.currentUser);
      return { success: true };
    } catch (err: any) {
      console.error(err);
      return { error: err.message || 'Failed to send verification email' };
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const checkPINStatus = async () => {
    try {
      const userHasPIN = await PINManager.hasPIN();
      setHasPIN(userHasPIN);
    } catch (error) {
      console.error('Error checking PIN status:', error);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    pinVerified,
    hasPIN,
    signOut: handleSignOut,
    checkPINStatus,
    setPINVerified,
    signIn,
  signUp,
    resendVerificationEmail,
    canPerformTransactions,
    canSendMoney,
    canReceiveMoney,
    canDeposit,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};