'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getWeatherAndIrrigationTips, WeatherAndIrrigationTipsInput } from '@/ai/flows/weather-and-irrigation-tips';
import { Loader2, Cloud, Droplets, Sun, Calendar, Search, MapPin } from 'lucide-react';
import AppLayout from '@/components/agrimitra/app-layout';

export default function WeatherPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState('');
  const [crop, setCrop] = useState('');
  const [result, setResult] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const { toast } = useToast();
  const [geoLoading, setGeoLoading] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [locationCoords, setLocationCoords] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);

  // Debounced location search
  useEffect(() => {
    if (!customLocation || customLocation.length < 2) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearchingLocation(true);
      try {
        const suggestions = await searchLocation(customLocation);
        setLocationSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch (error) {
        console.error('Location search error:', error);
        setLocationSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setSearchingLocation(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [customLocation]);

  const popularLocations = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
    'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'
  ];

  const popularCrops = [
    'Rice', 'Wheat', 'Corn', 'Soybeans', 'Cotton', 'Sugarcane',
    'Potato', 'Tomato', 'Onion', 'Chilli', 'Pulses', 'Oilseeds'
  ];

  // Location search function
  const searchLocation = async (query: string): Promise<string[]> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`
      );
      const data = await response.json();
      return data.map((item: any) => item.display_name.split(',')[0]).filter(Boolean);
    } catch (error) {
      console.error('Location search failed:', error);
      return [];
    }
  };

  // When user selects a city manually, set locationName to the selected city and clear coords
  const handleLocationChange = (val: string) => {
    setLocation(val);
    setLocationName(val); // Use the selected city as the display name
    setLocationCoords(''); // Clear coords so backend uses city name only
    setCustomLocation(''); // Clear custom location
    setShowSuggestions(false);
  };

  // Handle custom location input
  const handleCustomLocationChange = (value: string) => {
    setCustomLocation(value);
    setLocation(value);
    setLocationName(value);
    setLocationCoords('');
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    setCustomLocation(suggestion);
    setLocation(suggestion);
    setLocationName(suggestion);
    setLocationCoords('');
    setShowSuggestions(false);
    toast({
      title: "Location Selected",
      description: `Using: ${suggestion}`,
    });
  };

  const handleWeatherAnalysis = async () => {
    // Use coords if set, otherwise use city name
    const coordsToUse = locationCoords;
    const cityToUse = !locationCoords ? location : '';
    if (!coordsToUse && !cityToUse) {
      toast({
        title: "Error",
        description: "Please provide a location for weather analysis.",
        variant: "destructive",
      });
      return;
    }
    if (!crop.trim()) {
      toast({
        title: "Error",
        description: "Please select a crop for weather analysis.",
        variant: "destructive",
      });
      return;
    }
    console.log('Weather analysis request:', { coordsToUse, cityToUse, locationName });
    setIsLoading(true);
    try {
      const input: WeatherAndIrrigationTipsInput = {
        location: coordsToUse || cityToUse,
        cropType: crop.trim(), // Always send a valid cropType
        placeName: locationName || undefined,
      };
      const weatherTips = await getWeatherAndIrrigationTips(input);
      setResult(weatherTips);
      
      // Extract forecast data from the result if available
      if (weatherTips.forecast) {
        setForecastData(weatherTips.forecast);
      }
      
      toast({
        title: "Weather Analysis Complete",
        description: `Weather and irrigation tips for ${locationName || coordsToUse || cityToUse} generated.`,
      });
    } catch (error) {
      console.error('Weather analysis error:', error);
      let errorMessage = "Unable to get weather analysis. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes("Weather API error")) {
          errorMessage = "Weather service temporarily unavailable. Please try again later.";
        } else if (error.message.includes("Invalid weather data")) {
          errorMessage = "Unable to get weather data for this location. Please try a different location.";
        } else if (error.message.includes("Could not fetch weather data")) {
          errorMessage = "Location not found. Please check the spelling or try a nearby city.";
        }
      }
      
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Helper function to get weather icon
  const getWeatherIcon = (condition: string) => {
    const cond = condition.toLowerCase();
    if (cond.includes('rain')) return '🌧️';
    if (cond.includes('cloud')) return '☁️';
    if (cond.includes('sunny') || cond.includes('clear')) return '☀️';
    if (cond.includes('storm')) return '⛈️';
    if (cond.includes('snow')) return '❄️';
    if (cond.includes('fog') || cond.includes('mist')) return '🌫️';
    return '🌤️';
  };

  // Helper function to get temperature color
  const getTemperatureColor = (temp: number) => {
    if (temp >= 30) return 'text-red-600';
    if (temp >= 20) return 'text-orange-600';
    if (temp >= 10) return 'text-yellow-600';
    return 'text-blue-600';
  };

  // Handler for geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Error', description: 'Geolocation is not supported by your browser.', variant: 'destructive' });
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lon = pos.coords.longitude.toFixed(6);
        setLocationCoords(`${lat},${lon}`);
        // Reverse geocode
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          const address = data.address || {};
          const cityName =
            address.city ||
            address.town ||
            address.village ||
            address.suburb ||
            address.state_district ||
            address.state ||
            address.country;
          setLocationName(cityName || data.display_name || `${lat},${lon}`);
          setLocation(cityName || data.display_name || `${lat},${lon}`); // Use place name for display and backend
          toast({ title: 'Location Set', description: cityName || data.display_name || `Using your current location: ${lat},${lon}` });
        } catch {
          setLocationName(`${lat},${lon}`);
          setLocation(`${lat},${lon}`);
          toast({ title: 'Location Set', description: `Using your current location: ${lat},${lon}` });
        }
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        toast({ title: 'Error', description: 'Unable to get your location.', variant: 'destructive' });
      }
    );
  };

  // Helper function for crop emoji
  function getCropEmoji(name: string) {
    if (/corn|maize/i.test(name)) return '🌽';
    if (/lettuce|spinach|greens/i.test(name)) return '🥬';
    if (/carrot/i.test(name)) return '🥕';
    if (/tomato/i.test(name)) return '🍅';
    if (/bean|peas/i.test(name)) return '🫘';
    if (/potato/i.test(name)) return '🥔';
    if (/onion/i.test(name)) return '🧅';
    return '🌱';
  }

  // Helper to get weather illustration SVG
  function getWeatherSVG(condition: string) {
    const cond = (condition || '').toLowerCase();
    if (cond.includes('cloud')) {
      return (
        <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
          <ellipse cx="56" cy="60" rx="28" ry="18" fill="#B0BEC5"/>
          <ellipse cx="40" cy="64" rx="18" ry="12" fill="#CFD8DC"/>
        </svg>
      );
    }
    if (cond.includes('rain')) {
      return (
        <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
          <ellipse cx="56" cy="60" rx="28" ry="18" fill="#B0BEC5"/>
          <ellipse cx="40" cy="64" rx="18" ry="12" fill="#CFD8DC"/>
          <g stroke="#2196F3" strokeWidth="4" strokeLinecap="round">
            <line x1="40" y1="80" x2="40" y2="90"/>
            <line x1="56" y1="80" x2="56" y2="90"/>
            <line x1="72" y1="80" x2="72" y2="90"/>
          </g>
        </svg>
      );
    }
    if (cond.includes('storm')) {
      return (
        <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
          <ellipse cx="56" cy="60" rx="28" ry="18" fill="#90A4AE"/>
          <ellipse cx="40" cy="64" rx="18" ry="12" fill="#B0BEC5"/>
          <polygon points="56,80 64,92 60,92 68,104 62,104 72,120" fill="#FFD93B"/>
        </svg>
      );
    }
    if (cond.includes('snow')) {
      return (
        <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
          <ellipse cx="56" cy="60" rx="28" ry="18" fill="#B0BEC5"/>
          <ellipse cx="40" cy="64" rx="18" ry="12" fill="#CFD8DC"/>
          <g stroke="#90CAF9" strokeWidth="3" strokeLinecap="round">
            <line x1="40" y1="80" x2="40" y2="86"/>
            <line x1="56" y1="80" x2="56" y2="86"/>
            <line x1="72" y1="80" x2="72" y2="86"/>
            <circle cx="40" cy="89" r="2" fill="#90CAF9"/>
            <circle cx="56" cy="89" r="2" fill="#90CAF9"/>
            <circle cx="72" cy="89" r="2" fill="#90CAF9"/>
          </g>
        </svg>
      );
    }
    if (cond.includes('night') || cond.includes('moon')) {
      return (
        <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
          <circle cx="60" cy="48" r="20" fill="#FFD93B"/>
          <circle cx="68" cy="44" r="20" fill="#212121"/>
          <circle cx="80" cy="36" r="3" fill="#FFD93B"/>
          <circle cx="76" cy="60" r="2" fill="#FFD93B"/>
        </svg>
      );
    }
    // Default: Sunny
    return (
      <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
        <circle cx="48" cy="48" r="20" fill="#FFD93B"/>
        <g stroke="#FDB813" strokeWidth="4" strokeLinecap="round">
          <line x1="48" y1="10" x2="48" y2="28"/>
          <line x1="48" y1="68" x2="48" y2="86"/>
          <line x1="10" y1="48" x2="28" y2="48"/>
          <line x1="68" y1="48" x2="86" y2="48"/>
          <line x1="24" y1="24" x2="36" y2="36"/>
          <line x1="72" y1="24" x2="60" y2="36"/>
          <line x1="24" y1="72" x2="36" y2="60"/>
          <line x1="72" y1="72" x2="60" y2="60"/>
        </g>
      </svg>
    );
  }

  // Helper to get dynamic background and icon
  function getWeatherCardStyleAndIcon(condition: string) {
    const cond = (condition || '').toLowerCase();
    if (cond.includes('sunny') || cond.includes('clear')) {
      return {
        bg: 'bg-gradient-to-br from-yellow-200 via-yellow-400 to-orange-300',
        icon: (
          <svg width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="8" fill="#FFD93B" filter="url(#glow)" />
            <g stroke="#FDB813" strokeWidth="2" strokeLinecap="round">
              <line x1="16" y1="2" x2="16" y2="7" />
              <line x1="16" y1="25" x2="16" y2="30" />
              <line x1="2" y1="16" x2="7" y2="16" />
              <line x1="25" y1="16" x2="30" y2="16" />
              <line x1="7" y1="7" x2="10" y2="10" />
              <line x1="25" y1="7" x2="22" y2="10" />
              <line x1="7" y1="25" x2="10" y2="22" />
              <line x1="25" y1="25" x2="22" y2="22" />
            </g>
            <defs>
              <filter id="glow" x="-10" y="-10" width="52" height="52">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
          </svg>
        )
      };
    }
    if (cond.includes('rain')) {
      return {
        bg: 'bg-gradient-to-br from-blue-400 via-blue-600 to-gray-400',
        icon: (
          <svg width="32" height="32" viewBox="0 0 32 32">
            <ellipse cx="20" cy="22" rx="10" ry="6" fill="#B0BEC5"/>
            <ellipse cx="12" cy="25" rx="6" ry="4" fill="#CFD8DC"/>
            <g stroke="#2196F3" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="30" x2="12" y2="28" />
              <line x1="20" y1="30" x2="20" y2="28" />
              <line x1="28" y1="30" x2="28" y2="28" />
            </g>
          </svg>
        )
      };
    }
    if (cond.includes('cloud')) {
      return {
        bg: 'bg-gradient-to-br from-blue-200 via-blue-400 to-gray-300',
        icon: (
          <svg width="32" height="32" viewBox="0 0 32 32">
            <ellipse cx="20" cy="22" rx="10" ry="6" fill="#B0BEC5"/>
            <ellipse cx="12" cy="25" rx="6" ry="4" fill="#CFD8DC"/>
          </svg>
        )
      };
    }
    // Default
    return {
      bg: 'bg-gradient-to-br from-blue-700 to-blue-500',
      icon: null
    };
  }

  // Parse lat/lon from locationCoords (string: "lat,lon")
  const [lat, lon] = (locationCoords || '').split(',').map(Number);
  console.log('lat:', lat, 'lon:', lon);

  return (
    <AppLayout 
      title="Weather & Irrigation Tips" 
      subtitle="Get weather forecasts and irrigation recommendations for your crops"
      showBackButton={true}
    >
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Weather Analysis Parameters */}
          <div className="mb-8 relative">
            {/* Find My Location Button - Corner Position */}
            <Button
              onClick={handleUseMyLocation}
              disabled={geoLoading}
              variant="outline"
              size="sm"
              className="absolute top-0 right-0 font-medium bg-white/80 backdrop-blur-sm border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-xs"
            >
              {geoLoading ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Locating...
                </>
              ) : (
                "📍 My Location"
              )}
            </Button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Sun className="w-6 h-6 mr-3 text-blue-600" />
              Weather Analysis Parameters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Location */}
              <div className="space-y-3">
                <Label htmlFor="location" className="font-semibold text-gray-700">Location</Label>
                <Select value={location} onValueChange={handleLocationChange}>
                <SelectTrigger className="font-medium bg-white/80 backdrop-blur-sm border-blue-200 hover:border-blue-300 transition-colors">
                  <SelectValue placeholder="Select location">
                    {locationName || location}
                  </SelectValue>
                </SelectTrigger>
                  <SelectContent>
                    {/* If locationName is set by geolocation and not in the list, show it as the first option */}
                    {locationName && !popularLocations.includes(locationName) && (
                      <SelectItem key={locationName} value={locationName}>
                        {locationName}
                      </SelectItem>
                    )}
                    {popularLocations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Crop */}
              <div className="space-y-3">
                <Label htmlFor="crop" className="font-semibold text-gray-700">Crop</Label>
                <Select value={crop} onValueChange={setCrop}>
                  <SelectTrigger className="font-medium bg-white/80 backdrop-blur-sm border-blue-200 hover:border-blue-300 transition-colors">
                    <SelectValue placeholder="Select crop" />
                  </SelectTrigger>
                  <SelectContent>
                    {popularCrops.map((cropName) => (
                      <SelectItem key={cropName} value={cropName}>
                        {cropName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Location */}
              <div className="space-y-3">
                <Label htmlFor="custom-location" className="font-semibold text-gray-700">Custom Location (Type)</Label>
                <div className="relative">
                  <Input
                    id="custom-location"
                    placeholder="Enter custom location"
                    value={customLocation}
                    onChange={(e) => handleCustomLocationChange(e.target.value)}
                    className="font-medium bg-white/80 backdrop-blur-sm border-blue-200 hover:border-blue-300 focus:border-blue-400 transition-colors"
                  />
                  {searchingLocation && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    </div>
                  )}
                </div>
                {showSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white/95 backdrop-blur-sm border border-blue-200 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                    {locationSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center space-x-2 transition-colors"
                        onClick={() => handleSuggestionSelect(suggestion)}
                      >
                        <MapPin className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Analyze Button */}
              <div className="space-y-3 md:col-span-3">
                <Label>&nbsp;</Label>
                <Button
                  onClick={handleWeatherAnalysis}
                  disabled={isLoading}
                  className="w-full font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing Weather...
                    </>
                  ) : (
                    "Get Weather & Irrigation Tips"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-8 animate-fade-in">
              {/* Weather and Irrigation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                {/* Weather Card */}
                <div className={`rounded-2xl border border-blue-200 p-8 flex flex-col h-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 ${getWeatherCardStyleAndIcon(result.condition || 'unknown').bg}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 drop-shadow-sm">Current Weather</h3>
                    <div className="transform hover:scale-110 transition-transform duration-200">
                      {getWeatherCardStyleAndIcon(result.condition || 'unknown').icon}
                    </div>
                  </div>
                  
                  {result.temperature !== undefined && (
                    <div className="space-y-6 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-5xl font-bold text-gray-900 drop-shadow-sm">
                          {result.temperature}°C
                        </span>
                        <span className="text-xl font-semibold text-gray-800 drop-shadow-sm">
                          {result.condition}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-3 bg-white/40 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                          <Droplets className="w-5 h-5 text-blue-700" />
                          <span className="font-semibold text-gray-800">Humidity: {result.humidity}%</span>
                        </div>
                        <div className="flex items-center space-x-3 bg-white/40 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                          <Cloud className="w-5 h-5 text-blue-700" />
                          <span className="font-semibold text-gray-800">Wind: {result.wind_speed} km/h</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Irrigation Tips Card */}
                <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl border border-green-200 p-8 flex flex-col h-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center space-x-3 mb-6">
                    <Droplets className="w-7 h-7 text-green-700" />
                    <h3 className="text-2xl font-bold text-gray-900">Irrigation Tips</h3>
                  </div>
                  
                  {result.irrigationTips && (
                    <div className="space-y-4 flex-1">
                      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 h-full shadow-lg">
                        <p className="text-sm font-medium text-gray-800 leading-relaxed">{result.irrigationTips}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Weather Forecast */}
              {forecastData && forecastData.forecast && (
                <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-2xl border border-slate-200 p-8 shadow-xl">
                  <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                    <Calendar className="w-6 h-6 mr-3 text-blue-600" />
                    Weather Forecast
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {forecastData.forecast.slice(0, 5).map((day: any, index: number) => (
                      <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center min-h-[180px] flex flex-col justify-center shadow-lg hover:shadow-xl border border-slate-200 transition-all duration-300 transform hover:scale-105">
                        <div className="text-sm font-bold text-gray-700 mb-4">
                          {formatDate(day.date)}
                        </div>
                        <div className="text-4xl my-4 flex justify-center">
                          {getWeatherIcon(day.condition)}
                        </div>
                        <div className="text-xl font-bold text-gray-900 mb-3">
                          {day.max_temp}°C
                        </div>
                        <div className="text-xs font-medium text-gray-600">
                          {day.condition}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Crop Recommendations */}
              {result.recommendedCropsWithReasons && result.recommendedCropsWithReasons.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50 rounded-2xl border border-green-200 p-6 shadow-xl">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="text-xl mr-3">🌱</span>
                    Recommended Crops
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {result.recommendedCropsWithReasons.map((crop: any, index: number) => (
                      <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 shadow-lg hover:shadow-xl border border-green-200 transition-all duration-300 transform hover:scale-105">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="text-2xl flex-shrink-0">{getCropEmoji(crop.name || '')}</span>
                          <h4 className="font-bold text-gray-900 text-lg">{crop.name}</h4>
                        </div>
                        <p className="text-xs font-medium text-gray-700 leading-relaxed">
                          {crop.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Crops to Avoid */}
              {result.notRecommendedCropsWithReasons && result.notRecommendedCropsWithReasons.length > 0 && (
                <div className="bg-gradient-to-br from-red-50 via-white to-pink-50 rounded-2xl border border-red-200 p-6 shadow-xl">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="text-xl mr-3">⚠️</span>
                    Crops to Avoid
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {result.notRecommendedCropsWithReasons.map((crop: any, index: number) => (
                      <div key={index} className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 shadow-lg hover:shadow-xl border border-red-200 transition-all duration-300 transform hover:scale-105">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="text-2xl flex-shrink-0">{getCropEmoji(crop.name || '')}</span>
                          <h4 className="font-bold text-gray-900 text-lg">{crop.name}</h4>
                        </div>
                        <p className="text-xs font-medium text-gray-700 leading-relaxed">
                          {crop.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Remedial Actions */}
              {result.remedialActions && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="text-2xl mr-3">🛠️</span>
                    Remedial Actions
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="text-3xl">🛠️</span>
                      <h4 className="font-bold text-gray-900 text-xl">If You've Already Planted Not Recommended Crops</h4>
                    </div>
                    <p className="text-sm font-medium text-gray-700 leading-relaxed">
                      {result.remedialActions}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
} 
