// Client-only wallet utilities to avoid SSR issues with MeshJS

export interface WalletConnection {
  connect: () => Promise<any | null>;
  getAddress: (wallet: any) => Promise<string | null>;
  getBalance: (wallet: any) => Promise<string | null>;
}

// This function is safe to call from client components only
export function useCardanoWallet(): WalletConnection {
  if (typeof window === 'undefined') {
    // Return no-op functions for SSR
    return {
      connect: async () => null,
      getAddress: async () => null,
      getBalance: async () => null,
    };
  }

  return {
    connect: async () => {
      try {
        // Dynamic import only in browser
        const { BrowserWallet } = await import('@meshsdk/core');
        
        // Check if Eternl wallet is installed
        const wallets = BrowserWallet.getInstalledWallets();
        const hasEternl = wallets.some(w => w.name.toLowerCase().includes('eternl'));
        
        if (!hasEternl) {
          console.error('Eternl wallet not found');
          return null;
        }

        // Connect to wallet
        const wallet = await BrowserWallet.enable('eternl');
        return wallet;
      } catch (error) {
        console.error('Error connecting to wallet:', error);
        return null;
      }
    },

    getAddress: async (wallet: any) => {
      try {
        if (!wallet) return null;
        const addresses = await wallet.getUsedAddresses();
        return addresses?.[0] || null;
      } catch (error) {
        console.error('Error getting address:', error);
        return null;
      }
    },

    getBalance: async (wallet: any) => {
      try {
        if (!wallet) return null;
        const balance = await wallet.getBalance();
        return balance;
      } catch (error) {
        console.error('Error getting balance:', error);
        return null;
      }
    },
  };
}
