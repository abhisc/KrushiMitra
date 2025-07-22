'use server';
/**
 * @fileOverview A dedicated AI flow for diagnosing crop diseases from text and optional image input.
 *
 * - diagnoseCropDiseaseFromChat - A function that handles the diagnosis process initiated from the chat.
 * - DiagnoseCropDiseaseFromChatInput - The input type for the diagnoseCropDiseaseFromChat function.
 * - DiagnoseCropDiseaseFromChatOutput - The return type for the diagnoseCropDiseaseFromChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DiagnoseCropDiseaseFromChatInputSchema = z.object({
  textDescription: z.string().optional().describe('The description of the crop symptoms from the user (can be from voice or typing).'),
  photoDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of a crop, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DiagnoseCropDiseaseFromChatInput = z.infer<typeof DiagnoseCropDiseaseFromChatInputSchema>;

const DiagnoseCropDiseaseFromChatOutputSchema = z.object({
  diagnosisResult: z.string().describe('The diagnosis result, including identified disease, confidence, and recommendations.'),
});
export type DiagnoseCropDiseaseFromChatOutput = z.infer<typeof DiagnoseCropDiseaseFromChatOutputSchema>;

export async function diagnoseCropDiseaseFromChat(input: DiagnoseCropDiseaseFromChatInput): Promise<DiagnoseCropDiseaseFromChatOutput> {
  return diagnoseCropDiseaseFromChatFlow(input);
}

const diagnoseCropDiseaseFromChatPrompt = ai.definePrompt({
  name: 'diagnoseCropDiseaseFromChatPrompt',
  input: {schema: DiagnoseCropDiseaseFromChatInputSchema},
  output: {schema: DiagnoseCropDiseaseFromChatOutputSchema},
  prompt: `You are an expert in plant pathology, specializing in diagnosing crop diseases in India.

  Based on the following information, provide a concise diagnosis of the crop disease. Focus solely on identifying the disease and offering relevant recommendations for treatment or prevention.
  If the information is insufficient for a diagnosis, state that you need more details or a clearer image.
  Do NOT provide information unrelated to crop disease diagnosis.

  Description: {{{textDescription}}}
  {{~#if photoDataUri}}Photo: {{media url=photoDataUri}}{{~/if}}
  `,
});

const diagnoseCropDiseaseFromChatFlow = ai.defineFlow(
  {
    name: 'diagnoseCropDiseaseFromChatFlow',
    inputSchema: DiagnoseCropDiseaseFromChatInputSchema,
    outputSchema: DiagnoseCropDiseaseFromChatOutputSchema,
  },
  async input => {
    const {output} = await diagnoseCropDiseaseFromChatPrompt(input);
    return output!;
  }
);
