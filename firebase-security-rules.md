# Firebase Security Rules

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Profiles collection - User identity and verification data
    match /profiles/{userId} {
      // Users can only read and write their own profile
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Admin users can read all profiles (you'll need to implement admin role checking)
      // allow read: if request.auth != null && isAdmin(request.auth.uid);
    }
    
    // Transfer requests collection
    match /transferRequests/{requestId} {
      // Users can only read/write transfer requests they're involved in
      allow read, write: if request.auth != null && 
        (resource.data.senderId == request.auth.uid || 
         resource.data.recipientId == request.auth.uid);
    }
    
    // Transactions collection
    match /transactions/{transactionId} {
      // Users can only read/write transactions they're involved in
      allow read, write: if request.auth != null && 
        (resource.data.senderId == request.auth.uid || 
         resource.data.recipientId == request.auth.uid);
    }
    
    // Admin verification collection (optional - for admin actions)
    match /adminVerifications/{verificationId} {
      // Only admin users can access this collection
      allow read, write: if request.auth != null && isAdmin(request.auth.uid);
    }
  }
}

// Helper function to check if user is admin (implement based on your admin system)
function isAdmin(userId) {
  // You can implement this by checking against a separate admin collection
  // or by checking specific user IDs
  return userId in ['admin_user_id_1', 'admin_user_id_2'];
}
```

## Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Verification documents - users can only access their own files
    match /verification/{userId}/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Validate file types
      allow write: if request.auth != null && 
                   request.auth.uid == userId &&
                   request.resource.size < 10 * 1024 * 1024 && // 10MB max
                   request.resource.contentType.matches('image/.*');
    }
    
    // User profile images (if you add profile pictures later)
    match /profiles/{userId}/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      allow write: if request.auth != null && 
                   request.auth.uid == userId &&
                   request.resource.size < 5 * 1024 * 1024 && // 5MB max
                   request.resource.contentType.matches('image/.*');
    }
    
    // Transfer verification images
    match /transferVerification/{userId}/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      allow write: if request.auth != null && 
                   request.auth.uid == userId &&
                   request.resource.size < 10 * 1024 * 1024 && // 10MB max
                   request.resource.contentType.matches('image/.*');
    }
  }
}
```

## Authentication Rules

### Email Verification Requirements
- Users must verify their email before accessing protected features
- Unverified users can only access basic profile information
- Email verification is required for all financial transactions

### Verification Document Requirements
- Ghana National ID Card (front and back)
- Live selfie for identity verification
- Documents must be clear and legible
- File size limits: 10MB per image
- Supported formats: JPG, PNG

## Data Validation Rules

### Profile Data Validation
```javascript
// Example validation rules for profile data
function validateProfileData(data) {
  return data.fullName is string && 
         data.fullName.size() > 0 && 
         data.fullName.size() < 100 &&
         data.phoneNumber is string && 
         data.phoneNumber.matches('^\\+?[\\d\\s\\-\\(\\)]+$') &&
         data.email is string && 
         data.email.matches('^[^@]+@[^@]+\\.[^@]+$') &&
         data.walletBalance is number && 
         data.walletBalance >= 0;
}
```

### Verification Status Validation
```javascript
// Verification status must be one of the allowed values
function validateVerificationStatus(status) {
  return status in ['pending', 'submitted', 'verified', 'rejected'];
}
```

## Rate Limiting and Abuse Prevention

### Upload Limits
- Maximum 3 verification attempts per day
- Maximum file size: 10MB per image
- Maximum total storage per user: 50MB

### Request Limits
- Maximum 10 profile updates per hour
- Maximum 5 verification submissions per day
- Maximum 100 authentication attempts per hour

## Privacy and Data Protection

### Sensitive Data Handling
- Ghana ID card images are encrypted at rest
- Selfie images are stored securely
- All verification data is automatically deleted after 7 years (GDPR compliance)
- Users can request deletion of their verification data

### Access Control
- Only the user can access their own verification documents
- Admin access is restricted to authorized personnel only
- All access attempts are logged for audit purposes

## Implementation Notes

### Setting Up Rules
1. Copy the Firestore rules to your Firebase Console > Firestore > Rules
2. Copy the Storage rules to your Firebase Console > Storage > Rules
3. Deploy the rules to activate them

### Testing Rules
1. Test with authenticated users
2. Test with unauthenticated users
3. Test with different user roles
4. Verify file upload restrictions
5. Test data validation

### Monitoring
1. Enable Firebase App Check for additional security
2. Monitor authentication attempts
3. Track verification submission patterns
4. Set up alerts for suspicious activity

## Security Best Practices

1. **Always validate data on both client and server**
2. **Use Firebase App Check to prevent abuse**
3. **Implement proper error handling without exposing sensitive information**
4. **Regularly review and update security rules**
5. **Monitor access patterns and set up alerts**
6. **Implement proper logging for audit trails**
7. **Use Firebase Functions for complex validation logic**
8. **Regularly backup and test security configurations**
