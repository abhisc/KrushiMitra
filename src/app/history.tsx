import Header from '@/components/agrimitra/header';

export default function HistoryPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 transition-all duration-300">
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-8">
          <h1 className="text-2xl font-bold font-headline text-primary mb-4">History</h1>
          <div className="text-muted-foreground">Your past chats and actions will appear here soon.</div>
        </div>
      </main>
    </div>
  );
} 