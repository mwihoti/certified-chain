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
    "libsodium-wrappers-sumo",
  ],
  env: {
    NEXT_PUBLIC_CARDANO_NETWORK: process.env.NEXT_PUBLIC_CARDANO_NETWORK,
    NEXT_PUBLIC_BLOCKFROST_PROJECT_ID: process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID,
    NEXT_PUBLIC_BLOCKFROST_API_KEY: process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
  webpack: (config, { isServer, webpack }) => {
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

    // Provide Buffer for browser compatibility
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      })
    );

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
      "libsodium-wrappers": path.resolve(
        process.cwd(),
        "node_modules/libsodium-wrappers-sumo"
      ),
      "libsodium-wrappers-sumo": path.resolve(
        process.cwd(),
        "node_modules/libsodium-wrappers-sumo"
      ),
    };

    config.ignoreWarnings = [
      { module: /node_modules\/@meshsdk/ },
      { module: /node_modules\/@cardano-sdk/ },
    ];

    // Midnight SDK is not yet published — mark as external so webpack skips bundling.
    // The dynamic import in midnight.ts catches the missing module at runtime.
    config.externals = [
      ...(Array.isArray(config.externals) ? config.externals : config.externals ? [config.externals] : []),
      ({ request }: { request?: string }, callback: (err?: Error | null, result?: string) => void) => {
        if (request && request.startsWith('@midnight-ntwrk/')) {
          return callback(null, `commonjs ${request}`);
        }
        callback();
      },
    ];

    return config;
  },
};

export default nextConfig;
