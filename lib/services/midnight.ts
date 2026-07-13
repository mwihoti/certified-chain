/**
 * Midnight Network — Privacy-Preserving Certificate Proofs
 *
 * This service generates and verifies ZK proofs for LiteCert certificates.
 * Zero-knowledge proofs allow:
 *   - Proving a certificate is valid WITHOUT revealing personal data
 *   - Proving credential type WITHOUT revealing the holder's name
 *   - Proving non-expiry WITHOUT revealing the exact issue date
 *
 * Prerequisite: Midnight toolchain installed + contract deployed to devnet/testnet
 *   https://docs.midnight.network/getting-started
 *
 * Until Midnight public testnet launches, this service runs against local devnet.
 * All proof generation runs client-side — the private witness never leaves the device.
 */

// Midnight network configuration
const MIDNIGHT_NETWORK = process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK || 'devnet';
const MIDNIGHT_NODE_URL =
  process.env.NEXT_PUBLIC_MIDNIGHT_NODE_URL || 'http://localhost:9944';
const MIDNIGHT_PROOF_SERVER_URL =
  process.env.NEXT_PUBLIC_MIDNIGHT_PROOF_SERVER_URL || 'http://localhost:6300';

// Contract deployment address (set after deploying certificate_proof.compact)
const MIDNIGHT_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_MIDNIGHT_CONTRACT_ADDRESS || '';

export type { CertificateWitness } from '@/lib/midnight/helpers';
export { computeCertDataHash } from '@/lib/midnight/helpers';
import { computeCertDataHash, encodeBytes, certIdToBytes32, deriveInstitutionKeyHash } from '@/lib/midnight/helpers';
import type { CertificateWitness } from '@/lib/midnight/helpers';

/** Lazily load the SDK to avoid importing native modules at module load time. */
async function getSdk() {
  return import('@/lib/midnight/sdk');
}

type MidnightConfig = {
  network: string;
  nodeUrl: string;
  proofServerUrl: string;
  contractAddress: string;
  mnemonic?: string;
  privateStatePassword?: string;
  zkArtifactsPath?: string;
};
type CircuitId = 'issue_certificate' | 'prove_validity' | 'prove_credential_type' | 'prove_not_expired' | 'revoke_certificate';

export interface ZKProof {
  proof: string;           // serialised ZK proof bytes (hex)
  publicInputs: string[];  // public inputs visible to the verifier
  circuit: string;         // which circuit generated this proof
}

export interface MidnightVerificationResult {
  verified: boolean;
  circuit: string;
  publicInputs: string[];
  error?: string;
}

