"use client";

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import {
  parseExcelFile,
  updateExcelWithBlockchainData,
  downloadExcelFile,
  downloadTemplate,
  ExcelCertificateRow,
} from '@/lib/services/excel';
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

interface BatchEntry extends ExcelCertificateRow {
  status: 'pending' | 'processing' | 'complete' | 'error';
  uniqueIdentifier?: string;
  transactionHash?: string;
}

export default function BatchUpload() {
  const router = useRouter();
  const { toast } = useToast();
  const { connected, wallet } = useWallet();
  const [step, setStep] = useState<'upload' | 'preview' | 'processing' | 'complete'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [entries, setEntries] = useState<BatchEntry[]>([]);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const xlsxFile = files.find((f) => f.name.endsWith('.xlsx') || f.name.endsWith('.xls'));

      if (!xlsxFile) {
        toast({ title: 'Invalid File', description: 'Please upload an Excel file (.xlsx or .xls)', variant: 'destructive' });
        return;
      }

      try {
        const parsedData = await parseExcelFile(xlsxFile);
        setEntries(parsedData.map((entry) => ({ ...entry, status: 'pending' as const })));
        setStep('preview');
        toast({ title: 'File Uploaded', description: `${parsedData.length} certificates ready for review.` });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to parse Excel file. Please check the format.', variant: 'destructive' });
      }
    },
    [toast]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const parsedData = await parseExcelFile(file);
        setEntries(parsedData.map((entry) => ({ ...entry, status: 'pending' as const })));
        setStep('preview');
        toast({ title: 'File Uploaded', description: `${parsedData.length} certificates ready for review.` });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to parse Excel file. Please check the format.', variant: 'destructive' });
      }
    },
    [toast]
  );

  const processBatch = async () => {
    if (!connected || !wallet) {
      toast({
        title: 'Wallet Required',
        description: 'Please connect your Cardano wallet before processing.',
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
      const results = [];

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];

        setEntries((prev) =>
          prev.map((e, index) => (index === i ? { ...e, status: 'processing' as const } : e))
        );

        const entryNumber = await getNextEntryNumber(institutionId, entry.recipientName);
        const identifier = generateUniqueIdentifier(institutionName, entry.recipientName, entryNumber + i);

        const certificateData: CertificateData = {
          recipientName: entry.recipientName,
          recipientEmail: entry.recipientEmail,
          recipientPosition: entry.recipientPosition,
          credentialType: entry.credentialType,
          issueDate: entry.issueDate,
          expiryDate: entry.expiryDate,
          institutionId,
          institutionName,
        };

        const result = await submitCertificateToBlockchain(
          certificateData,
          identifier.fullIdentifier,
          wallet
        );

        const year = new Date().getFullYear();
        const certificateNumber = `${institutionName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()}-${year}-${String(entryNumber + i).padStart(5, '0')}`;

        await saveCertificate({
          uniqueIdentifier: identifier.fullIdentifier,
          certificateNumber,
          recipientName: entry.recipientName,
          recipientEmail: entry.recipientEmail,
          recipientPosition: entry.recipientPosition,
          credentialType: entry.credentialType,
          issueDate: entry.issueDate,
          expiryDate: entry.expiryDate,
          institutionId,
          institutionName,
          blockchainTxHash: result.txHash,
          blockchainTxIndex: result.txIndex,
          certificateHash: result.certificateHash,
        });

        results.push(result);

        setEntries((prev) =>
          prev.map((e, index) =>
            index === i
              ? {
                  ...e,
                  status: 'complete' as const,
                  uniqueIdentifier: result.uniqueIdentifier,
                  transactionHash: result.txHash,
                }
              : e
          )
        );

        setProcessedCount(i + 1);
        setProgress(((i + 1) / entries.length) * 100);
      }

      setStep('complete');
      toast({
        title: 'Batch Processing Complete',
        description: `Successfully issued ${entries.length} certificates on the blockchain.`,
      });
    } catch (error: any) {
      console.error('Error processing batch:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to process batch. Please try again.',
        variant: 'destructive',
      });
      setStep('preview');
    }
  };

  const downloadResults = () => {
    const certificateRows: ExcelCertificateRow[] = entries.map((entry) => ({
      recipientName: entry.recipientName,
      recipientEmail: entry.recipientEmail,
      recipientPosition: entry.recipientPosition,
      credentialType: entry.credentialType,
      issueDate: entry.issueDate,
      expiryDate: entry.expiryDate,
    }));

    const blockchainResults = entries.map((entry) => ({
      txHash: entry.transactionHash || '',
      uniqueIdentifier: entry.uniqueIdentifier || '',
      certificateHash: '',
      timestamp: Date.now(),
    }));

    const excelData = updateExcelWithBlockchainData(certificateRows, blockchainResults);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadExcelFile(excelData, `litecert_certificates_${timestamp}.xlsx`);

    toast({ title: 'Download Started', description: 'Certificate file with blockchain data is downloading.' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline">Pending</Badge>;
      case 'processing': return <Badge variant="secondary">Processing</Badge>;
      case 'complete': return <Badge className="bg-success text-success-foreground">Complete</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      default: return null;
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => router.push('/institution/dashboard')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {step === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle>Batch Upload Certificates</CardTitle>
              <CardDescription>Upload an Excel file to issue multiple certificates at once.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Wallet connection */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  {connected ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-success font-medium">Wallet connected</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-warning" />
                      <span className="text-muted-foreground">Connect wallet to process</span>
                    </>
                  )}
                </div>
                <CardanoWallet />
              </div>

              <div className="mb-6 flex justify-end">
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Drop your Excel file here</h3>
                <p className="text-muted-foreground mb-4">or click to browse</p>
                <input
                  type="file"
                  id="fileInput"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button variant="outline" onClick={() => document.getElementById('fileInput')?.click()}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Select Excel File
                </Button>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Excel Format Requirements</h4>
                <code className="text-xs bg-background p-2 rounded block">
                  recipientName, recipientEmail, recipientPosition, credentialType, issueDate, expiryDate (optional)
                </code>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'preview' && (
          <Card>
            <CardHeader>
              <CardTitle>Preview Certificates</CardTitle>
              <CardDescription>Review the certificates before issuing them on the blockchain.</CardDescription>
            </CardHeader>
            <CardContent>
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
                    {entries.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{entry.recipientName}</p>
                            <p className="text-sm text-muted-foreground">{entry.recipientEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>{entry.recipientPosition}</TableCell>
                        <TableCell>{entry.credentialType}</TableCell>
                        <TableCell>{entry.issueDate}</TableCell>
                        <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex gap-3">
                <Button onClick={processBatch} disabled={!connected}>
                  Issue {entries.length} Certificates
                </Button>
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Upload Different File
                </Button>
              </div>
              {!connected && (
                <p className="text-xs text-warning mt-2">Connect your wallet above before processing.</p>
              )}
            </CardContent>
          </Card>
        )}

        {step === 'processing' && (
          <Card>
            <CardHeader>
              <CardTitle>Processing Batch</CardTitle>
              <CardDescription>Issuing certificates on the Cardano blockchain...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Processing certificate {processedCount} of {entries.length}
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
                      <TableHead>Credential</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell>{entry.recipientName}</TableCell>
                        <TableCell>{entry.credentialType}</TableCell>
                        <TableCell>
                          {entry.status === 'complete' ? (
                            <div className="flex items-center gap-2 text-success">
                              <CheckCircle className="h-4 w-4" />
                              Complete
                            </div>
                          ) : index === processedCount ? (
                            <div className="flex items-center gap-2 text-primary">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Processing
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

        {step === 'complete' && (
          <Card>
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Batch Processing Complete!</h3>
                  <p className="text-muted-foreground">
                    Successfully issued {entries.length} certificates on the Cardano blockchain.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={downloadResults}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Results
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep('upload');
                      setEntries([]);
                      setProgress(0);
                      setProcessedCount(0);
                    }}
                  >
                    Upload Another Batch
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
