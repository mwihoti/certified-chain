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

// Private witness — never sent to chain, used only for local ZK proof generation
export interface CertificateWitness {
  recipientName: string;
  credentialType: string;
  issueDate: string;
  institutionId: string;
}

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

// Encode string to fixed-length hex bytes (Compact Bytes<N> format)
function encodeBytes(value: string, length: number): string {
  const encoded = Buffer.from(value, 'utf8');
  const padded = Buffer.alloc(length, 0);
  encoded.copy(padded, 0, 0, Math.min(encoded.length, length));
  return padded.toString('hex');
}

// Compute the certificate data hash that gets stored on Midnight
// Must match the persistent_hash<"LiteCert"> in the Compact contract
export async function computeCertDataHash(witness: CertificateWitness): Promise<string> {
  const data =
    encodeBytes(witness.recipientName, 64) +
    encodeBytes(witness.credentialType, 64) +
    encodeBytes(witness.issueDate, 16) +
    encodeBytes(witness.institutionId, 32);

  // Use SubtleCrypto (browser) or Node crypto for SHA-256
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const msgBuffer = Buffer.from(data, 'hex');
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    return Buffer.from(hashBuffer).toString('hex');
  }

  // Node.js fallback
  const { createHash } = await import('crypto');
  return createHash('sha256').update(Buffer.from(data, 'hex')).digest('hex');
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

  // Dynamic import — Midnight SDK is client-side only
  const { MidnightProvider, ContractClient } = await import('@midnight-ntwrk/sdk').catch(() => {
    throw new Error(
      '@midnight-ntwrk/sdk is not installed. ' +
      'Run: pnpm add @midnight-ntwrk/sdk'
    );
  });

  const provider = new MidnightProvider({
    network: MIDNIGHT_NETWORK,
    nodeUrl: MIDNIGHT_NODE_URL,
    proofServerUrl: MIDNIGHT_PROOF_SERVER_URL,
  });

  const contract = new ContractClient({
    provider,
    address: MIDNIGHT_CONTRACT_ADDRESS,
  });

  const tx = await contract.call('issue_certificate', {
    cert_id: certId,
    cert_data_hash: certDataHash,
    institution_key_hash: institutionKeyHash,
  });

  await tx.submit();
  return { txHash: tx.hash };
}

// Generate a ZK proof that a certificate is valid (no personal data revealed)
export async function proveValidity(
  certId: string,
  witness: CertificateWitness
): Promise<ZKProof> {
  if (!isMidnightAvailable()) {
    throw new Error('Midnight contract not deployed.');
  }

  const { MidnightProvider, ContractClient } = await import('@midnight-ntwrk/sdk').catch(() => {
    throw new Error('@midnight-ntwrk/sdk is not installed. Run: pnpm add @midnight-ntwrk/sdk');
  });

  const provider = new MidnightProvider({
    network: MIDNIGHT_NETWORK,
    nodeUrl: MIDNIGHT_NODE_URL,
    proofServerUrl: MIDNIGHT_PROOF_SERVER_URL,
  });

  const contract = new ContractClient({
    provider,
    address: MIDNIGHT_CONTRACT_ADDRESS,
  });

  // Proof generation runs locally — witness stays on device
  const result = await contract.prove('prove_validity', {
    cert_id: certId,
    witness: {
      recipient_name: encodeBytes(witness.recipientName, 64),
      credential_type: encodeBytes(witness.credentialType, 64),
      issue_date: encodeBytes(witness.issueDate, 16),
      institution_id: encodeBytes(witness.institutionId, 32),
    },
  });

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

  const { MidnightProvider, ContractClient } = await import('@midnight-ntwrk/sdk').catch(() => {
    throw new Error('@midnight-ntwrk/sdk is not installed. Run: pnpm add @midnight-ntwrk/sdk');
  });

  const provider = new MidnightProvider({
    network: MIDNIGHT_NETWORK,
    nodeUrl: MIDNIGHT_NODE_URL,
    proofServerUrl: MIDNIGHT_PROOF_SERVER_URL,
  });

  const contract = new ContractClient({
    provider,
    address: MIDNIGHT_CONTRACT_ADDRESS,
  });

  const result = await contract.prove('prove_credential_type', {
    cert_id: certId,
    required_credential_type: encodeBytes(requiredCredentialType, 64),
    witness: {
      recipient_name: encodeBytes(witness.recipientName, 64),
      credential_type: encodeBytes(witness.credentialType, 64),
      issue_date: encodeBytes(witness.issueDate, 16),
      institution_id: encodeBytes(witness.institutionId, 32),
    },
  });

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
    const { MidnightProvider, ContractClient } = await import('@midnight-ntwrk/sdk').catch(() => {
      throw new Error('@midnight-ntwrk/sdk is not installed.');
    });

    const provider = new MidnightProvider({
      network: MIDNIGHT_NETWORK,
      nodeUrl: MIDNIGHT_NODE_URL,
      proofServerUrl: MIDNIGHT_PROOF_SERVER_URL,
    });

    const contract = new ContractClient({
      provider,
      address: MIDNIGHT_CONTRACT_ADDRESS,
    });

    const verified = await contract.verify(zkProof.circuit, {
      proof: zkProof.proof,
      publicInputs: zkProof.publicInputs,
    });

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

export function isMidnightConfigured(): boolean {
  return isMidnightAvailable();
}
