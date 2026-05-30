import { createRequire } from 'node:module';
import type { CertificateNftImageData } from '@/lib/domain/certificate-nft';

const require = createRequire(import.meta.url);
const QRCode = require('qrcode-svg') as new (options: {
  content: string;
  width: number;
  height: number;
  padding?: number;
  color?: string;
  background?: string;
  join?: boolean;
}) => { svg: () => string };

const logoDataUriCache = new Map<string, string | null>();

function normalizeOrganizationLogoUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith('ipfs://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('data:image/')
  ) {
    return trimmed;
  }

  return null;
}

function toGatewayUrl(value: string): string {
  return value.startsWith('ipfs://')
    ? `https://gateway.pinata.cloud/ipfs/${value.slice('ipfs://'.length)}`
    : value;
}

export async function resolveEmbeddableOrganizationLogoUrl(
  value: string | null | undefined
): Promise<string | null> {
  const normalized = normalizeOrganizationLogoUrl(value);
  if (!normalized) return null;
  if (normalized.startsWith('data:image/')) return normalized;

  const cached = logoDataUriCache.get(normalized);
  if (cached !== undefined) return cached;

  try {
    const response = await fetch(toGatewayUrl(normalized), {
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      logoDataUriCache.set(normalized, normalized);
      return normalized;
    }

    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() || '';
    if (!contentType.startsWith('image/')) {
      logoDataUriCache.set(normalized, null);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > 1_500_000) {
      logoDataUriCache.set(normalized, normalized);
      return normalized;
    }

    const dataUri = `data:${contentType};base64,${buffer.toString('base64')}`;
    logoDataUriCache.set(normalized, dataUri);
    return dataUri;
  } catch {
    logoDataUriCache.set(normalized, normalized);
    return normalized;
  }
}

export function buildCertificateQrCodeSvg(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  return new QRCode({
    content: trimmed,
    width: 132,
    height: 132,
    padding: 1,
    color: '#111827',
    background: '#ffffff',
    join: true,
  }).svg();
}

export function toCertificateNftImageDataFromRow(
  row: any,
  options: {
    imageUrl?: string | null;
    qrCodeSvg?: string | null;
    organizationLogoUrl?: string | null;
  } = {}
): CertificateNftImageData {
  return {
    uniqueIdentifier: row.unique_identifier,
    certificateNumber: row.certificate_number,
    recipientName: row.recipient_name,
    recipientEmail: row.recipient_email,
    recipientPosition: row.recipient_position,
    credentialType: row.credential_type,
    issueDate: row.issue_date,
    expiryDate: row.expiry_date,
    institutionName: row.institution_name,
    blockchainTxHash: row.blockchain_tx_hash || 'Mint transaction pending',
    certificateHash: row.certificate_hash,
    status: row.status === 'revoked' || row.status === 'expired' ? row.status : 'valid',
    organizationLogoUrl:
      options.organizationLogoUrl ?? normalizeOrganizationLogoUrl(row.organization_image_name),
    imageUrl: options.imageUrl,
    qrCodeSvg: options.qrCodeSvg,
  };
}

export const certificateNftSelectSql = `
  select c.*, o.organization_image_name
  from certificates c
  left join organizations o on o.id = c.institution_id
  where c.unique_identifier = $1
  limit 1
`;

export const issuanceJobNftSelectSql = `
  select j.*, o.organization_image_name
  from issuance_jobs j
  left join organizations o on o.id = j.institution_id
  where j.unique_identifier = $1
  limit 1
`;
