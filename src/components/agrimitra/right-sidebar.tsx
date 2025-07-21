'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';

type RightSidebarProps = {
  children: React.ReactNode;
};

export default function RightSidebar({ children }: RightSidebarProps) {
  const { setTheme, theme } = useTheme();

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Customize your Agrimitra experience.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-muted-foreground">Appearance</h3>
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-muted-foreground">General</h3>
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="language">Language</Label>
              <Select defaultValue="en">
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                  <SelectItem value="kn">ಕನ್ನಡ (Kannada)</SelectItem>
                  <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="grid w-full items-center gap-2">
              <Label htmlFor="crop">Default Crop Preference</Label>
              <Input id="crop" placeholder="e.g., Wheat" />
            </div>
             <div className="grid w-full items-center gap-2">
              <Label htmlFor="mandi">Default Market (Mandi)</Label>
              <Input id="mandi" placeholder="e.g., Vashi, Navi Mumbai" />
            </div>
          </div>

          <Separator />
          
          <div className="space-y-4">
            <h3 className="font-semibold text-muted-foreground">Voice & Audio</h3>
             <div className="flex items-center justify-between">
              <Label htmlFor="mic-toggle">Microphone</Label>
              <Switch id="mic-toggle" defaultChecked />
            </div>
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="speech-rate">Speech Rate</Label>
              <Slider id="speech-rate" defaultValue={[50]} max={100} step={1} />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-muted-foreground">Data & Privacy</h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="save-history">Save Chat History</Label>
              <Switch id="save-history" defaultChecked />
            </div>
             <div className="flex items-center justify-between">
              <Label htmlFor="notifications">Enable Notifications</Label>
              <Switch id="notifications" />
            </div>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
}
