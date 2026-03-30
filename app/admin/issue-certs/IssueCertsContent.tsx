// pages/admin/issue-certs.tsx
"use client";

import { useState, useEffect } from 'react';
import { useWallet } from '@meshsdk/react';
import { CardanoWallet } from '@meshsdk/react';
import { Transaction, ForgeScript } from '@meshsdk/core';
import { BlockfrostProvider,  } from '@meshsdk/core';
import { Mint } from '@meshsdk/core';
import * as XLSX from 'xlsx';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Upload,
  FileSpreadsheet,
  QrCode,
  ExternalLink,
  Menu,
  X,
  Home,
  FileText,
  Shield,
  ImageIcon
} from 'lucide-react';

// Initialize Blockfrost provider for testnet
const blockfrostProvider = new BlockfrostProvider(
  process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID || 'preprodYourProjectIdHere'
);

interface CertificateData {
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  recipientPosition: string;
  credentialType: string;
  issueDate: string;
  expiryDate: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  uniqueIdentifier?: string;
  transactionHash?: string;
  explorerUrl?: string;
  errorMessage?: string;
}

interface OrganizationData {
  name: string;
  email: string;
  type: string;
  contactName: string;
  certificateDesign?: File;
}

export default function IssueCertsContent() {
  const { connected, wallet, connecting, name } = useWallet();

  const [step, setStep] = useState<'upload' | 'review' | 'processing' | 'complete'>('upload');
  const [organization, setOrganization] = useState<OrganizationData>({
    name: '',
    email: '',
    type: 'university',
    contactName: ''
  });
  
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    async function getAddress() {
      if (connected && wallet) {
        try {
          const addresses = await wallet.getUsedAddresses();
          if (addresses && addresses.length > 0) {
            setWalletAddress(addresses[0]);
          }
        } catch (error) {
          console.error('Error getting wallet address:', error);
        }
      } else {
        setWalletAddress('');
      }
    }
    getAddress();
  }, [connected, wallet]);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-700">Loading Admin Portal...</span>
      </div>
    );
  }

  // Generate unique identifier: ORG(3) + NAME(3) + PHONE(3)
  const generateUniqueIdentifier = (orgName: string, recipientName: string, phone: string): string => {
    const orgCode = orgName.substring(0, 3).toUpperCase();
    const nameCode = recipientName.replace(/\s/g, '').substring(0, 3).toUpperCase();
    const phoneDigits = phone.replace(/\D/g, '').substring(0, 3);
    return `${orgCode}-${nameCode}-${phoneDigits}`;
  };

  // Parse Excel file
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const parsedCertificates: CertificateData[] = jsonData.map((row: any) => ({
        recipientName: row['Recipient Name'] || row['Name'] || '',
        recipientEmail: row['Email'] || '',
        recipientPhone: row['Phone'] || row['Phone Number'] || '',
        recipientPosition: row['Position'] || '',
        credentialType: row['Credential Type'] || row['Credential'] || '',
        issueDate: row['Issue Date'] || new Date().toISOString().split('T')[0],
        expiryDate: row['Expiry Date'] || '',
        status: 'pending'
      }));

      setCertificates(parsedCertificates);
    } catch (error) {
      console.error('Error parsing Excel:', error);
      alert('Error reading Excel file. Please ensure it has the correct format.');
    }
  };

  const handleDesignUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDesignFile(file);
    }
  };

  const handleReview = () => {
    if (!organization.name || !organization.email || !organization.contactName) {
      alert('Please fill in all organization details');
      return;
    }
    if (certificates.length === 0) {
      alert('Please upload an Excel file with certificate data');
      return;
    }
    setStep('review');
  };

  // Mint certificates to Cardano blockchain
  const mintCertificateNFT = async (cert: CertificateData, uniqueId: string): Promise<{txHash: string, explorerUrl: string}> => {
    if (!wallet) throw new Error('Wallet not connected');

    try {
      // simple time-lock minting policy
      const mintingPolicy: any = {
        type: 'all',
        scripts: [
          {
            type: 'sig',
            keyHash: await wallet.getChangeAddress().then(addr => addr.slice(0, 58)),
          },
          {
            type: 'before',
            slot: ((await blockfrostProvider.fetchProtocolParameters()) as any).slot + 1000000,
          },
        ],
      };

      const forgeScript: any = {
        type: 'mintingPolicy',
        Policy: mintingPolicy,
      };

      // Get Asset name: uniqueId as hex
      const assetName = Buffer.from(uniqueId, 'utf-8').toString('hex');
      

      // Create metadata for the certificate NFT
      const metadata = {
        721: {
          [uniqueId]: {
            name: `Certificate - ${cert.recipientName}`,
            image: designFile ? 'ipfs://certificate-design' : '', // In production, upload to IPFS
            description: `${cert.credentialType} issued to ${cert.recipientName}`,
            properties: {
              recipientName: cert.recipientName,
              recipientEmail: cert.recipientEmail,
              position: cert.recipientPosition,
              credentialType: cert.credentialType,
              issueDate: cert.issueDate,
              expiryDate: cert.expiryDate,
              organization: organization.name,
              uniqueIdentifier: uniqueId
            }
          }
        }
      };

      // Build and submit transaction
      const tx = new Transaction({ initiator: wallet });
      
      // Add metadata
      tx.setMetadata(0, metadata);

      // Build the transaction
      const unsignedTx = await tx.build();
      
      // Sign the transaction
      const signedTx = await wallet.signTx(unsignedTx);
      
      // Submit to blockchain
      const txHash = await wallet.submitTx(signedTx);
      
      const explorerUrl = `https://preview.cardanoscan.io/transaction/${txHash}`;
      
      return { txHash, explorerUrl };
    } catch (error) {
      console.error('Minting error:', error);
      throw error;
    }
  };

  const processCertificates = async () => {
    if (!connected || !wallet) {
      alert('Please connect your wallet first');
      return;
    }

    setStep('processing');
    setProcessedCount(0);
    setProgress(0);

    for (let i = 0; i < certificates.length; i++) {
      const cert = certificates[i];
      
      setCertificates(prev => prev.map((c, idx) =>
        idx === i ? { ...c, status: 'processing' } : c
      ));

      try {
        // Generate unique identifier
        const uniqueId = generateUniqueIdentifier(
          organization.name,
          cert.recipientName,
          cert.recipientPhone
        );

        // Mint NFT on Cardano testnet
        const { txHash, explorerUrl } = await mintCertificateNFT(cert, uniqueId);

        // Update certificate with blockchain data
        setCertificates(prev => prev.map((c, idx) =>
          idx === i ? {
            ...c,
            status: 'complete',
            uniqueIdentifier: uniqueId,
            transactionHash: txHash,
            explorerUrl: explorerUrl
          } : c
        ));
      } catch (error: any) {
        console.error(`Error minting certificate ${i + 1}:`, error);
        setCertificates(prev => prev.map((c, idx) =>
          idx === i ? {
            ...c,
            status: 'error',
            errorMessage: error.message || 'Minting failed'
          } : c
        ));
      }

      setProcessedCount(i + 1);
      setProgress(((i + 1) / certificates.length) * 100);
    }

    setStep('complete');
  };

  // Download updated Excel with blockchain data
  const downloadUpdatedExcel = () => {
    const exportData = certificates.map(cert => ({
      'Recipient Name': cert.recipientName,
      'Email': cert.recipientEmail,
      'Phone': cert.recipientPhone,
      'Position': cert.recipientPosition,
      'Credential Type': cert.credentialType,
      'Issue Date': cert.issueDate,
      'Expiry Date': cert.expiryDate,
      'Unique Identifier': cert.uniqueIdentifier || '',
      'Transaction Hash': cert.transactionHash || '',
      'Explorer URL': cert.explorerUrl || '',
      'Status': cert.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Certificates');
    
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `${organization.name}_certificates_${timestamp}.xlsx`);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-gray-100 text-gray-800 border border-gray-300',
      processing: 'bg-blue-100 text-blue-800 border border-blue-300',
      complete: 'bg-green-100 text-green-800 border border-green-300',
      error: 'bg-red-100 text-red-800 border border-red-300'
    };
    
    const labels = {
      pending: 'Pending',
      processing: 'Processing',
      complete: 'Complete',
      error: 'Error'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Lite-Cert</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="/" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                <Home className="h-4 w-4 mr-1" />
                Home
              </a>
              <a href="/verify" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                <FileText className="h-4 w-4 mr-1" />
                Verify
              </a>
              <a href="/admin" className="flex items-center text-blue-600 font-medium">
                <Shield className="h-4 w-4 mr-1" />
                Admin
              </a>
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:text-gray-900"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-3">
                <a href="/" className="flex items-center text-gray-600 hover:text-gray-900 py-2">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </a>
                <a href="/verify" className="flex items-center text-gray-600 hover:text-gray-900 py-2">
                  <FileText className="h-4 w-4 mr-2" />
                  Verify
                </a>
                <a href="/admin" className="flex items-center text-blue-600 font-medium py-2">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <button
          onClick={() => window.location.href = '/'}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificate Minting Portal</h1>
          <p className="text-gray-600">
            Upload organization details and recipient data to mint certificates on Cardano testnet
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Wallet Connection</h3>
            <p className="text-sm text-gray-600 mt-1">
              Connect your Cardano wallet to mint certificates on testnet
            </p>
          </div>
          <div className="p-6">
            {!connected ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <CardanoWallet />
                </div>
                {connecting && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Connecting to wallet...</span>
                  </div>
                )}
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-md">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-800 font-medium">Wallet Required</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Connect your wallet to access minting features. 
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Wallet Connected: {name}</span>
                </div>
                {walletAddress && (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-xs text-gray-600 mb-1">Testnet Address:</p>
                    <code className="text-xs text-gray-800 break-all">{walletAddress}</code>
                  </div>
                )}
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    You can now upload organization details and certificate data to begin minting.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upload Organization & Certificate Data */}
        {connected && step === 'upload' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Organization & Certificate Details</h3>
              <p className="text-sm text-gray-600 mt-1">
                Fill in organization information and upload certificate recipient data
              </p>
            </div>
            <div className="p-6 space-y-6">
              {/* Organization Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    value={organization.name}
                    onChange={(e) => setOrganization({...organization, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Tech University"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Email *
                  </label>
                  <input
                    type="email"
                    value={organization.email}
                    onChange={(e) => setOrganization({...organization, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="admin@techuniversity.edu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Type *
                  </label>
                  <select
                    value={organization.type}
                    onChange={(e) => setOrganization({...organization, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="university">University</option>
                    <option value="school">School</option>
                    <option value="training_center">Training Center</option>
                    <option value="company">Company</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    value={organization.contactName}
                    onChange={(e) => setOrganization({...organization, contactName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Certificate Design Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificate Design Template (Optional)
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                    <ImageIcon className="h-5 w-5 text-gray-600 mr-2" />
                    <span className="text-sm text-gray-700">
                      {designFile ? designFile.name : 'Upload Design'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleDesignUpload}
                      className="hidden"
                    />
                  </label>
                  {designFile && (
                    <span className="text-sm text-green-600 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Design uploaded
                    </span>
                  )}
                </div>
              </div>

              {/* Excel Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificate Recipients Data (Excel) *
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Excel should include: Recipient Name, Email, Phone, Position, Credential Type, Issue Date, Expiry Date
                </p>
                <div className="flex items-center gap-4">
                  <label className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 transition-colors">
                    <Upload className="h-5 w-5 mr-2" />
                    <span className="text-sm">
                      {excelFile ? excelFile.name : 'Upload Excel File'}
                    </span>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleExcelUpload}
                      className="hidden"
                    />
                  </label>
                  {certificates.length > 0 && (
                    <span className="text-sm text-green-600 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {certificates.length} certificates loaded
                    </span>
                  )}
                </div>
              </div>

              {/* Preview Certificate Data */}
              {certificates.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Preview Recipients ({certificates.length})</h4>
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Phone</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Credential</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {certificates.slice(0, 5).map((cert, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-gray-900">{cert.recipientName}</td>
                            <td className="px-3 py-2 text-gray-600">{cert.recipientEmail}</td>
                            <td className="px-3 py-2 text-gray-600">{cert.recipientPhone}</td>
                            <td className="px-3 py-2 text-gray-600">{cert.credentialType}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {certificates.length > 5 && (
                      <p className="text-xs text-gray-500 mt-2 px-3">
                        + {certificates.length - 5} more recipients
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleReview}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Review & Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Review Step */}
        {step === 'review' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Review Before Minting</h3>
              <p className="text-sm text-gray-600 mt-1">
                Verify all information before minting certificates to the blockchain
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Organization Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium text-gray-900">{organization.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Contact:</span>
                    <span className="ml-2 font-medium text-gray-900">{organization.contactName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium text-gray-900">{organization.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium text-gray-900 capitalize">{organization.type.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <h4 className="font-medium text-gray-900 mb-3">Certificates to Mint ({certificates.length})</h4>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credential</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unique ID</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {certificates.map((cert, idx) => {
                      const uniqueId = generateUniqueIdentifier(organization.name, cert.recipientName, cert.recipientPhone);
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{cert.recipientName}</p>
                              <p className="text-xs text-gray-500">{cert.recipientEmail}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{cert.recipientPhone}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{cert.recipientPosition}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{cert.credentialType}</td>
                          <td className="px-4 py-3">
                            <code className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-mono">
                              {uniqueId}
                            </code>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={processCertificates}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Mint {certificates.length} Certificates
                </button>
                <button
                  onClick={() => setStep('upload')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Back to Edit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Minting Certificates</h3>
              <p className="text-sm text-gray-600 mt-1">
                Creating NFT certificates on Cardano ...
              </p>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    Processing certificate {processedCount} of {certificates.length}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unique ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {certificates.map((cert, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{cert.recipientName}</td>
                        <td className="px-4 py-3">
                          {cert.uniqueIdentifier ? (
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-800 font-mono">
                              {cert.uniqueIdentifier}
                            </code>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {cert.status === 'complete' ? (
                            <div className="flex items-center gap-2 text-green-600 text-sm">
                              <CheckCircle className="h-4 w-4" />
                              <span>Minted</span>
                            </div>
                          ) : cert.status === 'error' ? (
                            <div className="flex items-center gap-2 text-red-600 text-sm">
                              <AlertCircle className="h-4 w-4" />
                              <span>Failed</span>
                            </div>
                          ) : index === processedCount ? (
                            <div className="flex items-center gap-2 text-blue-600 text-sm">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Minting...</span>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-8">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Certificates Minted Successfully!</h3>
                  <p className="text-gray-600">
                    {certificates.filter(c => c.status === 'complete').length} of {certificates.length} certificates 
                    for {organization.name} have been minted on Cardano Preprod testnet.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-6 space-y-4 text-left max-w-4xl mx-auto">
                  <h4 className="font-semibold text-gray-900">Certificate Details</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {certificates.map((cert, index) => (
                      <div key={index} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{cert.recipientName}</p>
                          <p className="text-sm text-gray-600 mt-1">{cert.credentialType}</p>
                          {cert.uniqueIdentifier && (
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">ID:</span>
                                <code className="text-xs bg-white px-2 py-1 rounded text-blue-700 font-mono border border-blue-200">
                                  {cert.uniqueIdentifier}
                                </code>
                              </div>
                              {cert.transactionHash && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">TX:</span>
                                  <code className="text-xs bg-white px-2 py-1 rounded text-gray-700 font-mono border border-gray-200 truncate max-w-xs">
                                    {cert.transactionHash}
                                  </code>
                                </div>
                              )}
                            </div>
                          )}
                          {cert.status === 'error' && (
                            <p className="text-xs text-red-600 mt-2">Error: {cert.errorMessage}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {cert.status === 'complete' && cert.explorerUrl && (
                            <>
                              <button
                                onClick={() => window.open(cert.explorerUrl, '_blank')}
                                className="flex items-center px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View TX
                              </button>
                              <button
                                onClick={() => {
                                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${cert.explorerUrl}`;
                                  window.open(qrUrl, '_blank');
                                }}
                                className="flex items-center px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                              >
                                <QrCode className="h-3 w-3 mr-1" />
                                QR
                              </button>
                            </>
                          )}
                          {cert.status === 'complete' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : cert.status === 'error' ? (
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={downloadUpdatedExcel}
                    className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download Excel with Blockchain Data
                  </button>
                  <button
                    onClick={() => {
                      setStep('upload');
                      setCertificates([]);
                      setExcelFile(null);
                      setDesignFile(null);
                      setProgress(0);
                      setProcessedCount(0);
                      setOrganization({
                        name: '',
                        email: '',
                        type: 'university',
                        contactName: ''
                      });
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Mint More Certificates
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}