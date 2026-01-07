# MeshSDK Integration Guide

## Overview

This document provides guidance on integrating @meshsdk/core with this Next.js application.

## Current Status

The repository has `@meshsdk/core` installed as a dependency, which provides all the necessary tools for Cardano blockchain integration including:
- `BrowserWallet` - For connecting to Cardano wallets
- `BlockfrostProvider` - For blockchain data access
- `ForgeScript` - For creating minting policies
- `Transaction` - For building and submitting transactions

## Integration Approach

Due to SSR (Server-Side Rendering) compatibility issues with @meshsdk/core's dependencies (particularly libsodium-wrappers), the recommended approach is to use **dynamic imports** when working with MeshSDK functions.

### Example: Wallet Connection

```typescript
"use client";

import { useState } from "react";

export function WalletButton() {
  const [wallet, setWallet] = useState<any>(null);

  async function connectWallet() {
    // Dynamic import to avoid SSR issues
    const { BrowserWallet } = await import("@meshsdk/core");
    
    const wallets = await BrowserWallet.getInstalledWallets();
    const walletInstance = await BrowserWallet.enable(wallets[0].name);
    setWallet(walletInstance);
  }

  return (
    <button onClick={connectWallet}>
      {wallet ? "Connected" : "Connect Wallet"}
    </button>
  );
}
```

### Example: NFT Minting

```typescript
"use client";

async function mintNFT(wallet: any, metadata: any) {
  // Dynamic imports
  const { BlockfrostProvider, ForgeScript, Transaction } = await import("@meshsdk/core");

  const blockfrostApiKey = process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY;
  const provider = new BlockfrostProvider(blockfrostApiKey!);

  const addresses = await wallet.getUsedAddresses();
  const paymentAddress = addresses[0];

  const forgingScript = ForgeScript.withOneSignature(paymentAddress);

  const asset = {
    assetName: "MyNFT",
    assetQuantity: "1",
    metadata,
    label: "721",
    recipient: paymentAddress,
  };

  const tx = new Transaction({ initiator: wallet })
    .setNetwork("preprod")
    .mintAsset(forgingScript, asset);

  const unsignedTx = await tx.build();
  const signedTx = await wallet.signTx(unsignedTx);
  const txHash = await wallet.submitTx(signedTx);

  return txHash;
}
```

## Alternative: Using @meshsdk/react

`@meshsdk/react` provides React hooks and components but has the same SSR issues. To use it:

1. Install the package:
```bash
npm install @meshsdk/react
```

2. Create a client-only component file:
```typescript
// components/mesh-wallet.tsx
"use client";

export { MeshProvider, CardanoWallet, useWallet } from "@meshsdk/react";
```

3. Use dynamic import in your layout/page:
```typescript
import dynamic from "next/dynamic";

const MeshProvider = dynamic(
  () => import("@/components/mesh-wallet").then(mod => mod.MeshProvider),
  { ssr: false }
);
```

## Known Issues

1. **SSR Compatibility**: @meshsdk/core uses libsodium-wrappers which has ESM export issues with Next.js SSR
2. **Build Errors**: Direct imports of @meshsdk modules can cause build failures
3. **Solution**: Always use dynamic `await import()` syntax when calling MeshSDK functions

## Environment Variables

Required environment variables for MeshSDK integration:

```env
# Blockfrost API Key (required)
NEXT_PUBLIC_BLOCKFROST_API_KEY=your_api_key_here

# Cardano Network
NEXT_PUBLIC_CARDANO_NETWORK=preprod

# Optional: Pinata for IPFS uploads
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_API_KEY=your_pinata_secret
```

## Resources

- [MeshSDK Documentation](https://meshjs.dev/)
- [Blockfrost API](https://blockfrost.io/)
- [Cardano Developer Portal](https://developers.cardano.org/)

## Current Implementation

The existing code in `lib/services/wallet-client.ts` demonstrates the correct pattern for using @meshsdk/core with dynamic imports to avoid SSR issues.
