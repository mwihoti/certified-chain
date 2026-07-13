"use client";

import { useCallback, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, ExternalLink, Loader2, WalletCards } from "lucide-react";
import Layout from "@/components/layout/Layout";
import CertificateTemplate from "@/components/certificate/CertificateTemplate";
import {
  getCertificateByUniqueId,
  getCertificateByCertNumber,
  type CertificateRecord,
} from "@/lib/services/api";
import { useToast } from "@/hooks/use-toast";
import CardanoWalletPanel, {
  type WalletConnectionState,
} from "@/components/wallet/CardanoWalletPanel";
import { getCardanoNetwork, mintExistingCertificateNftToWallet } from "@/lib/services/cardano";

function CertificateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [certificate, setCertificate] = useState<CertificateRecord | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [{ connected, wallet }, setWalletConnection] =
    useState<WalletConnectionState>({
      connected: false,
      wallet: null,
    });
  const [minting, setMinting] = useState(false);
  const [mintTxHash, setMintTxHash] = useState("");

  useEffect(() => {
    const id = searchParams.get("id");
    const uniqueId = searchParams.get("uniqueId");

    async function load() {
      if (uniqueId) {
        const response = await getCertificateByUniqueId(uniqueId);
        if (response.success && response.data) setCertificate(response.data);
      } else if (id) {
        // id is treated as a certificate number for backward compatibility
        const response = await getCertificateByCertNumber(id);
        if (response.success && response.data) setCertificate(response.data);
      }
      setLoading(false);
    }

    load();
  }, [searchParams]);

  const handleDownload = () => {
    toast({
      title: "PDF Generation",
      description: "PDF download will be available in a future update.",
    });
  };

  const handleWalletChange = useCallback((connection: WalletConnectionState) => {
    setWalletConnection(connection);
  }, []);

  const handleMintNft = async () => {
    if (!certificate) return;

    if (!connected || !wallet) {
      toast({
        title: "Wallet Required",
        description: "Connect your Cardano wallet before minting this certificate NFT.",
        variant: "destructive",
      });
      return;
    }

    setMinting(true);
    try {
      const result = await mintExistingCertificateNftToWallet(certificate, wallet);
      setMintTxHash(result.txHash);
      toast({
        title: "NFT Minted",
        description: `${certificate.uniqueIdentifier} was minted to the connected wallet.`,
      });
    } catch (error: any) {
      toast({
        title: "NFT Mint Failed",
        description: error?.message || "Could not mint the certificate NFT.",
        variant: "destructive",
      });
    } finally {
      setMinting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <p>Loading certificate...</p>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Certificate Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The certificate you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => router.push("/")}>Return to Home</Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex flex-wrap gap-3">
          <CardanoWalletPanel onChange={handleWalletChange} />
          <Button variant="outline" onClick={handleMintNft} disabled={minting}>
            {minting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <WalletCards className="mr-2 h-4 w-4" />
            )}
            {minting ? "Minting NFT" : "Mint NFT to Wallet"}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              window.open(
                (() => {
                  const net = getCardanoNetwork();
                  if (net === 'mainnet') return `https://cardanoscan.io/transaction/${certificate.blockchainTxHash}`;
                  if (net === 'preprod') return `https://preprod.cardanoscan.io/transaction/${certificate.blockchainTxHash}`;
                  return `https://preview.cardanoscan.io/transaction/${certificate.blockchainTxHash}`;
                })(),
                "_blank",
              )
            }
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Blockchain
          </Button>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      <CertificateTemplate
        recipientName={certificate.recipientName}
        recipientEmail={certificate.recipientEmail}
        recipientPosition={certificate.recipientPosition}
        credentialType={certificate.credentialType}
        issueDate={certificate.issueDate}
        expiryDate={certificate.expiryDate}
        institutionName={certificate.institutionName}
        transactionHash={certificate.blockchainTxHash}
        uniqueIdentifier={certificate.uniqueIdentifier}
        certificateNumber={certificate.certificateNumber}
        status={certificate.status}
      />

      {mintTxHash && (
        <div className="mx-auto mt-4 max-w-5xl rounded-lg border bg-primary/5 p-4 text-sm">
          <p className="font-medium">Certificate NFT mint submitted.</p>
          <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
            {mintTxHash}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ViewCertificate() {
  return (
    <Layout>
      <Suspense
        fallback={
          <div className="container py-16 text-center">
            <p>Loading certificate...</p>
          </div>
        }
      >
        <CertificateContent />
      </Suspense>
    </Layout>
  );
}
