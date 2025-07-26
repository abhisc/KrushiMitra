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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import { 
  Palette, 
  Shield, 
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
  Bell,
  Save
} from 'lucide-react';

type RightSidebarProps = {
  children: React.ReactNode;
};

export default function RightSidebar({ children }: RightSidebarProps) {
  const { setTheme, theme } = useTheme();

  const getThemeIcon = (currentTheme: string) => {
    switch (currentTheme) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <SettingsIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl font-semibold">Settings</SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                Customize your Agrimitra experience
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        
        <div className="space-y-8">
          {/* Appearance Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Appearance</h3>
                <p className="text-xs text-muted-foreground">Customize the look and feel</p>
              </div>
            </div>
            
            <div className="ml-11 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme" className="text-sm font-medium">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      {getThemeIcon(theme || 'system')}
                      <SelectValue placeholder="Select theme" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Data & Privacy Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Data & Privacy</h3>
                <p className="text-xs text-muted-foreground">Manage your data and privacy settings</p>
              </div>
            </div>
            
            <div className="ml-11 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-950/20 rounded">
                    <Save className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <Label htmlFor="save-history" className="text-sm font-medium cursor-pointer">
                      Save Chat History
                    </Label>
                    <p className="text-xs text-muted-foreground">Store conversations for future reference</p>
                  </div>
                </div>
                <Switch id="save-history" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-orange-50 dark:bg-orange-950/20 rounded">
                    <Bell className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <Label htmlFor="notifications" className="text-sm font-medium cursor-pointer">
                      Enable Notifications
                    </Label>
                    <p className="text-xs text-muted-foreground">Receive alerts and updates</p>
                  </div>
                </div>
                <Switch id="notifications" />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
