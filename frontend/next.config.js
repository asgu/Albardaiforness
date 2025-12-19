/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Настройка для production
  output: 'standalone',
  
  // Настройка изображений
  images: {
    domains: ['new.albardaiforness.org', 'localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'new.albardaiforness.org',
      },
    ],
  },

  // Переменные окружения
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3300',
  },
};

module.exports = nextConfig;
