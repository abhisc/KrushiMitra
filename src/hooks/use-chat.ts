import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { chatService, ChatSession, ChatMessage, ChatType } from '@/firebaseStore/services/chat-service';

export interface UseChatReturn {
  recentChats: ChatSession[];
  loading: boolean;
  error: string | null;
  refreshChats: () => Promise<void>;
  startNewChat: (
    chatType: ChatType,
    title: string,
    firstMessage: string,
    imageFile?: File,
    metadata?: any
  ) => Promise<{ chatId: string; messageId: string }>;
  addMessageToChat: (
    chatId: string,
    chatType: ChatType,
    role: 'user' | 'assistant',
    content: string,
    imageFile?: File,
    metadata?: any
  ) => Promise<string>;
  getChatMessages: (chatId: string) => Promise<ChatMessage[]>;
  deleteChat: (chatId: string) => Promise<void>;
}

export function useChat(): UseChatReturn {
  const { user } = useAuth();
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshChats = useCallback(async () => {
    if (!user?.uid) return;

    setLoading(true);
    setError(null);

    try {
      const chats = await chatService.getRecentChats(user.uid, 10);
      setRecentChats(chats);
    } catch (err) {
      console.error('Error fetching recent chats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch recent chats');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const startNewChat = useCallback(async (
    chatType: ChatType,
    title: string,
    firstMessage: string,
    imageFile?: File,
    metadata?: any
  ) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      const result = await chatService.startChat(
        user.uid,
        chatType,
        title,
        firstMessage,
        imageFile,
        metadata
      );

      // Refresh the recent chats list
      await refreshChats();

      return result;
    } catch (err) {
      console.error('Error starting new chat:', err);
      throw err;
    }
  }, [user?.uid, refreshChats]);

  const addMessageToChat = useCallback(async (
    chatId: string,
    chatType: ChatType,
    role: 'user' | 'assistant',
    content: string,
    imageFile?: File,
    metadata?: any
  ) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      const messageId = await chatService.addMessageToChat(
        chatId,
        user.uid,
        chatType,
        role,
        content,
        imageFile,
        metadata
      );

      // Refresh the recent chats list
      await refreshChats();

      return messageId;
    } catch (err) {
      console.error('Error adding message to chat:', err);
      throw err;
    }
  }, [user?.uid, refreshChats]);

  const getChatMessages = useCallback(async (chatId: string): Promise<ChatMessage[]> => {
    try {
      return await chatService.getChatMessages(chatId);
    } catch (err) {
      console.error('Error fetching chat messages:', err);
      throw err;
    }
  }, []);

  const deleteChat = useCallback(async (chatId: string) => {
    try {
      await chatService.deleteChat(chatId);
      // Refresh the recent chats list
      await refreshChats();
    } catch (err) {
      console.error('Error deleting chat:', err);
      throw err;
    }
  }, [refreshChats]);

  // Load recent chats on mount and when user changes
  useEffect(() => {
    if (user?.uid) {
      refreshChats();
    } else {
      setRecentChats([]);
    }
  }, [user?.uid, refreshChats]);

  return {
    recentChats,
    loading,
    error,
    refreshChats,
    startNewChat,
    addMessageToChat,
    getChatMessages,
    deleteChat,
  };
} 