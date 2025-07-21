'use server';
/**
 * @fileOverview Provides weather forecasts and irrigation tips tailored to the user's location and crop type.
 *
 * - getWeatherAndIrrigationTips - A function that retrieves weather forecasts and irrigation tips.
 * - WeatherAndIrrigationTipsInput - The input type for the getWeatherAndIrrigationTips function.
 * - WeatherAndIrrigationTipsOutput - The return type for the getWeatherAndIrrigationTips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WeatherAndIrrigationTipsInputSchema = z.object({
  location: z.string().describe('The location for which to retrieve weather and irrigation tips.'),
  cropType: z.string().describe('The type of crop for which to tailor the irrigation tips.'),
});
export type WeatherAndIrrigationTipsInput = z.infer<typeof WeatherAndIrrigationTipsInputSchema>;

const WeatherAndIrrigationTipsOutputSchema = z.object({
  weatherForecast: z.string().describe('The weather forecast for the specified location.'),
  irrigationTips: z.string().describe('Irrigation tips tailored to the specified crop type and weather conditions.'),
});
export type WeatherAndIrrigationTipsOutput = z.infer<typeof WeatherAndIrrigationTipsOutputSchema>;

export async function getWeatherAndIrrigationTips(input: WeatherAndIrrigationTipsInput): Promise<WeatherAndIrrigationTipsOutput> {
  return weatherAndIrrigationTipsFlow(input);
}

const weatherAndIrrigationTipsPrompt = ai.definePrompt({
  name: 'weatherAndIrrigationTipsPrompt',
  input: {schema: WeatherAndIrrigationTipsInputSchema},
  output: {schema: WeatherAndIrrigationTipsOutputSchema},
  prompt: `You are an AI assistant providing weather forecasts and irrigation tips to farmers.

  Provide a weather forecast for the following location: {{{location}}}

  Also, provide irrigation tips tailored to the following crop type: {{{cropType}}}
  Consider the weather forecast when providing the irrigation tips.
  Format the response in a way that is easy to understand for farmers.
  `, 
});

const weatherAndIrrigationTipsFlow = ai.defineFlow(
  {
    name: 'weatherAndIrrigationTipsFlow',
    inputSchema: WeatherAndIrrigationTipsInputSchema,
    outputSchema: WeatherAndIrrigationTipsOutputSchema,
  },
  async input => {
    const {output} = await weatherAndIrrigationTipsPrompt(input);
    return output!;
  }
);
