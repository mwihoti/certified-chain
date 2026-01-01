"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';

export default function IssueCertificate() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<'form' | 'processing' | 'complete'>('form');
  const [progress, setProgress] = useState(0);
  const [txHash, setTxHash] = useState('');

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
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');

    // Simulate blockchain processing steps
    const steps = [
      { progress: 20, delay: 800 },
      { progress: 45, delay: 1000 },
      { progress: 70, delay: 1200 },
      { progress: 90, delay: 800 },
      { progress: 100, delay: 500 },
    ];

    for (const s of steps) {
      await new Promise((resolve) => setTimeout(resolve, s.delay));
      setProgress(s.progress);
    }

    // Generate mock transaction hash
    const mockTx = `0x${Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;
    
    setTxHash(mockTx);
    setStep('complete');
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
            <CardContent>
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
                    placeholder="e.g., Graduate, Physician, Developer"
                    value={formData.recipientPosition}
                    onChange={(e) => setFormData({ ...formData, recipientPosition: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be used along with certificate number for retrieval.
                  </p>
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
                  <Button type="submit" className="w-full">
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
                    {progress < 30 && 'Encrypting certificate data...'}
                    {progress >= 30 && progress < 60 && 'Uploading to IPFS...'}
                    {progress >= 60 && progress < 90 && 'Anchoring metadata on Cardano...'}
                    {progress >= 90 && 'Finalizing transaction...'}
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

                <div className="bg-muted rounded-lg p-4 text-left max-w-lg mx-auto">
                  <p className="text-sm text-muted-foreground mb-1">Transaction Hash</p>
                  <p className="font-mono text-xs break-all">{txHash}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => {
                    setStep('form');
                    setProgress(0);
                    setFormData({
                      recipientName: '',
                      recipientEmail: '',
                      recipientPosition: '',
                      credentialType: '',
                      issueDate: new Date().toISOString().split('T')[0],
                      expiryDate: '',
                    });
                  }}>
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
};
