'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  diagnoseCropDisease,
  DiagnoseCropDiseaseInput,
  DiagnoseCropDiseaseOutput,
} from '@/ai/flows/diagnose-crop-disease';
import {
  getMarketAnalysis,
  MarketAnalysisInput,
  MarketAnalysisOutput,
} from '@/ai/flows/real-time-market-analysis';
import {
  getGovernmentSchemeInfo,
  GovernmentSchemeInfoInput,
  GovernmentSchemeInfoOutput,
} from '@/ai/flows/government-scheme-information';
import {
  getWeatherAndIrrigationTips,
  WeatherAndIrrigationTipsInput,
  WeatherAndIrrigationTipsOutput,
} from '@/ai/flows/weather-and-irrigation-tips';
import { Leaf, LineChart, Landmark, Droplets, Loader2, Wheat } from 'lucide-react';

const features = [
  {
    title: 'Diagnose Crop Disease',
    description: 'Upload image or describe symptoms',
    icon: <Leaf className="h-8 w-8 text-primary" />,
    action: 'focus-chat',
  },
  {
    title: 'Real-Time Market Analysis',
    description: 'Get latest prices and trends',
    icon: <LineChart className="h-8 w-8 text-primary" />,
    dialog: 'market',
  },
  {
    title: 'Government Scheme Info',
    description: 'Find relevant schemes & subsidies',
    icon: <Landmark className="h-8 w-8 text-primary" />,
    dialog: 'scheme',
  },
  {
    title: 'Weather & Irrigation Tips',
    description: 'Forecasts and water management',
    icon: <Droplets className="h-8 w-8 text-primary" />,
    dialog: 'weather',
  },
];

const quickChats = [
  'Check price of tomato',
  'My wheat crop looks yellow',
  'Show fertilizer subsidies',
];

const DiagnoseSchema = z.object({
  description: z.string().min(10, 'Please provide a more detailed description.'),
  photo: z.any().optional(),
});
type DiagnoseFormValues = z.infer<typeof DiagnoseSchema>;

