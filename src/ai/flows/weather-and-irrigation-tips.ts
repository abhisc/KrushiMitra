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
  location: z
    .string()
    .describe(
      'The location for which to retrieve weather and irrigation tips.'
    ),
  cropType: z
    .string()
    .describe(
      'The type of crop for which to tailor the irrigation tips.'
    ),
});
export type WeatherAndIrrigationTipsInput = z.infer<
  typeof WeatherAndIrrigationTipsInputSchema
>;

const WeatherAndIrrigationTipsOutputSchema = z.object({
  weatherForecast: z
    .string()
    .describe('The weather forecast for the specified location.'),
  irrigationTips: z
    .string()
    .describe(
      'Irrigation tips tailored to the specified crop type and weather conditions.'
    ),
});
export type WeatherAndIrrigationTipsOutput = z.infer<
  typeof WeatherAndIrrigationTipsOutputSchema
>;

export async function getWeatherAndIrrigationTips(
  input: WeatherAndIrrigationTipsInput
): Promise<WeatherAndIrrigationTipsOutput> {
  return weatherAndIrrigationTipsFlow(input);
}

const getCurrentWeather = ai.defineTool(
  {
    name: 'getCurrentWeather',
    description: 'Get the current weather for a given location.',
    inputSchema: z.object({
      location: z.string().describe("The city and state, e.g. San Francisco, CA"),
    }),
    outputSchema: z.object({
      temperature: z.number().describe('The current temperature in Celsius.'),
      condition: z.string().describe('A brief description of the weather conditions (e.g., "Clear sky", "Light rain").'),
      humidity: z.number().describe('The humidity percentage.'),
      wind_speed: z.number().describe('The wind speed in km/h.'),
    }),
  },
  async ({location}) => {
    console.log(`Fetching weather for ${location}... (mocked)`);
    // In a real application, you would call a weather API here.
    // For this example, we'll return mocked data.
    if (location.toLowerCase().includes('bangalore')) {
      return {
        temperature: 24,
        condition: 'Partly cloudy with a chance of afternoon showers',
        humidity: 75,
        wind_speed: 15,
      };
    }
    // Default mock data
    return {
      temperature: 32,
      condition: 'Sunny and clear',
      humidity: 45,
      wind_speed: 10,
    };
  }
);


const weatherAndIrrigationTipsPrompt = ai.definePrompt({
  name: 'weatherAndIrrigationTipsPrompt',
  input: {schema: WeatherAndIrrigationTipsInputSchema},
  output: {schema: WeatherAndIrrigationTipsOutputSchema},
  tools: [getCurrentWeather],
  prompt: `You are an AI assistant providing weather forecasts and irrigation tips to farmers.

  First, use the getCurrentWeather tool to get the real-time weather forecast for the following location: {{{location}}}

  Then, based on that real-time weather data, provide a weather summary and irrigation tips tailored to the following crop type: {{{cropType}}}
  
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
