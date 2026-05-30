import { isContractDeployed } from '@/lib/contracts/registry';
import { LITECERT_METADATA_LABEL } from '@/lib/contracts/config';
import { buildLiteCertMetadata } from '@/lib/contracts/metadata';
import { issueOnChain } from '@/lib/services/contract';
import {
  generateUniqueIdentifier,
  hashCertificateData,
  type CertificateData,
  type UniqueIdentifier,
} from '@/lib/domain/certificates';
import {
  buildCertificateIssuerCopyAssetName,
  buildCertificateIssuerCopyMintMetadata,
  buildCertificateNftAssetName,
  buildCertificateNftImageData,
  buildCertificateNftMintMetadata,
  buildCertificateNftSvg,
} from '@/lib/domain/certificate-nft';
export type { CertificateData, UniqueIdentifier } from '@/lib/domain/certificates';

interface SubmitCertificateOptions {
  certificateNumber?: string;
}

interface CertificateNftMintInput {
  certificateData: CertificateData;
  uniqueIdentifier: string;
  certificateHash: string;
  certificateNumber?: string;
  blockchainTxHash?: string;
}

export interface ExistingCertificateNftInput {
  uniqueIdentifier: string;
  certificateNumber: string;
  recipientName: string;
  recipientEmail: string;
  recipientPosition: string;
  credentialType: string;
  issueDate: string;
  expiryDate?: string;
  institutionId: string;
  institutionName: string;
  blockchainTxHash: string;
  certificateHash: string;
}

export interface CertificateNftTransferResult {
  txHash: string;
  assetName: string;
  assetUnit: string;
  recipientAddress: string;
  issuerCopy: {
    assetName: string;
    assetUnit?: string;
    minted: boolean;
  };
}

export interface BlockchainResult {
  txHash: string;
  txIndex: number;
  uniqueIdentifier: string;
  certificateHash: string;
  timestamp: number;
  nftAsset?: {
    assetName: string;
    image: string;
    policyId?: string;
    unit?: string;
  };
}
export { generateUniqueIdentifier, hashCertificateData };

function stringToHex(value: string): string {
  return Array.from(new TextEncoder().encode(value))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function uploadNftImageToIpfs(
  certificateData: CertificateData,
  uniqueIdentifier: string,
  certificateHash: string,
  certificateNumber?: string,
  blockchainTxHash?: string
): Promise<string> {
  let lastError = 'Could not pin NFT image to IPFS.';

  try {
    const response = await fetch(`/api/certificates/${encodeURIComponent(uniqueIdentifier)}/pin-nft-image`, {
      method: 'POST',
    });

    if (response.ok) {
      const data = await response.json();
      if (data.image) return data.image;
    }

    const error = await response.json().catch(() => null);
    lastError = error?.error || response.statusText || lastError;
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
    console.warn('[LiteCert] Certificate NFT image pin endpoint failed; trying direct image upload.', error);
  }

  try {
    const imageData = buildCertificateNftImageData({
      certificateData,
      uniqueIdentifier,
      certificateHash,
      certificateNumber,
      blockchainTxHash,
    });
    const svg = buildCertificateNftSvg(imageData);
    const file = new File([svg], `${buildCertificateNftAssetName(uniqueIdentifier)}.svg`, {
      type: 'image/svg+xml',
    });
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/uploadToPinata', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      lastError = error?.error || response.statusText || lastError;
      throw new Error(lastError);
    }

    const data = await response.json();
    if (data.imgHash) return `ipfs://${data.imgHash}`;
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
    console.warn('[LiteCert] Could not prepare NFT image for IPFS.', error);
  }

  throw new Error(
    `Certificate image must be pinned to IPFS before minting. Pinata upload failed: ${lastError}`
  );
}

