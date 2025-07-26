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
  return (
    <Card className="border-primary/20 bg-primary/5 w-80 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-primary text-sm">
            <UserPlus className="w-4 h-4" />
            Help us improve your experience
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 text-primary hover:text-primary/80"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        <CardDescription className="text-primary/70 text-xs">
          Fill additional info (optional) to get personalized recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button 
          onClick={onFillNow}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
        >
          Fill Now
        </Button>
      </CardContent>
    </Card>
  );
} 