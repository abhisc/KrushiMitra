'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { UserService, UserProfile } from '@/lib/user-service';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  loadUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Create UserService instance
  const userService = new UserService();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        loadUserProfile();
      } else {
        setUserProfile(null);
      }
    });

    return unsubscribe;
  }, []);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const profile = await userService.ensureUserProfile({
        uid: user.uid,
        displayName: user.displayName || (user.isAnonymous ? 'Anonymous User' : 'User'),
        email: user.email || undefined,
        photoURL: user.photoURL || undefined,
      });
      
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Set a basic profile even if there's an error
      setUserProfile({
        uid: user.uid,
        displayName: user.displayName || (user.isAnonymous ? 'Anonymous User' : 'User'),
        email: user.email || undefined,
        photoURL: user.photoURL || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
      }
      
      // Create user profile in Firestore
      if (result.user) {
        await userService.createUserProfile({
          uid: result.user.uid,
          displayName: displayName || result.user.displayName || 'User',
          email: result.user.email || undefined,
          photoURL: result.user.photoURL || undefined,
        });
      }
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Create user profile in Firestore if it doesn't exist
      if (result.user) {
        const existingProfile = await userService.getUserProfile(result.user.uid);
        if (!existingProfile) {
          await userService.createUserProfile({
            uid: result.user.uid,
            displayName: result.user.displayName || 'User',
            email: result.user.email || undefined,
            photoURL: result.user.photoURL || undefined,
          });
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const signInAnonymouslyUser = async () => {
    try {
      const result = await signInAnonymously(auth);
      
      // Create user profile in Firestore
      if (result.user) {
        await userService.createUserProfile({
          uid: result.user.uid,
          displayName: 'Anonymous User',
          email: undefined,
          photoURL: undefined,
        });
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  };

  const updateUserProfile = async (displayName: string) => {
    try {
      if (user) {
        await updateProfile(user, { displayName });
        await loadUserProfile(); // Reload profile data
      }
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInAnonymously: signInAnonymouslyUser,
    logout,
    resetPassword,
    updateUserProfile,
    loadUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 