async function mintCertificateNft(
  {
    certificateData,
    uniqueIdentifier,
    certificateHash,
    certificateNumber,
    blockchainTxHash,
  }: CertificateNftMintInput,
  wallet: any
): Promise<BlockchainResult> {
  const { ForgeScript, Transaction, resolveScriptHash } = await import('@meshsdk/core');
  const usedAddresses: string[] = await wallet.getUsedAddresses();
  const recipient = usedAddresses?.[0];

  if (!recipient) {
    throw new Error('No wallet address found. Please reconnect your wallet and try again.');
  }

  const forgeScript = ForgeScript.withOneSignature(recipient);
  const assetName = buildCertificateNftAssetName(uniqueIdentifier);
  const imageUrl = await uploadNftImageToIpfs(
    certificateData,
    uniqueIdentifier,
    certificateHash,
    certificateNumber,
    blockchainTxHash
  );
  const nftImageData = buildCertificateNftImageData({
    certificateData,
    uniqueIdentifier,
    certificateHash,
    certificateNumber,
    blockchainTxHash,
  });
  const nftMetadata = buildCertificateNftMintMetadata(nftImageData, imageUrl);
  const policyId = resolveScriptHash(forgeScript);
  const assetNameHex = stringToHex(assetName);

  const tx = new Transaction({ initiator: wallet })
    .mintAsset(forgeScript, {
      assetName,
      assetQuantity: '1',
      recipient,
      metadata: nftMetadata,
      label: '721',
    })
    .setMetadata(
      LITECERT_METADATA_LABEL,
      buildLiteCertMetadata({
        certificateData,
        certificateHash,
        uniqueIdentifier,
      })
    );

  const unsignedTx = await tx.build();
  const signedTx = await wallet.signTx(unsignedTx);
  const txHash = await wallet.submitTx(signedTx);

  return {
    txHash,
    txIndex: 0,
    uniqueIdentifier,
    certificateHash,
    timestamp: Date.now(),
    nftAsset: {
      assetName,
      image: imageUrl,
      policyId,
      unit: `${policyId}${assetNameHex}`,
    },
  };
}

export async function mintExistingCertificateNftToWallet(
  certificate: ExistingCertificateNftInput,
  wallet?: any
): Promise<BlockchainResult> {
  if (!wallet || typeof window === 'undefined') {
    throw new Error('A connected wallet is required to mint the certificate NFT.');
  }

  return mintCertificateNft(
    {
      certificateData: {
        recipientName: certificate.recipientName,
        recipientEmail: certificate.recipientEmail,
        recipientPosition: certificate.recipientPosition,
        credentialType: certificate.credentialType,
        issueDate: certificate.issueDate,
        expiryDate: certificate.expiryDate,
        institutionId: certificate.institutionId,
        institutionName: certificate.institutionName,
      },
      uniqueIdentifier: certificate.uniqueIdentifier,
      certificateHash: certificate.certificateHash,
      certificateNumber: certificate.certificateNumber,
      blockchainTxHash: certificate.blockchainTxHash,
    },
    wallet
  );
}

function getUtxoAssets(utxo: any): Array<{ unit: string; quantity: string }> {
  return utxo?.output?.amount ?? utxo?.amount ?? [];
}

