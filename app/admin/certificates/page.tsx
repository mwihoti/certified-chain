'use client';

import { useState, useEffect } from 'react';
import { BlockfrostProvider } from '@meshsdk/core';
import { Loader2, Search, ExternalLink, AlertCircle, Shield } from 'lucide-react';

// Validate and initialize Blockfrost Provider for Preview network
const BLOCKFROST_API_KEY = process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID;

// Log API key status in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  if (!BLOCKFROST_API_KEY || BLOCKFROST_API_KEY === 'previewYourProjectIdHere') {
    console.warn('⚠️ Blockfrost API key not configured! Please add NEXT_PUBLIC_BLOCKFROST_PROJECT_ID to .env.local');
  } else {
    console.log('✅ Blockfrost API key loaded:', BLOCKFROST_API_KEY.substring(0, 10) + '...');
  }
}

const provider = new BlockfrostProvider(
  BLOCKFROST_API_KEY || 'previewYourProjectIdHere'
);

const ORG_ADDRESS = 'addr_test1qp967yv0ztrs8yzlj5nwe0vycfvfk72y4ee39rahfzh4623s6c29ckuqkha96h0wlkgjnhc858k45mqn0tzfcthfxvaspq7p48';

interface Certificate {
  uniqueId: string;
  assetUnit: string;
  name: string;
  recipientName: string;
  credentialType: string;
  issueDate: string;
  expiryDate?: string;
  organization: string;
  txHash?: string;
  explorerUrl?: string;
  image?: string;
  description?: string;
  error?: string;
}

