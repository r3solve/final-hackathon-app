# Firebase Setup Guide

## Environment Variables Setup

### Option 1: Create .env file (Recommended)
Create a `.env` file in your project root with the following content:

```bash
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyAbh4EhQ7EEjeZQVIAjTBHIRsxVZHIJE7Q
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=study-clinic-199f9.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=study-clinic-199f9
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=study-clinic-199f9.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=275795321529
EXPO_PUBLIC_FIREBASE_APP_ID=1:275795321529:web:9751911a5c8085e1313168
```

### Option 2: Use config.ts file (Current setup)
The project is currently configured to use the `lib/config.ts` file. You can modify this file directly.

## Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `study-clinic-199f9`
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password authentication
   - Optionally enable other providers as needed

4. Set up Firestore Database:
   - Go to Firestore Database
   - Create database in test mode (for development)
   - Set up security rules

5. Set up Storage:
   - Go to Storage
   - Initialize storage
   - Set up security rules

## Security Rules

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Profiles collection
    match /profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Transfer requests collection
    match /transferRequests/{requestId} {
      allow read, write: if request.auth != null && 
        (resource.data.senderId == request.auth.uid || 
         resource.data.recipientId == request.auth.uid);
    }
    
    // Transactions collection
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && 
        (resource.data.senderId == request.auth.uid || 
         resource.data.recipientId == request.auth.uid);
    }
  }
}
```

### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /verification-selfies/{userId}/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Testing Authentication

1. Run your app: `npm run dev`
2. Navigate to the sign-up screen
3. Create a test account
4. Verify you can sign in and out
5. Check that the user profile is created in Firestore

## Troubleshooting

### Common Issues:
1. **Module not found errors**: Run `npm install` to ensure all dependencies are installed
2. **Firebase initialization errors**: Check that your config values are correct
3. **Authentication errors**: Ensure Email/Password auth is enabled in Firebase Console
4. **Permission errors**: Check your Firestore and Storage security rules

### Debug Mode:
Enable debug logging by adding this to your Firebase config:
```typescript
if (__DEV__) {
  console.log('Firebase Config:', firebaseConfig);
}
```

## Next Steps

1. Test the authentication flow
2. Set up proper security rules for production
3. Add additional authentication providers if needed
4. Implement proper error handling and user feedback
5. Add loading states and offline support