export async function transferCertificateNftToWallet(
  certificate: ExistingCertificateNftInput,
  recipientAddress: string,
  wallet?: any
): Promise<CertificateNftTransferResult> {
  if (!wallet || typeof window === 'undefined') {
    throw new Error('Connect the institution wallet that currently holds this certificate NFT.');
  }

  const trimmedAddress = recipientAddress.trim();
  if (!trimmedAddress.startsWith('addr')) {
    throw new Error('Enter a valid Cardano recipient address.');
  }

  const { ForgeScript, Transaction, resolveScriptHash } = await import('@meshsdk/core');
  const usedAddresses: string[] = await wallet.getUsedAddresses();
  const issuerAddress = usedAddresses?.[0];

  if (!issuerAddress) {
    throw new Error('No institution wallet address found. Reconnect the wallet and try again.');
  }

  const assetName = buildCertificateNftAssetName(certificate.uniqueIdentifier);
  const assetNameHex = stringToHex(assetName);
  const issuerCopyAssetName = buildCertificateIssuerCopyAssetName(certificate.uniqueIdentifier);
  const issuerCopyAssetNameHex = stringToHex(issuerCopyAssetName);
  const utxos = await wallet.getUtxos();
  const asset = utxos
    .flatMap(getUtxoAssets)
    .find(
      (candidate: { unit: string; quantity: string }) =>
        candidate.unit !== 'lovelace' &&
        candidate.unit.endsWith(assetNameHex) &&
        BigInt(candidate.quantity || '0') > 0n
    );
  const issuerCopyAsset = utxos
    .flatMap(getUtxoAssets)
    .find(
      (candidate: { unit: string; quantity: string }) =>
        candidate.unit !== 'lovelace' &&
        candidate.unit.endsWith(issuerCopyAssetNameHex) &&
        BigInt(candidate.quantity || '0') > 0n
    );

  if (!asset) {
    throw new Error(
      `The connected wallet does not hold the NFT for ${certificate.uniqueIdentifier}. Connect the wallet that minted or received it.`
    );
  }

  let tx = new Transaction({ initiator: wallet }).sendAssets(trimmedAddress, [
    { unit: asset.unit, quantity: '1' },
  ]);
  let issuerCopyUnit = issuerCopyAsset?.unit;

  if (!issuerCopyAsset) {
    const certificateData: CertificateData = {
      recipientName: certificate.recipientName,
      recipientEmail: certificate.recipientEmail,
      recipientPosition: certificate.recipientPosition,
      credentialType: certificate.credentialType,
      issueDate: certificate.issueDate,
      expiryDate: certificate.expiryDate,
      institutionId: certificate.institutionId,
      institutionName: certificate.institutionName,
    };
    const imageUrl = await uploadNftImageToIpfs(
      certificateData,
      certificate.uniqueIdentifier,
      certificate.certificateHash,
      certificate.certificateNumber,
      certificate.blockchainTxHash
    );
    const nftImageData = buildCertificateNftImageData({
      certificateData,
      uniqueIdentifier: certificate.uniqueIdentifier,
      certificateHash: certificate.certificateHash,
      certificateNumber: certificate.certificateNumber,
      blockchainTxHash: certificate.blockchainTxHash,
    });
    const forgeScript = ForgeScript.withOneSignature(issuerAddress);
    const policyId = resolveScriptHash(forgeScript);
    issuerCopyUnit = `${policyId}${issuerCopyAssetNameHex}`;
    tx = tx.mintAsset(forgeScript, {
      assetName: issuerCopyAssetName,
      assetQuantity: '1',
      recipient: issuerAddress,
      metadata: buildCertificateIssuerCopyMintMetadata(nftImageData, imageUrl),
      label: '721',
    });
  }

  tx = tx.setMetadata(LITECERT_METADATA_LABEL, {
      app: 'LiteCert',
      action: 'transfer',
      id: certificate.uniqueIdentifier,
      issuerCopy: issuerCopyAsset ? 'already_exists' : 'minted',
    });

  const unsignedTx = await tx.build();
  const signedTx = await wallet.signTx(unsignedTx);
  const txHash = await wallet.submitTx(signedTx);

  return {
    txHash,
    assetName,
    assetUnit: asset.unit,
    recipientAddress: trimmedAddress,
    issuerCopy: {
      assetName: issuerCopyAssetName,
      assetUnit: issuerCopyUnit,
      minted: !issuerCopyAsset,
    },
  };
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
  wallet?: any,
  options: SubmitCertificateOptions = {}
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
      certificateData
    );

    return { txHash, txIndex, uniqueIdentifier, certificateHash, timestamp: Date.now() };
  }

  // --- Path 2: NFT minting fallback (until contract is built & deployed) ---
  console.warn(
    '[LiteCert] Contract not deployed — minting a certificate NFT with 674/721 metadata. ' +
    'Build the Aiken contract and set NEXT_PUBLIC_CONTRACT_COMPILED_CODE to enable ' +
    'trustless on-chain verification and revocation.'
  );

  return mintCertificateNft(
    {
      certificateData,
      uniqueIdentifier,
      certificateHash,
      certificateNumber: options.certificateNumber,
    },
    wallet
  );
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
    const entry = metadataList.find((m: any) => String(m.label) === String(LITECERT_METADATA_LABEL));
    const metadata = entry?.json_metadata;
    if (!metadata) return false;

    if (metadata.certificateId === uniqueIdentifier || metadata.id === uniqueIdentifier) return true;

    const msgs = Array.isArray(metadata.msg) ? metadata.msg : [];
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
