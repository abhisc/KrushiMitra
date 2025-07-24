'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { diagnoseCropDisease, DiagnoseCropDiseaseInput } from '@/ai/flows/diagnose-crop-disease';
import { Loader2, Upload, Camera } from 'lucide-react';
import AppLayout from '@/components/agrimitra/app-layout';

export default function DiagnosePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [photoDataUri, setPhotoDataUri] = useState<string>('');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoDataUri(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDiagnose = async () => {
    if (!photoDataUri && !description.trim()) {
      toast({
        title: "Error",
        description: "Please provide either a photo or description of the crop symptoms.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const input: DiagnoseCropDiseaseInput = {
        photoDataUri: photoDataUri || undefined,
        description: description.trim() || undefined,
      };

      const diagnosis = await diagnoseCropDisease(input);
      setResult(diagnosis);
      
      toast({
        title: "Diagnosis Complete",
        description: `Identified: ${diagnosis.disease} (Confidence: ${(diagnosis.confidence * 100).toFixed(1)}%)`,
      });
    } catch (error) {
      console.error('Diagnosis error:', error);
      toast({
        title: "Diagnosis Failed",
        description: "Unable to diagnose crop disease. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout 
      title="Crop Disease Diagnosis" 
      subtitle="Upload a photo or describe symptoms to diagnose crop diseases"
      showBackButton={true}
    >
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Photo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={() => document.getElementById('photo-upload')?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
                <Button variant="outline">
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
              {photoDataUri && (
                <div className="mt-4">
                  <img src={photoDataUri} alt="Uploaded crop" className="max-w-xs rounded-lg" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Describe Symptoms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Crop Symptoms Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the symptoms you're seeing on your crop..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleDiagnose} 
            disabled={isLoading || (!photoDataUri && !description.trim())}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Diagnosing...
              </>
            ) : (
              'Diagnose Crop Disease'
            )}
          </Button>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Diagnosis Result</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">Disease: {result.disease}</h3>
                  <p className="text-sm text-gray-600">
                    Confidence: {(result.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Recommendations:</h4>
                  <p className="text-gray-700">{result.recommendations}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
} 