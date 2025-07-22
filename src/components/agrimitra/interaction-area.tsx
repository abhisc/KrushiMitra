'use client';

import { useState, useEffect, ChangeEvent, DragEvent } from 'react';
import { Mic, Send, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { askAnything } from '@/ai/flows/ask-anything';

const HINTS = [
  'Tap to Speak (English)',
  'ಬಾಷೆ ಕೇಳಲು ಟ್ಯಾಪ್ ಮಾಡಿ (Kannada)',
  'बोलने के लिए टैप करें (Hindi)',
  'వినడానికి ట్యాప్ చేయండి (Telugu)',
];

type InteractionAreaProps = {
  isFocused: boolean;
  onFocusChange: (isFocused: boolean) => void;
  interactionMode: string; // 'chat' or 'diagnose'
};

export default function InteractionArea({ isFocused, onFocusChange, interactionMode }: InteractionAreaProps) {
  const [hintIndex, setHintIndex] = useState(0);
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [aiResponse, setAIResponse] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setHintIndex((prevIndex) => (prevIndex + 1) % HINTS.length);
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Clear selected image when interaction mode changes to 'chat'
    if (interactionMode === 'chat') {
      setSelectedImage(null);
    }
  }, [interactionMode]);

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (interactionMode === 'diagnose' && event.target.files && event.target.files[0]) {
      setSelectedImage(event.target.files[0]);
    } else {
      setSelectedImage(null);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (interactionMode === 'diagnose') {
      event.preventDefault();
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (interactionMode === 'diagnose') {
      event.preventDefault();
      setIsDragging(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (interactionMode === 'diagnose') {
      event.preventDefault();
      setIsDragging(false);

      if (event.dataTransfer.files && event.dataTransfer.files[0]) {
        setSelectedImage(event.dataTransfer.files[0]);
      }
    }
  };

  const askAI = async () => {
    if (!text && !selectedImage) {
      setAIResponse('Please enter text or upload an image to ask a question!');
      return;
    }

    let photoDataUri: string | undefined;
    if (selectedImage) {
      try {
        photoDataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(selectedImage);
        });
      } catch (error) {
        setAIResponse('Error reading image file.');
        return;
      }
    }

    askAnything({ text, photoDataUri }).then((res) => {
      setAIResponse(res.data?.response||'No response, please contact help!');
    })
  }

  return (
    <div
      className={cn(
        'relative w-full transition-all duration-500 ease-in-out',
        isFocused ? 'flex-grow flex flex-col' : ''
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
       {isDragging && interactionMode === 'diagnose' && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-sm z-10 rounded-lg border-2 border-dashed border-primary">
          <p className="text-primary text-lg font-semibold">Drop image here</p>
        </div>
      )}
      <div className="relative flex flex-col gap-2">
        <Textarea
          placeholder="Ask your question..."
          className={cn(
            'min-h-[60px] rounded-full py-4 px-6 text-lg resize-none shadow-lg focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-0',
             interactionMode === 'diagnose' ? 'pr-32' : 'pr-24'
          )}
          onFocus={() => onFocusChange(true)}
          onChange={(e) => setText(e.target.value)}
          value={text}
        />
        {interactionMode === 'diagnose' && (
        <div className="absolute right-16 top-1/2 -translate-y-1/2 flex items-center gap-2">
           <label htmlFor="image-upload" className="cursor-pointer rounded-full bg-secondary p-2 hover:bg-secondary/80">
            <ImageIcon className="h-5 w-5 text-primary" />
            <input id="image-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageSelect} />
          </label>
        </div>
         )}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <Button onClick={askAI} size="icon" className="rounded-full bg-accent hover:bg-accent/90">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {selectedImage && (
        <div className="mt-2 text-sm text-muted-foreground flex items-center justify-center">
          Selected image: {selectedImage.name}
        </div>
      )}
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
      <div className='p-2 mt-2 flex flex-col items-center justify-center border border-1 border-dashed rounded-sm'>{aiResponse || ''}</div>
    </div>
  );
}
