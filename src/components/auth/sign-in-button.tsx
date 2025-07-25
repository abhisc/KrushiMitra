'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { LogIn, User as UserIcon } from 'lucide-react';

interface SignInButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function SignInButton({ variant = 'outline', size = 'default', className = '' }: SignInButtonProps) {
  const { user } = useAuth();
  const router = useRouter();

  if (user) return null;

  const handleSignIn = () => {
    router.push('/auth');
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSignIn}
      className={className}
    >
      <LogIn className="mr-2 h-4 w-4" />
      Sign In
    </Button>
  );
} 