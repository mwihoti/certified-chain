"use client";

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
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
import Layout from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';

interface BatchEntry {
  recipientName: string;
  recipientEmail: string;
  recipientPosition: string;
  credentialType: string;
  issueDate: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
}

export default function BatchUpload() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<'upload' | 'preview' | 'processing' | 'complete'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [entries, setEntries] = useState<BatchEntry[]>([]);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);

  // Mock CSV data for demo
  const mockCSVData: BatchEntry[] = [
    { recipientName: 'John Doe', recipientEmail: 'john@email.com', recipientPosition: 'Graduate', credentialType: 'Bachelor of Science', issueDate: '2024-05-20', status: 'pending' },
    { recipientName: 'Jane Smith', recipientEmail: 'jane@email.com', recipientPosition: 'Graduate', credentialType: 'Bachelor of Arts', issueDate: '2024-05-20', status: 'pending' },
    { recipientName: 'Mike Johnson', recipientEmail: 'mike@email.com', recipientPosition: 'Graduate', credentialType: 'Master of Science', issueDate: '2024-05-20', status: 'pending' },
    { recipientName: 'Sarah Williams', recipientEmail: 'sarah@email.com', recipientPosition: 'Graduate', credentialType: 'Bachelor of Engineering', issueDate: '2024-05-20', status: 'pending' },
    { recipientName: 'Chris Brown', recipientEmail: 'chris@email.com', recipientPosition: 'Graduate', credentialType: 'Doctor of Philosophy', issueDate: '2024-05-20', status: 'pending' },
  ];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Simulate file upload with mock data
    setEntries(mockCSVData);
    setStep('preview');
    toast({
      title: 'File Uploaded',
      description: `${mockCSVData.length} certificates ready for review.`,
    });
  }, [toast]);

  export default function handleFileSelect() {
    // Simulate file selection with mock data
    setEntries(mockCSVData);
    setStep('preview');
    toast({
      title: 'File Uploaded',
      description: `${mockCSVData.length} certificates ready for review.`,
    });
  };

  const processBatch = async () => {
    setStep('processing');
    
    for (let i = 0; i < entries.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setEntries((prev) =>
        prev.map((entry, index) =>
          index === i ? { ...entry, status: 'complete' } : entry
        )
      );
      setProcessedCount(i + 1);
      setProgress(((i + 1) / entries.length) * 100);
    }

    setStep('complete');
    toast({
      title: 'Batch Processing Complete',
      description: `Successfully issued ${entries.length} certificates.`,
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
      <div className="container py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => router.push('/institution/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {step === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle>Batch Upload Certificates</CardTitle>
              <CardDescription>
                Upload a CSV file to issue multiple certificates at once.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Drop your CSV file here</h3>
                <p className="text-muted-foreground mb-4">or click to browse</p>
                <Button variant="outline" onClick={handleFileSelect}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Select CSV File
                </Button>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">CSV Format Requirements</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Your CSV should include the following columns:
                </p>
                <code className="text-xs bg-background p-2 rounded block">
                  recipientName, recipientEmail, recipientPosition, credentialType, issueDate
                </code>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'preview' && (
          <Card>
            <CardHeader>
              <CardTitle>Preview Certificates</CardTitle>
              <CardDescription>
                Review the certificates before issuing them on the blockchain.
              </CardDescription>
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
                <Button onClick={processBatch}>
                  Issue {entries.length} Certificates
                </Button>
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Upload Different File
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'processing' && (
          <Card>
            <CardHeader>
              <CardTitle>Processing Batch</CardTitle>
              <CardDescription>
                Issuing certificates on the Cardano blockchain...
              </CardDescription>
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
                  <Button onClick={() => {
                    setStep('upload');
                    setEntries([]);
                    setProgress(0);
                    setProcessedCount(0);
                  }}>
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
};
