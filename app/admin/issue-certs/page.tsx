"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const IssueCertsContent = dynamic(
  () => import("./IssueCertsContent"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading Admin Portal...</span>
      </div>
    ),
  }
);

export default function AdminIssueCerts() {
  return <IssueCertsContent />;
}