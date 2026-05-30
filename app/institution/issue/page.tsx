"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import {
  submitCertificateToBlockchain,
  CertificateData,
} from '@/lib/services/cardano';
import { createIssuanceJob, finalizeIssuanceJob } from '@/lib/services/api';
import { getCurrentSessionUser } from '@/lib/services/session';
import CardanoWalletPanel, { type WalletConnectionState } from '@/components/wallet/CardanoWalletPanel';

export default function IssueCertificate() {
  const router = useRouter();
  const { toast } = useToast();
  const [{ connected, wallet }, setWalletConnection] = useState<WalletConnectionState>({
    connected: false,
    wallet: null,
  });
  const [step, setStep] = useState<'form' | 'processing' | 'complete'>('form');
  const [progress, setProgress] = useState(0);
  const [txHash, setTxHash] = useState('');
  const [uniqueIdentifier, setUniqueIdentifier] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [institutionId, setInstitutionId] = useState('');

  useEffect(() => {
    async function loadInstitution() {
      const user = await getCurrentSessionUser();
      if (user) {
        setInstitutionName(user.institution_name || '');
        setInstitutionId(user.institution_id || user.id);
      }
    }
    loadInstitution();
  }, []);

  const [formData, setFormData] = useState({
    recipientName: '',
    recipientEmail: '',
    recipientPosition: '',
    credentialType: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
  });

  const credentialTypes = [
    'Bachelor of Science',
    'Master of Science',
    'Doctor of Philosophy',
    'Medical License',
    'Professional Certification',
    'Training Completion',
    'Board Certification',
    'Professional Player License',
    'Coaching License',
    'Referee Certification',
  ];

  const handleWalletChange = useCallback((connection: WalletConnectionState) => {
    setWalletConnection(connection);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected || !wallet) {
      toast({
        title: 'Wallet Required',
        description: 'Please connect your Cardano wallet before issuing a certificate.',
        variant: 'destructive',
      });
      return;
    }

    if (!institutionName || !institutionId) {
      toast({
        title: 'Institution Not Set',
        description: 'Institution details are missing. Please ensure you are logged in.',
        variant: 'destructive',
      });
      return;
    }

    setStep('processing');

    try {
      setProgress(20);
      const issuanceJob = await createIssuanceJob({
        recipientName: formData.recipientName,
        recipientEmail: formData.recipientEmail,
        recipientPosition: formData.recipientPosition,
        credentialType: formData.credentialType,
        issueDate: formData.issueDate,
        expiryDate: formData.expiryDate,
      });

      if (!issuanceJob.success || !issuanceJob.data) {
        throw new Error(issuanceJob.error || 'Failed to create issuance job.');
      }

      setUniqueIdentifier(issuanceJob.data.uniqueIdentifier);

      setProgress(45);

      const certificateData: CertificateData = {
        recipientName: formData.recipientName,
        recipientEmail: formData.recipientEmail,
        recipientPosition: formData.recipientPosition,
        credentialType: formData.credentialType,
        issueDate: formData.issueDate,
        expiryDate: formData.expiryDate,
        institutionId,
        institutionName,
      };

      setProgress(70);

      const result = await submitCertificateToBlockchain(
        certificateData,
        issuanceJob.data.uniqueIdentifier,
        wallet,
        { certificateNumber: issuanceJob.data.certificateNumber }
      );

      setProgress(90);
      const finalizeResult = await finalizeIssuanceJob(issuanceJob.data.id, {
        txHash: result.txHash,
        txIndex: result.txIndex,
        certificateHash: result.certificateHash,
        uniqueIdentifier: issuanceJob.data.uniqueIdentifier,
      });

      if (!finalizeResult.success) {
        throw new Error(finalizeResult.error || 'Blockchain submission succeeded, but certificate persistence failed.');
      }

      setTxHash(result.txHash);
      setProgress(100);
      setStep('complete');

      toast({
        title: 'Certificate Issued',
        description: `${issuanceJob.data.uniqueIdentifier} minted to your wallet on Cardano.`,
      });
    } catch (error: any) {
      console.error('Error issuing certificate:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to issue certificate. Please try again.',
        variant: 'destructive',
      });
      setStep('form');
      setProgress(0);
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => router.push('/institution/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {step === 'form' && (
          <Card>
            <CardHeader>
              <CardTitle>Issue New Certificate</CardTitle>
              <CardDescription>
                Create a new blockchain-verified credential for a recipient.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Wallet connection */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 text-sm">
                  {connected ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-success font-medium">Wallet connected</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-warning" />
                      <span className="text-muted-foreground">Connect wallet to issue</span>
                    </>
                  )}
                </div>
                <CardanoWalletPanel onChange={handleWalletChange} />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipientName">Recipient Name</Label>
                    <Input
                      id="recipientName"
                      placeholder="Full legal name"
                      value={formData.recipientName}
                      onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientEmail">Recipient Email</Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      placeholder="recipient@email.com"
                      value={formData.recipientEmail}
                      onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipientPosition">Position/Role</Label>
                  <Input
                    id="recipientPosition"
                    placeholder="e.g., Graduate, Physician, Coach"
                    value={formData.recipientPosition}
                    onChange={(e) => setFormData({ ...formData, recipientPosition: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="credentialType">Credential Type</Label>
                  <Select
                    value={formData.credentialType}
                    onValueChange={(value) => setFormData({ ...formData, credentialType: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select credential type" />
                    </SelectTrigger>
                    <SelectContent>
                      {credentialTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Issue Date</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={!connected}>
                    <Send className="mr-2 h-4 w-4" />
                    Issue Certificate
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'processing' && (
          <Card>
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-6">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Processing Certificate</h3>
                  <p className="text-muted-foreground">
                    {progress < 30 && 'Generating unique identifier...'}
                    {progress >= 30 && progress < 60 && 'Hashing certificate data...'}
                    {progress >= 60 && progress < 90 && 'Minting certificate NFT on Cardano...'}
                    {progress >= 90 && 'Saving to database...'}
                  </p>
                </div>
                <Progress value={progress} className="max-w-md mx-auto" />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'complete' && (
          <Card>
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Certificate Issued Successfully!</h3>
                  <p className="text-muted-foreground mb-4">
                    The certificate has been anchored on the Cardano blockchain.
                  </p>
                </div>

                <div className="bg-muted rounded-lg p-4 text-left max-w-lg mx-auto space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Unique Certificate Identifier</p>
                    <p className="font-mono text-sm font-semibold">{uniqueIdentifier}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Transaction Hash</p>
                    <p className="font-mono text-xs break-all">{txHash}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The minted asset should appear in the connected wallet after the transaction confirms.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => {
                      setStep('form');
                      setProgress(0);
                      setUniqueIdentifier('');
                      setFormData({
                        recipientName: '',
                        recipientEmail: '',
                        recipientPosition: '',
                        credentialType: '',
                        issueDate: new Date().toISOString().split('T')[0],
                        expiryDate: '',
                      });
                    }}
                  >
                    Issue Another
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/certificate/view?uniqueId=${encodeURIComponent(uniqueIdentifier)}`)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Certificate
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/institution/dashboard')}>
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
