import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'hi', 'kn', 'ta'],
    localeDetection: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  env: {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || 'AIzaSyCZzIYIgA1K4aaUxM3X67hgDtaUfBWrpZY',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'AIzaSyCZzIYIgA1K4aaUxM3X67hgDtaUfBWrpZY',
  },
};

export default nextConfig;
