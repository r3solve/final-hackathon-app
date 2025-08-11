// Firebase Configuration with environment variable support
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAbh4EhQ7EEjeZQVIAjTBHIRsxVZHIJE7Q",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "study-clinic-199f9.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "study-clinic-199f9",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "study-clinic-199f9.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "275795321529",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:275795321529:web:9751911a5c8085e1313168"
};

// App Configuration
export const appConfig = {
  appName: "PayFlow",
  version: "1.0.0",
  // Add other app-specific configuration here
};

// Environment Configuration
export const isDevelopment = __DEV__;
export const isProduction = !__DEV__;

// Debug logging in development
if (isDevelopment) {
  console.log('Firebase Config:', firebaseConfig);
  console.log('Environment:', isDevelopment ? 'Development' : 'Production');
}
