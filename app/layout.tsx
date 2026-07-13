import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import "@meshsdk/react/styles.css";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "LiteCert - Blockchain Certificate Verification",
  description:
    "Issue, manage, and verify tamper-proof certificates on the Cardano blockchain. Secure credentials you can trust.",
  openGraph: {
    title: "LiteCert - Blockchain Certificate Verification",
    description:
      "Issue, manage, and verify tamper-proof certificates on the Cardano blockchain.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
      
          {children}
        </Providers>
      </body>
    </html>
  );
}
