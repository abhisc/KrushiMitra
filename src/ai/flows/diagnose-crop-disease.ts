'use server';
/**
 * @fileOverview A consolidated crop disease diagnosis AI agent that handles both detailed and chat-based diagnosis.
 *
 * - diagnoseCropDisease - A function that handles the crop disease diagnosis process.
 * - DiagnoseCropDiseaseInput - The input type for the diagnoseCropDisease function.
 * - DiagnoseCropDiseaseOutput - The return type for the diagnoseCropDisease function.
 * - diagnoseFollowUp - A function that handles follow-up questions about a diagnosis.
 * - DiagnoseFollowUpInput - The input type for the diagnoseFollowUp function.
 * - DiagnoseFollowUpOutput - The return type for the diagnoseFollowUp function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const DiagnoseCropDiseaseInputSchema = z.object({
  photoDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of a crop, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().optional().describe('The description of the crop symptoms.'),
  textDescription: z.string().optional().describe('Alternative description field for chat-based input.'),
  outputFormat: z.enum(['detailed', 'chat']).optional().default('detailed').describe('Output format: detailed (structured) or chat (simple string)'),
});
export type DiagnoseCropDiseaseInput = z.infer<typeof DiagnoseCropDiseaseInputSchema>;

const DiagnoseCropDiseaseDetailedOutputSchema = z.object({
  disease: z.string().describe('The identified disease, if any.'),
  confidence: z.number().describe('The confidence level of the diagnosis (0-1).'),
  symptoms: z.string().describe('Detailed symptoms observed on the plant.'),
  cause: z.string().describe('The causative agent of the disease and favorable conditions for its spread.'),
  diseaseCycle: z.string().describe('Brief explanation of how the disease spreads and survives.'),
  management: z.object({
    cultural: z.string().describe('Cultural and physical control methods.'),
    chemical: z.string().describe('Recommended fungicides or pesticides with usage notes.'),
    biological: z.string().describe('Biological control methods or biopesticides, if available.'),
  }).describe('Management strategies for the disease.'),
  resistantVarieties: z.string().describe('Recommended disease-resistant crop varieties, if known.'),
});

const DiagnoseCropDiseaseChatOutputSchema = z.object({
  diagnosisResult: z.string().describe('The diagnosis result, including identified disease, confidence, and recommendations.'),
});

export type DiagnoseCropDiseaseDetailedOutput = z.infer<typeof DiagnoseCropDiseaseDetailedOutputSchema>;
export type DiagnoseCropDiseaseChatOutput = z.infer<typeof DiagnoseCropDiseaseChatOutputSchema>;
export type DiagnoseCropDiseaseOutput = DiagnoseCropDiseaseDetailedOutput | DiagnoseCropDiseaseChatOutput;

// Follow-up question schemas
const DiagnoseFollowUpInputSchema = z.object({
  previousDiagnosis: DiagnoseCropDiseaseDetailedOutputSchema.describe('The previous diagnosis result'),
  followUpQuestion: z.string().describe('The farmer\'s follow-up question about the diagnosis or management'),
  photoDataUri: z.string().optional().describe('Optional additional photo for follow-up analysis'),
});
export type DiagnoseFollowUpInput = z.infer<typeof DiagnoseFollowUpInputSchema>;

const DiagnoseFollowUpOutputSchema = z.object({
  answer: z.string().describe('A detailed answer to the follow-up question, building on the previous diagnosis'),
  additionalRecommendations: z.string().optional().describe('Any additional recommendations based on the follow-up question'),
});
export type DiagnoseFollowUpOutput = z.infer<typeof DiagnoseFollowUpOutputSchema>;

export async function diagnoseCropDisease(input: DiagnoseCropDiseaseInput): Promise<DiagnoseCropDiseaseOutput> {
  return diagnoseCropDiseaseFlow(input);
}

export async function diagnoseFollowUp(input: DiagnoseFollowUpInput): Promise<DiagnoseFollowUpOutput> {
  return diagnoseFollowUpFlow(input);
}

// Use the external prompt files
const prompt = ai.prompt('diagnose-crop-disease');
const followUpPrompt = ai.prompt('diagnose-follow-up');

const diagnoseCropDiseaseFlow = ai.defineFlow(
  {
    name: 'diagnoseCropDiseaseFlow',
    inputSchema: DiagnoseCropDiseaseInputSchema,
    outputSchema: z.union([DiagnoseCropDiseaseDetailedOutputSchema, DiagnoseCropDiseaseChatOutputSchema]),
  },
  async input => {
    // Prepare the input for the prompt
    const promptInput = {
      photoDataUri: input.photoDataUri,
      description: input.description || input.textDescription || '',
    };

    if (input.outputFormat === 'chat') {
      // For chat format, we'll use a simplified prompt that returns a string
      const chatPrompt = ai.definePrompt({
        name: 'diagnoseCropDiseaseChatPrompt',
        input: {schema: z.object({
          photoDataUri: z.string().optional(),
          description: z.string(),
        })},
        output: {schema: DiagnoseCropDiseaseChatOutputSchema},
        prompt: `You are an expert in plant pathology, specializing in diagnosing crop diseases in India.

Based on the following information, provide a concise diagnosis of the crop disease. Focus solely on identifying the disease and offering relevant recommendations for treatment or prevention.
If the information is insufficient for a diagnosis, state that you need more details or a clearer image.
Do NOT provide information unrelated to crop disease diagnosis.

Description: {{{description}}}
{{~#if photoDataUri}}Photo: {{media url=photoDataUri}}{{~/if}}
`,
      });

      const {output} = await chatPrompt(promptInput);
      return output!;
    } else {
      // For detailed format, use the external prompt file
      const {output} = await prompt(promptInput);
      return output!;
    }
  }
);

const diagnoseFollowUpFlow = ai.defineFlow(
  {
    name: 'diagnoseFollowUpFlow',
    inputSchema: DiagnoseFollowUpInputSchema,
    outputSchema: DiagnoseFollowUpOutputSchema,
  },
  async input => {
    const {output} = await followUpPrompt(input);
    return output!;
  }
);
