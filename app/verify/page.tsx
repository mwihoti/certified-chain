"use client";

import { useState } from 'react';
import { ShieldCheck, ShieldX, ShieldAlert, Search, Upload, Key, Lock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/layout/Layout';
import { getCertificateByCertNumber, getCertificateByUniqueId, CertificateRecord } from '@/lib/services/api';
import { verifyCertificateOnChain } from '@/lib/services/cardano';
import { verifyOnChain, ContractVerificationResult } from '@/lib/services/contract';
import { isContractDeployed } from '@/lib/contracts/registry';
import { verifyZKProof, isMidnightConfigured, ZKProof } from '@/lib/services/midnight';
import CertificateTemplate from '@/components/certificate/CertificateTemplate';

export default function VerifyPortal() {
  const [certNumber, setCertNumber] = useState('');
  const [uniqueId, setUniqueId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{
    status: 'valid' | 'invalid' | 'revoked';
    certificate?: CertificateRecord;
    onChainConfirmed?: boolean;
    contractVerification?: ContractVerificationResult;
  } | null>(null);

  // ZK proof (Midnight) state
  const [zkProofJson, setZkProofJson] = useState('');
  const [isVerifyingZK, setIsVerifyingZK] = useState(false);
  const [zkResult, setZkResult] = useState<{
    verified: boolean;
    circuit: string;
    error?: string;
  } | null>(null);

  async function runVerification(cert: CertificateRecord) {
    const [onChainConfirmed, contractVerification] = await Promise.all([
      verifyCertificateOnChain(cert.uniqueIdentifier, cert.blockchainTxHash),
      isContractDeployed()
        ? verifyOnChain(cert.blockchainTxHash, cert.blockchainTxIndex ?? 0, cert.certificateHash)
        : Promise.resolve(undefined),
    ]);

    setResult({
      status: cert.status === 'revoked' ? 'revoked' : 'valid',
      certificate: cert,
      onChainConfirmed,
      contractVerification: contractVerification ?? undefined,
    });
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setResult(null);

    const response = await getCertificateByCertNumber(certNumber);
    if (!response.success || !response.data) {
      setResult({ status: 'invalid' });
      setIsVerifying(false);
      return;
    }

    await runVerification(response.data);
    setIsVerifying(false);
  };

  const handleVerifyByUniqueId = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setResult(null);

    const response = await getCertificateByUniqueId(uniqueId);
    if (!response.success || !response.data) {
      setResult({ status: 'invalid' });
      setIsVerifying(false);
      return;
    }

    await runVerification(response.data);
    setIsVerifying(false);
  };

  const handleVerifyZKProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingZK(true);
    setZkResult(null);

    try {
      const proof: ZKProof = JSON.parse(zkProofJson);
      const result = await verifyZKProof(proof);
      setZkResult({ verified: result.verified, circuit: result.circuit, error: result.error });
    } catch (err: any) {
      setZkResult({ verified: false, circuit: '', error: err?.message || 'Invalid proof JSON' });
    }

    setIsVerifyingZK(false);
  };

  const ResultDisplay = () => {
    if (!result) return null;

    const configs = {
      valid: {
        icon: ShieldCheck, color: 'text-success', bg: 'bg-success/10',
        title: 'Certificate Valid',
        desc: 'This certificate is authentic and verified on the Cardano blockchain.',
      },
      invalid: {
        icon: ShieldX, color: 'text-destructive', bg: 'bg-destructive/10',
        title: 'Certificate Not Found',
        desc: 'This certificate could not be verified. It may be invalid or not registered.',
      },
      revoked: {
        icon: ShieldAlert, color: 'text-warning', bg: 'bg-warning/10',
        title: 'Certificate Revoked',
        desc: 'This certificate was revoked by the issuing institution.',
      },
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
              <CertificateTemplate
                recipientName={result.certificate.recipientName}
                recipientEmail={result.certificate.recipientEmail}
                recipientPosition={result.certificate.recipientPosition}
                credentialType={result.certificate.credentialType}
                issueDate={result.certificate.issueDate}
                expiryDate={result.certificate.expiryDate}
                institutionName={result.certificate.institutionName}
                transactionHash={result.certificate.blockchainTxHash}
                uniqueIdentifier={result.certificate.uniqueIdentifier}
                certificateNumber={result.certificate.certificateNumber}
                status={result.certificate.status}
              />

              <div className="border rounded-lg p-4 bg-muted/30 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipient:</span>
                  <span className="font-medium">{result.certificate.recipientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Credential:</span>
                  <span className="font-medium">{result.certificate.credentialType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Issuer:</span>
                  <span className="font-medium">{result.certificate.institutionName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Issue Date:</span>
                  <span className="font-medium">{new Date(result.certificate.issueDate).toLocaleDateString()}</span>
                </div>
                {result.certificate.revokedReason && (
                  <div className="pt-2 border-t">
                    <span className="text-destructive text-xs">{result.certificate.revokedReason}</span>
                  </div>
                )}
              </div>

              {/* Cardano Blockchain Verification */}
              <div className="border rounded-lg p-4 bg-primary/5 text-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-primary">Cardano Blockchain</h4>
                  <Badge variant="outline" className="text-xs">Layer 1</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Unique Identifier:</span>
                  <p className="font-mono text-sm font-medium break-all">{result.certificate.uniqueIdentifier}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Transaction Hash:</span>
                  <p className="font-mono text-xs break-all">{result.certificate.blockchainTxHash}</p>
                </div>
                <div className="space-y-1 pt-2 border-t text-xs">
                  <div className="flex items-center gap-2">
                    {result.onChainConfirmed ? (
                      <><ShieldCheck className="h-3 w-3 text-success" /><span className="text-success">TX metadata confirmed on Cardano</span></>
                    ) : (
                      <><ShieldAlert className="h-3 w-3 text-warning" /><span className="text-muted-foreground">TX metadata unavailable</span></>
                    )}
                  </div>
                  {result.contractVerification?.found && (
                    <div className="flex items-center gap-2">
                      {result.contractVerification.isRevoked ? (
                        <><ShieldAlert className="h-3 w-3 text-destructive" /><span className="text-destructive">Revoked via smart contract</span></>
                      ) : (
                        <><ShieldCheck className="h-3 w-3 text-success" /><span className="text-success">Verified via LiteCert smart contract</span></>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Midnight ZK notice */}
              {!isMidnightConfigured() && (
                <div className="border rounded-lg p-4 bg-muted/20 text-sm flex items-start gap-3">
                  <Lock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-muted-foreground">Privacy Proofs (Midnight)</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      When the Midnight network integration is active, certificate holders can generate
                      ZK proofs to verify credentials without revealing personal data.
                    </p>
                  </div>
                </div>
              )}
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="number">Cert Number</TabsTrigger>
            <TabsTrigger value="uniqueId">Unique ID</TabsTrigger>
            <TabsTrigger value="zk">
              <Lock className="h-3 w-3 mr-1" />ZK Proof
            </TabsTrigger>
            <TabsTrigger value="upload">PDF</TabsTrigger>
          </TabsList>

          <TabsContent value="number">
            <Card>
              <CardHeader>
                <CardTitle>Enter Certificate Number</CardTitle>
                <CardDescription>Enter the certificate number printed on the credential.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerify} className="space-y-4">
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
                <CardDescription>Enter your certificate's unique identifier (e.g., FKF_KOM_01)</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyByUniqueId} className="space-y-4">
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
                      Format: ORG_USR_NN (e.g., FKF_KOM_01 for Football Kenya Federation, Kombo, Entry 01)
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isVerifying}>
                    {isVerifying ? 'Verifying...' : <><Key className="mr-2 h-4 w-4" />Verify by Unique ID</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ZK Proof verification tab — Midnight Network */}
          <TabsContent value="zk">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Privacy Proof Verification
                </CardTitle>
                <CardDescription>
                  Verify a ZK proof from a certificate holder. The proof confirms their credential
                  is valid without revealing any personal information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isMidnightConfigured() && (
                  <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                    <p className="font-medium mb-1">Midnight Network — Coming Soon</p>
                    <p className="text-xs">
                      ZK proof verification will be available once the Midnight testnet launches
                      and the LiteCert contract is deployed. The contract is already written at
                      <code className="mx-1 bg-background px-1 rounded">contracts/midnight-certs/src/certificate_proof.compact</code>.
                    </p>
                  </div>
                )}

                <form onSubmit={handleVerifyZKProof} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="zkProof">ZK Proof (JSON)</Label>
                    <textarea
                      id="zkProof"
                      className="w-full min-h-[120px] rounded-md border bg-background px-3 py-2 text-xs font-mono resize-y"
                      placeholder={'{\n  "proof": "...",\n  "publicInputs": [...],\n  "circuit": "prove_validity"\n}'}
                      value={zkProofJson}
                      onChange={(e) => setZkProofJson(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      The certificate holder generates this proof using their Lace wallet.
                      It proves their credential is valid without revealing their name or details.
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isVerifyingZK || !isMidnightConfigured()}
                  >
                    {isVerifyingZK ? 'Verifying proof...' : <><Eye className="mr-2 h-4 w-4" />Verify ZK Proof</>}
                  </Button>
                </form>

                {zkResult && (
                  <div className={`border rounded-lg p-4 text-sm ${zkResult.verified ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {zkResult.verified ? (
                        <><ShieldCheck className="h-5 w-5 text-success" /><span className="font-semibold text-success">Proof Valid</span></>
                      ) : (
                        <><ShieldX className="h-5 w-5 text-destructive" /><span className="font-semibold text-destructive">Proof Invalid</span></>
                      )}
                    </div>
                    {zkResult.circuit && (
                      <p className="text-xs text-muted-foreground">Circuit: <code>{zkResult.circuit}</code></p>
                    )}
                    {zkResult.error && (
                      <p className="text-xs text-destructive mt-1">{zkResult.error}</p>
                    )}
                    {zkResult.verified && (
                      <p className="text-xs text-muted-foreground mt-2">
                        This proof was verified on the Midnight Network. The holder's personal data
                        was never revealed during this verification.
                      </p>
                    )}
                  </div>
                )}
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
                <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                  <Upload className="h-10 w-10 mx-auto mb-3" />
                  <p>PDF verification coming soon.</p>
                  <p className="text-xs mt-1">Use the Certificate Number or Unique ID tabs to verify now.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <ResultDisplay />
      </div>
    </Layout>
  );
}
