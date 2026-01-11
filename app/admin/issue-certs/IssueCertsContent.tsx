"use client";

import { useState, useEffect } from 'react';
import { useWallet } from '@meshsdk/react';
import { CardanoWallet } from '@meshsdk/react';
import {
  ArrowLeft,
  Wallet,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  FileSpreadsheet,
  QrCode,
  ExternalLink,
  Menu,
  X,
  Home,
  FileText,
  Shield,
  Loader
} from 'lucide-react';
import { set } from 'react-hook-form';

// Mock data and functions (replace with your actual implementations)
const mockPendingOrgs = [
  {
    id: '1',
    name: 'Tech University',
    email: 'admin@techuni.edu',
    type: 'university',
    contactName: 'John Doe',
    numberOfCerts: 25,
    submittedAt: '2024-01-15T10:00:00Z',
    status: 'pending'
  },
  {
    id: '2',
    name: 'Business School',
    email: 'contact@bizschool.edu',
    type: 'school',
    contactName: 'Jane Smith',
    numberOfCerts: 15,
    submittedAt: '2024-01-14T14:30:00Z',
    status: 'pending'
  }
];

const mockCertificates = [
  {
    recipientName: 'Alice Johnson',
    recipientEmail: 'alice@example.com',
    recipientPosition: 'Graduate Student',
    credentialType: 'Master of Science',
    issueDate: '2024-01-15',
    expiryDate: '2029-01-15',
    status: 'pending'
  },
  {
    recipientName: 'Bob Wilson',
    recipientEmail: 'bob@example.com',
    recipientPosition: 'PhD Candidate',
    credentialType: 'Doctor of Philosophy',
    issueDate: '2024-01-15',
    expiryDate: '2029-01-15',
    status: 'pending'
  }
];

