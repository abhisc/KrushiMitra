import Header from '@/components/agrimitra/header';
import InteractionArea from '@/components/agrimitra/interaction-area';
import { useState } from 'react';

export default function DiagnosePage() {
  const [isChatFocused, setIsChatFocused] = useState(true);
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 transition-all duration-300">
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-8">
          <h1 className="text-2xl font-bold font-headline text-primary mb-4">Diagnose Crop Disease</h1>
          <InteractionArea isFocused={isChatFocused} onFocusChange={setIsChatFocused} interactionMode="diagnose" />
        </div>
      </main>
    </div>
  );
} 