'use server';

/**
 * @fileOverview A flow to provide farmers with information about relevant government schemes and subsidies.
 *
 * - getGovernmentSchemeInfo - A function that handles the retrieval of government scheme information.
 * - GovernmentSchemeInfoInput - The input type for the getGovernmentSchemeInfo function.
 * - GovernmentSchemeInfoOutput - The return type for the getGovernmentSchemeInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GovernmentSchemeInfoInputSchema = z.object({
  cropType: z.string().describe('The type of crop the farmer is growing.'),
  location: z.string().describe('The location of the farmer (e.g., state, district).'),
  farmSize: z.string().describe('The size of the farm in acres.'),
  query: z.string().optional().describe('Optional: specific question about government schemes.'),
});
export type GovernmentSchemeInfoInput = z.infer<typeof GovernmentSchemeInfoInputSchema>;

const GovernmentSchemeInfoOutputSchema = z.object({
  schemes: z.array(
    z.object({
      name: z.string().describe('The name of the government scheme.'),
      description: z.string().describe('A brief description of the scheme.'),
      eligibility: z.string().describe('The eligibility criteria for the scheme.'),
      benefits: z.string().describe('The benefits offered under the scheme.'),
      howToApply: z.string().describe('Instructions on how to apply for the scheme.'),
    })
  ).describe('A list of relevant government schemes and subsidies.'),
});
export type GovernmentSchemeInfoOutput = z.infer<typeof GovernmentSchemeInfoOutputSchema>;

export async function getGovernmentSchemeInfo(input: GovernmentSchemeInfoInput): Promise<GovernmentSchemeInfoOutput> {
  return governmentSchemeInfoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'governmentSchemeInfoPrompt',
  input: {schema: GovernmentSchemeInfoInputSchema},
  output: {schema: GovernmentSchemeInfoOutputSchema},
  prompt: `You are an AI assistant providing information about government schemes and subsidies to farmers in India.\n\nYou have access to a database of government schemes. Based on the farmer's crop type, location, and farm size, identify relevant schemes and provide details about each scheme, with eligibility and how to apply.\n\nCrop Type: {{{cropType}}}\nLocation: {{{location}}}\nFarm Size: {{{farmSize}}}\n\n{{#if query}}\nFarmer's Question: {{{query}}}\n{{/if}}\n\nProvide the information in a structured format as described in the output schema.\n`,
});

const governmentSchemeInfoFlow = ai.defineFlow(
  {
    name: 'governmentSchemeInfoFlow',
    inputSchema: GovernmentSchemeInfoInputSchema,
    outputSchema: GovernmentSchemeInfoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
