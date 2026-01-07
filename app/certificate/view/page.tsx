"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import CertificateTemplate from '@/components/certificate/CertificateTemplate';
import { mockCertificates } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

function CertificateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = searchParams.get('id');
    const uniqueId = searchParams.get('uniqueId');
    
    if (id) {
      const cert = mockCertificates.find(c => c.id === id);
      setCertificate(cert);
    } else if (uniqueId) {
      // In a real app, you'd fetch by uniqueId
      const cert = mockCertificates[0]; // Mock for now
      setCertificate(cert);
    }
    
    setLoading(false);
  }, [searchParams]);

  const handleDownload = () => {
    // In a real implementation, this would generate a PDF
    toast({
      title: 'PDF Generation',
      description: 'PDF download feature will be implemented with a PDF generation library in production.',
    });
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
        <Button onClick={() => router.push('/')}>
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6 flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => window.open(`https://cardanoscan.io/transaction/${certificate.blockchainTxHash}`, '_blank')}
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
        recipientPosition={certificate.recipientPosition}
        credentialType={certificate.credentialType}
        issueDate={certificate.issueDate}
        institutionName={certificate.institutionName}
        transactionHash={certificate.blockchainTxHash}
        uniqueIdentifier={certificate.certificateNumber}
        certificateNumber={certificate.certificateNumber}
      />
    </div>
  );
}

export default function ViewCertificate() {
  return (
    <Layout>
      <Suspense fallback={
        <div className="container py-12 text-center">
          <p>Loading certificate...</p>
        </div>
      }>
        <CertificateContent />
      </Suspense>
    </Layout>
  );
}
