'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getWeatherAndIrrigationTips, WeatherAndIrrigationTipsInput } from '@/ai/flows/weather-and-irrigation-tips';
import { Loader2, Cloud, Droplets, Sun, Calendar } from 'lucide-react';
import AppLayout from '@/components/agrimitra/app-layout';

// Remove all SunPathArc and its Card. Only render the Weather card in the left column and the Irrigation Tips card in the right column.

export default function WeatherPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState('');
  const [crop, setCrop] = useState('');
  const [result, setResult] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const { toast } = useToast();
  const [selectedCrop, setSelectedCrop] = useState<{ name: string; reason: string; emoji: string } | null>(null);
  const [bestCropIndex, setBestCropIndex] = useState(0);
  const [avoidCropIndex, setAvoidCropIndex] = useState(0);
  const [geoLoading, setGeoLoading] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [locationCoords, setLocationCoords] = useState('');

  // Reset indexes when new data arrives
  useEffect(() => {
    setBestCropIndex(0);
  }, [result?.recommendedCropsWithReasons?.length]);

  useEffect(() => {
    setAvoidCropIndex(0);
  }, [result?.notRecommendedCropsWithReasons?.length]);

  // Auto-slide for Best Crops
  useEffect(() => {
    if (!result?.recommendedCropsWithReasons || result.recommendedCropsWithReasons.length === 0) return;
    const interval = setInterval(() => {
      setBestCropIndex(idx => (idx + 1) % result.recommendedCropsWithReasons.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [result?.recommendedCropsWithReasons]);

  // Auto-slide for Avoid Crops
  useEffect(() => {
    if (!result?.notRecommendedCropsWithReasons || result.notRecommendedCropsWithReasons.length === 0) return;
    const interval = setInterval(() => {
      setAvoidCropIndex(idx => (idx + 1) % result.notRecommendedCropsWithReasons.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [result?.notRecommendedCropsWithReasons]);

  const popularLocations = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
    'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'
  ];

  const popularCrops = [
    'Rice', 'Wheat', 'Corn', 'Soybeans', 'Cotton', 'Sugarcane',
    'Potato', 'Tomato', 'Onion', 'Chilli', 'Pulses', 'Oilseeds'
  ];

  // When user selects a city manually, set locationName to the selected city and clear coords
  const handleLocationChange = (val: string) => {
    setLocation(val);
    setLocationName(val); // Use the selected city as the display name
    setLocationCoords(''); // Clear coords so backend uses city name only
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
      toast({
        title: "Analysis Failed",
        description: "Unable to get weather analysis. Please try again.",
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
          <div className="bg-card rounded-lg border border-border p-6 mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Weather Analysis Parameters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Location */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleUseMyLocation}
                    disabled={geoLoading}
                    className="text-xs text-primary hover:text-primary/80 underline"
                  >
                    {geoLoading ? "Locating..." : "Use My Location"}
                  </button>
                </div>
                <Label htmlFor="location">Location</Label>
                <Select value={location} onValueChange={handleLocationChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {popularLocations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Crop */}
              <div className="space-y-2">
                <Label htmlFor="crop">Crop</Label>
                <Select value={crop} onValueChange={setCrop}>
                  <SelectTrigger>
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
              <div className="space-y-2">
                <Label htmlFor="custom-location">Custom Location (Optional)</Label>
                <Input
                  id="custom-location"
                  placeholder="Enter custom location"
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                />
              </div>

              {/* Analyze Button */}
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button
                  onClick={handleWeatherAnalysis}
                  disabled={isLoading}
                  className="w-full"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-8 h-full">
              {/* Weather Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border border-blue-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900">Current Weather</h3>
                  {getWeatherCardStyleAndIcon(result.currentWeather?.condition || 'unknown').icon}
                </div>
                
                {result.currentWeather && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-900">
                        {result.currentWeather.temperature}°C
                      </span>
                      <span className="text-blue-700">
                        {result.currentWeather.condition}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Droplets className="w-4 h-4 text-blue-600" />
                        <span>Humidity: {result.currentWeather.humidity}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Cloud className="w-4 h-4 text-blue-600" />
                        <span>Wind: {result.currentWeather.windSpeed} km/h</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Irrigation Tips Card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg border border-green-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Droplets className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-900">Irrigation Tips</h3>
                </div>
                
                {result.irrigationTips && (
                  <div className="space-y-3">
                    <div className="bg-white/50 rounded-lg p-3">
                      <h4 className="font-medium text-green-800 mb-2">Recommendations</h4>
                      <p className="text-sm text-green-700">{result.irrigationTips.recommendations}</p>
                    </div>
                    
                    {result.irrigationTips.schedule && (
                      <div className="bg-white/50 rounded-lg p-3">
                        <h4 className="font-medium text-green-800 mb-2">Schedule</h4>
                        <p className="text-sm text-green-700">{result.irrigationTips.schedule}</p>
                      </div>
                    )}
                    
                    {result.irrigationTips.warnings && (
                      <div className="bg-white/50 rounded-lg p-3">
                        <h4 className="font-medium text-green-800 mb-2">Warnings</h4>
                        <p className="text-sm text-green-700">{result.irrigationTips.warnings}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Results */}
          {result && (
            <div className="space-y-6">
              {/* Crop Recommendations */}
              {result.recommendedCropsWithReasons && result.recommendedCropsWithReasons.length > 0 && (
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Recommended Crops</h3>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getCropEmoji(result.recommendedCropsWithReasons[bestCropIndex]?.name || '')}</span>
                      <div>
                        <h4 className="font-semibold text-green-800">
                          {result.recommendedCropsWithReasons[bestCropIndex]?.name}
                        </h4>
                        <p className="text-sm text-green-700">
                          {result.recommendedCropsWithReasons[bestCropIndex]?.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Crops to Avoid */}
              {result.notRecommendedCropsWithReasons && result.notRecommendedCropsWithReasons.length > 0 && (
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Crops to Avoid</h3>
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getCropEmoji(result.notRecommendedCropsWithReasons[avoidCropIndex]?.name || '')}</span>
                      <div>
                        <h4 className="font-semibold text-red-800">
                          {result.notRecommendedCropsWithReasons[avoidCropIndex]?.name}
                        </h4>
                        <p className="text-sm text-red-700">
                          {result.notRecommendedCropsWithReasons[avoidCropIndex]?.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Weather Forecast */}
              {forecastData && (
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Weather Forecast</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {forecastData.slice(0, 5).map((day: any, index: number) => (
                      <div key={index} className="bg-muted rounded-lg p-3 text-center">
                        <div className="text-sm font-medium text-muted-foreground">
                          {formatDate(day.date)}
                        </div>
                        <div className="text-2xl my-2">
                          {getWeatherIcon(day.condition)}
                        </div>
                        <div className="text-sm font-semibold">
                          {day.temperature}°C
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {day.condition}
                        </div>
                      </div>
                    ))}
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