export default function IssueCertsContent() {
  const { connected, wallet, connecting, name } = useWallet();

  const [walletName, setWalletName] = useState('');
  const [pendingOrgs, setPendingOrgs] = useState(mockPendingOrgs);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [step, setStep] = useState('select');
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get Wallet address when connected
  useEffect(() => {
    async function getAddress(){      
    
    if (connected && wallet) {
      try {
        const addresses = await wallet.getUsedAddresses();
        if (addresses && addresses.length > 0) {
          setWalletAddress(addresses[0]);
              }
    } catch (error) {
      console.error("Error getting wallet address:", error);
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

  

  const handleSelectOrganization = (org) => {
    setSelectedOrg(org);
    setCertificates(mockCertificates.map(cert => ({ ...cert, status: 'pending' })));
    setStep('review');
  };

  const processCertificates = async () => {
    setStep('processing');
    setProcessedCount(0);
    setProgress(0);

    for (let i = 0; i < certificates.length; i++) {
      setCertificates(prev => prev.map((c, idx) =>
        idx === i ? { ...c, status: 'processing' } : c
      ));

      // Simulate blockchain minting
      await new Promise(resolve => setTimeout(resolve, 2000));

      const uniqueIdentifier = `CERT-${selectedOrg.id}-${Date.now()}-${i}`;
      const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      const qrCodeUrl = `https://cardanoscan.io/transaction/${transactionHash}`;

      setCertificates(prev => prev.map((c, idx) =>
        idx === i ? {
          ...c,
          status: 'complete',
          uniqueIdentifier,
          transactionHash,
          qrCodeUrl
        } : c
      ));

      setProcessedCount(i + 1);
      setProgress(((i + 1) / certificates.length) * 100);
    }

    setStep('complete');
  };

  const downloadResults = () => {
    alert('Downloading Excel file with blockchain data...');
  };

  const getStatusBadge = (status) => {
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
            {/* Logo */}
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Lite-Cert</span>
            </div>

            {/* Desktop Navigation */}
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

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:text-gray-900"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lite-Cert Admin Portal</h1>
          <p className="text-gray-600">
            Issue certificates for pending organizations using Cardano blockchain
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Wallet Connection</h3>
            <p className="text-sm text-gray-600 mt-1">
              Connect your Eternl wallet to mint certificates on the blockchain
            </p>
          </div>
          <div className="p-6">
            {!connected ? (
              <div className="space-y-4">
                <div className='flex flex-wrap gap-2'>
                  <CardanoWallet />
                  </div>
                  {connecting && (
                    <div className='flex items-center gap-2 text-blue-600'>
                      <Loader className="h-4 w-4 animate-spin" />
                      <span>Connecting to wallet...</span>
                  </div>
                  )};


                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-md">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    You must connect your wallet to issue certificates
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Wallet Connected: {name}</span>
                </div>
               {walletAddress && (
                <div className='p-3 bg-gray-50 rounded-md'>
                  <p className='text-xs text-gray-600 mb-1'>Address:</p>
                  <code className='text-xs text-gray-800'>{walletAddress}</code>
               
              </div>
               
            )}
          </div>
            )}
          </div>
        </div>

        {/* Organization Selection */}
        {step === 'select' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Pending Organizations</h3>
              <p className="text-sm text-gray-600 mt-1">
                Select an organization to process their certificate requests
              </p>
            </div>
            <div className="p-6">
              {pendingOrgs.length === 0 ? (
                <div className="text-center py-12">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No pending organizations</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificates</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingOrgs.map((org) => (
                        <tr key={org.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="font-medium text-gray-900">{org.name}</p>
                              <p className="text-sm text-gray-500">{org.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap capitalize text-gray-900">
                            {org.type.replace('_', ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">{org.contactName}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {org.numberOfCerts}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                            {new Date(org.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleSelectOrganization(org)}
                              disabled={!connected}
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                              Process
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Certificate Review */}
        {step === 'review' && selectedOrg && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Review Certificates - {selectedOrg.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Review the certificates before minting them on the blockchain
              </p>
            </div>
            <div className="p-6">
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Organization:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedOrg.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Contact:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedOrg.contactName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Certificates:</span>
                    <span className="ml-2 font-medium text-gray-900">{certificates.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2 font-medium text-gray-900">Ready to Process</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credential</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {certificates.map((cert, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{cert.recipientName}</p>
                            <p className="text-sm text-gray-500">{cert.recipientEmail}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-900">{cert.recipientPosition}</td>
                        <td className="px-6 py-4 text-gray-900">{cert.credentialType}</td>
                        <td className="px-6 py-4 text-gray-900">{cert.issueDate}</td>
                        <td className="px-6 py-4">{getStatusBadge(cert.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={processCertificates}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Mint {certificates.length} Certificates
                </button>
                <button
                  onClick={() => {
                    setStep('select');
                    setSelectedOrg(null);
                    setCertificates([]);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing */}
        {step === 'processing' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Minting Certificates</h3>
              <p className="text-sm text-gray-600 mt-1">
                Creating NFT certificates on the Cardano blockchain...
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {certificates.map((cert, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-900">{cert.recipientName}</td>
                        <td className="px-6 py-4">
                          {cert.uniqueIdentifier ? (
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-800">
                              {cert.uniqueIdentifier}
                            </code>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {cert.status === 'complete' ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>Complete</span>
                            </div>
                          ) : index === processedCount ? (
                            <div className="flex items-center gap-2 text-blue-600">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Minting...</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">Pending</span>
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

        {/* Complete */}
        {step === 'complete' && selectedOrg && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-8">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Certificates Minted Successfully!</h3>
                  <p className="text-gray-600">
                    {certificates.length} certificates for {selectedOrg.name} have been created on the blockchain.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-6 space-y-4">
                  <h4 className="font-semibold text-gray-900">Certificate Details</h4>
                  {certificates.slice(0, 3).map((cert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{cert.recipientName}</p>
                        <code className="text-xs text-gray-600">{cert.uniqueIdentifier}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(cert.qrCodeUrl, '_blank')}
                          className="flex items-center px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <QrCode className="h-4 w-4 mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => window.open(`https://cardanoscan.io/transaction/${cert.transactionHash}`, '_blank')}
                          className="flex items-center px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          TX
                        </button>
                      </div>
                    </div>
                  ))}
                  {certificates.length > 3 && (
                    <p className="text-sm text-gray-500">
                      + {certificates.length - 3} more certificates
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={downloadResults}
                    className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Updated Excel
                  </button>
                  <button
                    onClick={() => {
                      setStep('select');
                      setSelectedOrg(null);
                      setCertificates([]);
                      setProgress(0);
                      setProcessedCount(0);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Process Another Organization
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