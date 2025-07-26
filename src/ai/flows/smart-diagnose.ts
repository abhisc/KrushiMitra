import { z } from 'zod';
import { diagnoseCropDisease } from './diagnose-crop-disease';
import { Part, generate } from '@genkit-ai/ai';
import { gemini10Pro, geminiProVision } from '@genkit-ai/googleai';

export const SmartDiagnoseInputSchema = z.object({
  photoDataUri: z.string().optional(),
  text: z.string(),
});
export type SmartDiagnoseInput = z.infer<typeof SmartDiagnoseInputSchema>;

export const SmartDiagnoseOutputSchema = z.object({
  response: z.string(),
});
export type SmartDiagnoseOutput = z.infer<typeof SmartDiagnoseOutputSchema>;

const isDiagnosisRequestPrompt = `
You are an expert agricultural assistant.
Your task is to determine if the user is asking to diagnose a crop disease based on their query and/or image.

RULES:
- If the user's query is explicitly asking for a diagnosis, or describes symptoms of a disease, or provides an image that looks like a diseased plant, respond with only the text "DIAGNOSE".
- For any other query (e.g., asking for weather, market prices, general advice), respond with "PASS".

User query: {text}
`;

export async function smartDiagnose(
  input: SmartDiagnoseInput
): Promise<SmartDiagnoseOutput> {
  const { photoDataUri, text } = input;

  const decisionPromptText = isDiagnosisRequestPrompt.replace('{text}', text);
  const decisionResponse = await gemini10Pro.run({
    prompt: decisionPromptText,
  });

  const decision = decisionResponse.text().trim().toUpperCase();

  if (decision === 'DIAGNOSE' && photoDataUri) {
    const diagnosisResult = await diagnoseCropDisease({
      photoDataUri,
      textDescription: text,
      outputFormat: 'detailed',
    });
    return { response: JSON.stringify(diagnosisResult) };
  }

  const llm = photoDataUri ? geminiProVision : gemini10Pro;
  const promptParts: Part[] = [
    {
      text: `You are a helpful agricultural assistant. Provide a concise and helpful response to the user's query. User query: ${text}`,
    },
  ];

  if (photoDataUri) {
    promptParts.unshift({ media: { url: photoDataUri } });
  }

  const response = await generate({
    model: llm,
    prompt: promptParts,
  });

  return { response: response.text() };
} 