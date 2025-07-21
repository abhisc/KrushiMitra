'use client';

import { useState, useEffect } from 'react';
import { Mic, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const HINTS = [
  'Tap to Speak (English)',
  'ಬಾಷೆ ಕೇಳಲು ಟ್ಯಾಪ್ ಮಾಡಿ (Kannada)',
  'बोलने के लिए टैप करें (Hindi)',
  'వినడానికి ట్యాప్ చేయండి (Telugu)',
];

type InteractionAreaProps = {
  isFocused: boolean;
  onFocusChange: (isFocused: boolean) => void;
};

export default function InteractionArea({ isFocused, onFocusChange }: InteractionAreaProps) {
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setHintIndex((prevIndex) => (prevIndex + 1) % HINTS.length);
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div
      className={cn(
        'relative w-full transition-all duration-500 ease-in-out',
        isFocused ? 'flex-grow flex flex-col' : ''
      )}
    >
      <div className="relative flex flex-col gap-2">
        <Textarea
          placeholder="Ask your question..."
          className="min-h-[60px] rounded-full py-4 px-6 pr-24 text-lg resize-none shadow-lg focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-0"
          onFocus={() => onFocusChange(true)}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <Button type="submit" size="icon" className="rounded-full bg-accent hover:bg-accent/90">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="mt-4 flex flex-col items-center justify-center gap-2">
        <Button
          variant="outline"
          className="rounded-full h-16 w-16 p-0 border-2 border-primary/50 shadow-md hover:bg-primary/10"
          onClick={() => onFocusChange(true)}
        >
          <Mic className="h-8 w-8 text-primary" />
        </Button>
        <p className="text-sm text-muted-foreground font-headline h-5">{HINTS[hintIndex]}</p>
      </div>
    </div>
  );
}
