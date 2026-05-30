"use client";

import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Ban,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Layout from '@/components/layout/Layout';
import {
  getOrganization,
  revokeCertificate,
  updateOrganization,
  CertificateRecord,
} from '@/lib/services/api';
import { getCurrentSessionUser } from '@/lib/services/session';
import { revokeOnChain } from '@/lib/services/contract';
import { transferCertificateNftToWallet } from '@/lib/services/cardano';
import { isContractDeployed } from '@/lib/contracts/registry';
import { useToast } from '@/hooks/use-toast';
import CardanoWalletPanel, { type WalletConnectionState } from '@/components/wallet/CardanoWalletPanel';

export default function InstitutionDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [{ connected, wallet }, setWalletConnection] = useState<WalletConnectionState>({
    connected: false,
    wallet: null,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [institutionName, setInstitutionName] = useState('Institution Dashboard');
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [organizationLogoUrl, setOrganizationLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [transferCertificate, setTransferCertificate] = useState<CertificateRecord | null>(null);
  const [transferAddress, setTransferAddress] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const user = await getCurrentSessionUser();

      let instId: string | null = null;

      if (user) {
        if (user.institution_name) {
          setInstitutionName(user.institution_name);
        }
        instId = user.institution_id ?? (user.role === 'institution_admin' ? user.id : null);
        setInstitutionId(instId);
      }

      if (instId) {
        const organization = await getOrganization(instId);
        const logoUrl = organization.data?.organizationImageName?.trim();
        if (
          logoUrl?.startsWith('ipfs://') ||
          logoUrl?.startsWith('https://') ||
          logoUrl?.startsWith('http://') ||
          logoUrl?.startsWith('data:image/')
        ) {
          setOrganizationLogoUrl(logoUrl);
        }
      }

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
      const url = instId
        ? `${apiBase}/certificates?institutionId=${encodeURIComponent(instId)}`
        : `${apiBase}/certificates`;

      try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) setCertificates(data.data || []);
      } catch (err) {
        console.error('Failed to load certificates:', err);
      }

      setLoading(false);
    }

    loadData();
  }, []);

  const handleWalletChange = useCallback((connection: WalletConnectionState) => {
    setWalletConnection(connection);
  }, []);

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;
    if (!institutionId) {
      toast({
        title: 'Institution not loaded',
        description: 'Refresh the dashboard and try uploading the logo again.',
        variant: 'destructive',
      });
      return;
    }

    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/uploadToPinata', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadResponse.json().catch(() => null);

      if (!uploadResponse.ok || !uploadData?.imgHash) {
        throw new Error(uploadData?.error || 'Failed to upload logo to IPFS.');
      }

      const logoUrl = `ipfs://${uploadData.imgHash}`;
      const updateResult = await updateOrganization(institutionId, {
        organizationImageName: logoUrl,
      });

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Logo uploaded, but organization update failed.');
      }

      setOrganizationLogoUrl(logoUrl);
      toast({
        title: 'Logo saved',
        description: 'New certificate NFT images will use this organization logo.',
      });
    } catch (error) {
      toast({
        title: 'Logo upload failed',
        description: error instanceof Error ? error.message : 'Could not upload organization logo.',
        variant: 'destructive',
      });
    } finally {
      setLogoUploading(false);
    }
  };

  const filteredCertificates = certificates.filter(
    (cert) =>
      cert.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: certificates.length,
    valid: certificates.filter((c) => c.status === 'valid').length,
    revoked: certificates.filter((c) => c.status === 'revoked').length,
    thisMonth: certificates.filter((c) => {
      const issueDate = new Date(c.issueDate);
      const now = new Date();
      return issueDate.getMonth() === now.getMonth() && issueDate.getFullYear() === now.getFullYear();
    }).length,
  };

  const handleRevoke = async (cert: CertificateRecord) => {
    setRevoking(cert.uniqueIdentifier);

    try {
      let revokeTxHash: string | undefined;

      // Step 1: Revoke on-chain if contract is deployed and wallet is connected
      if (isContractDeployed() && connected && wallet) {
        try {
          revokeTxHash = await revokeOnChain(
            wallet,
            cert.blockchainTxHash,
            cert.blockchainTxIndex
          );
          toast({ title: 'On-chain revocation submitted', description: `TX: ${revokeTxHash.slice(0, 16)}...` });
        } catch (chainErr: any) {
          toast({
            title: 'On-chain revocation failed',
            description: chainErr?.message || 'Could not submit revocation to blockchain.',
            variant: 'destructive',
          });
          setRevoking(null);
          return;
        }
      }

      // Step 2: Update database
      const result = await revokeCertificate(cert.uniqueIdentifier, revokeTxHash);
      if (result.success) {
        setCertificates((prev) =>
          prev.map((c) =>
            c.uniqueIdentifier === cert.uniqueIdentifier ? { ...c, status: 'revoked' } : c
          )
        );
        toast({ title: 'Certificate Revoked', description: 'The certificate has been revoked.' });
      } else {
        toast({ title: 'DB Error', description: 'On-chain done but DB update failed.', variant: 'destructive' });
      }
    } finally {
      setRevoking(null);
    }
  };

  const openTransferDialog = (cert: CertificateRecord) => {
    setTransferCertificate(cert);
    setTransferAddress('');
  };

  const handleTransferNft = async () => {
    if (!transferCertificate) return;

    if (!connected || !wallet) {
      toast({
        title: 'Wallet Required',
        description: 'Connect the institution wallet holding this certificate NFT.',
        variant: 'destructive',
      });
      return;
    }

    setTransferring(true);
    try {
      const result = await transferCertificateNftToWallet(
        transferCertificate,
        transferAddress,
        wallet
      );
      toast({
        title: 'NFT Transfer Submitted',
        description: result.issuerCopy.minted
          ? `${transferCertificate.uniqueIdentifier} sent; issuer copy minted to institution wallet.`
          : `${transferCertificate.uniqueIdentifier} sent; issuer copy already exists in institution wallet.`,
      });
      setTransferCertificate(null);
      setTransferAddress('');
      window.open(`${networkScanBase}/${result.txHash}`, '_blank');
    } catch (error) {
      toast({
        title: 'NFT Transfer Failed',
        description: error instanceof Error ? error.message : 'Could not transfer this certificate NFT.',
        variant: 'destructive',
      });
    } finally {
      setTransferring(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-success text-success-foreground">Valid</Badge>;
      case 'revoked':
        return <Badge variant="destructive">Revoked</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const networkScanBase =
    process.env.NEXT_PUBLIC_CARDANO_NETWORK === 'mainnet'
      ? 'https://cardanoscan.io/transaction'
      : 'https://preview.cardanoscan.io/transaction';

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">{institutionName}</h1>
            <p className="text-muted-foreground">Certificate Management Dashboard</p>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <CardanoWalletPanel onChange={handleWalletChange} />
            <Input
              id="organization-logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('organization-logo-upload')?.click()}
              disabled={logoUploading || !institutionId}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              {logoUploading ? 'Uploading...' : organizationLogoUrl ? 'Change Logo' : 'Add Logo'}
            </Button>
            <Link href="/institution/issue">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Issue Certificate
              </Button>
            </Link>
            <Link href="/institution/batch">
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Batch Upload
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{loading ? '—' : stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Issued</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-success/10 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{loading ? '—' : stats.valid}</p>
                  <p className="text-sm text-muted-foreground">Valid</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <XCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{loading ? '—' : stats.revoked}</p>
                  <p className="text-sm text-muted-foreground">Revoked</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-info/10 rounded-lg">
                  <Clock className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{loading ? '—' : stats.thisMonth}</p>
                  <p className="text-sm text-muted-foreground">This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Issued Certificates</CardTitle>
                <CardDescription>Manage all certificates issued by your institution.</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search certificates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading certificates...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Certificate #</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Credential</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Blockchain</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCertificates.map((cert) => (
                      <TableRow key={cert.id}>
                        <TableCell className="font-mono text-sm">{cert.certificateNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{cert.recipientName}</p>
                            <p className="text-sm text-muted-foreground">{cert.recipientPosition}</p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{cert.credentialType}</TableCell>
                        <TableCell>{new Date(cert.issueDate).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusBadge(cert.status)}</TableCell>
                        <TableCell>
                          {cert.blockchainTxHash ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(`${networkScanBase}/${cert.blockchainTxHash}`, '_blank')
                              }
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View TX
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/certificate/view?uniqueId=${cert.uniqueIdentifier}`)
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openTransferDialog(cert)}>
                                <Send className="mr-2 h-4 w-4" />
                                Transfer NFT
                              </DropdownMenuItem>
                              {cert.status === 'valid' && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  disabled={revoking === cert.uniqueIdentifier}
                                  onClick={() => handleRevoke(cert)}
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  {revoking === cert.uniqueIdentifier ? 'Revoking...' : 'Revoke'}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredCertificates.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No certificates found.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={Boolean(transferCertificate)}
          onOpenChange={(open) => {
            if (!open && !transferring) {
              setTransferCertificate(null);
              setTransferAddress('');
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transfer Certificate NFT</DialogTitle>
              <DialogDescription>
                Send the official NFT to the recipient and keep an issuer copy in the institution wallet.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="recipient-wallet-address">Recipient wallet address</Label>
              <Input
                id="recipient-wallet-address"
                value={transferAddress}
                onChange={(event) => setTransferAddress(event.target.value)}
                placeholder="addr_test..."
                disabled={transferring}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTransferCertificate(null);
                  setTransferAddress('');
                }}
                disabled={transferring}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleTransferNft}
                disabled={transferring || !transferAddress.trim()}
              >
                {transferring ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {transferring ? 'Transferring' : 'Transfer NFT'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
