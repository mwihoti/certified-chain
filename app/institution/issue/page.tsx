"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import {
  generateUniqueIdentifier,
  submitCertificateToBlockchain,
  getNextEntryNumber,
  CertificateData,
} from '@/lib/services/cardano';
import { saveCertificate } from '@/lib/services/api';
import { useWallet } from '@meshsdk/react';
import { CardanoWallet } from '@meshsdk/react';
import { createClient } from '@/lib/supabase/client';

export default function IssueCertificate() {
  const router = useRouter();
  const { toast } = useToast();
  const { connected, wallet } = useWallet();
  const [step, setStep] = useState<'form' | 'processing' | 'complete'>('form');
  const [progress, setProgress] = useState(0);
  const [txHash, setTxHash] = useState('');
  const [uniqueIdentifier, setUniqueIdentifier] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [institutionId, setInstitutionId] = useState('');

  useEffect(() => {
    async function loadInstitution() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata) {
        const meta = session.user.user_metadata;
        setInstitutionName(meta.institution_name || '');
        setInstitutionId(meta.institution_id || session.user.id);
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

      const entryNumber = await getNextEntryNumber(institutionId, formData.recipientName);
      const identifier = generateUniqueIdentifier(institutionName, formData.recipientName, entryNumber);
      setUniqueIdentifier(identifier.fullIdentifier);

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
        identifier.fullIdentifier,
        wallet
      );

      setProgress(90);

      const year = new Date().getFullYear();
      const certificateNumber = `${institutionName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()}-${year}-${String(entryNumber).padStart(5, '0')}`;

      const saveResult = await saveCertificate({
        uniqueIdentifier: identifier.fullIdentifier,
        certificateNumber,
        recipientName: formData.recipientName,
        recipientEmail: formData.recipientEmail,
        recipientPosition: formData.recipientPosition,
        credentialType: formData.credentialType,
        issueDate: formData.issueDate,
        expiryDate: formData.expiryDate,
        institutionId,
        institutionName,
        blockchainTxHash: result.txHash,
        blockchainTxIndex: result.txIndex,
        certificateHash: result.certificateHash,
      });

      if (!saveResult.success) {
        console.warn('Failed to save certificate to database:', saveResult.error);
      }

      setTxHash(result.txHash);
      setProgress(100);
      setStep('complete');

      toast({
        title: 'Certificate Issued',
        description: `${identifier.fullIdentifier} anchored on Cardano.`,
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
                <CardanoWallet />
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
                    {progress >= 60 && progress < 90 && 'Submitting to Cardano blockchain...'}
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
