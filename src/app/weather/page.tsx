'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getWeatherAndIrrigationTips, WeatherAndIrrigationTipsInput } from '@/ai/flows/weather-and-irrigation-tips';
import { Loader2, Cloud, Droplets, Sun } from 'lucide-react';
import AppLayout from '@/components/agrimitra/app-layout';

export default function WeatherPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState('');
  const [crop, setCrop] = useState('');
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const popularLocations = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
    'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'
  ];

  const popularCrops = [
    'Rice', 'Wheat', 'Corn', 'Soybeans', 'Cotton', 'Sugarcane',
    'Potato', 'Tomato', 'Onion', 'Chilli', 'Pulses', 'Oilseeds'
  ];

  const handleWeatherAnalysis = async () => {
    if (!location.trim()) {
      toast({
        title: "Error",
        description: "Please provide a location for weather analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const input: WeatherAndIrrigationTipsInput = {
        location: location.trim(),
        cropType: crop.trim() || undefined,
      };

      const weatherTips = await getWeatherAndIrrigationTips(input);
      setResult(weatherTips);
      
      toast({
        title: "Weather Analysis Complete",
        description: `Weather and irrigation tips for ${location} generated.`,
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

  return (
    <AppLayout 
      title="Weather & Irrigation Tips" 
      subtitle="Get weather forecasts and irrigation recommendations for your crops"
      showBackButton={true}
    >
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="w-5 h-5" />
                Weather Analysis Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select value={location} onValueChange={setLocation}>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="w-5 h-5" />
                    Weather Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">Forecast</h3>
                    <p className="text-gray-700">{result.weatherForecast}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Unsuitable Crops</h3>
                    <ul className="list-disc list-inside text-gray-700">
                      {result.unsuitableCrops && result.unsuitableCrops.length > 0 ? (
                        result.unsuitableCrops.map((crop: string, idx: number) => (
                          <li key={idx}>{crop}</li>
                        ))
                      ) : (
                        <li>None</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Not Recommended Crops</h3>
                    <ul className="list-disc list-inside text-gray-700">
                      {result.notRecommendedCrops && result.notRecommendedCrops.length > 0 ? (
                        result.notRecommendedCrops.map((crop: string, idx: number) => (
                          <li key={idx}>{crop}</li>
                        ))
                      ) : (
                        <li>None</li>
                      )}
                    </ul>
                  </div>
                </CardContent>
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
                    <p className="text-gray-700">{result.irrigationTips}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Remedial Actions</h3>
                    <p className="text-gray-700">{result.remedialActions}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
} 