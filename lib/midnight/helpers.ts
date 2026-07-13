/**
 * Midnight Network — Hash Alignment Helpers
 *
 * Pure, testable helpers for encoding and hashing certificate witness data.
 * These must produce identical output to the Compact contract's
 * `persistentHash<Vector<4, Bytes<64>>>` recomputation.
 *
 * Field widths must match the witness struct in
 * contracts/midnight-certs/src/certificate_proof.compact:
 *   recipient_name:   Bytes<64>
 *   credential_type:  Bytes<64>
 *   issue_date:       Bytes<64>
 *   institution_id:   Bytes<64>
 *
 * IMPORTANT: The Compact contract uses persistentHash (Poseidon hash over
 * a prime field), NOT SHA-256. The computeCertDataHash function below uses
 * SHA-256 as a placeholder until the Poseidon hash from @midnight-ntwrk
 * is wired in (Phase 13 hash alignment testing).
 */

export interface CertificateWitness {
  recipientName: string;
  credentialType: string;
  issueDate: string;
  institutionId: string;
}

import CryptoJS from 'crypto-js';

/** Byte widths matching the Compact contract witness struct (all Bytes<64>). */
export const FIELD_SIZES = {
  recipientName: 64,
  credentialType: 64,
  issueDate: 64,
  institutionId: 64,
} as const;

/**
 * Encode a UTF-8 string to fixed-length hex bytes, right-zero-padded.
 * Matches the Compact `pad(N, value)` behaviour where short strings
 * are zero-padded up to the target length.
 */
export function encodeBytes(value: string, length: number): string {
  const encoded = Buffer.from(value, 'utf8');
  const padded = Buffer.alloc(length, 0);
  encoded.copy(padded, 0, 0, Math.min(encoded.length, length));
  return padded.toString('hex');
}

/**
 * Compute the certificate data hash that gets stored on the Midnight ledger.
 *
 * TODO (Phase 13): Replace SHA-256 with the Poseidon persistentHash from
 * @midnight-ntwrk/compact-runtime to match the Compact contract exactly.
 * The Compact contract uses:
 *   persistentHash<Vector<4, Bytes<64>>>([
 *     w.recipient_name, w.credential_type, w.issue_date, w.institution_id
 *   ])
 *
 * Until then, this uses SHA-256 as a stand-in. The hash alignment test
 * in Phase 13 will verify correctness against the compiled contract.
 */
export async function computeCertDataHash(witness: CertificateWitness): Promise<string> {
  const data =
    encodeBytes(witness.recipientName, FIELD_SIZES.recipientName) +
    encodeBytes(witness.credentialType, FIELD_SIZES.credentialType) +
    encodeBytes(witness.issueDate, FIELD_SIZES.issueDate) +
    encodeBytes(witness.institutionId, FIELD_SIZES.institutionId);

  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const msgBuffer = Buffer.from(data, 'hex');
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    return Buffer.from(hashBuffer).toString('hex');
  }

  const { createHash } = await import('crypto');
  return createHash('sha256').update(Buffer.from(data, 'hex')).digest('hex');
}

/**
 * Deterministically map a LiteCert unique identifier (e.g. "FKF_KOM_01")
 * to a 32-byte hex value for use as `cert_id` on the Midnight ledger.
 */
export function certIdToBytes32(uniqueIdentifier: string): string {
  return CryptoJS.SHA256(uniqueIdentifier).toString();
}

/**
 * Derive a 32-byte institution key hash from the institution ID.
 * This is used as `institution_key_hash` on the Midnight ledger and
 * must match between issuance and revocation.
 */
export function deriveInstitutionKeyHash(institutionId: string): string {
  return CryptoJS.SHA256(institutionId).toString();
}
