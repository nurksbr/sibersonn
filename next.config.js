/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Force HTTPS redirects to be disabled in development
    forceSwcTransforms: false,
  },
  // Disable HTTPS redirect in development
  async redirects() {
    return [];
  },
  images: {
    domains: ['placehold.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'http',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Configure environment variables
  env: {
    CUSTOM_KEY: 'development',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'sibergercek-gizli-anahtar-super-guvenli-2025',
    DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db'
  },
  // Next.js 15+ sürümünde appDir artık varsayılan olarak etkinleştirilmiştir
};

module.exports = nextConfig;