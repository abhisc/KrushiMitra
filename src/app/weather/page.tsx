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
import { TranslatableText } from '@/components/ui/translatable-text';

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
        <div className="max-w-4xl mx-auto space-y-6">
          <Card
            style={{
              backgroundImage: `url("data:image/svg+xml;utf8,<svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'><defs><linearGradient id='g1' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23e0f7fa'/><stop offset='100%' stop-color='%23e8f5e9'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23g1)'/><ellipse cx='80' cy='60' rx='60' ry='20' fill='%23b2dfdb' opacity='0.3'/><ellipse cx='220' cy='100' rx='80' ry='25' fill='%23a5d6a7' opacity='0.3'/><ellipse cx='350' cy='60' rx='60' ry='20' fill='%23b2dfdb' opacity='0.3'/><circle cx='60' cy='40' r='18' fill='%23fffde7' opacity='0.7'/><text x='30' y='50' font-size='24' fill='%23ffd600' opacity='0.5'>☀️</text><text x='200' y='80' font-size='24' fill='%2300bcd4' opacity='0.4'>☁️</text><text x='320' y='50' font-size='24' fill='%2300bcd4' opacity='0.4'>🌾</text></svg>")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
            className="relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2">
                <Cloud className="w-5 h-5" />
                <TranslatableText>Weather Analysis Parameters</TranslatableText>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={handleUseMyLocation} disabled={geoLoading}>
                  {geoLoading ? <TranslatableText>Locating...</TranslatableText> : <TranslatableText>Use My Location</TranslatableText>}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location"><TranslatableText>Location</TranslatableText></Label>
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
                <div>
                  <Label htmlFor="crop"><TranslatableText>Crop</TranslatableText></Label>
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
              </div>
              <div>
                <Label htmlFor="custom-location"><TranslatableText>Custom Location (Optional)</TranslatableText></Label>
                								<Input
									id="custom-location"
									placeholder="Enter custom location"
									value={location}
									onChange={(e) => setLocation(e.target.value)}
								/>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleWeatherAnalysis} 
            disabled={isLoading || !location.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <TranslatableText>Analyzing Weather...</TranslatableText>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 mr-2" />
                <TranslatableText>Get Weather & Irrigation Tips</TranslatableText>
              </>
            )}
          </Button>

          {result && (
            <>
              {/* Responsive grid: left column (Weather + Forecast), right column (Irrigation Tips) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-8 h-full">
                {/* Left column: Weather and Forecast */}
                <div className="flex flex-col gap-6 max-w-xl w-full h-full flex-1">
                  {/* Weather Card */}
                  {(() => {
                    const { bg } = getWeatherCardStyleAndIcon(result.condition);
                    return (
                      <div className={`w-full max-w-xl h-full min-h-[220px] flex-1 rounded-xl shadow-lg p-4 text-white flex flex-col justify-between ${bg} font-sans`}>
                  <div>
                          <div className="text-base font-semibold mb-1 flex items-center gap-2 tracking-tight">Current weather</div>
                          <div className="flex flex-col items-center">
                            <div className="flex items-end mt-4">
                              <span className="text-4xl font-extrabold drop-shadow-sm" style={{textShadow:'0 2px 8px rgba(0,0,0,0.10)'}}>{result.temperature != null ? Math.round(result.temperature) : '--'}</span>
                              <span className="text-xl font-semibold ml-1 drop-shadow-sm" style={{textShadow:'0 2px 8px rgba(0,0,0,0.10)'}}>°C</span>
                            </div>
                            <div className="text-lg font-semibold mt-1 capitalize drop-shadow-sm" style={{textShadow:'0 2px 8px rgba(0,0,0,0.10)'}}>{result.condition || '—'}</div>
                            {/* Weather Metrics Row */}
                            <div className="flex justify-center items-center gap-6 mt-4">
                              {/* Humidity */}
                              <div className="flex flex-col items-center">
                                <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" className="mb-0.5">
                                  <ellipse cx="10" cy="12" rx="5" ry="7" fill="#60A5FA" />
                                  <path d="M10 4 Q10 10 15 12" stroke="#fff" />
                                </svg>
                                <span className="text-sm font-bold">{result.humidity != null ? `${result.humidity}%` : '--'}</span>
                                <span className="text-xs">Humidity</span>
                              </div>
                              {/* Wind */}
                              <div className="flex flex-col items-center">
                                <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" className="mb-0.5">
                                  <path d="M4 10h12M6 14h8M5 6h10" stroke="#A7F3D0" />
                                </svg>
                                <span className="text-sm font-bold">{result.wind_speed != null ? `${result.wind_speed} km/h` : '--'}</span>
                                <span className="text-xs">Wind</span>
                              </div>
                              {/* Precipitation */}
                              <div className="flex flex-col items-center">
                                <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" className="mb-0.5">
                                  <ellipse cx="10" cy="12" rx="6" ry="4" fill="#E0E7FF" />
                                  <path d="M7 15v1M10 15v2M13 15v1" stroke="#fff" />
                                </svg>
                                <span className="text-sm font-bold">{result.precipitation != null ? `${result.precipitation} mm` : '--'}</span>
                                <span className="text-xs">Precip.</span>
                              </div>
                            </div>
                  </div>
                  </div>
                  </div>
                    );
                  })()}

                  {/* Forecast Card */}
                  {forecastData && forecastData.forecast && forecastData.forecast.length > 0 && (
                    <Card className="w-full max-w-xl rounded-xl shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Calendar className="w-5 h-5" />
                          3-Day Forecast
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-3 gap-4">
                          {forecastData.forecast.slice(0, 3).map((day: any, index: number) => (
                            <div key={index} className="flex flex-col items-center p-3 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                              <div className="text-sm font-semibold text-gray-700 mb-1">
                                {formatDate(day.date)}
                              </div>
                              <div className="text-2xl mb-2">
                                {getWeatherIcon(day.condition)}
                              </div>
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <span className={`text-lg font-bold ${getTemperatureColor(day.max_temp)}`}>
                                    {Math.round(day.max_temp)}°
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {Math.round(day.min_temp)}°
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 capitalize mb-2">
                                  {day.condition}
                                </div>
                                <div className="flex flex-col items-center gap-1 text-xs">
                                  <div className="flex items-center gap-1">
                                    <span className="text-blue-600">💧</span>
                                    <span>{day.chance_of_rain}%</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-600">💨</span>
                                    <span>{day.max_wind_kph} km/h</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                {/* Right column: Irrigation Tips */}
                <div className="h-full flex-1 max-w-xl w-full">
                  <Card className="w-full max-w-xl h-full min-h-[220px] flex-1 flex flex-col justify-between rounded-xl shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Droplets className="w-5 h-5" />
                    Irrigation Tips
                  </CardTitle>
                </CardHeader>
                    <CardContent className="space-y-4 flex-1 flex flex-col justify-center">
                  <div>
                        {result.irrigationTips && !result.irrigationTips.trim().startsWith('The weather in') ? (
                          <p className="text-gray-700">{result.irrigationTips}</p>
                        ) : (
                          <p className="text-gray-500 italic">No specific irrigation advice available for these conditions.</p>
                        )}
                  </div>
                </CardContent>
              </Card>
            </div>
              </div>
              {/* Below: Crops and Remedy Section (full width) */}
              <div className="mt-6">
                <div className="font-bold text-green-800 mb-1">Recommended Crops</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {result.recommendedCropsWithReasons && result.recommendedCropsWithReasons.length > 0 ? (
                    result.recommendedCropsWithReasons.map((crop: any, idx: number) => (
                      <span key={idx} className="bg-green-100 text-green-900 px-3 py-1 rounded-full" title={crop.reason}>
                        {getCropEmoji(crop.name)} {crop.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">Data not available</span>
                  )}
                </div>
                <div className="font-bold text-red-800 mb-1">Not Recommended Crops</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {result.notRecommendedCropsWithReasons && result.notRecommendedCropsWithReasons.length > 0 ? (
                    result.notRecommendedCropsWithReasons.map((crop: any, idx: number) => (
                      <span key={idx} className="bg-red-100 text-red-900 px-3 py-1 rounded-full" title={crop.reason}>
                        {getCropEmoji(crop.name)} {crop.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">None</span>
                  )}
                </div>
                {result.remedialActions && (
                  <div className="mt-2 bg-yellow-50 border-l-4 border-yellow-400 p-3 text-yellow-900 rounded">
                    <span className="font-semibold">Remedial Actions:</span> {result.remedialActions}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
} 
