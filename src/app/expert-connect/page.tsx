'use client';

import React from 'react';
import Link from 'next/link';
import { Users, Globe, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/agrimitra/app-layout';

export default function ExpertConnectPage() {
  const router = useRouter();
  return (
    <AppLayout
      title="Expert Connect"
      subtitle="Connect with agricultural experts for personalized advice."
      showBackButton={true}
    >
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="flex flex-col gap-8">
          <Link href="/expert-connect/match" className="flex items-center gap-4 p-8 rounded-2xl shadow bg-white hover:bg-green-50 text-2xl font-semibold min-h-[90px]">
            <Users className="w-10 h-10 text-green-600" />
            <span>Find an Expert</span>
          </Link>
          <Link href="/expert-connect/community" className="flex items-center gap-4 p-8 rounded-2xl shadow bg-white hover:bg-green-50 text-2xl font-semibold min-h-[90px]">
            <Globe className="w-10 h-10 text-green-600" />
            <span>Community Forum</span>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
} 