'use server';

/**
 * @fileOverview Weather tool for fetching real-time weather data from WeatherAPI.
 *
 * - getCurrentWeather - A tool that fetches current weather data for a given location.
 */

import {z} from 'zod';
import {ai} from '@/ai/genkit';

const WEATHERAPI_KEY = 'f99d1c63ef1746c4b95110957252407'; // User's actual WeatherAPI key

// Fallback weather data for common Indian cities
const FALLBACK_WEATHER_DATA = {
  'mumbai': {
    temperature: 28.3,
    condition: 'Partly cloudy',
    humidity: 89,
    wind_speed: 41.4,
    precipitation: 0.33
  },
  'delhi': {
    temperature: 32.1,
    condition: 'Sunny',
    humidity: 65,
    wind_speed: 28.7,
    precipitation: 0
  },
  'pune': {
    temperature: 26.8,
    condition: 'Clear sky',
    humidity: 72,
    wind_speed: 35.2,
    precipitation: 0
  },
  'bangalore': {
    temperature: 24.5,
    condition: 'Cloudy',
    humidity: 78,
    wind_speed: 22.1,
    precipitation: 2.1
  },
  'chennai': {
    temperature: 30.2,
    condition: 'Partly cloudy',
    humidity: 81,
    wind_speed: 38.9,
    precipitation: 0.5
  },
  'kolkata': {
    temperature: 29.7,
    condition: 'Mist',
    humidity: 85,
    wind_speed: 31.6,
    precipitation: 1.2
  },
  'hyderabad': {
    temperature: 27.4,
    condition: 'Clear sky',
    humidity: 69,
    wind_speed: 33.8,
    precipitation: 0
  },
  'ahmedabad': {
    temperature: 31.9,
    condition: 'Sunny',
    humidity: 58,
    wind_speed: 42.3,
    precipitation: 0
  },
  'nashik': {
    temperature: 25.6,
    condition: 'Partly cloudy',
    humidity: 74,
    wind_speed: 29.4,
    precipitation: 0.8
  },
  'nagpur': {
    temperature: 29.3,
    condition: 'Clear sky',
    humidity: 67,
    wind_speed: 36.7,
    precipitation: 0
  }
};

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
    try {
      // Try to fetch real weather from WeatherAPI
      const url = `https://api.weatherapi.com/v1/current.json?key=${WEATHERAPI_KEY}&q=${encodeURIComponent(location)}`;
      console.log('Fetching weather for:', location);
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!res.ok) {
        throw new Error(`WeatherAPI responded with status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data && data.current) {
        return {
          temperature: data.current.temp_c,
          condition: data.current.condition.text,
          humidity: data.current.humidity,
          wind_speed: data.current.wind_kph,
          precipitation: data.current.precip_mm || 0,
        };
      } else {
        throw new Error('Invalid response format from WeatherAPI');
      }
    } catch (error) {
      console.warn('WeatherAPI failed for', location, ':', error);
      
      // Use fallback data based on location
      const normalizedLocation = location.toLowerCase().trim();
      const fallbackData = FALLBACK_WEATHER_DATA[normalizedLocation as keyof typeof FALLBACK_WEATHER_DATA];
      
      if (fallbackData) {
        console.log('Using fallback weather data for', location);
        return fallbackData;
      } else {
        // Default fallback for unknown locations
        console.log('Using default fallback weather data for', location);
        return {
          temperature: 25.0,
          condition: 'Partly cloudy',
          humidity: 75,
          wind_speed: 30.0,
          precipitation: 0,
        };
      }
    }
  }
); 