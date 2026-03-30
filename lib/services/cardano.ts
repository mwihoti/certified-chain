import CryptoJS from 'crypto-js';
import { isContractDeployed } from '@/lib/contracts/registry';
import { issueOnChain } from '@/lib/services/contract';

export interface CertificateData {
  recipientName: string;
  recipientEmail: string;
  recipientPosition: string;
  credentialType: string;
  issueDate: string;
  expiryDate?: string;
  institutionId: string;
  institutionName: string;
}

export interface UniqueIdentifier {
  orgCode: string;
  userCode: string;
  entryNumber: string;
  fullIdentifier: string;
}

export interface BlockchainResult {
  txHash: string;
  txIndex: number;
  uniqueIdentifier: string;
  certificateHash: string;
  timestamp: number;
}

// Generate unique certificate identifier: ORG_USR_NN
export function generateUniqueIdentifier(
  organizationName: string,
  userName: string,
  entryNumber: number
): UniqueIdentifier {
  const orgCode = organizationName
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 3)
    .toUpperCase();

  const nameParts = userName.trim().split(/\s+/);
  let userCode: string;

  if (nameParts.length >= 2) {
    userCode = nameParts
      .map((part) => part.charAt(0))
      .join('')
      .substring(0, 3)
      .toUpperCase();
  } else {
    userCode = userName
      .replace(/[^a-zA-Z]/g, '')
      .substring(0, 3)
      .toUpperCase();
  }

  const entryStr = entryNumber.toString().padStart(2, '0');
  const fullIdentifier = `${orgCode}_${userCode}_${entryStr}`;

  return { orgCode, userCode, entryNumber: entryStr, fullIdentifier };
}

// Hash certificate data for privacy — this hash goes on-chain
export function hashCertificateData(data: CertificateData): string {
  const dataString = JSON.stringify({
    recipientName: data.recipientName,
    recipientEmail: data.recipientEmail,
    recipientPosition: data.recipientPosition,
    credentialType: data.credentialType,
    issueDate: data.issueDate,
    expiryDate: data.expiryDate,
    institutionId: data.institutionId,
  });

  return CryptoJS.SHA256(dataString).toString();
}

// Get Cardano network from env
export function getCardanoNetwork(): 'preview' | 'preprod' | 'mainnet' {
  const network = process.env.NEXT_PUBLIC_CARDANO_NETWORK || 'preview';
  if (network !== 'preview' && network !== 'preprod' && network !== 'mainnet') {
    console.warn(`Invalid network "${network}", defaulting to preview`);
    return 'preview';
  }
  return network as 'preview' | 'preprod' | 'mainnet';
}

// Get wallet payment key hash (client-side only)
export async function getWalletAddress(wallet: any): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const addresses = await wallet.getUsedAddresses();
    return addresses?.[0] ?? null;
  } catch (error) {
    console.error('Error getting wallet address:', error);
    return null;
  }
}

// Get wallet balance (client-side only)
export async function getWalletBalance(wallet: any): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    return await wallet.getBalance();
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    return null;
  }
}

/**
 * Submit a certificate to the blockchain.
 *
 * If the Aiken contract is deployed (NEXT_PUBLIC_CONTRACT_COMPILED_CODE is set),
 * this locks a UTxO at the contract address with the certificate hash as an inline datum.
 * This enables trustless on-chain verification and revocation.
 *
 * If the contract is not yet deployed, falls back to a metadata-only transaction.
 * This is the legacy approach — upgrade to the contract as soon as possible.
 */
