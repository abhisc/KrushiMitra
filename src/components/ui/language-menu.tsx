"use client";

import React from "react";
import { Globe, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";

interface LanguageMenuProps {
  onLanguageChange?: (language: any) => void;
}

export function LanguageMenu({ onLanguageChange }: LanguageMenuProps) {
  const { currentLanguage, setLanguage, languages } = useLanguage();

  const handleLanguageSelect = (language: any) => {
    setLanguage(language);
    onLanguageChange?.(language);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="sm" className="flex items-center gap-2">
           <Globe className="w-4 h-4" />
           <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
           <ChevronDown className="w-3 h-3" />
         </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageSelect(language)}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="font-medium">{language.nativeName}</span>
              <span className="text-xs text-muted-foreground">{language.name}</span>
            </div>
                         {currentLanguage.code === language.code && (
               <div className="w-2 h-2 bg-primary rounded-full" />
             )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 