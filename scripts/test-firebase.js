#!/usr/bin/env node

// Simple Firebase connection test script
// Run with: node scripts/test-firebase.js

const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAbh4EhQ7EEjeZQVIAjTBHIRsxVZHIJE7Q",
  authDomain: "study-clinic-199f9.firebaseapp.com",
  projectId: "study-clinic-199f9",
  storageBucket: "study-clinic-199f9.firebasestorage.app",
  messagingSenderId: "275795321529",
  appId: "1:275795321529:web:9751911a5c8085e1313168"
};

async function testFirebase() {
  try {
    console.log('🚀 Testing Firebase connection...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized');
    
    // Test Auth
    const auth = getAuth(app);
    console.log('✅ Firebase Auth initialized');
    
    // Test Firestore
    const db = getFirestore(app);
    console.log('✅ Firestore initialized');
    
    console.log('🎉 All Firebase services initialized successfully!');
    console.log('📱 Your Firebase configuration is working correctly.');
    
    return true;
  } catch (error) {
    console.error('❌ Firebase test failed:', error.message);
    return false;
  }
}

// Run the test
testFirebase().then(success => {
  process.exit(success ? 0 : 1);
});
