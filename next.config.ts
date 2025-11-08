import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'iaxlywoszs4tdq1y.public.blob.vercel-storage.com',
        pathname: '/profiles/**',
      },
    ],
  },
};

export default nextConfig;
