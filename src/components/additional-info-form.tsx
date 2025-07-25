'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin, User, Save, X } from 'lucide-react';
import { UserService, UserProfile } from '@/lib/user-service';
import { useAuth } from '@/contexts/auth-context';

interface AdditionalInfoFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdditionalInfoForm({ onClose, onSuccess }: AdditionalInfoFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    isStudent: '',
    minority: '',
    disability: '',
    caste: '',
    residence: '',
    age: '',
    gender: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    if (user) {
      loadExistingData();
    }
  }, [user]);

  // Create UserService instance
  const userService = new UserService();

  const loadExistingData = async () => {
    if (!user) return;
    
    try {
      const userProfile = await userService.getUserProfile(user.uid);
      if (userProfile) {
        setFormData({
          isStudent: userProfile.isStudent || '',
          minority: userProfile.minority || '',
          disability: userProfile.disability || '',
          caste: userProfile.caste || '',
          residence: userProfile.residence || '',
          age: userProfile.age?.toString() || '',
          gender: userProfile.gender || '',
          city: userProfile.location?.city || '',
          state: userProfile.location?.state || '',
        });
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
      // Don't show error toast for guest users
    }
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Error",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive",
      });
      return;
    }

    setIsLocationLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      // For now, we'll just store coordinates and let user enter city/state manually
      // In a production app, you would use a geocoding service like OpenCage, Google Maps, etc.
      const { latitude, longitude } = position.coords;
      toast({
        title: "Location Retrieved",
        description: "Coordinates obtained. Please enter your city and state manually.",
      });
    } catch (error) {
      toast({
        title: "Location Error",
        description: "Could not get your location. Please enter manually.",
        variant: "destructive",
      });
    } finally {
      setIsLocationLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const additionalInfo: Partial<UserProfile> = {};
      
      // Only add fields that have values (not empty strings)
      if (formData.isStudent && formData.isStudent.trim()) {
        additionalInfo.isStudent = formData.isStudent as 'Yes' | 'No';
      }
      if (formData.minority && formData.minority.trim()) {
        additionalInfo.minority = formData.minority as 'Yes' | 'No';
      }
      if (formData.disability && formData.disability.trim()) {
        additionalInfo.disability = formData.disability as 'Yes' | 'No';
      }
      if (formData.caste && formData.caste.trim()) {
        additionalInfo.caste = formData.caste as 'All' | 'General' | 'SC' | 'ST' | 'OBC';
      }
      if (formData.residence && formData.residence.trim()) {
        additionalInfo.residence = formData.residence as 'Both' | 'Urban' | 'Rural';
      }
      if (formData.age && formData.age.trim()) {
        additionalInfo.age = parseInt(formData.age);
      }
      if (formData.gender && formData.gender.trim()) {
        additionalInfo.gender = formData.gender as 'All' | 'Male' | 'Female' | 'Other';
      }
      
      // Only add location if city or state is provided (not empty strings)
      const city = formData.city?.trim();
      const state = formData.state?.trim();
      if (city || state) {
        additionalInfo.location = {};
        if (city) {
          additionalInfo.location.city = city;
        }
        if (state) {
          additionalInfo.location.state = state;
        }
      }

      await userService.updateAdditionalInfo(user.uid, additionalInfo, user.displayName || undefined);
      
      toast({
        title: "Success",
        description: "Additional information saved successfully!",
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Error saving additional info:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save additional information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Additional Information
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription>
            Help us provide personalized recommendations for weather, government schemes, and more. All fields are optional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Enter your age"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    min="1"
                    max="120"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Location Information</h3>
              
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={isLocationLoading}
                  className="w-full"
                >
                  {isLocationLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4 mr-2" />
                  )}
                  {isLocationLoading ? 'Getting Location...' : 'Get Current Location'}
                </Button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Enter your city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="Enter your state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Eligibility Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Eligibility Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="isStudent">Are you a student?</Label>
                  <Select value={formData.isStudent} onValueChange={(value) => handleInputChange('isStudent', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="minority">Do you belong to minority community?</Label>
                  <Select value={formData.minority} onValueChange={(value) => handleInputChange('minority', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="disability">Do you have any disability?</Label>
                  <Select value={formData.disability} onValueChange={(value) => handleInputChange('disability', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="caste">Caste Category</Label>
                  <Select value={formData.caste} onValueChange={(value) => handleInputChange('caste', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select caste" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="SC">SC</SelectItem>
                      <SelectItem value="ST">ST</SelectItem>
                      <SelectItem value="OBC">OBC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="residence">Residence Type</Label>
                  <Select value={formData.residence} onValueChange={(value) => handleInputChange('residence', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select residence type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Urban">Urban</SelectItem>
                      <SelectItem value="Rural">Rural</SelectItem>
                      <SelectItem value="Both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Information
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Skip
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 