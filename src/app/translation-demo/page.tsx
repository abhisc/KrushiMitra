"use client";

import React, { useState } from 'react';
import { TranslatableText } from '@/components/ui/translatable-text';
import { useAiTranslation } from '@/hooks/use-ai-translation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function TranslationDemoPage() {
  const { translateText, isTranslating } = useAiTranslation();
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [context, setContext] = useState('');

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    
    try {
      const result = await translateText(inputText, undefined, context);
      setTranslatedText(result);
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedText('Translation failed');
    }
  };

  const sampleTexts = [
    "Welcome to Agrimitra - Your AI-powered farming assistant",
    "Check the latest market prices for your crops",
    "Get weather forecasts and irrigation tips",
    "Diagnose crop diseases with AI",
    "Find government schemes and subsidies",
    "Connect with agricultural experts",
    "Track your farm activities and journal",
    "Plan your farming operations efficiently"
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-700 mb-4">
          <TranslatableText context="page title">AI Translation Demo</TranslatableText>
        </h1>
        <p className="text-gray-600">
          <TranslatableText context="page description">
            This page demonstrates the AI-powered translation functionality. 
            All text on this page will be automatically translated when you change the language.
          </TranslatableText>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Translation Input */}
        <Card>
          <CardHeader>
            <CardTitle>
              <TranslatableText context="card title">Translation Input</TranslatableText>
            </CardTitle>
            <CardDescription>
              <TranslatableText context="card description">
                Enter text to translate using AI
              </TranslatableText>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="context">
                <TranslatableText context="form label">Context (optional)</TranslatableText>
              </Label>
              <Input
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g., navigation menu, button label"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="input-text">
                <TranslatableText context="form label">Text to Translate</TranslatableText>
              </Label>
              <Textarea
                id="input-text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter text to translate..."
                className="mt-1 min-h-[100px]"
              />
            </div>
            <Button 
              onClick={handleTranslate} 
              disabled={!inputText.trim() || isTranslating}
              className="w-full"
            >
              {isTranslating ? (
                <>
                  <TranslatableText context="button text">Translating...</TranslatableText>
                </>
              ) : (
                <TranslatableText context="button text">Translate</TranslatableText>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Translation Output */}
        <Card>
          <CardHeader>
            <CardTitle>
              <TranslatableText context="card title">Translation Result</TranslatableText>
            </CardTitle>
            <CardDescription>
              <TranslatableText context="card description">
                AI-generated translation
              </TranslatableText>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg min-h-[100px]">
              {translatedText ? (
                <p className="text-gray-800">{translatedText}</p>
              ) : (
                <p className="text-gray-400 italic">
                  <TranslatableText context="placeholder text">
                    Translation will appear here...
                  </TranslatableText>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sample Texts */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            <TranslatableText context="card title">Sample Texts</TranslatableText>
          </CardTitle>
          <CardDescription>
            <TranslatableText context="card description">
              Click on any sample text to see it translated
            </TranslatableText>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sampleTexts.map((text, index) => (
              <div
                key={index}
                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setInputText(text)}
              >
                <TranslatableText context="sample text">{text}</TranslatableText>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            <TranslatableText context="card title">Translation Features</TranslatableText>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="text-2xl mb-2">🌐</div>
              <h3 className="font-semibold mb-2">
                <TranslatableText context="feature title">Multi-Language Support</TranslatableText>
              </h3>
              <p className="text-sm text-gray-600">
                <TranslatableText context="feature description">
                  Supports English, Kannada, Tamil, and Hindi
                </TranslatableText>
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-semibold mb-2">
                <TranslatableText context="feature title">Real-time Translation</TranslatableText>
              </h3>
              <p className="text-sm text-gray-600">
                <TranslatableText context="feature description">
                  Instant AI-powered translation with caching
                </TranslatableText>
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-semibold mb-2">
                <TranslatableText context="feature title">Context-Aware</TranslatableText>
              </h3>
              <p className="text-sm text-gray-600">
                <TranslatableText context="feature description">
                  Understands context for better translations
                </TranslatableText>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 