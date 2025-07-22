'use client';

import { useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import LeftSidebar from '@/components/agrimitra/left-sidebar';
import Header from '@/components/agrimitra/header';
import InteractionArea from '@/components/agrimitra/interaction-area';
import QuickActions from '@/components/agrimitra/quick-actions';

export default function Home() {
  const [isChatFocused, setIsChatFocused] = useState(false);

  return (
    <SidebarProvider>
      <LeftSidebar />
      <SidebarInset className="flex flex-col !min-h-screen">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 transition-all duration-300">
          <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
            <InteractionArea
              isFocused={isChatFocused}
              onFocusChange={setIsChatFocused}
            />
            {!isChatFocused && <QuickActions onFocusChange={setIsChatFocused} />}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
