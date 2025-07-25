# Authentication Setup for KrushiMitra

This document describes the authentication system implemented in the KrushiMitra PWA.

## Features

### Authentication Methods
- **Email/Password**: Traditional email and password authentication
- **Google Sign-In**: OAuth authentication using Google accounts
- **Anonymous Sign-In**: Guest access without account creation

### Components

#### 1. Firebase Configuration (`src/lib/firebase.ts`)
- Initializes Firebase with your project configuration
- Sets up authentication and analytics
- Exports auth instance and Google provider

#### 2. Authentication Context (`src/contexts/auth-context.tsx`)
- Manages user state throughout the app
- Provides authentication methods (signIn, signUp, signOut, etc.)
- Handles auth state changes

#### 3. Authentication Form (`src/components/auth/auth-form.tsx`)
- Complete sign-in/sign-up form with validation
- Supports all three authentication methods
- Styled with your existing UI components

#### 4. User Menu (`src/components/auth/user-menu.tsx`)
- Dropdown menu for signed-in users
- Shows user avatar and basic info
- Provides quick access to profile and logout

#### 5. Auth Guard (`src/components/auth/auth-guard.tsx`)
- Protects routes that require authentication
- Shows auth form when user is not signed in
- Handles loading states

#### 6. Sign-In Button (`src/components/auth/sign-in-button.tsx`)
- Simple button component for prompting sign-in
- Only shows when user is not authenticated

## Usage

### For Users

1. **Sign In**: Click the "Sign In" button in the sidebar or visit `/auth`
2. **Choose Method**:
   - **Email/Password**: Enter your email and password
   - **Google**: Click "Continue with Google" to use your Google account
   - **Anonymous**: Click "Continue as Guest" for temporary access
3. **Profile Management**: Click your avatar in the header to access your profile
4. **Sign Out**: Use the dropdown menu or profile page to sign out

### For Developers

#### Adding Authentication to a Page

```tsx
import { useAuth } from '@/contexts/auth-context';

function MyPage() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;
  
  return <div>Welcome, {user.displayName}!</div>;
}
```

#### Protecting Routes

```tsx
import { AuthGuard } from '@/components/auth/auth-guard';

function ProtectedPage() {
  return (
    <AuthGuard requireAuth={true}>
      <div>This content requires authentication</div>
    </AuthGuard>
  );
}
```

#### Using Auth Methods

```tsx
import { useAuth } from '@/contexts/auth-context';

function MyComponent() {
  const { signIn, signUp, signInWithGoogle, signInAnonymously } = useAuth();
  
  const handleEmailSignIn = async () => {
    try {
      await signIn('user@example.com', 'password');
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };
}
```

## Firebase Console Setup

1. **Enable Authentication Methods**:
   - Go to Firebase Console > Authentication > Sign-in method
   - Enable Email/Password
   - Enable Google (configure OAuth consent screen)
   - Enable Anonymous authentication

2. **Configure Google Sign-In**:
   - Add your domain to authorized domains
   - Configure OAuth consent screen if needed

3. **Security Rules**:
   - Set up Firestore security rules if using database
   - Configure App Check if needed

## Environment Variables

The Firebase configuration is hardcoded in `src/lib/firebase.ts`. For production, consider using environment variables:

```typescript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  // ... other config
};
```

## Security Considerations

1. **Client-Side Security**: Remember that client-side code is visible to users
2. **Server-Side Validation**: Always validate data on the server side
3. **Rate Limiting**: Consider implementing rate limiting for auth attempts
4. **Error Handling**: Handle authentication errors gracefully
5. **User Data**: Be careful with user data and follow privacy regulations

## Troubleshooting

### Common Issues

1. **Google Sign-In Not Working**:
   - Check if domain is authorized in Firebase Console
   - Verify OAuth consent screen configuration

2. **Anonymous Sign-In Failing**:
   - Ensure anonymous authentication is enabled in Firebase Console

3. **Email/Password Issues**:
   - Check if email/password authentication is enabled
   - Verify email verification settings if enabled

### Debug Mode

Enable debug logging by adding this to your Firebase config:

```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase Auth Debug Mode');
}
```

## Next Steps

1. **User Profiles**: Implement more detailed user profiles
2. **Role-Based Access**: Add user roles and permissions
3. **Data Persistence**: Connect to Firestore for user data
4. **Email Verification**: Implement email verification flow
5. **Password Reset**: Add password reset functionality
6. **Social Login**: Add more social login providers (Facebook, Twitter, etc.) 