'use client';

import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import LeftSidebar from '@/components/agrimitra/left-sidebar';
import Header from '@/components/agrimitra/header';
import QuickActions from '@/components/agrimitra/quick-actions';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();
  return (
    <SidebarProvider defaultOpen={true}>
      <LeftSidebar />
      <SidebarInset className="flex flex-col !min-h-screen">
        <Header />
        <SidebarTrigger className="md:hidden" />
        <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 transition-all duration-300">
          <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
            <Button
              className="w-full py-6 text-lg font-headline"
              onClick={() => router.push('/diagnose')}
            >
              Start Chat / Diagnose Crop Disease
            </Button>
            <QuickActions onFocusChange={() => {}} setInteractionMode={() => {}} />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
