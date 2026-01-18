import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@pokemon-idle/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/PokeAPI/sprites/**',
      },
    ],
  },
};

export default nextConfig;
