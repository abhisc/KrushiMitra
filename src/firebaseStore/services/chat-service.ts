import { FirestoreService, BaseDocument, DBCollectionKeys } from "../firestore-service";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// Chat types for different features
export enum ChatType {
  QUICK_CHAT = "quick_chat",
  DIAGNOSIS = "diagnosis",
  MARKET_ANALYSIS = "market_analysis",
  WEATHER_TIPS = "weather_tips",
  SCHEME_INFO = "scheme_info",
  FARM_JOURNAL = "farm_journal",
  GENERAL = "general"
}

// Message interface
export interface ChatMessage extends BaseDocument {
  userId: string;
  chatId: string;
  chatType: ChatType;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: Date;
  metadata?: {
    cropType?: string;
    location?: string;
    weatherData?: any;
    marketData?: any;
    [key: string]: any;
  };
}

// Chat session interface
export interface ChatSession extends BaseDocument {
  userId: string;
  chatType: ChatType;
  title: string;
  lastMessage: string;
  lastMessageTime: Date;
  messageCount: number;
  imageUrl?: string;
  metadata?: {
    cropType?: string;
    location?: string;
    weatherData?: any;
    marketData?: any;
    [key: string]: any;
  };
}



export class ChatSessionService extends FirestoreService<ChatSession> {
  constructor() {
    super(DBCollectionKeys.ChatSessions);
  }

