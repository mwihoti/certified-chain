import { useState } from 'react';
import { ShieldCheck, ShieldX, ShieldAlert, Search, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/layout/Layout';
import { findCertificateByNumber, Certificate } from '@/lib/mockData';

const VerifyPortal = () => {
  const [certNumber, setCertNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{ status: 'valid' | 'invalid' | 'revoked'; certificate?: Certificate } | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setResult(null);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const found = findCertificateByNumber(certNumber);
    if (found) {
      setResult({ status: found.status === 'revoked' ? 'revoked' : 'valid', certificate: found });
    } else {
      setResult({ status: 'invalid' });
    }
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
            <div className="border rounded-lg p-4 bg-muted/30 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Recipient:</span><span className="font-medium">{result.certificate.recipientName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Credential:</span><span className="font-medium">{result.certificate.credentialType}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Issuer:</span><span className="font-medium">{result.certificate.institutionName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Issue Date:</span><span className="font-medium">{new Date(result.certificate.issueDate).toLocaleDateString()}</span></div>
              {result.certificate.revokedReason && <div className="pt-2 border-t"><span className="text-destructive text-xs">{result.certificate.revokedReason}</span></div>}
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="number">By Certificate Number</TabsTrigger>
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

export default VerifyPortal;