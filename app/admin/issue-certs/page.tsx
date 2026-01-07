"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Wallet, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Download,
  FileSpreadsheet,
  Image as ImageIcon,
  QrCode,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import {useWallet} from '@meshsdk/react';
import { CardanoWallet } from '@meshsdk/react';
import { BrowserWallet } from '@meshsdk/core';
import {
  generateUniqueIdentifier,
  submitCertificateToBlockchain,
  getNextEntryNumber,
  CertificateData,
} from '@/lib/services/cardano';
import {
  parseExcelFile,
  updateExcelWithBlockchainData,
  downloadExcelFile,
  ExcelCertificateRow,
} from '@/lib/services/excel';
import { 
  getOrganizations, 
  updateOrganization, 
  OrganizationData,
  downloadOrganizationExcel
} from '@/lib/services/api';

interface PendingOrganization extends OrganizationData {
  id: string;
  status: string;
  submittedAt: string;
}

interface CertificateEntry extends ExcelCertificateRow {
  status: 'pending' | 'processing' | 'complete' | 'error';
  uniqueIdentifier?: string;
  transactionHash?: string;
  qrCodeUrl?: string;
}

export default function AdminIssueCerts() {
  const router = useRouter();
  const { toast } = useToast();
  
  const { connected, wallet, connecting, connect, disconnect, name} = useWallet();

  
  const [pendingOrgs, setPendingOrgs] = useState<PendingOrganization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<PendingOrganization | null>(null);
  const [certificates, setCertificates] = useState<CertificateEntry[]>([]);
  
  const [step, setStep] = useState<'select' | 'review' | 'processing' | 'complete'>('select');
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);

  useEffect(() => {
    // Load pending organizations from API
    loadPendingOrganizations();
  }, []);

  const loadPendingOrganizations = async () => {
    try {
      const response = await getOrganizations('pending');
      if (response.success && response.data) {
        setPendingOrgs(response.data as PendingOrganization[]);
      } else {
        console.error('Failed to load organizations:', response.error);
        toast({
          title: 'Error',
          description: 'Failed to load pending organizations.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

 

  const handleSelectOrganization = async (org: PendingOrganization) => {
    setSelectedOrg(org);
    setCertificates([]);

    try {
      const excelData = await downloadOrganizationExcel(org.id);
      const parsedCerts: ExcelCertificateRow[] = parseExcelFile(excelData);
      
      const certEntries: CertificateEntry[] = parsedCerts.map(row => ({
        ...row,
        status: 'pending' as const,
      }));
       setCertificates(certEntries);
    setStep('review');
    } catch (error) {
      console.error('Failed to load Excel data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load certificate data for this organization.',
        variant: 'destructive',
      });
    }
  };

    
   


  const generateQRCodeUrl = (txHash: string): string => {
    // Generate QR code URL linking to Cardano explorer
    // In production, you would generate actual QR code image
    return `https://cardanoscan.io/transaction/${txHash}`;
  };

  const processCertificates = async () => {
    if (!selectedOrg || !connected || !wallet) return;
    
    setStep('processing');
    setProcessedCount(0);
    setProgress(0);

    let hasError = false;
    for (let i = 0; i < certificates.length; i++) {
      const cert = certificates[i];

      setCertificates(prev => prev.map((c, idx) => 
        idx === i ? { ...c, status: 'processing'} : c
        
      ));

        
    try {
      
        
        // Generate unique identifier
        const entryNumber = getNextEntryNumber(selectedOrg.id, cert.recipientName);
        const identifier = generateUniqueIdentifier(
          selectedOrg.name,
          cert.recipientName,
          entryNumber
        );
        
        // Create certificate data
        const certificateData: CertificateData = {
          recipientName: cert.recipientName,
          recipientEmail: cert.recipientEmail,
          recipientPosition: cert.recipientPosition,
          credentialType: cert.credentialType,
          issueDate: cert.issueDate,
          expiryDate: cert.expiryDate,
          institutionId: selectedOrg.id,
          institutionName: selectedOrg.name,
        };
        
        // Submit to blockchain
        const result = await submitCertificateToBlockchain(
          certificateData,
          identifier.fullIdentifier,
          wallet
        );
        
        // Generate QR code URL
        const qrCodeUrl = generateQRCodeUrl(result.txHash);
        
        
        // Update status to complete
        setCertificates((prev) =>
          prev.map((c, index) =>
            index === i
              ? {
                  ...c,
                  status: 'complete' as const,
                  uniqueIdentifier: result.uniqueIdentifier,
                  transactionHash: result.txHash,
                  qrCodeUrl,
                }
              : c
          )
        );
        

      } catch (error: any) {
        console.error(`Error minting cert ${i + 1}:`, error);
        setCertificates(prev => prev.map((c,idx) => idx === i ? {
          ...c, status: 'error',
          errorMessage: error.message || 'Unknown error',
        } : c
      ));
      hasError = true;
      }
      setProcessedCount(i + 1);
      setProgress(((i + 1) / certificates.length) * 100);
      
   try {
      await updateOrganization(selectedOrg.id, { 
        status: hasError ? 'partial' : 'completed', // Assume backend handles partial
        completedAt: new Date().toISOString() 
      });
    } catch (error) {
      console.error('Failed to update org status:', error);
    }

    setStep('complete');
    toast({
      title: hasError ? 'Partial Success' : 'Success',
      description: hasError 
        ? 'Some certificates failed. Check the table for details.'
        : `Successfully issued ${certificates.length} certificates.`,
      variant: hasError ? 'destructive' : 'default',
    });
  };

  const downloadResults = () => {
    if (!selectedOrg) return;
    
    // Prepare data for Excel
    const certificateRows: ExcelCertificateRow[] = certificates.map(cert => ({
      recipientName: cert.recipientName,
      recipientEmail: cert.recipientEmail,
      recipientPosition: cert.recipientPosition,
      credentialType: cert.credentialType,
      issueDate: cert.issueDate,
      expiryDate: cert.expiryDate,
    }));
    
    const blockchainResults = certificates.map(cert => ({
      txHash: cert.transactionHash || '',
      uniqueIdentifier: cert.uniqueIdentifier || '',
      certificateHash: '',
      timestamp: Date.now(),
    }));
    
    const excelData = updateExcelWithBlockchainData(certificateRows, blockchainResults);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadExcelFile(excelData, `${selectedOrg.name}_certificates_${timestamp}.xlsx`);
    
    toast({
      title: 'Download Started',
      description: 'Certificate file with blockchain data is being downloaded.',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'complete':
        return <Badge className="bg-success text-success-foreground">Complete</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Lite-Cert Admin Portal</h1>
          <p className="text-muted-foreground">
            Issue certificates for pending organizations using Cardano blockchain
          </p>
        </div>

        {/* Wallet Connection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Wallet Connection</CardTitle>
            <CardDescription>
              Connect your Eternl wallet to mint certificates on the blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!connected ? (
              <div className="flex items-center gap-4">
                <CardanoWallet />
                {connecting && (
                  <div className='flex items-center gap-2'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    <span>Connecting...</span>
                    </div>
                )}

                <Alert >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You must connect your wallet to issue certificates
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Wallet Connected: {name}</span>
                </div>
               <Button variant='outline' onClick={disconnect}>
                Disconnect
               </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Organization Selection */}
        {step === 'select' && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Organizations</CardTitle>
              <CardDescription>
                Select an organization to process their certificate requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingOrgs.length === 0 ? (
                <div className="text-center py-12">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No pending organizations</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Organization</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Certificates</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingOrgs.map((org) => (
                        <TableRow key={org.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{org.name}</p>
                              <p className="text-sm text-muted-foreground">{org.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{org.type.replace('_', ' ')}</TableCell>
                          <TableCell>{org.contactName}</TableCell>
                          <TableCell>
                            <Badge>{org.numberOfCerts}</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(org.submittedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleSelectOrganization(org)}
                              disabled={!connected}
                            >
                              Process
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Certificate Review */}
        {step === 'review' && selectedOrg && (
          <Card>
            <CardHeader>
              <CardTitle>Review Certificates - {selectedOrg.name}</CardTitle>
              <CardDescription>
                Review the certificates before minting them on the blockchain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Organization:</span>
                    <span className="ml-2 font-medium">{selectedOrg.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Contact:</span>
                    <span className="ml-2 font-medium">{selectedOrg.contactName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Certificates:</span>
                    <span className="ml-2 font-medium">{certificates.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <span className="ml-2 font-medium">Ready to Process</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto mb-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Credential</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificates.map((cert, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{cert.recipientName}</p>
                            <p className="text-sm text-muted-foreground">{cert.recipientEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>{cert.recipientPosition}</TableCell>
                        <TableCell>{cert.credentialType}</TableCell>
                        <TableCell>{cert.issueDate}</TableCell>
                        <TableCell>{getStatusBadge(cert.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex gap-3">
                <Button onClick={processCertificates}>
                  Mint {certificates.length} Certificates
                </Button>
                <Button variant="outline" onClick={() => {
                  setStep('select');
                  setSelectedOrg(null);
                  setCertificates([]);
                }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing */}
        {step === 'processing' && (
          <Card>
            <CardHeader>
              <CardTitle>Minting Certificates</CardTitle>
              <CardDescription>
                Creating NFT certificates on the Cardano blockchain...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Processing certificate {processedCount} of {certificates.length}
                  </span>
                  <span className="text-sm font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Unique ID</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificates.map((cert, index) => (
                      <TableRow key={index}>
                        <TableCell>{cert.recipientName}</TableCell>
                        <TableCell>
                          {cert.uniqueIdentifier ? (
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {cert.uniqueIdentifier}
                            </code>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {cert.status === 'complete' ? (
                            <div className="flex items-center gap-2 text-success">
                              <CheckCircle className="h-4 w-4" />
                              Complete
                            </div>
                          ) : index === processedCount ? (
                            <div className="flex items-center gap-2 text-primary">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Minting...
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Pending</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Complete */}
        {step === 'complete' && selectedOrg && (
          <Card>
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Certificates Minted Successfully!</h3>
                  <p className="text-muted-foreground">
                    {certificates.length} certificates for {selectedOrg.name} have been created on the blockchain.
                  </p>
                </div>

                <div className="border rounded-lg p-6 space-y-4">
                  <h4 className="font-semibold">Certificate Details</h4>
                  {certificates.slice(0, 3).map((cert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded">
                      <div className="text-left">
                        <p className="font-medium">{cert.recipientName}</p>
                        <code className="text-xs text-muted-foreground">{cert.uniqueIdentifier}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(cert.qrCodeUrl, '_blank')}
                        >
                          <QrCode className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`https://cardanoscan.io/transaction/${cert.transactionHash}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          TX
                        </Button>
                      </div>
                    </div>
                  ))}
                  {certificates.length > 3 && (
                    <p className="text-sm text-muted-foreground">
                      + {certificates.length - 3} more certificates
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={downloadResults}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Updated Excel
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setStep('select');
                    setSelectedOrg(null);
                    setCertificates([]);
                    setProgress(0);
                    setProcessedCount(0);
                    // Reload pending orgs from API
                    loadPendingOrganizations();
                  }}>
                    Process Another Organization
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
}