  // Get all chat sessions for a user
  async getUserChatSessions(userId: string, limitCount?: number): Promise<ChatSession[]> {
    const sessions = await this.getWhere("userId", "==", userId);
    // Sort by lastMessageTime descending and limit if specified
    const sortedSessions = sessions.sort((a, b) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
    return limitCount ? sortedSessions.slice(0, limitCount) : sortedSessions;
  }

  // Get chat sessions by type
  async getUserChatSessionsByType(userId: string, chatType: ChatType, limitCount?: number): Promise<ChatSession[]> {
    const sessions = await this.getWhere("userId", "==", userId);
    const filteredSessions = sessions.filter(session => session.chatType === chatType);
    const sortedSessions = filteredSessions.sort((a, b) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
    return limitCount ? sortedSessions.slice(0, limitCount) : sortedSessions;
  }

  // Get chat session by ID
  async getChatSession(chatId: string): Promise<ChatSession | null> {
    return this.get(chatId);
  }

  // Create a new chat session
  async createChatSession(
    userId: string, 
    chatType: ChatType, 
    title: string, 
    imageUrl?: string,
    metadata?: any
  ): Promise<string> {
    const chatId = this.generateChatId();
    const chat: Partial<ChatSession> = {
      userId,
      chatType,
      title,
      lastMessage: "Chat started",
      lastMessageTime: new Date(),
      messageCount: 0,
      imageUrl,
      metadata,
    };
    
    await this.create(chatId, chat);
    return chatId;
  }

  // Update chat session with new message
  async updateChatSessionWithMessage(
    chatId: string, 
    lastMessage: string, 
    metadata?: any
  ): Promise<void> {
    const chat = await this.get(chatId);
    if (chat) {
      await this.update(chatId, {
        lastMessage,
        lastMessageTime: new Date(),
        messageCount: (chat.messageCount || 0) + 1,
        ...(metadata && { metadata: { ...chat.metadata, ...metadata } }),
      });
    }
  }

  // Delete chat session and all its messages
  async deleteChatSession(chatId: string): Promise<void> {
    // First delete all messages in this chat
    const messageService = new ChatMessageService();
    const messages = await messageService.getChatMessages(chatId);
    
    for (const message of messages) {
      if (message.imageUrl) {
        await storageService.deleteImage(message.imageUrl);
      }
      await messageService.delete(message.id!);
    }
    
    // Then delete the chat session
    await this.delete(chatId);
  }

  // Generate unique chat ID
  private generateChatId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class ChatMessageService extends FirestoreService<ChatMessage> {
  constructor() {
    super(DBCollectionKeys.ChatMessages);
  }

  // Get all messages for a chat
  async getChatMessages(chatId: string): Promise<ChatMessage[]> {
    const messages = await this.getWhere("chatId", "==", chatId);
    return messages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  // Get recent messages across all chats for a user
  async getUserRecentMessages(userId: string, limitCount: number = 10): Promise<ChatMessage[]> {
    const messages = await this.getWhere("userId", "==", userId);
    const sortedMessages = messages.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return sortedMessages.slice(0, limitCount);
  }

  // Add a message to chat
  async addMessage(
    chatId: string, 
    userId: string, 
    chatType: ChatType,
    role: 'user' | 'assistant', 
    content: string, 
    imageUrl?: string,
    metadata?: any
  ): Promise<string> {
    const messageId = this.generateMessageId();
    const message: Partial<ChatMessage> = {
      userId,
      chatId,
      chatType,
      role,
      content,
      imageUrl,
      timestamp: new Date(),
      metadata,
    };
    
    await this.create(messageId, message);
    return messageId;
  }

  // Delete a message
  async deleteMessage(messageId: string): Promise<void> {
    const message = await this.get(messageId);
    if (message?.imageUrl) {
      await storageService.deleteImage(message.imageUrl);
    }
    await this.delete(messageId);
  }

  // Generate unique message ID
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Enhanced Storage service for handling image uploads
export class StorageService {
  // Upload image to Firebase Storage
  async uploadImage(file: File, userId: string, chatType: ChatType): Promise<string> {
    const fileName = `chat_images/${chatType}/${userId}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  }

  // Upload base64 image
  async uploadBase64Image(
    base64Data: string, 
    userId: string, 
    chatType: ChatType,
    fileName: string
  ): Promise<string> {
    // Convert base64 to blob
    const response = await fetch(base64Data);
    const blob = await response.blob();
    
    const storageFileName = `chat_images/${chatType}/${userId}/${Date.now()}_${fileName}`;
    const storageRef = ref(storage, storageFileName);
    
    const snapshot = await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  }

  // Delete image from storage
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error("Error deleting image:", error);
      // Don't throw error as the image might already be deleted
    }
  }
}

// Main Chat Service that combines all functionality
export class ChatService {
  private sessionService: ChatSessionService;
  private messageService: ChatMessageService;
  private storageService: StorageService;

  constructor() {
    this.sessionService = new ChatSessionService();
    this.messageService = new ChatMessageService();
    this.storageService = new StorageService();
  }

  // Create a new chat and add the first message
  async startChat(
    userId: string,
    chatType: ChatType,
    title: string,
    firstMessage: string,
    imageFile?: File,
    metadata?: any
  ): Promise<{ chatId: string; messageId: string }> {
    let imageUrl: string | undefined;
    
    // Upload image if provided
    if (imageFile) {
      imageUrl = await this.storageService.uploadImage(imageFile, userId, chatType);
    }

    // Create chat session
    const chatId = await this.sessionService.createChatSession(
      userId,
      chatType,
      title,
      imageUrl,
      metadata
    );

    // Add first message
    const messageId = await this.messageService.addMessage(
      chatId,
      userId,
      chatType,
      'user',
      firstMessage,
      imageUrl,
      metadata
    );

    // Update chat session with the first message
    await this.sessionService.updateChatSessionWithMessage(chatId, firstMessage, metadata);

    return { chatId, messageId };
  }

  // Add a message to existing chat
  async addMessageToChat(
    chatId: string,
    userId: string,
    chatType: ChatType,
    role: 'user' | 'assistant',
    content: string,
    imageFile?: File,
    metadata?: any
  ): Promise<string> {
    let imageUrl: string | undefined;
    
    // Upload image if provided
    if (imageFile) {
      imageUrl = await this.storageService.uploadImage(imageFile, userId, chatType);
    }

    // Add message
    const messageId = await this.messageService.addMessage(
      chatId,
      userId,
      chatType,
      role,
      content,
      imageUrl,
      metadata
    );

    // Update chat session
    await this.sessionService.updateChatSessionWithMessage(chatId, content, metadata);

    return messageId;
  }

  // Get recent chats for sidebar
  async getRecentChats(userId: string, limit: number = 10): Promise<ChatSession[]> {
    return this.sessionService.getUserChatSessions(userId, limit);
  }

  // Get chat messages
  async getChatMessages(chatId: string): Promise<ChatMessage[]> {
    return this.messageService.getChatMessages(chatId);
  }

  // Delete chat and all its messages
  async deleteChat(chatId: string): Promise<void> {
    await this.sessionService.deleteChatSession(chatId);
  }

  // Get chats by type
  async getChatsByType(userId: string, chatType: ChatType, limit?: number): Promise<ChatSession[]> {
    return this.sessionService.getUserChatSessionsByType(userId, chatType, limit);
  }
}

// Export singleton instances
export const chatService = new ChatService();
export const chatSessionService = new ChatSessionService();
export const chatMessageService = new ChatMessageService();
export const storageService = new StorageService(); 