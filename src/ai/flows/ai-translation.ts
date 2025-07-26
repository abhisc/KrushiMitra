"use server";

import { ai } from "@/ai/genkit";
import { z } from "zod";

const TranslationInputSchema = z.object({
  text: z.string().describe("The text to be translated"),
  sourceLanguage: z.string().describe("The source language code (e.g., 'en', 'hi', 'kn', 'ta')"),
  targetLanguage: z.string().describe("The target language code (e.g., 'en', 'hi', 'kn', 'ta')"),
  context: z.string().optional().describe("Optional context about the text (e.g., 'navigation menu', 'button label')"),
});

export type TranslationInput = z.infer<typeof TranslationInputSchema>;

const TranslationOutputSchema = z.object({
  translatedText: z.string().describe("The translated text"),
  confidence: z.number().describe("Confidence score of the translation (0-1)"),
  sourceLanguage: z.string().describe("The source language code"),
  targetLanguage: z.string().describe("The target language code"),
});

export type TranslationOutput = z.infer<typeof TranslationOutputSchema>;

const translationPrompt = ai.definePrompt({
  name: "translationPrompt",
  input: { schema: TranslationInputSchema },
  output: { schema: TranslationOutputSchema },
  prompt: `You are an expert translator specializing in Indian languages and agricultural terminology. Translate the given text from the source language to the target language while maintaining the meaning, tone, and cultural context.

**Language Codes:**
- 'en': English
- 'ka': Kannada (ಕನ್ನಡ)
- 'tn': Tamil (தமிழ்)
- 'hi': Hindi (हिन्दी)

**Translation Guidelines:**
1. Maintain the original meaning and intent
2. Use appropriate agricultural terminology for farming-related content
3. Consider cultural context and local expressions
4. Keep technical terms consistent
5. Preserve formatting and structure where possible
6. For UI elements, use natural, user-friendly language

**Input:**
Text: {{{text}}}
Source Language: {{{sourceLanguage}}}
Target Language: {{{targetLanguage}}}
Context: {{{context}}}

**Instructions:**
- If the source and target languages are the same, return the original text
- Provide a confidence score based on the complexity and clarity of the translation
- Ensure the translation is natural and appropriate for the target language

Translate the text and provide your response in the specified output format.`,
});

export const aiTranslationFlow = ai.defineFlow(
  {
    name: "aiTranslationFlow",
    inputSchema: TranslationInputSchema,
    outputSchema: TranslationOutputSchema,
  },
  async (input) => {
    // If source and target languages are the same, return the original text
    if (input.sourceLanguage === input.targetLanguage) {
      return {
        translatedText: input.text,
        confidence: 1.0,
        sourceLanguage: input.sourceLanguage,
        targetLanguage: input.targetLanguage,
      };
    }

    const { output } = await translationPrompt(input);
    return output!;
  },
);

// Batch translation for multiple texts
const BatchTranslationInputSchema = z.object({
  texts: z.array(z.object({
    key: z.string().describe("Translation key"),
    text: z.string().describe("Text to translate"),
    context: z.string().optional().describe("Context for the text"),
  })),
  sourceLanguage: z.string().describe("Source language code"),
  targetLanguage: z.string().describe("Target language code"),
});

export type BatchTranslationInput = z.infer<typeof BatchTranslationInputSchema>;

const BatchTranslationOutputSchema = z.object({
  translations: z.array(z.object({
    key: z.string(),
    translatedText: z.string(),
    confidence: z.number(),
  })),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
});

export type BatchTranslationOutput = z.infer<typeof BatchTranslationOutputSchema>;

export const batchTranslationFlow = ai.defineFlow(
  {
    name: "batchTranslationFlow",
    inputSchema: BatchTranslationInputSchema,
    outputSchema: BatchTranslationOutputSchema,
  },
  async (input) => {
    const translations = [];

    for (const textItem of input.texts) {
      const result = await aiTranslationFlow({
        text: textItem.text,
        sourceLanguage: input.sourceLanguage,
        targetLanguage: input.targetLanguage,
        context: textItem.context,
      });

      translations.push({
        key: textItem.key,
        translatedText: result.translatedText,
        confidence: result.confidence,
      });
    }

    return {
      translations,
      sourceLanguage: input.sourceLanguage,
      targetLanguage: input.targetLanguage,
    };
  },
); 