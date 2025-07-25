'use server';

/**
 * @fileOverview Weather tool for fetching real-time weather data from WeatherAPI.
 *
 * - getCurrentWeather - A tool that fetches current weather data for a given location.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const WEATHERAPI_KEY = 'f99d1c63ef1746c4b95110957252407'; // User's actual WeatherAPI key

export const getCurrentWeather = ai.defineTool(
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
      precipitation: z.number().describe('The precipitation in mm.'),
    }),
  },
  async ({ location }) => {
    // Fetch real weather from WeatherAPI
    const url = `https://api.weatherapi.com/v1/current.json?key=${WEATHERAPI_KEY}&q=${encodeURIComponent(location)}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log('WeatherAPI response for', location, ':', JSON.stringify(data));
    if (data && data.current) {
      return {
        temperature: data.current.temp_c,
        condition: data.current.condition.text,
        humidity: data.current.humidity,
        wind_speed: data.current.wind_kph,
        precipitation: data.current.precip_mm || 0,
      };
    } else {
      throw new Error('Could not fetch weather data for the given location.');
    }
  }
); 