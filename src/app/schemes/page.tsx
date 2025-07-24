'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getGovernmentSchemeInfo, GovernmentSchemeInfoInput } from '@/ai/flows/government-scheme-information';
import { Loader2, Landmark, FileText, Users } from 'lucide-react';
import AppLayout from '@/components/agrimitra/app-layout';

export default function SchemesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [cropType, setCropType] = useState('');
  const [location, setLocation] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const popularCrops = [
    'Rice', 'Wheat', 'Corn', 'Soybeans', 'Cotton', 'Sugarcane',
    'Potato', 'Tomato', 'Onion', 'Chilli', 'Pulses', 'Oilseeds'
  ];

  const popularLocations = [
    'Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu',
    'West Bengal', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Bihar'
  ];

  const farmSizes = [
    'Small (1-5 acres)', 'Medium (5-20 acres)', 'Large (20+ acres)'
  ];

  const handleSchemeSearch = async () => {
    if (!cropType.trim() || !location.trim() || !farmSize.trim()) {
      toast({
        title: "Error",
        description: "Please provide crop type, location, and farm size for scheme information.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const input: GovernmentSchemeInfoInput = {
        cropType: cropType.trim(),
        location: location.trim(),
        farmSize: farmSize.trim(),
        query: query.trim() || undefined,
      };

      const schemeInfo = await getGovernmentSchemeInfo(input);
      setResult(schemeInfo);
      
      toast({
        title: "Scheme Search Complete",
        description: `Government schemes for ${cropType} in ${location} found.`,
      });
    } catch (error) {
      console.error('Scheme search error:', error);
      toast({
        title: "Search Failed",
        description: "Unable to get scheme information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout 
      title="Government Scheme Information" 
      subtitle="Find relevant government schemes and subsidies for farmers"
      showBackButton={true}
    >
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="w-5 h-5" />
                Scheme Search Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cropType">Crop Type</Label>
                  <Select value={cropType} onValueChange={setCropType}>
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
                  <Label htmlFor="farmSize">Farm Size</Label>
                  <Select value={farmSize} onValueChange={setFarmSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select farm size" />
                    </SelectTrigger>
                    <SelectContent>
                      {farmSizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="query">Specific Question (Optional)</Label>
                <Input
                  id="query"
                  placeholder="Ask about specific schemes or requirements..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleSchemeSearch} 
            disabled={isLoading || !cropType.trim() || !location.trim() || !farmSize.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching Schemes...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Search Government Schemes
              </>
            )}
          </Button>

          {result && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Available Schemes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.schemes?.map((scheme: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 space-y-2">
                        <h3 className="font-semibold text-lg">{scheme.name}</h3>
                        <p className="text-gray-600">{scheme.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Eligibility:</span> {scheme.eligibility}
                          </div>
                          <div>
                            <span className="font-medium">Benefits:</span> {scheme.benefits}
                          </div>
                          <div>
                            <span className="font-medium">How to Apply:</span> {scheme.howToApply}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">Total Schemes Found</h3>
                      <p className="text-2xl font-bold text-green-600">
                        {result.schemes?.length || 0} schemes
                      </p>
                    </div>
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