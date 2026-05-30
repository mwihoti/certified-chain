import type { CertificateData } from '@/lib/domain/certificates';

const CARDANO_METADATA_TEXT_MAX_BYTES = 64;

interface LiteCertMetadataInput {
  certificateData: CertificateData;
  certificateHash: string;
  uniqueIdentifier: string;
  issuedAt?: string;
}

function textByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function chunkMetadataText(value: string): string | string[] {
  if (textByteLength(value) <= CARDANO_METADATA_TEXT_MAX_BYTES) return value;

  const chunks: string[] = [];
  let chunk = '';

  for (const char of value) {
    const next = `${chunk}${char}`;
    if (textByteLength(next) > CARDANO_METADATA_TEXT_MAX_BYTES) {
      chunks.push(chunk);
      chunk = char;
    } else {
      chunk = next;
    }
  }

  if (chunk) chunks.push(chunk);
  return chunks;
}

function requireMetadataText(value: string, fieldName: string): string {
  if (textByteLength(value) > CARDANO_METADATA_TEXT_MAX_BYTES) {
    throw new Error(`${fieldName} exceeds Cardano metadata text limit of 64 bytes.`);
  }
  return value;
}

export function buildLiteCertMetadata({
  certificateData,
  certificateHash,
  uniqueIdentifier,
  issuedAt = new Date().toISOString(),
}: LiteCertMetadataInput) {
  const metadata: Record<string, string | string[] | number> = {
    app: 'LiteCert',
    schemaVersion: 1,
    certificateId: requireMetadataText(uniqueIdentifier, 'Certificate identifier'),
    certificateHash: requireMetadataText(certificateHash, 'Certificate hash'),
    institutionName: chunkMetadataText(certificateData.institutionName),
    recipientName: chunkMetadataText(certificateData.recipientName),
    recipientEmail: chunkMetadataText(certificateData.recipientEmail),
    recipientPosition: chunkMetadataText(certificateData.recipientPosition),
    credentialType: chunkMetadataText(certificateData.credentialType),
    issueDate: requireMetadataText(certificateData.issueDate, 'Issue date'),
    issuedAt,
  };

  if (certificateData.expiryDate) {
    metadata.expiryDate = requireMetadataText(certificateData.expiryDate, 'Expiry date');
  }

  return metadata;
}
