'use server';
/**
 * @fileOverview Provides weather forecasts and irrigation tips tailored to the user's location and crop type, including advice on which crops to avoid.
 *
 * - getWeatherAndIrrigationTips - A function that retrieves weather forecasts and irrigation tips.
 * - WeatherAndIrrigationTipsInput - The input type for the getWeatherAndIrrigationTips function.
 * - WeatherAndIrrigationTipsOutput - The return type for the getWeatherAndIrrigationTips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { getCurrentWeather } from '../tools/weather-tool';

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
  placeName: z.string().optional(),
});
export type WeatherAndIrrigationTipsInput = z.infer<
  typeof WeatherAndIrrigationTipsInputSchema
>;

const WeatherAndIrrigationTipsOutputSchema = z.object({
  weatherForecast: z.string().describe('The weather forecast for the specified location.'),
  irrigationTips: z.string().describe('Irrigation tips tailored to the specified crop type and weather conditions.'),
  notRecommendedCrops: z.array(z.string()).describe('A list of vegetables and fruits that are not recommended to be grown in the current weather conditions.'),
  remedialActions: z.string().describe('Suggestions for what to do if a farmer has already planted the not recommended crops.'),
  unsuitableCrops: z.array(z.string()).describe('A list of crops that are not suitable for the current weather conditions.'),
  recommendedCrops: z.array(z.string()).describe('A list of crops that are best suited for the current weather conditions.'),
  recommendedCropsWithReasons: z.array(z.object({ name: z.string(), reason: z.string() })).describe('Recommended crops with reasons.'),
  notRecommendedCropsWithReasons: z.array(z.object({ name: z.string(), reason: z.string() })).describe('Not recommended crops with reasons.'),
  temperature: z.number().optional(),
  humidity: z.number().optional(),
  wind_speed: z.number().optional(),
  condition: z.string().optional(),
  precipitation: z.number().optional(),
  sunrise: z.string().optional(),
  sunset: z.string().optional(),
});
export type WeatherAndIrrigationTipsOutput = z.infer<
  typeof WeatherAndIrrigationTipsOutputSchema
>;

export async function getWeatherAndIrrigationTips(
  input: WeatherAndIrrigationTipsInput
): Promise<WeatherAndIrrigationTipsOutput> {
  return weatherAndIrrigationTipsFlow(input);
}





const weatherAndIrrigationTipsPrompt = ai.definePrompt({
  name: 'weatherAndIrrigationTipsPrompt',
  input: {schema: z.object({
    location: z.string(),
    cropType: z.string(),
    placeName: z.string().optional(),
    weather: z.any(),
  })},
  output: {schema: WeatherAndIrrigationTipsOutputSchema},
  tools: [getCurrentWeather],
  prompt: `You are an AI assistant providing weather forecasts and irrigation tips to farmers in India.

  The user is at {{placeName}} (lat,lon: {{location}}).
  Real-time weather data:
  - Temperature: {{weather.temperature}}°C
  - Condition: {{weather.condition}}
  - Humidity: {{weather.humidity}}%
  - Wind Speed: {{weather.wind_speed}} km/h

  1. In the 'weatherForecast' field, provide ONLY a weather summary for {{placeName}}.
  2. In the 'irrigationTips' field, provide ONLY actionable irrigation advice for farmers in {{placeName}} growing {{cropType}}, based on the above weather. 
     The advice MUST be specific to the selected crop ({{cropType}}). Mention the crop in the advice. DO NOT repeat or paraphrase the weather summary here. DO NOT start with 'The weather in...' or mention temperature/humidity unless it is directly relevant to the advice.
     Example: 'For tomatoes, increase irrigation frequency due to high temperature.' or 'For rice, delay watering if rain is expected.'
  3. In the 'remedialActions' field, provide advice for farmers who have already planted not recommended crops.

  IMPORTANT: The 'irrigationTips' field MUST NOT repeat or paraphrase the weather summary. It MUST contain only actionable, practical irrigation advice for farmers in {{placeName}} growing {{cropType}}, based on the weather above.

  Return your response as a JSON object with these fields: weatherForecast, irrigationTips, remedialActions, recommendedCrops, notRecommendedCrops, recommendedCropsWithReasons, notRecommendedCropsWithReasons.

  Also, suggest what types of vegetables and fruits should NOT be grown in these weather conditions.
  Include any recommended remedial actions based on the weather and crop conditions.
  Also, mention any crops that are unsuitable for the current weather conditions.

  Additionally, based on the current weather and season, list the best crops to grow now (as an array of crop names). Always provide at least 1-3 recommended crops, even if you have to make a best guess based on the region and season.

  For each recommended and not recommended crop, provide a short reason explaining why it is (or is not) suitable for the current weather and season. Return these as arrays of objects with 'name' and 'reason' fields: 'recommendedCropsWithReasons' and 'notRecommendedCropsWithReasons'.

  `,
});

const weatherAndIrrigationTipsFlow = ai.defineFlow(
  {
    name: 'weatherAndIrrigationTipsFlow',
    inputSchema: WeatherAndIrrigationTipsInputSchema,
    outputSchema: WeatherAndIrrigationTipsOutputSchema,
  },
  async (input) => {
    console.log('weatherAndIrrigationTipsFlow input:', input);
    // First, call the tool to get the current weather.
    const weatherData = await getCurrentWeather({ location: input.location });
    console.log('Fetched weatherData:', weatherData);

    // Then, pass the tool's output to the prompt.
    const promptInput = {
      ...input,
      weather: weatherData,
    };
    console.log('Prompt input to weatherAndIrrigationTipsPrompt:', promptInput);
    const { output } = await weatherAndIrrigationTipsPrompt(promptInput);

    if (!output) {
      throw new Error('Prompt did not return any output');
    }
    // Add weather fields to output for frontend display
    output.temperature = weatherData.temperature;
    output.humidity = weatherData.humidity;
    output.wind_speed = weatherData.wind_speed;
    output.condition = weatherData.condition;
    output.precipitation = weatherData.precipitation || 0;
    // output.sunrise = weatherData.sunrise || undefined;
    // output.sunset = weatherData.sunset || undefined;

    // Fallback: If recommendedCrops is empty, provide defaults
    if (!output.recommendedCrops || output.recommendedCrops.length === 0) {
      output.recommendedCrops = ['Rice', 'Maize', 'Wheat'];
    }
    if (!output.recommendedCropsWithReasons || output.recommendedCropsWithReasons.length === 0) {
      output.recommendedCropsWithReasons = [
        { name: 'Rice', reason: 'Grows well in warm, humid conditions and abundant water.' },
        { name: 'Maize', reason: 'Tolerates a range of weather and is suitable for the current season.' },
        { name: 'Wheat', reason: 'Can be sown in moderate temperatures and is a staple crop.' },
      ];
    }
    if (!output.notRecommendedCropsWithReasons || output.notRecommendedCropsWithReasons.length === 0) {
      output.notRecommendedCropsWithReasons = [
        { name: 'Strawberry', reason: 'Sensitive to high temperatures and humidity.' },
        { name: 'Spinach', reason: 'Prefers cooler weather and may bolt in heat.' },
      ];
    }

    return output!;
  }
);
