"use client";

import { useEffect, useState, type ComponentType } from 'react';
import { Button } from '@/components/ui/button';

export interface WalletConnectionState {
  connected: boolean;
  wallet: any | null;
}

interface CardanoWalletPanelProps {
  onChange?: (state: WalletConnectionState) => void;
}

export default function CardanoWalletPanel({ onChange }: CardanoWalletPanelProps) {
  const [LoadedWallet, setLoadedWallet] = useState<ComponentType<CardanoWalletPanelProps> | null>(null);

  useEffect(() => {
    let mounted = true;

    import('@meshsdk/react').then((mesh) => {
      if (!mounted) return;

      const { CardanoWallet, MeshProvider, useWallet } = mesh;

      function WalletContent({ onChange: handleChange }: CardanoWalletPanelProps) {
        const { connected, wallet } = useWallet();

        useEffect(() => {
          handleChange?.({ connected, wallet: wallet ?? null });
        }, [connected, wallet, handleChange]);

        return <CardanoWallet />;
      }

      function LoadedCardanoWalletPanel(props: CardanoWalletPanelProps) {
        return (
          <MeshProvider>
            <WalletContent {...props} />
          </MeshProvider>
        );
      }

      setLoadedWallet(() => LoadedCardanoWalletPanel);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!LoadedWallet) {
      onChange?.({ connected: false, wallet: null });
    }
  }, [LoadedWallet, onChange]);

  if (!LoadedWallet) {
    return (
      <Button type="button" variant="outline" disabled>
        Loading wallet
      </Button>
    );
  }

  return <LoadedWallet onChange={onChange} />;
}
