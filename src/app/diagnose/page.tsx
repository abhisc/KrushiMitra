'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { diagnoseCropDisease, DiagnoseCropDiseaseInput } from '@/ai/flows/diagnose-crop-disease';
import { Loader2, Upload, Camera, Mic, MicOff, FileImage, X } from 'lucide-react';
import AppLayout from '@/components/agrimitra/app-layout';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function DiagnosePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [photoDataUri, setPhotoDataUri] = useState<string>('');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

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

  const handleDiagnose = async () => {
    if (!photoDataUri && !description.trim()) {
      toast({
        title: "Error",
        description: "Please provide either a photo or description of the crop symptoms.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const input: DiagnoseCropDiseaseInput = {
        photoDataUri: photoDataUri || undefined,
        description: description.trim() || undefined,
      };

      const diagnosis = await diagnoseCropDisease(input);
      setResult(diagnosis);
      
      toast({
        title: "Diagnosis Complete",
        description: `Identified: ${diagnosis.disease} (Confidence: ${(diagnosis.confidence * 100).toFixed(1)}%)`,
      });
    } catch (error) {
      console.error('Diagnosis error:', error);
      toast({
        title: "Diagnosis Failed",
        description: "Unable to diagnose crop disease. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = () => {
    setPhotoDataUri('');
  };

  return (
    <AppLayout 
      title="Crop Disease Diagnosis" 
      subtitle="Upload a photo or describe symptoms to diagnose crop diseases"
      showBackButton={true}
    >
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Image Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileImage className="w-5 h-5" />
                Upload Crop Image
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
                        alt="Uploaded crop" 
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
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-700">
                        Drop your image here, or click to browse
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Supports JPG, PNG, GIF up to 10MB
                      </p>
                    </div>
                    <div className="flex justify-center gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </Button>
                      <Button variant="outline">
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Description Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Describe Symptoms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Crop Symptoms Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the symptoms you're seeing on your crop... (e.g., yellow spots on leaves, wilting, brown patches)"
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

          {/* Diagnose Button */}
          <Button 
            onClick={handleDiagnose} 
            disabled={isLoading || (!photoDataUri && !description.trim())}
            className="w-full h-12 text-lg font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Crop Disease...
              </>
            ) : (
              'Diagnose Crop Disease'
            )}
          </Button>

          {/* Results Section */}
          {result && (
            <Card className="border-green-200 bg-green-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Diagnosis Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Disease Name and Confidence */}
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xl text-green-700">{result.disease}</h3>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Confidence</p>
                      <p className="text-lg font-semibold text-green-600">
                        {(result.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Symptoms */}
                {result.symptoms && (
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Symptoms Observed
                    </h4>
                    <div className="text-gray-700 leading-relaxed prose prose-sm max-w-none">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({children}) => <p className="mb-3">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                          li: ({children}) => <li className="text-gray-700">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold text-gray-800">{children}</strong>,
                          em: ({children}) => <em className="italic">{children}</em>,
                          h1: ({children}) => <h1 className="text-xl font-bold text-gray-800 mb-3">{children}</h1>,
                          h2: ({children}) => <h2 className="text-lg font-semibold text-gray-800 mb-2">{children}</h2>,
                          h3: ({children}) => <h3 className="text-base font-semibold text-gray-800 mb-2">{children}</h3>,
                          h4: ({children}) => <h4 className="text-sm font-semibold text-gray-800 mb-2">{children}</h4>,
                          h5: ({children}) => <h5 className="text-sm font-medium text-gray-800 mb-1">{children}</h5>,
                          h6: ({children}) => <h6 className="text-xs font-medium text-gray-800 mb-1">{children}</h6>,
                          blockquote: ({children}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-3">{children}</blockquote>,
                          code: ({children}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                          pre: ({children}) => <pre className="bg-gray-100 p-3 rounded overflow-x-auto mb-3">{children}</pre>,
                        }}
                      >
                        {result.symptoms}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Cause */}
                {result.cause && (
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                      Disease Cause
                    </h4>
                    <p className="text-gray-700 leading-relaxed">{result.cause}</p>
                  </div>
                )}

                {/* Disease Cycle */}
                {result.diseaseCycle && (
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      Disease Cycle
                    </h4>
                    <p className="text-gray-700 leading-relaxed">{result.diseaseCycle}</p>
                  </div>
                )}

                {/* Management Strategies */}
                {result.management && (
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      Management Strategies
                    </h4>
                    <div className="space-y-4">
                      {result.management.cultural && (
                        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                          <h5 className="font-medium text-blue-800 mb-2">Cultural Control</h5>
                          <div className="text-blue-700 text-sm leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({children}) => <p className="mb-2">{children}</p>,
                                ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                li: ({children}) => <li className="text-blue-700">{children}</li>,
                                strong: ({children}) => <strong className="font-semibold text-blue-800">{children}</strong>,
                                em: ({children}) => <em className="italic">{children}</em>,
                                h1: ({children}) => <h1 className="text-lg font-bold text-blue-800 mb-2">{children}</h1>,
                                h2: ({children}) => <h2 className="text-base font-semibold text-blue-800 mb-2">{children}</h2>,
                                h3: ({children}) => <h3 className="text-sm font-semibold text-blue-800 mb-1">{children}</h3>,
                                h4: ({children}) => <h4 className="text-sm font-medium text-blue-800 mb-1">{children}</h4>,
                                h5: ({children}) => <h5 className="text-xs font-medium text-blue-800 mb-1">{children}</h5>,
                                h6: ({children}) => <h6 className="text-xs font-medium text-blue-800 mb-1">{children}</h6>,
                                blockquote: ({children}) => <blockquote className="border-l-4 border-blue-300 pl-3 italic text-blue-600 mb-2">{children}</blockquote>,
                                code: ({children}) => <code className="bg-blue-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                                pre: ({children}) => <pre className="bg-blue-100 p-2 rounded overflow-x-auto mb-2 text-xs">{children}</pre>,
                              }}
                            >
                              {result.management.cultural}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                      
                      {result.management.chemical && (
                        <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
                          <h5 className="font-medium text-orange-800 mb-2">Chemical Control</h5>
                          <div className="text-orange-700 text-sm leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({children}) => <p className="mb-2">{children}</p>,
                                ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                li: ({children}) => <li className="text-orange-700">{children}</li>,
                                strong: ({children}) => <strong className="font-semibold text-orange-800">{children}</strong>,
                                em: ({children}) => <em className="italic">{children}</em>,
                                h1: ({children}) => <h1 className="text-lg font-bold text-orange-800 mb-2">{children}</h1>,
                                h2: ({children}) => <h2 className="text-base font-semibold text-orange-800 mb-2">{children}</h2>,
                                h3: ({children}) => <h3 className="text-sm font-semibold text-orange-800 mb-1">{children}</h3>,
                                h4: ({children}) => <h4 className="text-sm font-medium text-orange-800 mb-1">{children}</h4>,
                                h5: ({children}) => <h5 className="text-xs font-medium text-orange-800 mb-1">{children}</h5>,
                                h6: ({children}) => <h6 className="text-xs font-medium text-orange-800 mb-1">{children}</h6>,
                                blockquote: ({children}) => <blockquote className="border-l-4 border-orange-300 pl-3 italic text-orange-600 mb-2">{children}</blockquote>,
                                code: ({children}) => <code className="bg-orange-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                                pre: ({children}) => <pre className="bg-orange-100 p-2 rounded overflow-x-auto mb-2 text-xs">{children}</pre>,
                              }}
                            >
                              {result.management.chemical}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                      
                      {result.management.biological && (
                        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                          <h5 className="font-medium text-green-800 mb-2">Biological Control</h5>
                          <div className="text-green-700 text-sm leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({children}) => <p className="mb-2">{children}</p>,
                                ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                li: ({children}) => <li className="text-green-700">{children}</li>,
                                strong: ({children}) => <strong className="font-semibold text-green-800">{children}</strong>,
                                em: ({children}) => <em className="italic">{children}</em>,
                                h1: ({children}) => <h1 className="text-lg font-bold text-green-800 mb-2">{children}</h1>,
                                h2: ({children}) => <h2 className="text-base font-semibold text-green-800 mb-2">{children}</h2>,
                                h3: ({children}) => <h3 className="text-sm font-semibold text-green-800 mb-1">{children}</h3>,
                                h4: ({children}) => <h4 className="text-sm font-medium text-green-800 mb-1">{children}</h4>,
                                h5: ({children}) => <h5 className="text-xs font-medium text-green-800 mb-1">{children}</h5>,
                                h6: ({children}) => <h6 className="text-xs font-medium text-green-800 mb-1">{children}</h6>,
                                blockquote: ({children}) => <blockquote className="border-l-4 border-green-300 pl-3 italic text-green-600 mb-2">{children}</blockquote>,
                                code: ({children}) => <code className="bg-green-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                                pre: ({children}) => <pre className="bg-green-100 p-2 rounded overflow-x-auto mb-2 text-xs">{children}</pre>,
                              }}
                            >
                              {result.management.biological}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Resistant Varieties */}
                {result.resistantVarieties && (
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                      Resistant Varieties
                    </h4>
                    <p className="text-gray-700 leading-relaxed">{result.resistantVarieties}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
} 