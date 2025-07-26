import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { LanguageProvider } from '@/contexts/language-context';
import { PageTranslator } from '@/components/ui/page-translator';
import { PlaceholderTranslator } from '@/components/ui/placeholder-translator';
import { TranslationPreloader } from '@/components/ui/translation-preloader';
import { TranslationStatus } from '@/components/ui/translation-status';

import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Agrimitra - AI Assistant for Farmers',
  description: 'Smart farming solutions for modern agriculture. Get crop disease diagnosis, market analysis, weather tips, and government scheme information.',
  manifest: '/manifest.json',
  keywords: 'agriculture, farming, crop disease, market analysis, weather, government schemes, AI assistant',
  authors: [{ name: 'Agrimitra Team' }],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Agrimitra',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://agrimitra.app',
    title: 'Agrimitra - AI Assistant for Farmers',
    description: 'Smart farming solutions for modern agriculture',
    siteName: 'Agrimitra',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agrimitra - AI Assistant for Farmers',
    description: 'Smart farming solutions for modern agriculture',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#16a34a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Agrimitra" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Agrimitra" />
        <meta name="description" content="AI Assistant for Farmers" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#16a34a" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#16a34a" />

        {/* PWA Icons */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icon-192.png" color="#16a34a" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Preload critical resources */}
        <link rel="preload" href="/icon-192.png" as="image" />
        <link rel="preload" href="/icon-512.png" as="image" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          		<AuthProvider>
			<LanguageProvider>
				<TranslationPreloader />
				<PlaceholderTranslator>
					{children}
				</PlaceholderTranslator>
			</LanguageProvider>
		</AuthProvider>
          <Toaster />
        </ThemeProvider>
        
        {/* Service Worker Registration */}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
