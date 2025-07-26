# Chat Service Usage Guide

## Overview
The chat service provides a comprehensive solution for storing and retrieving chat data across all features of the KrushiMitra app. It supports different chat types, image uploads, and metadata storage.

## Features
- **Multiple Chat Types**: Support for different features (diagnosis, market analysis, weather tips, etc.)
- **Image Storage**: Automatic upload to Firebase Storage with organized folder structure
- **Metadata Support**: Store additional context like crop type, location, weather data
- **Real-time Updates**: Automatic refresh of recent chats in sidebar
- **Message History**: Complete conversation history with timestamps

## Chat Types
```typescript
enum ChatType {
  QUICK_CHAT = "quick_chat",
  DIAGNOSIS = "diagnosis", 
  MARKET_ANALYSIS = "market_analysis",
  WEATHER_TIPS = "weather_tips",
  SCHEME_INFO = "scheme_info",
  FARM_JOURNAL = "farm_journal",
  GENERAL = "general"
}
```

## Usage Examples

### 1. Using the Chat Hook
```typescript
import { useChat } from '@/hooks/use-chat';
import { ChatType } from '@/firebaseStore/services/chat-service';

function MyComponent() {
  const { 
    recentChats, 
    loading, 
    startNewChat, 
    addMessageToChat 
  } = useChat();

  const handleStartDiagnosis = async () => {
    try {
      const { chatId, messageId } = await startNewChat(
        ChatType.DIAGNOSIS,
        "Crop Disease Diagnosis",
        "My wheat crop has yellow leaves",
        imageFile, // optional
        { cropType: "wheat", location: "Karnataka" }
      );
      
      console.log("Chat started:", chatId);
    } catch (error) {
      console.error("Failed to start chat:", error);
    }
  };

  const handleSendMessage = async (chatId: string) => {
    try {
      const messageId = await addMessageToChat(
        chatId,
        ChatType.DIAGNOSIS,
        'user',
        "Can you help me identify this disease?",
        imageFile, // optional
        { timestamp: new Date().toISOString() }
      );
      
      console.log("Message sent:", messageId);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div>
      {loading ? (
        <div>Loading chats...</div>
      ) : (
        <div>
          {recentChats.map(chat => (
            <div key={chat.id}>
              <h3>{chat.title}</h3>
              <p>{chat.lastMessage}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 2. Direct Service Usage
```typescript
import { chatService, ChatType } from '@/firebaseStore/services/chat-service';

// Start a new chat
const { chatId, messageId } = await chatService.startChat(
  userId,
  ChatType.MARKET_ANALYSIS,
  "Tomato Price Analysis",
  "What's the current price of tomatoes?",
  imageFile, // optional
  { location: "Mumbai", cropType: "tomato" }
);

// Add message to existing chat
const messageId = await chatService.addMessageToChat(
  chatId,
  userId,
  ChatType.MARKET_ANALYSIS,
  'assistant',
  "The current price of tomatoes in Mumbai is ₹40/kg",
  undefined, // no image
  { price: 40, unit: "kg" }
);

// Get recent chats
const recentChats = await chatService.getRecentChats(userId, 10);

// Get chat messages
const messages = await chatService.getChatMessages(chatId);

// Delete chat
await chatService.deleteChat(chatId);
```

### 3. Image Upload
```typescript
import { storageService, ChatType } from '@/firebaseStore/services/chat-service';

// Upload file
const imageUrl = await storageService.uploadImage(
  file,
  userId,
  ChatType.DIAGNOSIS
);

// Upload base64 image
const imageUrl = await storageService.uploadBase64Image(
  base64Data,
  userId,
  ChatType.DIAGNOSIS,
  "crop_image.jpg"
);

// Delete image
await storageService.deleteImage(imageUrl);
```

## Integration with Features

### Diagnosis Feature
```typescript
// In diagnosis page
const handleDiagnosisSubmit = async (imageFile: File, description: string) => {
  const { chatId } = await startNewChat(
    ChatType.DIAGNOSIS,
    "Crop Disease Diagnosis",
    description,
    imageFile,
    { 
      cropType: selectedCrop,
      location: userLocation,
      timestamp: new Date().toISOString()
    }
  );
  
  // Navigate to chat or show results
  router.push(`/diagnose?chatId=${chatId}`);
};
```

### Market Analysis Feature
```typescript
// In market page
const handleMarketQuery = async (query: string) => {
  const { chatId } = await startNewChat(
    ChatType.MARKET_ANALYSIS,
    "Market Price Query",
    query,
    undefined,
    { 
      commodity: selectedCommodity,
      location: selectedLocation
    }
  );
  
  // Process market data and add assistant response
  const marketData = await fetchMarketData(selectedCommodity);
  await addMessageToChat(
    chatId,
    ChatType.MARKET_ANALYSIS,
    'assistant',
    `Current price: ₹${marketData.price}/kg`,
    undefined,
    { marketData }
  );
};
```

### Weather Tips Feature
```typescript
// In weather page
const handleWeatherQuery = async (location: string) => {
  const { chatId } = await startNewChat(
    ChatType.WEATHER_TIPS,
    "Weather Advisory",
    `Weather forecast for ${location}`,
    undefined,
    { location, timestamp: new Date().toISOString() }
  );
  
  // Get weather data and add assistant response
  const weatherData = await fetchWeatherData(location);
  await addMessageToChat(
    chatId,
    ChatType.WEATHER_TIPS,
    'assistant',
    `Temperature: ${weatherData.temperature}°C, Humidity: ${weatherData.humidity}%`,
    undefined,
    { weatherData }
  );
};
```

## Sidebar Integration
The app layout automatically shows recent chats in the sidebar using the `useChat` hook. Recent chats are displayed with:
- Chat title
- Last message preview
- Click to continue conversation

## Data Structure

### ChatSession
```typescript
interface ChatSession {
  id?: string;
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
  createdAt?: Date;
  updatedAt?: Date;
}
```

### ChatMessage
```typescript
interface ChatMessage {
  id?: string;
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
  createdAt?: Date;
  updatedAt?: Date;
}
```

## Storage Structure
Images are stored in Firebase Storage with the following structure:
```
chat_images/
├── diagnosis/
│   └── {userId}/
│       └── {timestamp}_{filename}
├── market_analysis/
│   └── {userId}/
│       └── {timestamp}_{filename}
└── weather_tips/
    └── {userId}/
        └── {timestamp}_{filename}
```

## Error Handling
The service includes comprehensive error handling:
- Network errors during upload/download
- Invalid file types
- Missing user authentication
- Database connection issues

All errors are logged and can be handled gracefully in the UI. 