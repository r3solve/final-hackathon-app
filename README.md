# PayFlow - Secure Money Transfer App

A React Native/Expo app for secure money transfers with verification features.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Firebase:**
   - Create a `.env` file in the project root (see Firebase Setup section below)
   - Or use the existing configuration in `lib/config.ts`

3. **Run the app:**
   ```bash
   npm run dev
   ```

## 🔥 Firebase Setup

### Option 1: Environment Variables (Recommended)
Create a `.env` file in your project root:

```bash
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyAbh4EhQ7EEjeZQVIAjTBHIRsxVZHIJE7Q
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=study-clinic-199f9.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=study-clinic-199f9
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=study-clinic-199f9.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=275795321529
EXPO_PUBLIC_FIREBASE_APP_ID=1:275795321529:web:9751911a5c8085e1313168
```

### Option 2: Direct Configuration
Modify `lib/config.ts` with your Firebase credentials.

## 🔐 Firebase Console Setup

1. **Enable Authentication:**
   - Go to Firebase Console > Authentication > Sign-in method
   - Enable Email/Password authentication

2. **Set up Firestore:**
   - Go to Firestore Database
   - Create database in test mode (for development)

3. **Set up Storage:**
   - Go to Storage
   - Initialize storage bucket

4. **Security Rules:**
   See `FIREBASE_SETUP.md` for detailed security rules.

## 🧪 Testing Firebase

Run the Firebase tests to verify your setup:

```typescript
import { runFirebaseTests } from '@/lib/firebase-test';

// In your component or test file
useEffect(() => {
  runFirebaseTests();
}, []);
```

## 📱 Features

- **User Authentication:** Sign up, sign in, and profile management
- **Secure Transfers:** Money transfers with verification
- **Digital Wallet:** Balance tracking and transaction history
- **Verification System:** Selfie and location verification for transfers

## 🏗️ Project Structure

```
├── app/                    # Expo Router app screens
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app tabs
│   └── verify/            # Transfer verification
├── contexts/               # React contexts
│   └── AuthContext.tsx    # Authentication context
├── lib/                    # Firebase and utilities
│   ├── firebase.ts        # Firebase configuration
│   ├── config.ts          # App configuration
│   └── firebase-test.ts   # Firebase testing utilities
└── types/                  # TypeScript type definitions
```

## 🔧 Configuration

### Firebase Services
- **Authentication:** Email/password with AsyncStorage persistence
- **Firestore:** User profiles, transfer requests, transactions
- **Storage:** Verification selfies and documents

### Environment Variables
The app supports both environment variables and direct configuration:
- `EXPO_PUBLIC_FIREBASE_*` variables for Firebase config
- Fallback to hardcoded values in `lib/config.ts`

## 🚨 Troubleshooting

### Common Issues
1. **Module not found:** Run `npm install`
2. **Firebase errors:** Check your config values and Firebase Console setup
3. **Permission errors:** Verify security rules in Firebase Console

### Debug Mode
Enable debug logging by checking the console in development mode.

## 📚 Documentation

- **Firebase Setup:** See `FIREBASE_SETUP.md` for detailed instructions
- **Security Rules:** Comprehensive security configuration examples
- **Testing:** Firebase connection and authentication testing utilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
