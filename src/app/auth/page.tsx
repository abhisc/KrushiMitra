'use client';

import React from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is already signed in, redirect to home
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleAuthSuccess = () => {
    router.push('/');
  };

  const handleReturnHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      {/* Return to Home Button */}
      <div className="absolute top-6 left-6">
        <Button
          variant="outline"
          onClick={handleReturnHome}
          className="flex items-center gap-2 bg-white/80 backdrop-blur-sm hover:bg-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <Home className="w-4 h-4" />
          Return to Home
        </Button>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-700 mb-2">KrushiMitra</h1>
          <p className="text-gray-600">Your AI Assistant for Smart Farming</p>
        </div>
        <AuthForm onSuccess={handleAuthSuccess} />
      </div>
    </div>
  );
} 