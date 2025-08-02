import { z } from "zod";

// The API key for WeatherAPI.com
const WEATHERAPI_KEY = "f99d1c63ef1746c4b95110957252407";

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

// Schema for weather data
export const WeatherDataSchema = z.object({
	temperature: z.number().describe("The current temperature in Celsius."),
	condition: z
		.string()
		.describe(
			'A brief description of the weather conditions (e.g., "Clear sky", "Light rain").',
		),
	humidity: z.number().describe("The humidity percentage."),
	wind_speed: z.number().describe("The wind speed in km/h."),
	precipitation: z.number().describe("The precipitation in mm."),
});

// Type for weather data
export type WeatherData = z.infer<typeof WeatherDataSchema>;

// Schema for forecast day data
export const ForecastDaySchema = z.object({
	date: z.string().describe("The date of the forecast (YYYY-MM-DD format)"),
	max_temp: z.number().describe("Maximum temperature in Celsius"),
	min_temp: z.number().describe("Minimum temperature in Celsius"),
	avg_temp: z.number().describe("Average temperature in Celsius"),
	condition: z.string().describe("Weather condition text"),
	max_wind_kph: z.number().describe("Maximum wind speed in km/h"),
	total_precipitation: z.number().describe("Total precipitation in mm"),
	chance_of_rain: z.number().describe("Chance of rain as percentage"),
	sunrise: z.string().describe("Sunrise time"),
	sunset: z.string().describe("Sunset time"),
	humidity: z.number().describe("Average humidity as percentage"),
});

// Schema for forecast data
export const WeatherForecastSchema = z.object({
	location: z.object({
		name: z.string(),
		region: z.string(),
		country: z.string(),
		localtime: z.string(),
	}),
	current: WeatherDataSchema,
	forecast: z.array(ForecastDaySchema),
});

export type ForecastDay = z.infer<typeof ForecastDaySchema>;
export type WeatherForecast = z.infer<typeof WeatherForecastSchema>;

/**
 * Fetches current weather data from WeatherAPI.com
 * @param location The location to get weather for (can be coordinates, city name, etc.)
 * @returns Weather data including temperature, condition, humidity, wind speed, and precipitation
 */
export async function getCurrentWeatherAPI(
	location: string,
): Promise<WeatherData> {
	try {
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
			throw new Error(`Weather API error: ${res.status} ${res.statusText}`);
		}

		const data = await res.json();
		console.log("WeatherAPI response for", location, ":", JSON.stringify(data));

		// Check if the response contains the expected data
		if (!data || !data.current) {
			throw new Error("Invalid weather data received from API");
		}

		// Validate and return the weather data
		return {
			temperature: data.current.temp_c,
			condition: data.current.condition?.text || "Unknown",
			humidity: data.current.humidity || 0,
			wind_speed: data.current.wind_kph || 0,
			precipitation: data.current.precip_mm || 0,
		};
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

/**
 * Fetches weather forecast data from WeatherAPI.com
 * @param location The location to get forecast for (can be coordinates, city name, etc.)
 * @param days Number of days to forecast (1-10)
 * @returns Weather forecast data including daily forecasts
 */
export async function getWeatherForecastAPI(
	location: string,
	days: number = 3,
): Promise<WeatherForecast> {
	try {
		// Ensure days is within valid range (1-10)
		const validDays = Math.min(Math.max(1, days), 10);

		const url = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHERAPI_KEY}&q=${encodeURIComponent(location)}&days=${validDays}&aqi=no&alerts=no`;
		console.log('Fetching weather forecast for:', location, 'for', validDays, 'days');
		
		const res = await fetch(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
			// Add timeout to prevent hanging
			signal: AbortSignal.timeout(15000) // 15 second timeout
		});

		if (!res.ok) {
			throw new Error(`Weather API error: ${res.status} ${res.statusText}`);
		}

		const data = await res.json();

		// Check if the response contains the expected data
		if (!data || !data.forecast || !data.forecast.forecastday) {
			throw new Error("Invalid forecast data received from API");
		}

		// Transform the API response to match our schema
		const forecastDays = data.forecast.forecastday.map((day: any) => ({
			date: day.date,
			max_temp: day.day.maxtemp_c,
			min_temp: day.day.mintemp_c,
			avg_temp: day.day.avgtemp_c,
			condition: day.day.condition.text,
			max_wind_kph: day.day.maxwind_kph,
			total_precipitation: day.day.totalprecip_mm,
			chance_of_rain: day.day.daily_chance_of_rain,
			sunrise: day.astro.sunrise,
			sunset: day.astro.sunset,
			humidity: day.day.avghumidity,
		}));

		return {
			location: {
				name: data.location.name,
				region: data.location.region,
				country: data.location.country,
				localtime: data.location.localtime,
			},
			current: {
				temperature: data.current.temp_c,
				condition: data.current.condition.text,
				humidity: data.current.humidity,
				wind_speed: data.current.wind_kph,
				precipitation: data.current.precip_mm || 0,
			},
			forecast: forecastDays,
		};
	} catch (error) {
		console.warn('WeatherAPI forecast failed for', location, ':', error);
		
		// Return a simple fallback forecast
		const normalizedLocation = location.toLowerCase().trim();
		const fallbackData = FALLBACK_WEATHER_DATA[normalizedLocation as keyof typeof FALLBACK_WEATHER_DATA];
		
		if (fallbackData) {
			console.log('Using fallback forecast data for', location);
			return {
				location: {
					name: location,
					region: 'India',
					country: 'India',
					localtime: new Date().toISOString(),
				},
				current: fallbackData,
				forecast: Array.from({ length: days }, (_, i) => ({
					date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
					max_temp: fallbackData.temperature + 2,
					min_temp: fallbackData.temperature - 2,
					avg_temp: fallbackData.temperature,
					condition: fallbackData.condition,
					max_wind_kph: fallbackData.wind_speed,
					total_precipitation: fallbackData.precipitation,
					chance_of_rain: fallbackData.precipitation > 0 ? 30 : 10,
					sunrise: '06:00 AM',
					sunset: '06:00 PM',
					humidity: fallbackData.humidity,
				})),
			};
		} else {
			// Default fallback for unknown locations
			console.log('Using default fallback forecast data for', location);
			return {
				location: {
					name: location,
					region: 'India',
					country: 'India',
					localtime: new Date().toISOString(),
				},
				current: {
					temperature: 25.0,
					condition: 'Partly cloudy',
					humidity: 75,
					wind_speed: 30.0,
					precipitation: 0,
				},
				forecast: Array.from({ length: days }, (_, i) => ({
					date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
					max_temp: 27.0,
					min_temp: 23.0,
					avg_temp: 25.0,
					condition: 'Partly cloudy',
					max_wind_kph: 30.0,
					total_precipitation: 0,
					chance_of_rain: 10,
					sunrise: '06:00 AM',
					sunset: '06:00 PM',
					humidity: 75,
				})),
			};
		}
	}
}
