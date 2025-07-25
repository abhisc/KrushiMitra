'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/agrimitra/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User as UserIcon, Mail, Shield, Calendar, Edit, Save, X, LogOut, MapPin, Info, Plus } from 'lucide-react';
import { UserService } from '@/lib/user-service';
import AdditionalInfoForm from '@/components/additional-info-form';

export default function ProfilePage() {
  const { user, userProfile, updateUserProfile, logout, loadUserProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAdditionalInfoForm, setShowAdditionalInfoForm] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Create UserService instance
  const userService = new UserService();

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    setDisplayName(user.displayName || '');
    
    // Load user profile if not already loaded
    if (!userProfile) {
      loadUserProfile();
    }
  }, [user, userProfile, router, loadUserProfile]);

  // Function to manually refresh user profile
  const refreshUserProfile = async () => {
    if (!user) return;
    
    setIsLoadingProfile(true);
    try {
      await loadUserProfile();
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      toast({
        title: "Error",
        description: "Display name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateUserProfile(displayName);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const handleFillAdditionalInfo = () => {
    setShowAdditionalInfoForm(true);
  };

  const handleAdditionalInfoSuccess = async () => {
    setShowAdditionalInfoForm(false);
    await refreshUserProfile();
    toast({
      title: "Success",
      description: "Additional information saved successfully!",
    });
  };

  const getInitials = (displayName: string | null) => {
    if (!displayName) return 'U';
    return displayName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAuthProvider = () => {
    if (!user) return 'Unknown';
    if (user.isAnonymous) return 'Anonymous';
    if (user.providerData.length > 0) {
      const provider = user.providerData[0];
      if (provider.providerId === 'google.com') return 'Google';
      if (provider.providerId === 'password') return 'Email/Password';
    }
    return 'Email/Password';
  };

  // Check if user has any additional information
  const hasAdditionalInfo = userProfile && (
    userProfile.age ||
    userProfile.gender ||
    userProfile.location?.city ||
    userProfile.location?.state ||
    userProfile.isStudent ||
    userProfile.minority ||
    userProfile.disability ||
    userProfile.caste ||
    userProfile.residence
  );

  // Debug: Log profile data to console
  useEffect(() => {
    if (userProfile) {
      console.log('User Profile Data:', userProfile);
    }
  }, [userProfile]);

  if (!user) {
    return null;
  }

  return (
    <AppLayout title="Profile" subtitle="Manage your account">
      <div className="p-6 space-y-6">
        {/* Additional Info Form Modal */}
        {showAdditionalInfoForm && (
          <AdditionalInfoForm
            onClose={() => setShowAdditionalInfoForm(false)}
            onSuccess={handleAdditionalInfoSuccess}
          />
        )}

        {/* Profile Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              View and manage your account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar and Basic Info */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                <AvatarFallback className="text-lg">{getInitials(user.displayName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="max-w-xs"
                      />
                      <Button
                        size="sm"
                        onClick={handleUpdateProfile}
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setDisplayName(user.displayName || '');
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold">{user.displayName || 'User'}</h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {user.email || 'Guest User'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Sign-in Method</Label>
                <p className="text-sm">{getAuthProvider()}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Account Created</Label>
                <p className="text-sm">
                  {user.metadata.creationTime 
                    ? new Date(user.metadata.creationTime).toLocaleDateString()
                    : 'Unknown'
                  }
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Last Sign In</Label>
                <p className="text-sm">
                  {user.metadata.lastSignInTime 
                    ? new Date(user.metadata.lastSignInTime).toLocaleDateString()
                    : 'Unknown'
                  }
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">User ID</Label>
                <p className="text-sm font-mono text-xs bg-muted p-2 rounded">
                  {user.uid}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Additional Information
              {isLoadingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
            </CardTitle>
            <CardDescription>
              Personal details for personalized recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Debug: Manual refresh button */}
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={refreshUserProfile}
                disabled={isLoadingProfile}
              >
                {isLoadingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Refresh'
                )}
              </Button>
            </div>
            
            {hasAdditionalInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userProfile?.age && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Age</Label>
                    <p className="text-sm">{userProfile.age} years</p>
                  </div>
                )}
                
                {userProfile?.gender && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Gender</Label>
                    <p className="text-sm">{userProfile.gender}</p>
                  </div>
                )}
                
                {userProfile?.location?.city && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">City</Label>
                    <p className="text-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {userProfile.location.city}
                    </p>
                  </div>
                )}
                
                {userProfile?.location?.state && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">State</Label>
                    <p className="text-sm">{userProfile.location.state}</p>
                  </div>
                )}
                
                {userProfile?.isStudent && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Student Status</Label>
                    <p className="text-sm">{userProfile.isStudent}</p>
                  </div>
                )}
                
                {userProfile?.minority && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Minority Community</Label>
                    <p className="text-sm">{userProfile.minority}</p>
                  </div>
                )}
                
                {userProfile?.disability && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Disability</Label>
                    <p className="text-sm">{userProfile.disability}</p>
                  </div>
                )}
                
                {userProfile?.caste && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Caste Category</Label>
                    <p className="text-sm">{userProfile.caste}</p>
                  </div>
                )}
                
                {userProfile?.residence && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Residence Type</Label>
                    <p className="text-sm">{userProfile.residence}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-4">
                  <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No additional information available</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fill in your details to get personalized recommendations
                  </p>
                </div>
              </div>
            )}
            
            <div className="pt-4">
              <Button
                variant="outline"
                onClick={handleFillAdditionalInfo}
                className="w-full"
              >
                {hasAdditionalInfo ? (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Update Additional Information
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Fill Additional Information
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
} 