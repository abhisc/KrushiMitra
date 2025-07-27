'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, UserPlus } from 'lucide-react';

interface AdditionalInfoCardProps {
  onFillNow: () => void;
  onDismiss: () => void;
}

export default function AdditionalInfoCard({ onFillNow, onDismiss }: AdditionalInfoCardProps) {
  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Close button clicked');
    onDismiss();
  };

  const handleFillNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Fill Now button clicked');
    onFillNow();
  };

  return (
    <Card className="border-primary/20 w-80 shadow-lg relative">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-primary text-sm">
            <UserPlus className="w-4 h-4" />
            Help us improve your experience
          </CardTitle>
          <div className="relative z-[60]">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0 text-primary hover:text-primary/80 pointer-events-auto relative z-[60]"
              type="button"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <CardDescription className="text-primary/90 text-sm">
          Fill additional info (optional) to get personalized recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button 
          onClick={handleFillNow}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
          type="button"
        >
          Fill Now
        </Button>
      </CardContent>
    </Card>
  );
} 