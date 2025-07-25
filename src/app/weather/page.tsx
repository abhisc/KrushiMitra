'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getWeatherAndIrrigationTips, WeatherAndIrrigationTipsInput } from '@/ai/flows/weather-and-irrigation-tips';
import { Loader2, Cloud, Droplets, Sun } from 'lucide-react';
import AppLayout from '@/components/agrimitra/app-layout';

// SunPathArc component
function SunPathArc({ latitude, longitude, locationName }: { latitude: number, longitude: number, locationName: string }) {
  const [sunData, setSunData] = useState<{ sunrise: string, sunset: string }>({ sunrise: '', sunset: '' });
  const [now, setNow] = useState<Date>(new Date());
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!latitude || !longitude) return;
    fetch(`https://api.sunrisesunset.io/json?lat=${latitude}&lng=${longitude}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.results) setSunData({ sunrise: data.results.sunrise, sunset: data.results.sunset });
      });
    const interval = setInterval(() => setNow(new Date()), 1000 * 30); // update every 30s
    return () => clearInterval(interval);
  }, [latitude, longitude]);

  // Helper: parse "5:25:00 AM" to Date (today)
  function parseTime(str: string): Date | null {
    if (!str) return null;
    const [time, ampm] = str.split(' ');
    let [h, m, s] = time.split(':');
    h = parseInt(h, 10);
    m = parseInt(m, 10);
    s = s ? parseInt(s, 10) : 0;
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    const d = new Date(now);
    d.setHours(h, m, s, 0);
    return d;
  }
  const sunrise = parseTime(sunData.sunrise);
  const sunset = parseTime(sunData.sunset);
  // Calculate sun position (0=start, 1=end)
  let sunPos = 0;
  if (sunrise && sunset && now >= sunrise && now <= sunset) {
    sunPos = (Number(now) - Number(sunrise)) / (Number(sunset) - Number(sunrise));
  } else if (sunset && now > sunset) {
    sunPos = 1;
  }
  // Arc geometry
  const arcW = 240, arcH = 60;
  const sunX = 20 + sunPos * (arcW - 40);
  const sunY = 30 - 24 * Math.sin(Math.PI * sunPos);
  // Time since sunrise/until sunset
  function formatDuration(ms: number): string {
    const min = Math.floor(ms / 60000);
    const hr = Math.floor(min / 60);
    const m = min % 60;
    return hr > 0 ? `${hr}h ${m}m` : `${m}m`;
  }
  let sinceSunrise = sunrise && now > sunrise ? formatDuration(Number(now) - Number(sunrise)) : null;
  let untilSunset = sunset && now < sunset ? formatDuration(Number(sunset) - Number(now)) : null;
  // Tooltip content (only time)
  const tooltip = (
    <div className="absolute left-1/2 top-[-48px] -translate-x-1/2 bg-white shadow-lg rounded-lg px-3 py-2 text-xs z-20 border border-gray-200 min-w-[100px] max-w-[140px] flex flex-col items-center"
         style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div className="absolute left-1/2 top-full -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-white"></div>
      <div className="font-semibold mb-1">☀️ Sun Details</div>
      <div><span className="font-semibold">Time:</span> {now.toLocaleTimeString()}</div>
    </div>
  );
  return (
    <div className="w-full flex flex-col items-center relative select-none mt-4">
      <div className="flex items-center w-full justify-between text-xs text-gray-600 mb-1">
        <span>{sunData.sunrise || '--'}</span>
        <span>{sunData.sunset || '--'}</span>
      </div>
      <div className="relative w-full h-20 flex items-center justify-center bg-white rounded-xl">
        <svg width={arcW} height={arcH} viewBox={`0 0 ${arcW} ${arcH}`} fill="none" className="w-full h-16">
          <path d={`M 20 50 Q ${arcW/2} 0 ${arcW-20} 50`} stroke="#fbbf24" strokeWidth="2" strokeDasharray="4 4" fill="none" />
        </svg>
        {/* Sun icon */}
        <span
          className={`absolute`} style={{ left: `calc(${(sunX/arcW)*100}% - 18px)`, top: `${sunY+8}px`, transition: 'left 1s linear, top 1s linear', zIndex: 10 }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <span className={`text-4xl ${sunPos > 0 && sunPos < 1 ? 'animate-pulse' : ''}`} style={{ filter: sunPos > 0 && sunPos < 1 ? 'drop-shadow(0 0 12px #fbbf24)' : '' }}>☀️</span>
        </span>
        {showTooltip && tooltip}
      </div>
    </div>
  );
}

export default function WeatherPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState('');
  const [crop, setCrop] = useState('');
  const [result, setResult] = useState<any>(null);
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

  // Helper to get weather illustration image path
  function getWeatherImage(condition: string) {
    if (!condition) return '/weather-illustrations/sunny.png';
    const cond = condition.toLowerCase();
    if (cond.includes('cloud')) return '/weather-illustrations/cloudy.png';
    if (cond.includes('rain')) return '/weather-illustrations/rainy.png';
    if (cond.includes('clear')) return '/weather-illustrations/sunny.png';
    if (cond.includes('snow')) return '/weather-illustrations/snowy.png';
    if (cond.includes('storm')) return '/weather-illustrations/stormy.png';
    if (cond.includes('night') || cond.includes('moon')) return '/weather-illustrations/night.png';
    return '/weather-illustrations/sunny.png';
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
                Weather Analysis Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={handleUseMyLocation} disabled={geoLoading}>
                  {geoLoading ? 'Locating...' : 'Use My Location'}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
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
                <div>
                  <Label htmlFor="crop">Crop (Optional)</Label>
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
                <Label htmlFor="custom-location">Custom Location (Optional)</Label>
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
                Analyzing Weather...
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 mr-2" />
                Get Weather & Irrigation Tips
              </>
            )}
          </Button>

          {result && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-[#f9f7f3] rounded-2xl shadow-lg p-8 text-gray-900 relative overflow-hidden">
                  <div className="flex justify-center items-center w-full h-48">
                    <img
                      src={getWeatherImage(result.condition)}
                      alt={result.condition}
                      className="w-40 h-40 object-contain mx-auto"
                      draggable={false}
                    />
                  </div>
                  {/* Sunrise/Sunset Row */}
                  <div className="flex flex-col items-center mt-4">
                    <SunPathArc latitude={lat} longitude={lon} locationName={locationName || locationCoords} />
                  </div>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Droplets className="w-5 h-5" />
                      Irrigation Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">Irrigation Tips</h3>
                      {result.irrigationTips && !result.irrigationTips.trim().startsWith('The weather in') ? (
                        <p className="text-gray-700">{result.irrigationTips}</p>
                      ) : (
                        <p className="text-gray-500 italic">No specific irrigation advice available for these conditions.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* Crops and Remedy Section */}
              {console.log('Weather result:', result)}
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