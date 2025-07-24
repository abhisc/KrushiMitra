'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getMarketAnalysis, MarketAnalysisInput } from '@/ai/flows/real-time-market-analysis';
import { Loader2, TrendingUp, BarChart3 } from 'lucide-react';
import AppLayout from '@/components/agrimitra/app-layout';

export default function MarketPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [crop, setCrop] = useState('');
  const [market, setMarket] = useState('');
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const popularCrops = [
    'Rice', 'Wheat', 'Corn', 'Soybeans', 'Cotton', 'Sugarcane',
    'Potato', 'Tomato', 'Onion', 'Chilli', 'Pulses', 'Oilseeds'
  ];

  const popularMarkets = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
    'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'
  ];

  const handleMarketAnalysis = async () => {
    if (!crop.trim() || !market.trim()) {
      toast({
        title: "Error",
        description: "Please provide both crop and market for analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const input: MarketAnalysisInput = {
        crop: crop.trim(),
        market: market.trim(),
      };

      const analysis = await getMarketAnalysis(input);
      setResult(analysis);
      
      toast({
        title: "Analysis Complete",
        description: `Market analysis for ${crop} in ${market} completed.`,
      });
    } catch (error) {
      console.error('Market analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to get market analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout 
      title="Real-Time Market Analysis" 
      subtitle="Get latest prices and market trends for agricultural products"
      showBackButton={true}
    >
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Market Analysis Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="crop">Crop/Product</Label>
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
                <div>
                  <Label htmlFor="market">Market Location</Label>
                  <Select value={market} onValueChange={setMarket}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select market" />
                    </SelectTrigger>
                    <SelectContent>
                      {popularMarkets.map((marketName) => (
                        <SelectItem key={marketName} value={marketName}>
                          {marketName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="custom-crop">Custom Crop (Optional)</Label>
                  <Input
                    id="custom-crop"
                    placeholder="Enter custom crop name"
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="custom-market">Custom Market (Optional)</Label>
                  <Input
                    id="custom-market"
                    placeholder="Enter custom market"
                    value={market}
                    onChange={(e) => setMarket(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleMarketAnalysis} 
            disabled={isLoading || (!crop.trim() || !market.trim())}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Market...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4 mr-2" />
                Get Market Analysis
              </>
            )}
          </Button>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Market Analysis Result</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">Current Price</h3>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{result.price}/quintal
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Price Trend</h3>
                    <p className="text-lg text-gray-700">{result.trend}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Market Analysis:</h4>
                  <p className="text-gray-700">{result.analysis}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
} 