function DiagnoseDialogContent({ setOpen }: { setOpen: (open: boolean) => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnoseCropDiseaseOutput | null>(null);
  const form = useForm<DiagnoseFormValues>({
    resolver: zodResolver(DiagnoseSchema),
  });

  const onSubmit = async (data: DiagnoseFormValues) => {
    setLoading(true);
    setResult(null);

    let photoDataUri: string | undefined;
    if (data.photo && data.photo[0]) {
      try {
        photoDataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(data.photo[0]);
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error reading file',
          description: 'Could not process the uploaded image.',
        });
        setLoading(false);
        return;
      }
    }

    const input: DiagnoseCropDiseaseInput = {
      description: data.description,
      photoDataUri,
    };

    try {
      const response = await diagnoseCropDisease(input);
      setResult(response);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'AI Error',
        description: 'Failed to get diagnosis from AI model.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="description">Describe the symptoms</Label>
          <Textarea id="description" {...form.register('description')} />
          {form.formState.errors.description && (
            <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="photo">Upload a photo (optional)</Label>
          <Input id="photo" type="file" accept="image/*" {...form.register('photo')} />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Diagnose
          </Button>
        </DialogFooter>
      </form>
      {result && (
        <div className="mt-4 space-y-4 rounded-lg border bg-secondary/50 p-4">
          <h3 className="font-bold">Diagnosis Result</h3>
          <p>
            <strong>Disease:</strong> {result.disease}
          </p>
          <p>
            <strong>Confidence:</strong> {(result.confidence * 100).toFixed(0)}%
          </p>
          <p>
            <strong>Recommendations:</strong> {result.recommendations}
          </p>
        </div>
      )}
    </>
  );
}

const MarketSchema = z.object({
  crop: z.string().min(1, 'Crop name is required.'),
  market: z.string().min(1, 'Market name is required.'),
});
type MarketFormValues = z.infer<typeof MarketSchema>;

function MarketAnalysisDialogContent({ setOpen }: { setOpen: (open: boolean) => void }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<MarketAnalysisOutput | null>(null);
    const form = useForm<MarketFormValues>({
        resolver: zodResolver(MarketSchema),
    });

    const onSubmit = async (data: MarketFormValues) => {
        setLoading(true);
        setResult(null);
        try {
            const response = await getMarketAnalysis(data);
            setResult(response);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'AI Error',
                description: 'Failed to get market analysis from AI model.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="crop">Crop</Label>
                    <Input id="crop" placeholder="e.g., Tomato" {...form.register('crop')} />
                    {form.formState.errors.crop && <p className="text-sm text-destructive">{form.formState.errors.crop.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="market">Market (Mandi)</Label>
                    <Input id="market" placeholder="e.g., Azadpur, Delhi" {...form.register('market')} />
                    {form.formState.errors.market && <p className="text-sm text-destructive">{form.formState.errors.market.message}</p>}
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Get Analysis
                    </Button>
                </DialogFooter>
            </form>
            {result && (
                <div className="mt-4 space-y-4 rounded-lg border bg-secondary/50 p-4">
                    <h3 className="font-bold">Market Analysis for {result.crop} in {result.market}</h3>
                    <p><strong>Price:</strong> {result.price}</p>
                    <p><strong>Trend:</strong> {result.trend}</p>
                    <p><strong>Analysis:</strong> {result.analysis}</p>
                </div>
            )

            }
        </>
    );
}

const SchemeSchema = z.object({
    cropType: z.string().min(1, 'Crop type is required.'),
    location: z.string().min(1, 'Location is required.'),
    farmSize: z.string().min(1, 'Farm size is required.'),
});
type SchemeFormValues = z.infer<typeof SchemeSchema>;

function SchemeInfoDialogContent({ setOpen }: { setOpen: (open: boolean) => void }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<GovernmentSchemeInfoOutput | null>(null);
    const form = useForm<SchemeFormValues>({
        resolver: zodResolver(SchemeSchema),
    });

    const onSubmit = async (data: SchemeFormValues) => {
        setLoading(true);
        setResult(null);
        try {
            const response = await getGovernmentSchemeInfo(data);
            setResult(response);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'AI Error',
                description: 'Failed to get scheme information from AI model.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="cropType">Crop Type</Label>
                    <Input id="cropType" placeholder="e.g., Wheat" {...form.register('cropType')} />
                     {form.formState.errors.cropType && <p className="text-sm text-destructive">{form.formState.errors.cropType.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" placeholder="e.g., Punjab" {...form.register('location')} />
                     {form.formState.errors.location && <p className="text-sm text-destructive">{form.formState.errors.location.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="farmSize">Farm Size (in acres)</Label>
                    <Input id="farmSize" placeholder="e.g., 5" {...form.register('farmSize')} />
                     {form.formState.errors.farmSize && <p className="text-sm text-destructive">{form.formState.errors.farmSize.message}</p>}
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Find Schemes
                    </Button>
                </DialogFooter>
            </form>
            {result && (
                <div className="mt-4 space-y-4 rounded-lg border bg-secondary/50 p-4 max-h-[300px] overflow-y-auto">
                    <h3 className="font-bold">Relevant Schemes</h3>
                    {result.schemes.length > 0 ? (
                        result.schemes.map((scheme, index) => (
                            <div key={index} className="pb-4 border-b last:border-b-0">
                                <h4 className="font-semibold">{scheme.name}</h4>
                                <p><strong>Description:</strong> {scheme.description}</p>
                                <p><strong>Eligibility:</strong> {scheme.eligibility}</p>
                                <p><strong>Benefits:</strong> {scheme.benefits}</p>
                                <p><strong>How to Apply:</strong> {scheme.howToApply}</p>
                            </div>
                        ))
                    ) : (
                        <p>No relevant schemes found for your profile.</p>
                    )}
                </div>
            )}
        </>
    );
}

const WeatherSchema = z.object({
    location: z.string().min(3, 'Please enter a valid location.'),
    cropType: z.string().min(1, 'Crop type is required.'),
});
type WeatherFormValues = z.infer<typeof WeatherSchema>;

function WeatherTipsDialogContent({ setOpen }: { setOpen: (open: boolean) => void }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<WeatherAndIrrigationTipsOutput | null>(null);
    const form = useForm<WeatherFormValues>({
        resolver: zodResolver(WeatherSchema),
    });

    const onSubmit = async (data: WeatherFormValues) => {
        setLoading(true);
        setResult(null);
        try {
            const response = await getWeatherAndIrrigationTips(data);
            setResult(response);
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to get weather tips.',
            });
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" placeholder="e.g., Pune, Maharashtra" {...form.register('location')} />
                    {form.formState.errors.location && <p className="text-sm text-destructive">{form.formState.errors.location.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="cropType">Crop Type</Label>
                    <Input id="cropType" placeholder="e.g., Sugarcane" {...form.register('cropType')} />
                    {form.formState.errors.cropType && <p className="text-sm text-destructive">{form.formState.errors.cropType.message}</p>}
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Get Tips
                    </Button>
                </DialogFooter>
            </form>
            {result && (

                <div className="mt-4 space-y-4 rounded-lg border bg-secondary/50 p-4 max-h-[300px] overflow-y-auto">
                    <h3 className="font-bold">Weather & Irrigation Tips</h3>
                    <p><strong>Forecast:</strong> {result.weatherForecast}</p>
                    <p><strong>Irrigation Tips:</strong> {result.irrigationTips}</p>
                    <div className="mt-2">
                        <h4 className="font-semibold">Crops to Avoid:</h4>
                        <p>{result.unsuitableCrops}</p>
                    </div>
                    <div className="mt-2">
                        <h4 className="font-semibold">Remedial Actions:</h4>
                        <p>{result.remedialActions}</p>
                    </div>
                </div>
            )}
        </>
    );
}

const Dialogs: Record<string, React.FC<{ setOpen: (open: boolean) => void }>> = {
  market: MarketAnalysisDialogContent,
  scheme: SchemeInfoDialogContent,
  weather: WeatherTipsDialogContent,
};

export { MarketAnalysisDialogContent, SchemeInfoDialogContent, WeatherTipsDialogContent };

export default function QuickActions({ onFocusChange, setInteractionMode }: { onFocusChange: (isFocused: boolean) => void, setInteractionMode: (mode: string) => void }) {
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const CurrentDialog = openDialog ? Dialogs[openDialog] : null;

  const handleFeatureClick = (feature: (typeof features)[0]) => {
    if (feature.action === 'focus-chat') {
      setInteractionMode('diagnose');
      onFocusChange(true);
    } else if (feature.dialog) {
      setInteractionMode('chat'); // Assuming other dialogs are general chat or don't involve image upload in the main chat area
      setOpenDialog(feature.dialog);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {features.map((feature) => (
          feature.action === 'focus-chat' ? (
            <Card
              key={feature.title}
              className="hover:bg-primary/10 cursor-pointer transition-colors duration-300 transform hover:scale-[1.02]"
              onClick={() => handleFeatureClick(feature)}
            >
              <CardHeader className="flex flex-row items-center gap-4">
                {feature.icon}
                <div className="grid gap-1">
                  <CardTitle className="font-headline">{feature.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </CardHeader>
            </Card>
          ) : (
            <Dialog
              key={feature.title}
              open={openDialog === feature.dialog}
              onOpenChange={(isOpen) => {
                setOpenDialog(isOpen ? feature.dialog || null : null);
                if (!isOpen) {
                  setInteractionMode('chat'); // Revert to chat mode when dialog is closed
                }
              }}
            >
              <DialogTrigger asChild>
                <Card className="hover:bg-primary/10 cursor-pointer transition-colors duration-300 transform hover:scale-[1.02]">
                  <CardHeader className="flex flex-row items-center gap-4">
                    {feature.icon}
                    <div className="grid gap-1">
                      <CardTitle className="font-headline">{feature.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </CardHeader>
                </Card>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{feature.title}</DialogTitle>
                  <DialogDescription>{feature.description}</DialogDescription>
                </DialogHeader>
                {CurrentDialog && <CurrentDialog setOpen={(isOpen) => setOpenDialog(isOpen ? feature.dialog || null : null)} />}
              </DialogContent>
            </Dialog>
          )
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {quickChats.map((chat) => (
          <Button key={chat} variant="outline" className="rounded-full">
            {chat}
          </Button>
        ))}
      </div>
    </div>
  );
}
