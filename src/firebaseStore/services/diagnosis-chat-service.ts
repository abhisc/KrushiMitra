import { FirestoreService, BaseDocument, DBCollectionKeys } from "../firestore-service";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export interface DiagnosisMessage extends BaseDocument {
  userId: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: Date;
}

export interface DiagnosisChat extends BaseDocument {
  userId: string;
  title: string;
  lastMessage: string;
  lastMessageTime: Date;
  messageCount: number;
  imageUrl?: string;
}

export class DiagnosisChatService extends FirestoreService<DiagnosisChat> {
  constructor() {
    super(DBCollectionKeys.DiagnosisChat);
  }

  // Get all chats for a user
  async getUserChats(userId: string): Promise<DiagnosisChat[]> {
    return this.getWhere("userId", "==", userId);
  }

  // Get chat by ID
  async getChat(chatId: string): Promise<DiagnosisChat | null> {
    return this.get(chatId);
  }

  // Create a new chat
  async createChat(userId: string, title: string, imageUrl?: string): Promise<string> {
    const chatId = this.generateChatId();
    const chat: Partial<DiagnosisChat> = {
      userId,
      title,
      lastMessage: "Chat started",
      lastMessageTime: new Date(),
      messageCount: 0,
      imageUrl,
    };
    
    await this.create(chatId, chat);
    return chatId;
  }

  // Update chat with new message
  async updateChatWithMessage(chatId: string, lastMessage: string): Promise<void> {
    const chat = await this.get(chatId);
    if (chat) {
      await this.update(chatId, {
        lastMessage,
        lastMessageTime: new Date(),
        messageCount: (chat.messageCount || 0) + 1,
      });
    }
  }

  // Generate unique chat ID
  private generateChatId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class DiagnosisMessageService extends FirestoreService<DiagnosisMessage> {
  constructor() {
    super(DBCollectionKeys.DiagnosisChat);
  }

  // Get all messages for a chat
  async getChatMessages(chatId: string): Promise<DiagnosisMessage[]> {
    return this.getWhere("chatId", "==", chatId);
  }

  // Add a message to chat
  async addMessage(
    chatId: string, 
    userId: string, 
    role: 'user' | 'assistant', 
    content: string, 
    imageUrl?: string
  ): Promise<string> {
    const messageId = this.generateMessageId();
    const message: Partial<DiagnosisMessage> = {
      userId,
      chatId,
      role,
      content,
      imageUrl,
      timestamp: new Date(),
    };
    
    await this.create(messageId, message);
    return messageId;
  }

  // Generate unique message ID
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Storage service for handling image uploads
export class StorageService {
  // Upload image to Firebase Storage
  async uploadImage(file: File, userId: string): Promise<string> {
    const fileName = `diagnosis_images/${userId}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  }

  // Upload base64 image
  async uploadBase64Image(base64Data: string, userId: string, fileName: string): Promise<string> {
    // Convert base64 to blob
    const response = await fetch(base64Data);
    const blob = await response.blob();
    
    const storageFileName = `diagnosis_images/${userId}/${Date.now()}_${fileName}`;
    const storageRef = ref(storage, storageFileName);
    
    const snapshot = await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  }

  // Delete image from storage
  async deleteImage(imageUrl: string): Promise<void> {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  }
}

// Export singleton instances
export const diagnosisChatService = new DiagnosisChatService();
export const diagnosisMessageService = new DiagnosisMessageService();
export const storageService = new StorageService(); 