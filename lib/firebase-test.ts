import { auth, db } from './firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';

// Test Firebase connection
export async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase connection...');
    
    // Test Firestore connection
    const testCollection = collection(db, 'test');
    await getDocs(testCollection);
    console.log('✅ Firestore connection successful');
    
    // Test Auth connection
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('✅ Auth connection successful, user:', user.uid);
      } else {
        console.log('✅ Auth connection successful, no user');
      }
      unsubscribe();
    });
    
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
}

// Test anonymous authentication
export async function testAnonymousAuth() {
  try {
    console.log('Testing anonymous authentication...');
    const userCredential = await signInAnonymously(auth);
    console.log('✅ Anonymous auth successful:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('❌ Anonymous auth failed:', error);
    return null;
  }
}

// Run all tests
export async function runFirebaseTests() {
  console.log('🚀 Starting Firebase tests...');
  
  const connectionTest = await testFirebaseConnection();
  if (!connectionTest) {
    console.error('❌ Firebase connection test failed');
    return false;
  }
  
  const authTest = await testAnonymousAuth();
  if (!authTest) {
    console.error('❌ Firebase auth test failed');
    return false;
  }
  
  console.log('✅ All Firebase tests passed!');
  return true;
}
