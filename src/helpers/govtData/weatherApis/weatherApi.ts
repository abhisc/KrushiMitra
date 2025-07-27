import { z } from "zod";

// The API key for WeatherAPI.com
const WEATHERAPI_KEY = "f99d1c63ef1746c4b95110957252407";

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
	const url = `https://api.weatherapi.com/v1/current.json?key=${WEATHERAPI_KEY}&q=${encodeURIComponent(location)}`;
	const res = await fetch(url);

	if (!res.ok) {
		throw new Error(
			`Weather API error: ${res.status} ${res.statusText}`,
		);
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
	// Ensure days is within valid range (1-10)
	const validDays = Math.min(Math.max(1, days), 10);

	const url = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHERAPI_KEY}&q=${encodeURIComponent(location)}&days=${validDays}&aqi=no&alerts=no`;
	const res = await fetch(url);

	if (!res.ok) {
		throw new Error(
			`Weather forecast API error: ${res.status} ${res.statusText}`,
		);
	}

	const data = await res.json();
	console.log("WeatherAPI forecast response fetched");

	// Transform the API response to match our schema
	const forecast: ForecastDay[] = data.forecast.forecastday.map((day: any) => ({
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

	// Create response that matches our schema
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
		forecast,
	};
}
