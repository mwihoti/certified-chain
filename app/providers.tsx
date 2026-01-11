"use client";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import dynamic from "next/dynamic";




export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const MeshProvider = dynamic(
    () => import("@meshsdk/react").then((mod) => mod.MeshProvider),
    { ssr: false }
  );


  return (
    <QueryClientProvider client={queryClient}>


      <MeshProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {children}
        </TooltipProvider>
      </MeshProvider>


    </QueryClientProvider>
  );
}
