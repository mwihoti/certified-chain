"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, Loader2 } from 'lucide-react';

interface WalletConnectorProps {
  onConnect: (wallet: any, address: string) => void;
  onError: (error: string) => void;
  isConnecting: boolean;
  setIsConnecting: (value: boolean) => void;
}

export default function WalletConnector({
  onConnect,
  onError,
  isConnecting,
  setIsConnecting
}: WalletConnectorProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const handleConnect = async () => {
    if (!isMounted) return;
    
    setIsConnecting(true);
    try {
      // Dynamically import MeshJS only after component is mounted
      const { BrowserWallet } = await import('@meshsdk/core');
      
      // Check if Eternl wallet is installed
      const wallets = BrowserWallet.getInstalledWallets();
      const hasEternl = wallets.some(w => w.name.toLowerCase().includes('eternl'));
      
      if (!hasEternl) {
        onError('Eternl wallet not found. Please install Eternl wallet extension.');
        setIsConnecting(false);
        return;
      }
      
      // Connect to Eternl wallet - this will prompt the user for PIN/password
      const wallet = await BrowserWallet.enable('eternl');
      
      if (!wallet) {
        onError('Failed to connect to Eternl wallet. Please try again.');
        setIsConnecting(false);
        return;
      }
      
      // Get wallet address
      const addresses = await wallet.getUsedAddresses();
      const address = addresses?.[0];
      
      if (!address) {
        onError('Failed to get wallet address. Please try again.');
        setIsConnecting(false);
        return;
      }
      
      onConnect(wallet, address);
      setIsConnecting(false);
    } catch (error) {
      console.error('Wallet connection error:', error);
      onError('Failed to connect to wallet. Please try again.');
      setIsConnecting(false);
    }
  };
  
  if (!isMounted) {
    return null;
  }
  
  return (
    <Button 
      onClick={handleConnect}
      disabled={isConnecting}
    >
      {isConnecting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="mr-2 h-4 w-4" />
          Connect Eternl Wallet
        </>
      )}
    </Button>
  );
}
