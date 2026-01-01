"use client";

import { useState } from 'react';
import { Search, Download, Share2, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/layout/Layout';
import { findCertificate, generateVerificationCode, Certificate } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

export default function UserPortal() {
  const { toast } = useToast();
  const [certNumber, setCertNumber] = useState('');
  const [position, setPosition] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setNotFound(false);
    setCertificate(null);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const found = findCertificate(certNumber, position);
    if (found) {
      setCertificate(found);
    } else {
      setNotFound(true);
    }
    setIsSearching(false);
  };

  const handleShare = () => {
    const code = generateVerificationCode(certificate!.certificateNumber);
    navigator.clipboard.writeText(`${window.location.origin}/verify?code=${code}`);
    toast({ title: 'Link Copied', description: 'Verification link copied to clipboard.' });
  };

  return (
    <Layout>
      <div className="container py-12 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Retrieve Your Certificate</h1>
          <p className="text-muted-foreground">Enter your certificate number and position to access your credential.</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Certificate Lookup</CardTitle>
            <CardDescription>Demo: Try "CSU-2024-00147" with position "Graduate"</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="certNumber">Certificate Number</Label>
                <Input id="certNumber" placeholder="e.g., CSU-2024-00147" value={certNumber} onChange={(e) => setCertNumber(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Your Position/Role</Label>
                <Input id="position" placeholder="e.g., Graduate, Physician" value={position} onChange={(e) => setPosition(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={isSearching}>
                {isSearching ? 'Searching...' : <><Search className="mr-2 h-4 w-4" />Find Certificate</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {notFound && (
          <Card className="border-destructive">
            <CardContent className="pt-6 text-center">
              <p className="text-destructive">No certificate found. Please check your details and try again.</p>
            </CardContent>
          </Card>
        )}

        {certificate && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-success" />
                <Badge className="bg-success text-success-foreground">Verified on Blockchain</Badge>
              </div>
              <div className="border rounded-lg p-6 bg-muted/30 mb-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">{certificate.institutionName}</p>
                  <h3 className="text-xl font-bold mt-2">{certificate.credentialType}</h3>
                  <p className="text-lg mt-2">{certificate.recipientName}</p>
                  <p className="text-sm text-muted-foreground">Issued: {new Date(certificate.issueDate).toLocaleDateString()}</p>
                </div>
                <div className="text-center text-xs text-muted-foreground font-mono">{certificate.certificateNumber}</div>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => toast({ title: 'Download Started', description: 'Certificate PDF is being generated.' })}>
                  <Download className="mr-2 h-4 w-4" />Download PDF
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />Share Link
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};
