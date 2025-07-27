'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Camera, Mic, MicOff, FileImage, X, Send, MessageCircle, Brain } from 'lucide-react';
import AppLayout from '@/components/agrimitra/app-layout';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { mcpClient } from '@/utils/mcp-client';

interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export default function SmartDiagnosePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [photoDataUri, setPhotoDataUri] = useState<string>('');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoDataUri(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPhotoDataUri(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file.",
          variant: "destructive",
        });
      }
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        toast({
          title: "Voice recording completed",
          description: "Voice input feature coming soon!",
        });
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use voice input.",
        variant: "destructive",
      });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSmartDiagnose = async () => {
    if (!photoDataUri && !description.trim()) {
      toast({
        title: "Error",
        description: "Please provide either a photo or description.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setChatMessages([]);

    try {
      // Use MCP client to call smartDiagnose
      const response = await mcpClient.callFlow('smartDiagnose', {
        photoDataUri: photoDataUri || undefined,
        text: description.trim() || 'Please help me with this.',
      });

      let diagnosisResult;
      
      // Handle response from smart-diagnose
      if (typeof response.result === 'string') {
        try {
          // Try to parse as JSON first
          diagnosisResult = JSON.parse(response.result);
        } catch (e) {
          // If not JSON, treat as plain text
          diagnosisResult = { response: response.result };
        }
      } else if (response.result && typeof response.result === 'object') {
        // Handle object response (e.g., { response: "string" })
        diagnosisResult = response.result;
      } else {
        // Fallback
        diagnosisResult = { response: String(response.result) };
      }

      setResult(diagnosisResult);

      if ('disease' in diagnosisResult && 'confidence' in diagnosisResult) {
        toast({
          title: "Smart Diagnosis Complete",
          description: `Identified: ${diagnosisResult.disease} (Confidence: ${(diagnosisResult.confidence * 100).toFixed(1)}%)`,
        });
      } else {
        toast({
          title: "Smart Analysis Complete",
          description: "AI analysis completed successfully.",
        });
      }
    } catch (error) {
      console.error('Smart diagnosis error:', error);
      toast({
        title: "Smart Diagnosis Failed",
        description: "Unable to process your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUpQuestion = async () => {
    if (!followUpQuestion.trim()) {
      toast({
        title: "Error",
        description: "Please enter a follow-up question.",
        variant: "destructive",
      });
      return;
    }

    setIsFollowUpLoading(true);
    
    const userMessage: ChatMessage = {
      type: 'user',
      content: followUpQuestion,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    setFollowUpQuestion('');

    try {
      // Use MCP client for follow-up questions
      const response = await mcpClient.callFlow('smartDiagnose', {
        text: followUpQuestion,
        photoDataUri: photoDataUri || undefined,
      });
      
      // Handle response content
      let content = response.result;
      if (typeof content === 'object' && content !== null) {
        content = content.response || JSON.stringify(content);
      } else if (typeof content !== 'string') {
        content = String(content);
      }
      
      const aiMessage: ChatMessage = {
        type: 'ai',
        content: content,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, aiMessage]);

      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);

    } catch (error) {
      console.error('Follow-up error:', error);
      toast({
        title: "Follow-up Failed",
        description: "Unable to process your question. Please try again.",
        variant: "destructive",
      });
      const errorMessage: ChatMessage = {
        type: 'ai',
        content: "Sorry, I couldn't process that. Please try again.",
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  const removeImage = () => {
    setPhotoDataUri('');
  };

  return (
    <AppLayout 
      title="Smart AI Diagnosis" 
      subtitle="Ask anything about farming - the AI will intelligently route your request"
      showBackButton={true}
    >
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Smart AI Info Card */}
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Brain className="w-5 h-5" />
                Smart AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-700">
                This AI can intelligently handle various farming queries. It will automatically:
              </p>
              <ul className="list-disc list-inside mt-2 text-blue-700 space-y-1">
                <li>Diagnose crop diseases when you provide symptoms or images</li>
                <li>Answer general farming questions</li>
                <li>Provide weather and irrigation advice</li>
                <li>Help with market information</li>
                <li>And much more!</li>
              </ul>
            </CardContent>
          </Card>
          
          {/* Image Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileImage className="w-5 h-5" />
                Upload Image (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {photoDataUri ? (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <img 
                        src={photoDataUri} 
                        alt="Uploaded image" 
                        className="max-w-xs rounded-lg shadow-md" 
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0"
                        onClick={removeImage}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">Image uploaded successfully</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <FileImage className="w-12 h-12 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-700">
                        Drop your image here, or click to browse
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Supports JPG, PNG, GIF up to 10MB
                      </p>
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {/* Camera functionality */}}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Question Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Ask Your Question
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  What would you like to know?
                </Label>
                <Textarea
                  id="description"
                  placeholder="Ask anything about farming... (e.g., diagnose crop disease, weather advice, market prices, general farming tips)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  className={isRecording ? 'bg-red-50 border-red-200 text-red-700' : ''}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Voice Input
                    </>
                  )}
                </Button>
                {isRecording && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    Recording...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Smart Diagnose Button */}
          <Button 
            onClick={handleSmartDiagnose} 
            disabled={isLoading || (!photoDataUri && !description.trim())}
            className="w-full h-12 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing with Smart AI...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5 mr-2" />
                Ask Smart AI
              </>
            )}
          </Button>

          {/* Results Section */}
          {result && (
            <>
              {/* Detailed Output Format */}
              {result.disease && (
                <Card className="border-green-200 bg-green-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <MessageCircle className="w-5 h-5" />
                      Diagnosis Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-green-700">Disease</Label>
                        <p className="text-lg font-semibold text-green-800">{result.disease}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-green-700">Confidence</Label>
                        <p className="text-lg font-semibold text-green-800">
                          {(result.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-green-700">Symptoms</Label>
                      <p className="text-green-800">{result.symptoms}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-green-700">Cause</Label>
                      <p className="text-green-800">{result.cause}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-green-700">Management</Label>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium text-green-700">Cultural:</span>
                          <p className="text-green-800">{result.management?.cultural}</p>
                        </div>
                        <div>
                          <span className="font-medium text-green-700">Chemical:</span>
                          <p className="text-green-800">{result.management?.chemical}</p>
                        </div>
                        <div>
                          <span className="font-medium text-green-700">Biological:</span>
                          <p className="text-green-800">{result.management?.biological}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-green-700">Resistant Varieties</Label>
                      <p className="text-green-800">{result.resistantVarieties}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Chat Output Format */}
              {!result.disease && (
                <Card className="border-blue-200 bg-blue-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <Brain className="w-5 h-5" />
                      AI Response
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({children}) => <h1 className="text-xl font-bold text-blue-800 mb-2">{children}</h1>,
                          h2: ({children}) => <h2 className="text-lg font-semibold text-blue-800 mb-2">{children}</h2>,
                          h3: ({children}) => <h3 className="text-base font-medium text-blue-800 mb-1">{children}</h3>,
                          h4: ({children}) => <h4 className="text-sm font-medium text-blue-800 mb-1">{children}</h4>,
                          h5: ({children}) => <h5 className="text-xs font-medium text-blue-800 mb-1">{children}</h5>,
                          h6: ({children}) => <h6 className="text-xs font-medium text-blue-800 mb-1">{children}</h6>,
                          blockquote: ({children}) => <blockquote className="border-l-4 border-blue-300 pl-4 italic text-blue-600 mb-3">{children}</blockquote>,
                          code: ({children}) => <code className="bg-blue-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                          pre: ({children}) => <pre className="bg-blue-100 p-3 rounded overflow-x-auto mb-3">{children}</pre>,
                        }}
                      >
                        {typeof result === 'string' ? result : (result.diagnosisResult || result.response || (typeof result === 'object' ? JSON.stringify(result) : String(result)))}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Follow-up Chat Section */}
          {(result || chatMessages.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Follow-up Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  ref={chatContainerRef}
                  className="max-h-64 overflow-y-auto space-y-3 border rounded-lg p-3 bg-gray-50"
                >
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isFollowUpLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border text-gray-800 px-3 py-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ask a follow-up question..."
                    value={followUpQuestion}
                    onChange={(e) => setFollowUpQuestion(e.target.value)}
                    className="flex-1"
                    rows={2}
                  />
                  <Button
                    onClick={handleFollowUpQuestion}
                    disabled={isFollowUpLoading || !followUpQuestion.trim()}
                    className="px-4"
                  >
                    {isFollowUpLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
} 