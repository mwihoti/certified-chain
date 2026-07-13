"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, ShieldCheck, Copy, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Layout from '@/components/layout/Layout';
import { getCertificateByUniqueId, CertificateRecord } from '@/lib/services/api';
import {
  proveValidity,
  proveCredentialType,
  proveNotExpired,
  isMidnightConfigured,
  type ZKProof,
  type CertificateWitness,
} from '@/lib/services/midnight';

export default function ProofPage() {
  const searchParams = useSearchParams();
  const uniqueId = searchParams.get('uniqueId') || '';

  const [certificate, setCertificate] = useState<CertificateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [proof, setProof] = useState<ZKProof | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Inputs for different proof types
  const [credentialTypeInput, setCredentialTypeInput] = useState('');
  const [expiryTimestamp, setExpiryTimestamp] = useState('');

  useEffect(() => {
    async function loadCertificate() {
      if (!uniqueId) {
        setError('No certificate identifier provided.');
        setLoading(false);
        return;
      }

      const response = await getCertificateByUniqueId(uniqueId);
      if (!response.success || !response.data) {
        setError('Certificate not found.');
        setLoading(false);
        return;
      }

      setCertificate(response.data);
      setCredentialTypeInput(response.data.credentialType);
      setLoading(false);
    }
    loadCertificate();
  }, [uniqueId]);

  function buildWitness(): CertificateWitness {
    if (!certificate) throw new Error('Certificate not loaded');
    return {
      recipientName: certificate.recipientName,
      credentialType: certificate.credentialType,
      issueDate: certificate.issueDate,
      institutionId: certificate.institutionId,
    };
  }

  async function handleProveValidity() {
    if (!certificate) return;
    setGenerating(true);
    setProof(null);
    try {
      const result = await proveValidity(certificate.uniqueIdentifier, buildWitness());
      setProof(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate proof');
    }
    setGenerating(false);
  }

  async function handleProveCredentialType() {
    if (!certificate || !credentialTypeInput) return;
    setGenerating(true);
    setProof(null);
    try {
      const result = await proveCredentialType(
        certificate.uniqueIdentifier,
        credentialTypeInput,
        buildWitness()
      );
      setProof(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate proof');
    }
    setGenerating(false);
  }

  async function handleProveNotExpired() {
    if (!certificate || !expiryTimestamp) return;
    setGenerating(true);
    setProof(null);
    try {
      const ts = Math.floor(new Date(expiryTimestamp).getTime() / 1000);
      const result = await proveNotExpired(certificate.uniqueIdentifier, ts, buildWitness());
      setProof(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate proof');
    }
    setGenerating(false);
  }

  function copyProof() {
    if (!proof) return;
    navigator.clipboard.writeText(JSON.stringify(proof, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 max-w-2xl text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!isMidnightConfigured()) {
    return (
      <Layout>
        <div className="container py-12 max-w-2xl">
          <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
            <p className="font-medium mb-1 flex items-center gap-2">
              <Lock className="h-4 w-4" /> Midnight Network Not Configured
            </p>
            <p className="text-xs">
              ZK proof generation requires the Midnight contract to be deployed.
              Ask the administrator to set <code>NEXT_PUBLIC_MIDNIGHT_CONTRACT_ADDRESS</code>.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <Button variant="ghost" onClick={() => window.history.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {error && (
          <div className="p-3 bg-destructive/10 rounded-lg text-sm text-destructive mb-6">
            {error}
          </div>
        )}

        {certificate && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Generate Privacy Proof
              </CardTitle>
              <CardDescription>
                Certificate {certificate.uniqueIdentifier} — generate a zero-knowledge proof
                that verifies your credential without revealing personal data.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {certificate && (
          <div className="space-y-4">
            {/* Prove Validity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Prove Validity</CardTitle>
                <CardDescription>
                  Generate a proof that your certificate is valid. No personal data is revealed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleProveValidity} disabled={generating} className="w-full">
                  {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  Generate Validity Proof
                </Button>
              </CardContent>
            </Card>

            {/* Prove Credential Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Prove Credential Type</CardTitle>
                <CardDescription>
                  Prove you hold a specific credential type without revealing your name.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="credentialType">Credential Type to Disclose</Label>
                  <Input
                    id="credentialType"
                    value={credentialTypeInput}
                    onChange={(e) => setCredentialTypeInput(e.target.value)}
                    placeholder="e.g., Coaching License"
                  />
                </div>
                <Button onClick={handleProveCredentialType} disabled={generating || !credentialTypeInput} className="w-full">
                  {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  Generate Credential Type Proof
                </Button>
              </CardContent>
            </Card>

            {/* Prove Not Expired */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Prove Not Expired</CardTitle>
                <CardDescription>
                  Prove your certificate was issued before a given date and has not been revoked,
                  without revealing the exact issue date.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="expiryTs">Expiry Check Date</Label>
                  <Input
                    id="expiryTs"
                    type="date"
                    value={expiryTimestamp}
                    onChange={(e) => setExpiryTimestamp(e.target.value)}
                  />
                </div>
                <Button onClick={handleProveNotExpired} disabled={generating || !expiryTimestamp} className="w-full">
                  {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  Generate Non-Expiry Proof
                </Button>
              </CardContent>
            </Card>

            {/* Proof Output */}
            {proof && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Generated Proof ({proof.circuit})</span>
                    <Button variant="ghost" size="sm" onClick={copyProof}>
                      {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-auto max-h-64">
                    {JSON.stringify(proof, null, 2)}
                  </pre>
                  <p className="text-xs text-muted-foreground mt-2">
                    Share this proof with a verifier. They can verify it at the Verify page
                    without seeing your personal data.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
