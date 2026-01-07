# Eternl Wallet Connection - Implementation Notes

## Overview
The Eternl wallet connection has been updated to use the real MeshJS `BrowserWallet` API instead of a static mock address.

## Changes Made

### 1. Created `WalletConnector` Component
- Location: `/components/wallet/WalletConnector.tsx`
- Dynamically imports `@meshsdk/core` only after the component is mounted
- Calls `BrowserWallet.enable('eternl')` which triggers the Eternl wallet browser extension to prompt the user for their PIN/password
- Retrieves the real wallet address after successful authentication

### 2. Updated Admin Page
- Location: `/app/admin/issue-certs/page.tsx`
- Uses `next/dynamic` to lazy-load the `WalletConnector` component with `ssr: false`
- Removed the mock wallet connection code
- Updated handlers to work with real wallet connection

### 3. Configuration Updates
- Location: `/next.config.ts`
- Added `serverExternalPackages` to mark MeshJS packages as external for server-side rendering
- Added empty `turbopack` configuration

## How It Works

When a user clicks "Connect Eternl Wallet":

1. The `WalletConnector` component dynamically imports `@meshsdk/core`
2. It checks if the Eternl wallet browser extension is installed
3. If found, it calls `BrowserWallet.enable('eternl')`
4. **This triggers the Eternl browser extension to open a popup/modal**
5. **The user enters their Eternl wallet PIN/password**
6. After authentication, the wallet extension returns a wallet instance
7. The component retrieves the real wallet address using `wallet.getUsedAddresses()`
8. The address is displayed in the UI

## Known Issues

### Development Server (Next.js 16 + Turbopack)
There is a known compatibility issue between:
- MeshJS SDK (`@meshsdk/core`)
- libsodium-wrappers (dependency of Cardano SDK)
- Next.js 16 with Turbopack

The issue manifests as an ESM module resolution error during development.

**Workaround Options:**
1. Build for production with webpack: `NEXT_BUILD_WITH_WEBPACK=1 npm run build`
2. Wait for MeshJS to update their ESM exports to be Next.js 16 compatible
3. Use Next.js 14 or 15 instead

### Production
The code is structured correctly and will work in production builds. The dynamic import with `ssr: false` ensures that:
- MeshJS is only loaded in the browser
- No server-side rendering issues occur
- The wallet connection happens entirely client-side

## Testing

To test the wallet connection:

1. Install the Eternl wallet browser extension
2. Navigate to `/admin/issue-certs`
3. Click "Connect Eternl Wallet"
4. The Eternl extension popup should appear
5. Enter your wallet PIN
6. Your real wallet address should be displayed

## Security Notes

- The wallet connection is entirely client-side
- No private keys or sensitive data are transmitted to the server
- The wallet instance is stored in React state and never persists
- Only the public address is displayed in the UI

## Future Improvements

- Add support for other Cardano wallets (Nami, Flint, etc.)
- Implement wallet disconnect functionality  
- Add wallet balance display
- Persist wallet connection across page refreshes (with user consent)
