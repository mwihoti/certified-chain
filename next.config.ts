import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["lucide-react"],
  env: {
    NEXT_PUBLIC_CARDANO_NETWORK: process.env.NEXT_PUBLIC_CARDANO_NETWORK,
    NEXT_PUBLIC_BLOCKFROST_PROJECT_ID: process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
  // Add empty turbopack config to silence warning and ensure compatibility
  turbopack: {},
};

export default nextConfig;