// Helper function to parse CIP-25 metadata and add to certificate list
function parseAndAddCertificate(
  nftData: any,
  assetName: string,
  policyId: string,
  txHash: string,
  list: Certificate[]
) {
  const props = nftData.properties || {};
  const assetUnit = policyId ? policyId + assetName : assetName;

  // Deduplicate by unique identification or name+recipient
  const uniqueId = props.uniqueIdentifier || nftData.name?.split(' - ')[0] || assetUnit.slice(-8);
  if (list.some(c => c.uniqueId === uniqueId)) return;

  list.push({
    uniqueId: uniqueId,
    assetUnit: assetUnit,
    name: nftData.name || 'Certificate',
    recipientName: props.recipientName || 'Unknown',
    credentialType: props.credentialType || 'N/A',
    issueDate: props.issueDate || 'N/A',
    expiryDate: props.expiryDate,
    organization: props.organization || 'Unknown Organization',
    image: nftData.image,
    description: nftData.description,
    txHash: txHash,
    explorerUrl: `https://preview.cardanoscan.io/transaction/${txHash}`,
  });

  console.log('✅ Parsed certificate:', nftData.name);
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCertificates() {
      try {
        setLoading(true);
        setError(null);

        // Check if API key is configured
        if (!BLOCKFROST_API_KEY || BLOCKFROST_API_KEY === 'previewYourProjectIdHere') {
          console.error('❌ Blockfrost API key not configured');
          setError('Blockfrost API key not configured. Please add NEXT_PUBLIC_BLOCKFROST_PROJECT_ID to your .env.local file.');
          setCertificates([]);
          setLoading(false);
          return;
        }

        console.log('🔍 Fetching transactions from address:', ORG_ADDRESS);
        console.log('📡 Using Blockfrost API key:', BLOCKFROST_API_KEY.substring(0, 10) + '...');

        // 1. Get all transactions from the organization's address
        // This is a minting address, so certificates are in transaction metadata
        let transactions;
        try {
          // Fetch transactions (this might need pagination for many transactions)
          transactions = await provider.fetchAddressTxs(ORG_ADDRESS);
          console.log('📦 Raw transactions response from Blockfrost:', transactions);
          console.log('📊 Response type:', typeof transactions);
          console.log('📋 Is array?', Array.isArray(transactions));
        } catch (fetchError: any) {
          console.error('❌ Error fetching transactions:', fetchError);
          console.error('Error details:', {
            message: fetchError.message,
            status: fetchError.status,
            statusText: fetchError.statusText
          });

          let errorMessage = 'Failed to fetch transactions from Blockfrost. ';

          if (fetchError.message?.includes('Invalid API key') || fetchError.status === 403) {
            errorMessage += 'Your API key appears to be invalid. Please verify it at blockfrost.io';
          } else if (fetchError.message?.includes('project_id') || fetchError.status === 401) {
            errorMessage += 'Authentication failed. Please check your API key in .env.local';
          } else if (fetchError.status === 404) {
            errorMessage += 'Address not found on the blockchain. This might be a network mismatch (ensure you\'re using a Preview network API key).';
          } else {
            errorMessage += fetchError.message || 'Unknown error. Check browser console for details.';
          }

          setError(errorMessage);
          setCertificates([]);
          return;
        }

        // Check if transactions is undefined or null
        if (!transactions) {
          console.error('❌ No transactions returned from provider (undefined/null)');
          setError('No response from Blockfrost. Please verify your API key is valid and for the Preview network.');
          setCertificates([]);
          return;
        }

        // Check if transactions is an array
        if (!Array.isArray(transactions)) {
          console.error('❌ Transactions is not an array:', typeof transactions);
          console.error('Actual response:', JSON.stringify(transactions, null, 2));
          setError(`Invalid response from Blockfrost (expected array, got ${typeof transactions}). Check console for details.`);
          setCertificates([]);
          return;
        }

        // If empty array
        if (transactions.length === 0) {
          console.log('ℹ️ No transactions at this address');
          setError('No transactions found at this address yet.');
          setCertificates([]);
          return;
        }

        console.log(`✅ Found ${transactions.length} transactions`);

        const certList: Certificate[] = [];

        // 2. For each transaction, fetch metadata and look for CIP-25 (label 721)
        for (const tx of transactions.slice(0, 50)) { // Limit to 50 most recent to avoid too many API calls
          try {
            console.log('🔍 Fetching metadata for transaction:', tx.tx_hash);

            // Fetch transaction info including metadata
            const txInfo = await provider.fetchTxInfo(tx.tx_hash);

            if (!txInfo || !txInfo.metadata) {
              console.log('No metadata found for', tx.tx_hash);
              continue;
            }

            console.log('📊 Metadata found labels:', Object.keys(txInfo.metadata));

            // Look for CIP-25 metadata (label 721)
            // It might be top-level or nested under label 0
            let metadata721 = txInfo.metadata['721'];

            if (!metadata721 && txInfo.metadata['0']) {
              console.log('🔎 Checking Label 0 for nested 721 metadata');
              metadata721 = (txInfo.metadata['0'] as any)?.['721'];
            }

            if (!metadata721) {
              // Try to find ANY key named '721' in any label
              for (const label of Object.keys(txInfo.metadata)) {
                const labelData = txInfo.metadata[label];
                if (labelData && typeof labelData === 'object' && '721' in labelData) {
                  console.log(`🔎 Found 721 nested under Label ${label}`);
                  metadata721 = (labelData as any)['721'];
                  break;
                }
              }
            }

            if (!metadata721) {
              console.log('No CIP-25 (721) metadata in', tx.tx_hash);
              continue;
            }

            console.log('📜 Found CIP-25 metadata in transaction:', tx.tx_hash);

            // Parse the metadata structure
            // 1. Standard CIP-25: { "721": { "<policy_id>": { "<asset_name>": { ... } } } }
            // 2. Flatter format (sometimes used): { "721": { "<asset_name>": { ... } } }

            for (const key of Object.keys(metadata721)) {
              const value = metadata721[key];

              if (!value || typeof value !== 'object') continue;

              // Check if this level is already the NFT data (has 'name' property)
              if ('name' in value && typeof value.name === 'string') {
                const nftData = value as any;
                const assetName = key;

                parseAndAddCertificate(nftData, assetName, '', tx.tx_hash, certList);
              } else {
                // It might be a policy ID level
                for (const assetName of Object.keys(value)) {
                  const nftData = (value as any)[assetName];
                  if (nftData && typeof nftData === 'object' && 'name' in nftData) {
                    parseAndAddCertificate(nftData, assetName, key, tx.tx_hash, certList);
                  }
                }
              }
            }
          } catch (err) {
            console.error('Error fetching metadata for transaction', tx.tx_hash, err);
          }
        }

        console.log(`🎉 Successfully parsed ${certList.length} certificates from transactions`);
        setCertificates(certList);

        if (certList.length === 0) {
          setError('Found transactions but no certificate metadata. Make sure certificates follow CIP-25 standard with label 721.');
        }

      } catch (err: any) {
        console.error('Failed to fetch certificates:', err);
        setError(
          err.message ||
          'Failed to load certificates. Please check your Blockfrost API key and ensure the address is valid.'
        );
        setCertificates([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCertificates();
  }, []);

  const filteredCerts = certificates.filter(cert =>
    cert.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.credentialType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Loading certificates from blockchain...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto py-8 px-4 max-w-6xl">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Issued Certificates</h1>
          </div>
          <p className="text-gray-600">
            All blockchain-verified certificates minted from this organization address
          </p>
          <p className="text-xs text-gray-500 mt-2 font-mono break-all">
            Address: {ORG_ADDRESS}
          </p>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Error Display */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Notice</p>
              <p className="text-sm mt-1">{error}</p>
              <p className="text-xs mt-2 text-amber-700">
                If you just minted certificates, they may take a few minutes to appear on the blockchain.
              </p>
            </div>
          </div>
        )}

        {/* Search */}
        {certificates.length > 0 && (
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by name, ID or credential type..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Showing {filteredCerts.length} of {certificates.length} certificates
            </p>
          </div>
        )}

        {/* Certificates Grid */}
        {certificates.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Shield className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Certificates Yet</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              No certificates have been minted to this address yet. Once you mint certificates through the admin portal, they will appear here.
            </p>
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No certificates found matching "{searchTerm}"
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCerts.map((cert, idx) => (
              <div
                key={cert.uniqueId + idx}
                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {cert.name}
                  </h3>
                  {cert.description && (
                    <p className="text-gray-600 mb-4 text-sm">{cert.description}</p>
                  )}

                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500 font-medium">Recipient</dt>
                      <dd className="text-gray-900">{cert.recipientName}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 font-medium">Unique ID</dt>
                      <dd className="font-mono text-blue-700 text-xs bg-blue-50 px-2 py-1 rounded inline-block">
                        {cert.uniqueId}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 font-medium">Credential Type</dt>
                      <dd className="text-gray-900">{cert.credentialType}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 font-medium">Issue Date</dt>
                      <dd className="text-gray-900">{cert.issueDate}</dd>
                    </div>
                    {cert.expiryDate && (
                      <div>
                        <dt className="text-gray-500 font-medium">Expires</dt>
                        <dd className="text-gray-900">{cert.expiryDate}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-100">
                  <span className="text-xs text-gray-500 truncate max-w-[150px]">
                    {cert.organization}
                  </span>
                  {cert.explorerUrl && (
                    <a
                      href={cert.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
                    >
                      View <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Debug Info (remove in production) */}
        {process.env.NODE_ENV === 'development' && certificates.length > 0 && (
          <details className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
            <summary className="cursor-pointer font-mono text-gray-600">
              Debug Info (Development Only)
            </summary>
            <pre className="mt-2 overflow-auto">
              {JSON.stringify(certificates, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}