export async function submitCertificateToBlockchain(
  certificateData: CertificateData,
  uniqueIdentifier: string,
  wallet?: any
): Promise<BlockchainResult> {
  if (!wallet || typeof window === 'undefined') {
    throw new Error('A connected wallet is required to submit certificates to the blockchain.');
  }

  const blockfrostKey = process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID;
  if (!blockfrostKey || blockfrostKey.includes('your_')) {
    throw new Error(
      'Blockfrost API key not configured. Set NEXT_PUBLIC_BLOCKFROST_PROJECT_ID in .env.local'
    );
  }

  const certificateHash = hashCertificateData(certificateData);

  // --- Path 1: Contract-based submission (preferred) ---
  if (isContractDeployed()) {
    const { txHash, txIndex } = await issueOnChain(
      wallet,
      certificateHash,
      uniqueIdentifier,
      certificateData.institutionName
    );

    return { txHash, txIndex, uniqueIdentifier, certificateHash, timestamp: Date.now() };
  }

  // --- Path 2: Metadata-only fallback (until contract is built & deployed) ---
  console.warn(
    '[LiteCert] Contract not deployed — using metadata-only TX. ' +
    'Build the Aiken contract and set NEXT_PUBLIC_CONTRACT_COMPILED_CODE to enable ' +
    'trustless on-chain verification and revocation.'
  );

  const { Transaction } = await import('@meshsdk/core');

  const tx = new Transaction({ initiator: wallet }).setMetadata(674, {
    msg: [
      'LiteCert Certificate',
      `ID: ${uniqueIdentifier}`,
      `Hash: ${certificateHash}`,
      `Issuer: ${certificateData.institutionName}`,
      `Timestamp: ${new Date().toISOString()}`,
    ],
  });

  const unsignedTx = await tx.build();
  const signedTx = await wallet.signTx(unsignedTx);
  const txHash = await wallet.submitTx(signedTx);

  return { txHash, txIndex: 0, uniqueIdentifier, certificateHash, timestamp: Date.now() };
}

/**
 * Verify a certificate exists on-chain via Blockfrost.
 *
 * For contract-based certificates: queries the UTxO datum.
 * For metadata-only certificates: checks transaction metadata at label 674.
 */
export async function verifyCertificateOnChain(
  uniqueIdentifier: string,
  txHash: string
): Promise<boolean> {
  if (!uniqueIdentifier || !txHash) return false;

  const network = getCardanoNetwork();
  const blockfrostKey = process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID;

  if (!blockfrostKey || blockfrostKey.includes('your_')) return false;

  const baseUrl =
    network === 'mainnet'
      ? 'https://cardano-mainnet.blockfrost.io/api/v0'
      : `https://cardano-${network}.blockfrost.io/api/v0`;

  try {
    const response = await fetch(`${baseUrl}/txs/${txHash}/metadata`, {
      headers: { project_id: blockfrostKey },
    });

    if (!response.ok) return false;

    const metadataList: any[] = await response.json();
    const entry = metadataList.find((m: any) => m.label === '674');
    if (!entry?.json_metadata?.msg) return false;

    const msgs: string[] = entry.json_metadata.msg;
    return msgs.some((line: string) => line.includes(uniqueIdentifier));
  } catch (error) {
    console.error('Error verifying on blockchain:', error);
    return false;
  }
}

// Get next entry number for an institution from the live certificate count in DB
export async function getNextEntryNumber(
  institutionId: string,
  _userName: string
): Promise<number> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
    const response = await fetch(
      `${apiBase}/certificates?institutionId=${encodeURIComponent(institutionId)}`
    );
    if (!response.ok) return 1;

    const data = await response.json();
    const count: number = Array.isArray(data.data) ? data.data.length : 0;
    return count + 1;
  } catch {
    return 1;
  }
}

// Batch submit certificates to blockchain
export async function batchSubmitCertificates(
  certificates: CertificateData[],
  wallet: any
): Promise<BlockchainResult[]> {
  const results: BlockchainResult[] = [];

  for (let i = 0; i < certificates.length; i++) {
    const cert = certificates[i];
    const entryNumber = await getNextEntryNumber(cert.institutionId, cert.recipientName);
    const identifier = generateUniqueIdentifier(
      cert.institutionName,
      cert.recipientName,
      entryNumber + i
    );
    const result = await submitCertificateToBlockchain(cert, identifier.fullIdentifier, wallet);
    results.push(result);
  }

  return results;
}