function isMidnightAvailable(): boolean {
  return MIDNIGHT_CONTRACT_ADDRESS.length > 0;
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

function getConfig(): MidnightConfig {
  return {
    network: MIDNIGHT_NETWORK,
    nodeUrl: MIDNIGHT_NODE_URL,
    proofServerUrl: MIDNIGHT_PROOF_SERVER_URL,
    contractAddress: MIDNIGHT_CONTRACT_ADDRESS,
  };
}

// Issue a certificate on Midnight (called alongside Cardano TX issuance)
export async function issueOnMidnight(
  certId: string,
  witness: CertificateWitness,
  institutionKeyHash: string
): Promise<{ txHash: string }> {
  if (!isMidnightAvailable()) {
    throw new Error(
      'Midnight contract not deployed. ' +
      'Set NEXT_PUBLIC_MIDNIGHT_CONTRACT_ADDRESS in .env.local after deploying ' +
      'contracts/midnight-certs/src/certificate_proof.compact'
    );
  }

  const certDataHash = await computeCertDataHash(witness);
  const config = getConfig();

  // Convert hex strings to Uint8Array as expected by the compiled contract
  const certIdBytes = hexToUint8Array(certIdToBytes32(certId));
  const certDataHashBytes = hexToUint8Array(certDataHash);
  const institutionKeyHashBytes = hexToUint8Array(institutionKeyHash);
  const issuedAt = BigInt(Math.floor(Date.now() / 1000));

  const { callCircuit } = await getSdk();
  const result = await callCircuit(
    config,
    'issue_certificate',
    certIdBytes,
    certDataHashBytes,
    institutionKeyHashBytes,
    issuedAt
  );

  return { txHash: result.hash };
}

// Generate a ZK proof that a certificate is valid (no personal data revealed)
export async function proveValidity(
  certId: string,
  witness: CertificateWitness
): Promise<ZKProof> {
  if (!isMidnightAvailable()) {
    throw new Error('Midnight contract not deployed.');
  }

  const config = getConfig();

  // Convert to Uint8Array as expected by the compiled contract
  const certIdBytes = hexToUint8Array(certIdToBytes32(certId));

  // Note: proveCircuit is a placeholder that throws until the full
  // proof generation pipeline is implemented. The proof generation
  // requires creating an unproven transaction and using the proof provider.
  const { proveCircuit } = await getSdk();
  const result = await proveCircuit(config, 'prove_validity', certIdBytes);

  return {
    proof: result.proof,
    publicInputs: result.publicInputs,
    circuit: 'prove_validity',
  };
}

// Generate a ZK proof of a specific credential type
export async function proveCredentialType(
  certId: string,
  requiredCredentialType: string,
  witness: CertificateWitness
): Promise<ZKProof> {
  if (!isMidnightAvailable()) {
    throw new Error('Midnight contract not deployed.');
  }

  const config = getConfig();

  // Convert to Uint8Array as expected by the compiled contract
  const certIdBytes = hexToUint8Array(certIdToBytes32(certId));
  const credentialTypeBytes = hexToUint8Array(encodeBytes(requiredCredentialType, 64));

  const { proveCircuit } = await getSdk();
  const result = await proveCircuit(config, 'prove_credential_type', certIdBytes, credentialTypeBytes);

  return {
    proof: result.proof,
    publicInputs: result.publicInputs,
    circuit: 'prove_credential_type',
  };
}

// Verify a ZK proof submitted by a certificate holder
export async function verifyZKProof(zkProof: ZKProof): Promise<MidnightVerificationResult> {
  if (!isMidnightAvailable()) {
    return {
      verified: false,
      circuit: zkProof.circuit,
      publicInputs: zkProof.publicInputs,
      error: 'Midnight contract not deployed.',
    };
  }

  try {
    const config = getConfig();
    const circuitId = zkProof.circuit as CircuitId;

    // Note: verifyProof is a placeholder that throws until the full
    // verification pipeline is implemented using compact-runtime verifier.
    const { verifyProof } = await getSdk();
    const verified = await verifyProof(config, circuitId, zkProof.proof, zkProof.publicInputs);

    return { verified, circuit: zkProof.circuit, publicInputs: zkProof.publicInputs };
  } catch (error: any) {
    return {
      verified: false,
      circuit: zkProof.circuit,
      publicInputs: zkProof.publicInputs,
      error: error?.message || 'Verification failed',
    };
  }
}

// Generate a ZK proof that a certificate was issued before a given timestamp
// and has not been revoked — without revealing the actual issue date.
export async function proveNotExpired(
  certId: string,
  expiryTimestamp: number,
  witness: CertificateWitness
): Promise<ZKProof> {
  if (!isMidnightAvailable()) {
    throw new Error('Midnight contract not deployed.');
  }

  const config = getConfig();

  // Convert to Uint8Array as expected by the compiled contract
  const certIdBytes = hexToUint8Array(certIdToBytes32(certId));
  const expiryTimestampBig = BigInt(expiryTimestamp);

  const { proveCircuit } = await getSdk();
  const result = await proveCircuit(config, 'prove_not_expired', certIdBytes, expiryTimestampBig);

  return {
    proof: result.proof,
    publicInputs: result.publicInputs,
    circuit: 'prove_not_expired',
  };
}

// Revoke a certificate on Midnight (requires institution key)
export async function revokeOnMidnight(
  certId: string,
  institutionKeyHash: string
): Promise<{ txHash: string }> {
  if (!isMidnightAvailable()) {
    throw new Error('Midnight contract not deployed.');
  }

  const config = getConfig();

  // Convert hex strings to Uint8Array as expected by the compiled contract
  const certIdBytes = hexToUint8Array(certIdToBytes32(certId));
  const institutionKeyHashBytes = hexToUint8Array(institutionKeyHash);

  const { callCircuit } = await getSdk();
  const result = await callCircuit(config, 'revoke_certificate', certIdBytes, institutionKeyHashBytes);

  return { txHash: result.hash };
}

export function isMidnightConfigured(): boolean {
  return isMidnightAvailable();
}
