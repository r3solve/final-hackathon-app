# Authentication Persistence

## Overview
This app implements persistent authentication using Firebase Auth with React Native persistence. Users will remain logged in until they explicitly sign out, even after closing and reopening the app.

## How It Works

### 1. Firebase Auth Persistence
- Uses `getReactNativePersistence(AsyncStorage)` to store authentication tokens locally
- Authentication state is automatically restored when the app starts
- No need to re-enter credentials after app restart

### 2. Authentication Flow
```
App Start → Check Auth State → 
├─ User Logged In → Navigate to Main App (/(tabs))
└─ No User → Navigate to Welcome Screen (/(auth)/welcome)
```

### 3. Key Components

#### AuthContext (`contexts/AuthContext.tsx`)
- Manages authentication state using `onAuthStateChanged`
- Automatically fetches user profile when authenticated
- Provides sign-in, sign-up, and sign-out functions

#### Main Router (`app/index.tsx`)
- Checks authentication state on app start
- Routes to appropriate screen based on auth status
- Shows loading screen while checking auth state

#### Firebase Configuration (`lib/firebase.ts`)
- Initializes Firebase Auth with persistence enabled
- Uses AsyncStorage for token storage
- Handles initialization errors gracefully

## User Experience

### Login Once
- User signs in with email/password
- Authentication tokens are stored locally
- User is redirected to main app

### Persistent Session
- App remembers user across restarts
- No need to log in again
- User goes directly to main app

### Logout
- User can sign out from Profile screen
- Clears all stored authentication data
- Redirects to welcome screen
- Must log in again to access app

## Debugging

The app includes console logging to help debug authentication issues:

- `🔐 Setting up auth state listener...` - Auth listener initialized
- `🔐 Auth state changed: [user info]` - Authentication state changes
- `✅ Email verified, fetching profile...` - Profile loading
- `🔄 App routing - Loading: [status] User: [email]` - Routing decisions
- `✅ User authenticated, navigating to tabs` - Successful auth
- `❌ No user, navigating to welcome` - No auth found

## Security Features

- Email verification required for full access
- Secure token storage using AsyncStorage
- Automatic token refresh
- Proper logout functionality

## Troubleshooting

If users are being logged out unexpectedly:

1. Check console logs for authentication errors
2. Verify Firebase configuration
3. Ensure AsyncStorage permissions
4. Check network connectivity for token refresh

## Testing

To test persistence:
1. Log in to the app
2. Close the app completely
3. Reopen the app
4. Should go directly to main app without login screen
5. Use logout button to test sign out functionality
