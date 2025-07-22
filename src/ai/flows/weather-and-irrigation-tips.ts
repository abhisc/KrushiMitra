'use server';
/**
 * @fileOverview Provides weather forecasts and irrigation tips tailored to the user's location and crop type, including advice on which crops to avoid.
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

  notRecommendedCrops: z.array(z.string()).describe('A list of vegetables and fruits that are not recommended to be grown in the current weather conditions.'),
  remedialActions: z.string().describe('Suggestions for what to do if a farmer has already planted the not recommended crops.'),
  unsuitableCrops: z.array(z.string()).describe('A list of crops that are not suitable for the current weather conditions.'),
  //remedialActions: z.string().describe('Actions to take if unsuitable crops have already been planted.'),

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
  async ({ location }) => {
    console.log(`Fetching weather for ${location}... (mocked)`);

    if (location.toLowerCase().trim() === 'haha' || location.length < 3) {
      throw new Error('Invalid location entered. Please enter a proper location.');
    }

    if (location.toLowerCase().includes('bangalore')) {
      return {
        temperature: 24,
        condition: 'Partly cloudy with a chance of afternoon showers',
        humidity: 75,
        wind_speed: 15,
      };
    }

    if (location.toLowerCase().includes('pune')) {
      return {
        temperature: 28,
        condition: 'Sunny',
        humidity: 60,
        wind_speed: 12,
      };
    }

    // Default return
    return {
      temperature: 26,
      condition: 'Clear sky',
      humidity: 50,
      wind_speed: 10,
    };
  }
);



const weatherAndIrrigationTipsPrompt = ai.definePrompt({
  name: 'weatherAndIrrigationTipsPrompt',
  input: {schema: z.object({
    location: z.string(),
    cropType: z.string(),

    weather: z.any(),
  })},
  output: {schema: WeatherAndIrrigationTipsOutputSchema},
  tools: [getCurrentWeather],
  prompt: `You are an AI assistant providing weather forecasts and irrigation tips to farmers in India.

  Based on the real-time weather data provided, provide a weather summary and irrigation tips tailored to the following crop type: {{{cropType}}} at {{{location}}}.

  Real-time weather data:
  - Temperature: {{{weather.temperature}}}°C
  - Condition: {{{weather.condition}}}
  - Humidity: {{{weather.humidity}}}%
  - Wind Speed: {{{weather.wind_speed}}} km/h
  
  Also, suggest what types of vegetables and fruits should NOT be grown in these weather conditions.
  Finally, provide suggestions on what a farmer can do if they have already planted such vegetables or fruits.


  Also, provide irrigation tips tailored to the following crop type: {{{cropType}}}
  Consider the weather forecast when providing the irrigation tips.
  Format the response in a way that is easy to understand for farmers.
  Include any recommended remedial actions based on the weather and crop conditions.
  Also, mention any crops that are unsuitable for the current weather conditions.

  `,
});

const weatherAndIrrigationTipsFlow = ai.defineFlow(
  {
    name: 'weatherAndIrrigationTipsFlow',
    inputSchema: WeatherAndIrrigationTipsInputSchema,
    outputSchema: WeatherAndIrrigationTipsOutputSchema,
  },
  async (input) => {

    // First, call the tool to get the current weather.
    const weatherData = await getCurrentWeather({ location: input.location });

    // Then, pass the tool's output to the prompt.
    const { output } = await weatherAndIrrigationTipsPrompt({
      ...input,
      weather: JSON.stringify(weatherData), // Convert weather object to string for the prompt
    });

    return output!;
  }
);
