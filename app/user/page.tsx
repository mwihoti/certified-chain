"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Search, Download, Share2, CheckCircle, Key, ExternalLink, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/layout/Layout';
import { getCertificateByCertNumber, getCertificateByUniqueId, CertificateRecord } from '@/lib/services/api';
import { isMidnightConfigured } from '@/lib/services/midnight';
import { useToast } from '@/hooks/use-toast';
import CertificateTemplate from '@/components/certificate/CertificateTemplate';

export default function UserPortal() {
  const { toast } = useToast();
  const [certNumber, setCertNumber] = useState('');
  const [position, setPosition] = useState('');
  const [uniqueId, setUniqueId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [certificate, setCertificate] = useState<CertificateRecord | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setNotFound(false);
    setCertificate(null);

    const response = await getCertificateByCertNumber(certNumber);

    if (response.success && response.data) {
      const cert = response.data;
      // Validate position matches as an extra lookup guard
      if (position && cert.recipientPosition.toLowerCase() !== position.toLowerCase()) {
        setNotFound(true);
      } else {
        setCertificate(cert);
      }
    } else {
      setNotFound(true);
    }

    setIsSearching(false);
  };

  const handleSearchByUniqueId = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setNotFound(false);
    setCertificate(null);

    const response = await getCertificateByUniqueId(uniqueId);

    if (response.success && response.data) {
      setCertificate(response.data);
    } else {
      setNotFound(true);
    }

    setIsSearching(false);
  };

  const handleShare = () => {
    if (!certificate) return;
    const url = `${window.location.origin}/certificate/view?uniqueId=${encodeURIComponent(certificate.uniqueIdentifier)}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link Copied', description: 'Share the public certificate view link.' });
  };

  return (
    <Layout>
      <div className="container py-12 max-w-5xl">
        <div className="text-center mb-8 max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Retrieve Your Certificate</h1>
          <p className="text-muted-foreground">Enter your certificate details or unique identifier to access your credential.</p>
        </div>

        <Tabs defaultValue="certNumber" className="mb-6 max-w-2xl mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="certNumber">By Certificate Number</TabsTrigger>
            <TabsTrigger value="uniqueId">By Unique ID</TabsTrigger>
          </TabsList>

          <TabsContent value="certNumber">
            <Card>
              <CardHeader>
                <CardTitle>Certificate Lookup</CardTitle>
                <CardDescription>Enter your certificate number and position to retrieve your credential.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="certNumber">Certificate Number</Label>
                    <Input
                      id="certNumber"
                      placeholder="e.g., FKF-2025-00001"
                      value={certNumber}
                      onChange={(e) => setCertNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Your Position/Role</Label>
                    <Input
                      id="position"
                      placeholder="e.g., Graduate, Coach, Athlete"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSearching}>
                    {isSearching ? 'Searching...' : <><Search className="mr-2 h-4 w-4" />Find Certificate</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="uniqueId">
            <Card>
              <CardHeader>
                <CardTitle>Lookup by Unique ID</CardTitle>
                <CardDescription>Enter your certificate's unique identifier provided at issuance.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearchByUniqueId} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="uniqueId">Unique Identifier</Label>
                    <Input
                      id="uniqueId"
                      placeholder="e.g., FKF_KOM_01"
                      value={uniqueId}
                      onChange={(e) => setUniqueId(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: ORG_USR_NN (provided when your certificate was issued)
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSearching}>
                    {isSearching ? 'Searching...' : <><Key className="mr-2 h-4 w-4" />Find by Unique ID</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {notFound && (
          <Card className="border-destructive">
            <CardContent className="pt-6 text-center">
              <p className="text-destructive">No certificate found. Please check your details and try again.</p>
            </CardContent>
          </Card>
        )}

        {certificate && (
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-success" />
                <Badge className="bg-success text-success-foreground">Verified on Blockchain</Badge>
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

              <div className="border rounded-lg p-4 bg-primary/5 my-4">
                <h4 className="font-semibold text-sm mb-3">Blockchain Verification</h4>
                <div className="mb-2">
                  <span className="text-xs text-muted-foreground">Unique Identifier:</span>
                  <p className="font-mono text-sm font-medium break-all">{certificate.uniqueIdentifier}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Transaction Hash:</span>
                  <p className="font-mono text-xs break-all">{certificate.blockchainTxHash}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="flex-1">
                  <Link href={`/certificate/view?uniqueId=${encodeURIComponent(certificate.uniqueIdentifier)}`}>
                    <ExternalLink className="mr-2 h-4 w-4" />Open Certificate
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => toast({ title: 'PDF Generation', description: 'PDF download will be available soon.' })}
                >
                  <Download className="mr-2 h-4 w-4" />Download PDF
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />Share Link
                </Button>
                {isMidnightConfigured() && (
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/proof?uniqueId=${encodeURIComponent(certificate.uniqueIdentifier)}`}>
                      <Lock className="mr-2 h-4 w-4" />Privacy Proof
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
