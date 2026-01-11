import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "lucide-react",
    "@meshsdk/react",
    "@meshsdk/core",
    "@meshsdk/core-cst",
    "@meshsdk/common",
    "@meshsdk/web3-sdk",
    "@meshsdk/wallet",
    "@meshsdk/transaction",
    "@cardano-sdk/core",
    "@cardano-sdk/crypto",
    "@cardano-sdk/input-selection",
  ],
  env: {
    NEXT_PUBLIC_CARDANO_NETWORK: process.env.NEXT_PUBLIC_CARDANO_NETWORK,
    NEXT_PUBLIC_BLOCKFROST_PROJECT_ID: process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID,
    NEXT_PUBLIC_BLOCKFROST_API_KEY: process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
  webpack: (config, { isServer }) => {
    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
      topLevelAwait: true,
    };

    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    // Polyfills for browser compatibility
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      net: false,
      tls: false,
      stream: false,
    };

    config.resolve.alias = {
      ...config.resolve.alias,
      "@utxorpc/sdk": path.resolve(
        process.cwd(),
        "node_modules/@utxorpc/sdk/lib",
        isServer ? "node/index.mjs" : "browser/index.mjs"
      ),
      // Redirect libsodium-wrappers-sumo to standard libsodium-wrappers
      "libsodium-wrappers-sumo": "libsodium-wrappers",
    };

    config.ignoreWarnings = [
      { module: /node_modules\/@meshsdk/ },
      { module: /node_modules\/@cardano-sdk/ },
    ];

    return config;
  },
};

export default nextConfig;
