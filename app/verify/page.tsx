"use client";

import { useState } from 'react';
import { ShieldCheck, ShieldX, ShieldAlert, Search, Upload, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/layout/Layout';
import { findCertificateByNumber, Certificate } from '@/lib/mockData';

export default function VerifyPortal() {
  const [certNumber, setCertNumber] = useState('');
  const [uniqueId, setUniqueId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{ status: 'valid' | 'invalid' | 'revoked'; certificate?: Certificate; uniqueIdentifier?: string; txHash?: string } | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setResult(null);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const found = findCertificateByNumber(certNumber);
    if (found) {
      setResult({ 
        status: found.status === 'revoked' ? 'revoked' : 'valid', 
        certificate: found,
        txHash: found.blockchainTxHash,
      });
    } else {
      setResult({ status: 'invalid' });
    }
    setIsVerifying(false);
  };

  const handleVerifyByUniqueId = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setResult(null);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // In production, this would query the database by unique identifier
    // For now, simulate with mock data
    const mockResult = {
      status: 'valid' as const,
      certificate: {
        id: 'cert-mock',
        certificateNumber: 'CSU-2024-00147',
        recipientName: 'John Doe',
        recipientPosition: 'Graduate',
        institutionId: 'inst-001',
        institutionName: 'Cardano State University',
        credentialType: 'Bachelor of Science',
        issueDate: '2024-01-15',
        status: 'valid' as const,
        blockchainTxHash: '8f3a2b1c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678',
        ipfsCid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
        metadataHash: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      },
      uniqueIdentifier: uniqueId,
      txHash: '8f3a2b1c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678',
    };

    setResult(mockResult);
    setIsVerifying(false);
  };

  const ResultDisplay = () => {
    if (!result) return null;

    const configs = {
      valid: { icon: ShieldCheck, color: 'text-success', bg: 'bg-success/10', title: 'Certificate Valid', desc: 'This certificate is authentic and verified on the Cardano blockchain.' },
      invalid: { icon: ShieldX, color: 'text-destructive', bg: 'bg-destructive/10', title: 'Certificate Not Found', desc: 'This certificate could not be verified. It may be invalid or not registered.' },
      revoked: { icon: ShieldAlert, color: 'text-warning', bg: 'bg-warning/10', title: 'Certificate Revoked', desc: 'This certificate was revoked by the issuing institution.' },
    };

    const config = configs[result.status];
    const Icon = config.icon;

    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 rounded-full ${config.bg} flex items-center justify-center mx-auto mb-4`}>
              <Icon className={`h-8 w-8 ${config.color}`} />
            </div>
            <h3 className="text-xl font-semibold">{config.title}</h3>
            <p className="text-muted-foreground text-sm">{config.desc}</p>
          </div>
          {result.certificate && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/30 text-sm space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Recipient:</span><span className="font-medium">{result.certificate.recipientName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Credential:</span><span className="font-medium">{result.certificate.credentialType}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Issuer:</span><span className="font-medium">{result.certificate.institutionName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Issue Date:</span><span className="font-medium">{new Date(result.certificate.issueDate).toLocaleDateString()}</span></div>
                {result.certificate.revokedReason && <div className="pt-2 border-t"><span className="text-destructive text-xs">{result.certificate.revokedReason}</span></div>}
              </div>
              
              {/* Blockchain Verification Data */}
              <div className="border rounded-lg p-4 bg-primary/5 text-sm space-y-3">
                <h4 className="font-semibold text-primary">Blockchain Verification</h4>
                {result.uniqueIdentifier && (
                  <div>
                    <span className="text-muted-foreground text-xs">Unique Identifier:</span>
                    <p className="font-mono text-sm font-medium break-all">{result.uniqueIdentifier}</p>
                  </div>
                )}
                {result.txHash && (
                  <div>
                    <span className="text-muted-foreground text-xs">Transaction Hash:</span>
                    <p className="font-mono text-xs break-all">{result.txHash}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <ShieldCheck className="h-3 w-3 text-success" />
                  <span>Verified on Cardano Blockchain</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="container py-12 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Verify Certificate</h1>
          <p className="text-muted-foreground">Instantly verify the authenticity of any LiteCert credential.</p>
        </div>

        <Tabs defaultValue="number" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="number">By Certificate Number</TabsTrigger>
            <TabsTrigger value="uniqueId">By Unique ID</TabsTrigger>
            <TabsTrigger value="upload">Upload PDF</TabsTrigger>
          </TabsList>
          <TabsContent value="number">
            <Card>
              <CardHeader>
                <CardTitle>Enter Certificate Number</CardTitle>
                <CardDescription>Demo: Try "CSU-2024-00147" (valid) or "NMB-2024-01567" (revoked)</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="certNumber">Certificate Number</Label>
                    <Input id="certNumber" placeholder="e.g., CSU-2024-00147" value={certNumber} onChange={(e) => setCertNumber(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isVerifying}>
                    {isVerifying ? 'Verifying...' : <><Search className="mr-2 h-4 w-4" />Verify Certificate</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="uniqueId">
            <Card>
              <CardHeader>
                <CardTitle>Enter Unique Identifier</CardTitle>
                <CardDescription>Enter your certificate's unique identifier (e.g., CAR_JOH_01)</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyByUniqueId} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="uniqueId">Unique Identifier</Label>
                    <Input 
                      id="uniqueId" 
                      placeholder="e.g., CAR_JOH_01" 
                      value={uniqueId} 
                      onChange={(e) => setUniqueId(e.target.value)} 
                      required 
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: ORG3_USER_ENTRY (e.g., CAR_JOH_01 for Cardano University, John, Entry 01)
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isVerifying}>
                    {isVerifying ? 'Verifying...' : <><Key className="mr-2 h-4 w-4" />Verify by Unique ID</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload Certificate PDF</CardTitle>
                <CardDescription>Upload the certificate file to verify its authenticity.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground mb-3">Drop PDF here or click to browse</p>
                  <Button variant="outline" onClick={() => { setCertNumber('GTC-2024-03421'); handleVerify({ preventDefault: () => {} } as React.FormEvent); }}>
                    Simulate PDF Upload
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <ResultDisplay />
      </div>
    </Layout>
  );
};
