import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [
    'level',
    'leveldown',
    'classic-level',
    'abstract-level',
    'encoding-down',
    'levelup',
    'deferred-leveldown',
    'catering',
    'isomorphic-ws',
    'ws',
  ],
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
    "@midnight-ntwrk/compact-js",
    "@midnight-ntwrk/compact-runtime",
    "@midnight-ntwrk/dapp-connector-api",
    "@midnight-ntwrk/ledger-v8",
    "@midnight-ntwrk/midnight-js-contracts",
    "@midnight-ntwrk/midnight-js-fetch-zk-config-provider",
    "@midnight-ntwrk/midnight-js-http-client-proof-provider",
    "@midnight-ntwrk/midnight-js-indexer-public-data-provider",
    "@midnight-ntwrk/midnight-js-level-private-state-provider",
    "@midnight-ntwrk/midnight-js-network-id",
    "@midnight-ntwrk/midnight-js-node-zk-config-provider",
    "@midnight-ntwrk/midnight-js-protocol",
    "@midnight-ntwrk/midnight-js-types",
    "@midnight-ntwrk/midnight-js-utils",
    "@midnight-ntwrk/onchain-runtime-v3",
    "@midnight-ntwrk/platform-js",
    "@midnight-ntwrk/wallet-sdk",
    "@midnight-ntwrk/wallet-sdk-abstractions",
    "@midnight-ntwrk/wallet-sdk-address-format",
    "@midnight-ntwrk/wallet-sdk-capabilities",
    "@midnight-ntwrk/wallet-sdk-dust-wallet",
    "@midnight-ntwrk/wallet-sdk-facade",
    "@midnight-ntwrk/wallet-sdk-hd",
    "@midnight-ntwrk/wallet-sdk-indexer-client",
    "@midnight-ntwrk/wallet-sdk-node-client",
    "@midnight-ntwrk/wallet-sdk-prover-client",
    "@midnight-ntwrk/wallet-sdk-runtime",
    "@midnight-ntwrk/wallet-sdk-shielded",
    "@midnight-ntwrk/wallet-sdk-unshielded-wallet",
    "@midnight-ntwrk/wallet-sdk-utilities",
    "@midnight-ntwrk/zkir-v2",
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
      ws: isServer ? false : require.resolve('ws'),
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
      // Fix isomorphic-ws WebSocket import for Midnight SDK
      // Use custom shim that exports WebSocket as named export
      "isomorphic-ws": path.resolve(process.cwd(), 'lib/midnight/isomorphic-ws-shim.mjs'),
    };

    config.ignoreWarnings = [
      { module: /node_modules\/@meshsdk/ },
      { module: /node_modules\/@cardano-sdk/ },
      { module: /node_modules\/@midnight-ntwrk/ },
    ];

    return config;
  },
};

export default nextConfig;
