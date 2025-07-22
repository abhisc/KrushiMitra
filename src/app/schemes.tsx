import Header from '@/components/agrimitra/header';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SchemeInfoDialogContent } from '@/components/agrimitra/quick-actions';

export default function SchemesPage() {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 transition-all duration-300">
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-8">
          <h1 className="text-2xl font-bold font-headline text-primary mb-4">Government Scheme Info</h1>
          <Card>
            <CardHeader>
              <CardTitle>Find relevant schemes & subsidies</CardTitle>
            </CardHeader>
            <CardContent>
              <SchemeInfoDialogContent setOpen={setOpen} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 