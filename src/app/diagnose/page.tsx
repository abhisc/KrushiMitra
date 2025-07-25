'use client';

import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/agrimitra/app-layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Send, Image as ImageIcon } from 'lucide-react';
import { diagnoseCropDiseaseFromChat } from '@/ai/flows/diagnose-crop-disease-from-chat';
import { cn } from '@/lib/utils';

export default function DiagnosePage() {
  const [chat, setChat] = useState([
    { sender: 'ai', text: 'Hi! Upload a crop photo or describe symptoms to get a diagnosis.' }
  ]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
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

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;
    setIsLoading(true);
    let photoDataUri: string | undefined;
    if (selectedImage) {
      photoDataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(selectedImage);
      });
    }
    setChat((prev) => [
      ...prev,
      { sender: 'user', text: input, image: photoDataUri }
    ]);
    setInput('');
    setSelectedImage(null);
    try {
      const res = await diagnoseCropDiseaseFromChat({ textDescription: input, photoDataUri });
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
      <div className="flex flex-col h-[80vh] max-w-2xl mx-auto bg-white rounded-lg shadow-lg border mt-8">
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 0 }}>
          {chat.map((msg, idx) => (
            <div key={idx} className={cn(
              'flex',
              msg.sender === 'user' ? 'justify-end' : 'justify-start')
            }>
              <div className={cn(
                'max-w-xs px-4 py-2 rounded-lg',
                msg.sender === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-100 text-gray-900 rounded-bl-none')
              }>
                {msg.image && <img src={msg.image} alt="User upload" className="mb-2 max-w-[120px] rounded" />}
                <span>{msg.text}</span>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="p-4 border-t flex items-center gap-2">
          <label htmlFor="image-upload" className="cursor-pointer">
            <ImageIcon className="h-6 w-6 text-primary" />
            <input id="image-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageSelect} />
          </label>
          <Textarea
            className="flex-1 resize-none rounded-full px-4 py-2 text-base border focus:ring-primary"
            placeholder="Describe symptoms or upload a photo..."
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={1}
            disabled={isLoading}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <Button onClick={handleSend} disabled={isLoading || (!input.trim() && !selectedImage)} className="rounded-full h-12 w-12 flex items-center justify-center">
            {isLoading ? <span className="animate-spin">⏳</span> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
} 