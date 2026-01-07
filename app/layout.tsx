import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Lite-Cert",
  description: "lite-cert",
  authors: [{ name: "Lovable" }],
  openGraph: {
    title: "Lite-Cert",
    description: "Lovable Generated Project",
    type: "website",
   
  },
  twitter: {
    card: "summary_large_image",
    site: "@Lovable",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
