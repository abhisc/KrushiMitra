'use client';

import { useState, useRef, useEffect, DragEvent } from 'react';

type ChatMessage = {
  sender: 'user' | 'ai';
  text: string;
  image?: string;
  file?: File;
};
import AppLayout from '@/components/agrimitra/app-layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Send, Paperclip, X, User, Bot } from 'lucide-react';
import { diagnoseCropDiseaseFromChat } from '@/ai/flows/diagnose-crop-disease-from-chat';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

export default function DiagnosePage() {
  const [chat, setChat] = useState<ChatMessage[]>([
    { sender: 'ai', text: 'Hi! Upload a crop photo (drag & drop or click) or describe symptoms to get a diagnosis.' }
  ]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  // Speech recognition setup (optional, can be expanded)
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedImage(event.target.files[0]);
    }
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    // Handle file drop (local)
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setSelectedImage(event.dataTransfer.files[0]);
      return;
    }
    // Handle image drop from web (HTML or URL)
    const items = event.dataTransfer.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'string' && item.type === 'text/uri-list') {
        item.getAsString(async (url) => {
          try {
            const res = await fetch(url);
            const blob = await res.blob();
            const name = url.split('/').pop()?.split('?')[0] || 'image.jpg';
            const file = new File([blob], name, { type: blob.type });
            setSelectedImage(file);
          } catch (e) {
            // ignore
          }
        });
        return;
      }
      // Handle HTML drag (e.g., from Google Images)
      if (item.kind === 'string' && item.type === 'text/html') {
        item.getAsString(async (html) => {
          const match = html.match(/<img[^>]+src=["']([^"'>]+)["']/);
          if (match && match[1]) {
            try {
              const res = await fetch(match[1]);
              const blob = await res.blob();
              const name = match[1].split('/').pop()?.split('?')[0] || 'image.jpg';
              const file = new File([blob], name, { type: blob.type });
              setSelectedImage(file);
            } catch (e) {
              // ignore
            }
          }
        });
        return;
      }
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;
    setIsLoading(true);
    let imageUrl: string | undefined;
    let fileToSend = selectedImage;
    // For preview, create a local URL
    if (selectedImage) {
      imageUrl = URL.createObjectURL(selectedImage);
    }
    setChat((prev) => [
      ...prev,
      { sender: 'user', text: input, image: imageUrl, file: fileToSend ?? undefined }
    ]);
    setInput('');
    setSelectedImage(null);
    try {
      // Send as FormData (simulate backend endpoint)
      const formData = new FormData();
      formData.append('textDescription', input);
      if (fileToSend) formData.append('photo', fileToSend);
      // Replace below with your actual API call
      // Example: const res = await fetch('/api/diagnose', { method: 'POST', body: formData });
      // const data = await res.json();
      // For now, fallback to diagnoseCropDiseaseFromChat (simulate file support)
      let res;
      if (fileToSend) {
        // If backend supports file, send formData; else, fallback to base64
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(fileToSend);
        });
        res = await diagnoseCropDiseaseFromChat({ textDescription: input, photoDataUri: base64 });
      } else {
        res = await diagnoseCropDiseaseFromChat({ textDescription: input });
      }
      setChat((prev) => [
        ...prev,
        { sender: 'ai', text: res.diagnosisResult || 'Could not diagnose, please try again.' }
      ]);
    } catch (e) {
      setChat((prev) => [
        ...prev,
        { sender: 'ai', text: 'Diagnosis failed. Please try again.' }
      ]);
    }
    setIsLoading(false);
  };

  return (
    <AppLayout title="Crop Disease Diagnosis" subtitle="Chat with the AI to diagnose crop diseases" showBackButton={true}>
      <div
        className="flex flex-col h-[80vh] max-w-2xl mx-auto bg-white rounded-lg shadow-lg border mt-8"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{ position: 'relative' }}
      >
        {isDragging && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg">
            <span className="text-primary text-lg font-semibold">Drop image here</span>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white" style={{ minHeight: 0 }}>
          {chat.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                'flex items-end gap-2',
                msg.sender === 'user' ? 'justify-end' : 'justify-start')
            }>
              {msg.sender === 'ai' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Bot className="w-5 h-5 text-primary" aria-label="AI" />
                </div>
              )}
              <div
                className={cn(
                  'relative max-w-xs px-4 py-2 rounded-2xl shadow-sm transition-all',
                  msg.sender === 'user'
                    ? 'bg-primary text-white rounded-br-md ml-2'
                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md mr-2')
                }
                tabIndex={0}
                aria-label={msg.sender === 'user' ? 'Your message' : 'AI message'}
              >
                {msg.image && (
                  <img
                    src={msg.image}
                    alt="User upload"
                    className="mb-2 max-w-[120px] rounded-lg border border-gray-200 shadow"
                    style={{ objectFit: 'cover' }}
                  />
                )}
                <span className="whitespace-pre-line break-words">{msg.text}</span>
              </div>
              {msg.sender === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-primary/30">
                  <User className="w-5 h-5 text-white" aria-label="You" />
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="p-4 border-t flex items-center gap-2 bg-white/80 backdrop-blur-md">
          <Popover>
            <PopoverTrigger asChild>
              <div className="relative cursor-pointer flex items-center group focus:outline-none" tabIndex={0} aria-label="Show attachment">
                <label htmlFor="image-upload" className="cursor-pointer flex items-center">
                  <Paperclip className="h-6 w-6 text-primary group-hover:text-primary/80 transition-colors" />
                  <input id="image-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageSelect} />
                </label>
                {selectedImage && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white border border-white rounded-full px-1 text-xs font-bold min-w-[18px] text-center shadow transition-all">1</span>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-2 w-56 rounded-xl shadow-xl border border-gray-200 bg-white">
              {selectedImage ? (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={URL.createObjectURL(selectedImage)}
                    alt="Selected preview"
                    className="max-h-32 max-w-full rounded-lg border border-gray-200 shadow"
                    style={{ objectFit: 'cover' }}
                  />
                  <span className="text-xs text-gray-500 break-all">{selectedImage.name}</span>
                  <Button size="icon" variant="ghost" onClick={() => setSelectedImage(null)} title="Remove image" aria-label="Remove image">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <span className="text-xs text-gray-400">No attachment</span>
              )}
            </PopoverContent>
          </Popover>
          <Textarea
            className="flex-1 resize-none rounded-full px-4 py-2 text-base border focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm bg-white/90"
            placeholder="Describe symptoms or upload a photo..."
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={1}
            disabled={isLoading}
            aria-label="Message input"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !selectedImage)}
            className="rounded-full h-12 w-12 flex items-center justify-center bg-primary hover:bg-primary/90 transition-colors shadow"
            aria-label="Send message"
          >
            {isLoading ? <span className="animate-spin">⏳</span> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
} 