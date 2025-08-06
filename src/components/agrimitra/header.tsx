'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RightSidebar from '@/components/agrimitra/right-sidebar';
import { LanguageMenu } from '@/components/ui/language-menu';
import { useLanguage } from '@/contexts/language-context';

export default function Header() {
  const { currentLanguage } = useLanguage();
  
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <h1 className="text-2xl font-bold font-headline text-primary">Agrimitra</h1>
      <div className="flex items-center space-x-4">
        <LanguageMenu 
          onLanguageChange={(language) => {
            console.log("Language changed to:", language);
            // Language change is handled by the context
          }}
        />
        <RightSidebar>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open Settings</span>
          </Button>
        </RightSidebar>
      </div>
    </header>
  );
}
