"use client";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import MeshProvider with no SSR
const MeshProviderWrapper = dynamic(
  () => import("@meshsdk/react").then((mod) => mod.MeshProvider),
  { ssr: false }
);

// Dynamically import CardanoWallet with no SSR
const CardanoWalletComponent = dynamic(
  () => import("@meshsdk/react").then((mod) => mod.CardanoWallet),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {isMounted ? (
        <MeshProviderWrapper>
          <div className="relative">
            <div className="fixed top-4 right-4 z-50">
              <CardanoWalletComponent />
            </div>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              {children}
            </TooltipProvider>
          </div>
        </MeshProviderWrapper>
      ) : (
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {children}
        </TooltipProvider>
      )}
    </QueryClientProvider>
  );
}
