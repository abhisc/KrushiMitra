'use server';
/**
 * @fileOverview Retrieves real-time market analysis for crops, including pricing information, to help farmers make informed selling decisions.
 *
 * - getMarketAnalysis - A function that retrieves real-time market analysis.
 * - MarketAnalysisInput - The input type for the getMarketAnalysis function.
 * - MarketAnalysisOutput - The return type for the getMarketAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MarketAnalysisInputSchema = z.object({
  crop: z.string().describe('The crop to get market analysis for.'),
  market: z.string().describe('The market to get analysis from.'),
});
export type MarketAnalysisInput = z.infer<typeof MarketAnalysisInputSchema>;

const MarketAnalysisOutputSchema = z.object({
  crop: z.string().describe('The crop being analyzed.'),
  market: z.string().describe('The market being analyzed.'),
  price: z.string().describe('The current price of the crop in the market.'),
  trend: z.string().describe('The price trend of the crop in the market.'),
  analysis: z.string().describe('Overall market analysis and recommendations.'),
});
export type MarketAnalysisOutput = z.infer<typeof MarketAnalysisOutputSchema>;

export async function getMarketAnalysis(input: MarketAnalysisInput): Promise<MarketAnalysisOutput> {
  return marketAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'marketAnalysisPrompt',
  input: {schema: MarketAnalysisInputSchema},
  output: {schema: MarketAnalysisOutputSchema},
  prompt: `You are an AI assistant for farmers, providing real-time market analysis.
  Provide the current price, trend, and overall market analysis for the specified crop in the specified market.

  Crop: {{{crop}}}
  Market: {{{market}}}

  Include specific recommendations for the farmer based on the analysis.
`,
});

const marketAnalysisFlow = ai.defineFlow(
  {
    name: 'marketAnalysisFlow',
    inputSchema: MarketAnalysisInputSchema,
    outputSchema: MarketAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
