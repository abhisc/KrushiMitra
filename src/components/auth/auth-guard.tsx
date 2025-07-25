'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { AuthForm } from './auth-form';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ children, requireAuth = false }: AuthGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If auth is not required, show children regardless of auth state
  if (!requireAuth) {
    return <>{children}</>;
  }

  // If auth is required and user is not signed in, show auth form
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-full max-w-md px-4">
          <AuthForm />
        </div>
      </div>
    );
  }

  // If user is signed in, show children
  return <>{children}</>;
} 