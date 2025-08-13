import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from './config';

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw error;
}

// Initialize Firebase Auth with persistence
let auth:any;
try {
  auth = initializeAuth(app);
  console.log('✅ Firebase Auth initialized successfully with persistence');
} catch (error) {
  // If auth is already initialized, get the existing instance
  try {
    auth = getAuth(app);
    console.log('✅ Firebase Auth retrieved successfully');
  } catch (getAuthError) {
    console.error('❌ Firebase Auth initialization failed:', getAuthError);
    throw getAuthError;
  }
}

// Initialize Firestore
let db: Firestore;
try {
  db = getFirestore(app);
  console.log('✅ Firestore initialized successfully');
} catch (error) {
  console.error('❌ Firestore initialization failed:', error);
  throw error;
}

// Initialize Storage
let storage;
try {
  storage = getStorage(app);
  console.log('✅ Firebase Storage initialized successfully');
} catch (error) {
  console.error('❌ Firebase Storage initialization failed:', error);
  throw error;
}

// Connect to emulators in development (if needed)
if (__DEV__) {
  // Uncomment these lines if you want to use Firebase emulators
  // try {
  //   connectFirestoreEmulator(db, 'localhost', 8080);
  //   connectStorageEmulator(storage, 'localhost', 9199);
  //   console.log('✅ Connected to Firebase emulators');
  // } catch (error) {
  //   console.log('ℹ️ Firebase emulators not available');
  // }
}

export { auth, db, storage };
export default app;

// Database schema types
export interface Profile {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  walletBalance: number;
  isVerified: boolean;
  emailVerified: boolean;
  ghanaCardNumber?: string;
  ghanaCardFrontUrl?: string;
  ghanaCardBackUrl?: string;
  selfieUrl?: string;
  verificationStatus: 'pending' | 'submitted' | 'verified' | 'rejected';
  verificationSubmittedAt?: Date;
  verificationVerifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransferRequest {
  id: string;
  senderId: string;
  recipientId: string;
  amount: number;
  status: 'pending' | 'verified' | 'approved' | 'completed' | 'cancelled';
  verificationSelfieUrl?: string;
  verificationLocation?: {
    latitude: number;
    longitude: number;
    timestamp: number;
  };
  createdAt: Date;
  verifiedAt?: Date;
  completedAt?: Date;
}

export interface Transaction {
  id: string;
  transferRequestId: string;
  senderId: string;
  recipientId: string;
  amount: number;
  description: string;
  createdAt: Date;
}