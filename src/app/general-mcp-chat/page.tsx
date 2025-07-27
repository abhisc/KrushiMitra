'use client';

import { useState, useRef, useEffect } from 'react';
import { mcpClient } from '@/utils/mcp-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, Send, Bot, User, Zap, Wrench, MessageSquare, Mic, MicOff } from 'lucide-react';
import AppLayout from '@/components/agrimitra/app-layout';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    flow?: string;
    tool?: string;
    input?: any;
    output?: any;
  };
}

interface ServerInfo {
  name: string;
  version: string;
  flows: string[];
  tools: string[];
}

export default function GeneralMCPChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    initializeConnection();
  }, []);

  const initializeConnection = async () => {
    try {
      const info = await mcpClient.getServerInfo();
      setServerInfo(info);
      setIsConnected(true);
      
      setMessages([{
        id: 'welcome',
        type: 'system',
        content: `Connected to ${info.name} v${info.version}. I can help you with farming-related tasks using ${info.flows.length} flows and ${info.tools.length} tools. What would you like to know?`,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      setMessages([{
        id: 'error',
        type: 'system',
        content: 'Failed to connect to MCP server. Please check if the server is running.',
        timestamp: new Date()
      }]);
    }
  };

  // Speech-to-text handler
  const handleMicClick = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? prev + ' ' + transcript : transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  const analyzeUserIntent = (userInput: string): { type: 'flow' | 'tool', name: string, confidence: number } => {
    const input = userInput.toLowerCase();
    
    const flowPatterns = [
      { pattern: /diagnos|disease|sick|problem|crop/, name: 'diagnoseCropDisease', confidence: 0.9 },
      { pattern: /weather|climate|temperature|rain/, name: 'getWeatherAndIrrigationTips', confidence: 0.8 },
      { pattern: /market|price|sell|buy|commodity/, name: 'getMarketAnalysis', confidence: 0.8 },
      { pattern: /scheme|government|subsidy|help/, name: 'handleFarmerSchemeQuery', confidence: 0.8 },
      { pattern: /journal|record|log|farm/, name: 'farmJournalExtract', confidence: 0.7 },
      { pattern: /general|question|help|anything/, name: 'askAnything', confidence: 0.6 },
    ];

    const toolPatterns = [
      { pattern: /weather|temperature|climate/, name: 'getCurrentWeather', confidence: 0.9 },
      { pattern: /market|price|commodity/, name: 'getMarketplaceData', confidence: 0.8 },
      { pattern: /scheme|government/, name: 'getGovernmentSchemeInfo', confidence: 0.8 },
      { pattern: /district|location|area/, name: 'getDistrictsData', confidence: 0.7 },
    ];

    for (const flow of flowPatterns) {
      if (flow.pattern.test(input)) {
        return { type: 'flow', name: flow.name, confidence: flow.confidence };
      }
    }

    for (const tool of toolPatterns) {
      if (tool.pattern.test(input)) {
        return { type: 'tool', name: tool.name, confidence: tool.confidence };
      }
    }

    return { type: 'flow', name: 'askAnything', confidence: 0.5 };
  };

  const extractParameters = (userInput: string, actionName: string): any => {
    const input = userInput.toLowerCase();
    
    if (actionName.includes('Weather') || actionName.includes('Marketplace')) {
      const locationMatch = input.match(/(?:in|at|for|location:?)\s+([a-zA-Z\s]+)/);
      if (locationMatch) {
        return { location: locationMatch[1].trim() };
      }
      return { location: 'Mumbai' };
    }

    if (actionName.includes('askAnything') || actionName.includes('diagnose')) {
      return { text: userInput };
    }

    if (actionName.includes('diagnose')) {
      const cropMatch = input.match(/(?:crop|plant):?\s+([a-zA-Z\s]+)/);
      const diseaseMatch = input.match(/(?:disease|symptom):?\s+([a-zA-Z\s]+)/);
      
      return {
        text: userInput,
        crop: cropMatch ? cropMatch[1].trim() : undefined,
        symptoms: diseaseMatch ? diseaseMatch[1].trim() : undefined
      };
    }

    return { text: userInput };
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const intent = analyzeUserIntent(input);
      const params = extractParameters(input, intent.name);
      
      const systemMessage: Message = {
        id: `system-${Date.now()}`,
        type: 'system',
        content: `Detected ${intent.type}: ${intent.name} (confidence: ${Math.round(intent.confidence * 100)}%)`,
        timestamp: new Date(),
        metadata: {
          [intent.type]: intent.name,
          input: params
        }
      };
      setMessages(prev => [...prev, systemMessage]);

      let result;
      if (intent.type === 'flow') {
        result = await mcpClient.callFlow(intent.name, params);
      } else {
        result = await mcpClient.callTool(intent.name, params);
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: result.result?.response || result.result || 'No response received',
        timestamp: new Date(),
        metadata: {
          [intent.type]: intent.name,
          input: params,
          output: result.result
        }
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'user': return <User className="w-4 h-4" />;
      case 'assistant': return <Bot className="w-4 h-4" />;
      case 'system': return <Zap className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getMessageBadge = (message: Message) => {
    if (message.metadata?.flow) {
      return <Badge variant="secondary" className="ml-2"><Wrench className="w-3 h-3 mr-1" />Flow: {message.metadata.flow}</Badge>;
    }
    if (message.metadata?.tool) {
      return <Badge variant="outline" className="ml-2"><Wrench className="w-3 h-3 mr-1" />Tool: {message.metadata.tool}</Badge>;
    }
    return null;
  };

  return (
    <AppLayout
      title="General MCP Chat"
      subtitle="Agentic AI Assistant with Dynamic Tool & Flow Discovery"
    >
      <div className="container mx-auto p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {serverInfo && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">MCP Server Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Server:</span> {serverInfo.name} v{serverInfo.version}
                </div>
                <div>
                  <span className="font-semibold">Available Flows:</span> {serverInfo.flows.length}
                </div>
                <div>
                  <span className="font-semibold">Available Tools:</span> {serverInfo.tools.length}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Chat Interface
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 mb-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.type !== 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        {getMessageIcon(message.type)}
                      </div>
                    )}
                    
                    <div className={`max-w-[80%] ${
                      message.type === 'user' ? 'order-first' : ''
                    }`}>
                      <div className={`rounded-lg p-3 ${
                        message.type === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : message.type === 'system'
                          ? 'bg-muted'
                          : 'bg-muted/50'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">
                            {message.type === 'user' ? 'You' : 
                             message.type === 'assistant' ? 'Assistant' : 'System'}
                          </span>
                          {getMessageBadge(message)}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.metadata?.input && (
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer text-muted-foreground">
                              Input Parameters
                            </summary>
                            <pre className="text-xs bg-background p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(message.metadata.input, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {message.type === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        {getMessageIcon(message.type)}
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Processing...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <Separator className="mb-4" />
            
            {/* Modern Voice-Enabled Input Field */}
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full shadow-lg px-4 py-2 border border-gray-200 dark:border-gray-600 focus-within:ring-2 focus-within:ring-green-200 dark:focus-within:ring-green-600 relative transition-all duration-300">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={listening ? "Listening..." : "Ask me anything about farming, weather, market prices, government schemes, or crop diseases..."}
                className="flex-1 border-none shadow-none bg-transparent focus:ring-0 focus:outline-none text-base min-w-0 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                style={listening ? { color: '#4F46E5', fontWeight: 600 } : {}}
                disabled={loading || !isConnected}
                rows={1}
              />
              {loading ? (
                <div className="flex items-center justify-center w-10 h-10">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : input ? (
                <Button
                  onClick={handleSendMessage}
                  disabled={loading || !input.trim() || !isConnected}
                  className="flex items-center justify-center bg-[#4F46E5] hover:bg-[#3730A3] rounded-full w-10 h-10 transition-colors focus:outline-none shadow"
                  title="Send"
                >
                  <Send className="w-5 h-5 text-white" />
                </Button>
              ) : (
                <Button
                  onClick={handleMicClick}
                  disabled={loading || !isConnected}
                  className={`flex items-center justify-center rounded-full w-10 h-10 transition-colors focus:outline-none shadow relative ${
                    listening 
                      ? 'bg-[#4F46E5] animate-pulse' 
                      : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                  }`}
                  title="Voice input"
                >
                  {listening ? (
                    <MicOff className="w-5 h-5 text-white" />
                  ) : (
                    <Mic className="w-5 h-5 text-[#4F46E5] dark:text-indigo-400" />
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Quick Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput("What's the weather like in Mumbai?")}
                disabled={loading}
              >
                Weather Check
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput("My tomato plants have yellow leaves, what's wrong?")}
                disabled={loading}
              >
                Crop Diagnosis
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput("What are the current market prices for wheat?")}
                disabled={loading}
              >
                Market Prices
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput("Tell me about government schemes for farmers")}
                disabled={loading}
              >
                Government Schemes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
} 