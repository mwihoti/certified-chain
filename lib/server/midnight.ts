/**
 * Server-side Midnight Network operations.
 *
 * These functions run on the server (API routes) and use a server-managed
 * wallet to anchor certificate records on the Midnight ledger.
 *
 * Client-side proof generation lives in lib/services/midnight.ts.
 */

import { certIdToBytes32, deriveInstitutionKeyHash } from '@/lib/midnight/helpers';

const MIDNIGHT_NETWORK = process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK || 'devnet';
const MIDNIGHT_NODE_URL =
  process.env.NEXT_PUBLIC_MIDNIGHT_NODE_URL || 'http://localhost:9944';
const MIDNIGHT_PROOF_SERVER_URL =
  process.env.NEXT_PUBLIC_MIDNIGHT_PROOF_SERVER_URL || 'http://localhost:6300';
const MIDNIGHT_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_MIDNIGHT_CONTRACT_ADDRESS || '';
const MIDNIGHT_DEPLOYER_MNEMONIC = process.env.MIDNIGHT_DEPLOYER_MNEMONIC || '';

export function isMidnightServerConfigured(): boolean {
  return MIDNIGHT_CONTRACT_ADDRESS.length > 0 && MIDNIGHT_DEPLOYER_MNEMONIC.length > 0;
}

/**
 * Convert a hex string to Uint8Array.
 */
function hexToUint8Array(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function getServerConfig() {
  return {
    network: MIDNIGHT_NETWORK,
    nodeUrl: MIDNIGHT_NODE_URL,
    proofServerUrl: MIDNIGHT_PROOF_SERVER_URL,
    contractAddress: MIDNIGHT_CONTRACT_ADDRESS,
    mnemonic: MIDNIGHT_DEPLOYER_MNEMONIC,
  };
}

/**
 * Lazily load the SDK to avoid importing native modules (level) at module load time.
 */
async function getSdk() {
  const sdk = await import('@/lib/midnight/sdk');
  return sdk;
}

/**
 * Issue a certificate on the Midnight ledger.
 * Called after Cardano persistence succeeds — errors here must not
 * roll back the Cardano transaction.
 *
 * Contract signature:
 *   issue_certificate(cert_id: Uint8Array, cert_data_hash: Uint8Array,
 *                     institution_key_hash: Uint8Array, issued_at: bigint)
 */
export async function issueCertificateOnMidnight(job: {
  unique_identifier: string;
  institution_id: string;
  midnight_cert_id: string;
  midnight_cert_data_hash: string;
}): Promise<{ txHash: string }> {
  if (!isMidnightServerConfigured()) {
    throw new Error('Midnight not configured (missing contract address or deployer mnemonic).');
  }

  const { callCircuit } = await getSdk();
  const config = getServerConfig();
  const institutionKeyHash = deriveInstitutionKeyHash(job.institution_id);

  // Convert hex strings to Uint8Array as expected by the compiled contract
  const certId = hexToUint8Array(job.midnight_cert_id);
  const certDataHash = hexToUint8Array(job.midnight_cert_data_hash);
  const institutionKeyHashBytes = hexToUint8Array(institutionKeyHash);
  const issuedAt = BigInt(Math.floor(Date.now() / 1000));

  const result = await callCircuit(
    config,
    'issue_certificate',
    certId,
    certDataHash,
    institutionKeyHashBytes,
    issuedAt
  );

  return { txHash: result.hash };
}

/**
 * Revoke a certificate on the Midnight ledger.
 * Called after Cardano revocation succeeds — errors here must not
 * roll back the Cardano revocation.
 *
 * Contract signature:
 *   revoke_certificate(cert_id: Uint8Array, institution_key_hash: Uint8Array)
 */
export async function revokeCertificateOnMidnight(
  uniqueIdentifier: string,
  institutionId: string
): Promise<{ txHash: string }> {
  if (!isMidnightServerConfigured()) {
    throw new Error('Midnight not configured (missing contract address or deployer mnemonic).');
  }

  const { callCircuit } = await getSdk();
  const config = getServerConfig();
  const certId = certIdToBytes32(uniqueIdentifier);
  const institutionKeyHash = deriveInstitutionKeyHash(institutionId);

  // Convert hex strings to Uint8Array as expected by the compiled contract
  const certIdBytes = hexToUint8Array(certId);
  const institutionKeyHashBytes = hexToUint8Array(institutionKeyHash);

  const result = await callCircuit(
    config,
    'revoke_certificate',
    certIdBytes,
    institutionKeyHashBytes
  );

  return { txHash: result.hash };
}
