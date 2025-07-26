"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useChat, ChatType } from '@/firebaseStore/services/chat-service';
import { toast } from '@/hooks/use-toast';

interface ChatExampleProps {
  chatType: ChatType;
  title: string;
  placeholder?: string;
}

export function ChatExample({ chatType, title, placeholder = "Type your message..." }: ChatExampleProps) {
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { startNewChat, addMessageToChat, recentChats } = useChat();

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      // Start a new chat or add to existing chat
      if (recentChats.length === 0) {
        // Start new chat
        await startNewChat(
          chatType,
          title,
          message,
          imageFile || undefined,
          { timestamp: new Date().toISOString() }
        );
        toast({
          title: "Chat started",
          description: "Your message has been sent and chat session created.",
        });
      } else {
        // Add to existing chat (using the most recent chat)
        const mostRecentChat = recentChats[0];
        await addMessageToChat(
          mostRecentChat.id!,
          chatType,
          'user',
          message,
          imageFile || undefined,
          { timestamp: new Date().toISOString() }
        );
        toast({
          title: "Message sent",
          description: "Your message has been added to the chat.",
        });
      }

      setMessage('');
      setImageFile(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder={placeholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[100px]"
          />
          
          <div className="flex items-center space-x-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="flex-1"
            />
            {imageFile && (
              <span className="text-xs text-muted-foreground">
                {imageFile.name}
              </span>
            )}
          </div>
        </div>

        <Button 
          onClick={handleSendMessage} 
          disabled={!message.trim()}
          className="w-full"
        >
          Send Message
        </Button>

        {recentChats.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Recent Chats:</h4>
            <div className="space-y-2">
              {recentChats.slice(0, 3).map((chat) => (
                <div key={chat.id} className="text-xs p-2 bg-muted rounded">
                  <div className="font-medium">{chat.title}</div>
                  <div className="text-muted-foreground">{chat.lastMessage}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 