export interface CertificateNftImageData {
  uniqueIdentifier: string;
  certificateNumber: string;
  recipientName: string;
  recipientEmail?: string | null;
  recipientPosition: string;
  credentialType: string;
  issueDate: string;
  expiryDate?: string | null;
  institutionName: string;
  blockchainTxHash: string;
  certificateHash: string;
  status: 'valid' | 'revoked' | 'expired';
  organizationLogoUrl?: string | null;
  imageUrl?: string | null;
  qrCodeSvg?: string | null;
}

export function buildCertificateNftAssetName(uniqueIdentifier: string): string {
  return uniqueIdentifier.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'LiteCert';
}

export function buildCertificateIssuerCopyAssetName(uniqueIdentifier: string): string {
  const suffix = '_ISSUER_COPY';
  const base = uniqueIdentifier.replace(/[^a-zA-Z0-9_-]/g, '') || 'LiteCert';
  return `${base.slice(0, 32 - suffix.length)}${suffix}`;
}

export function buildCertificateNftImageData(input: {
  certificateData: {
    recipientName: string;
    recipientEmail?: string;
    recipientPosition: string;
    credentialType: string;
    issueDate: string;
    expiryDate?: string;
    institutionName: string;
  };
  uniqueIdentifier: string;
  certificateHash: string;
  certificateNumber?: string;
  blockchainTxHash?: string;
  status?: 'valid' | 'revoked' | 'expired';
  organizationLogoUrl?: string | null;
  imageUrl?: string | null;
  qrCodeSvg?: string | null;
}): CertificateNftImageData {
  return {
    uniqueIdentifier: input.uniqueIdentifier,
    certificateNumber: input.certificateNumber || input.uniqueIdentifier,
    recipientName: input.certificateData.recipientName,
    recipientEmail: input.certificateData.recipientEmail,
    recipientPosition: input.certificateData.recipientPosition,
    credentialType: input.certificateData.credentialType,
    issueDate: input.certificateData.issueDate,
    expiryDate: input.certificateData.expiryDate,
    institutionName: input.certificateData.institutionName,
    blockchainTxHash: input.blockchainTxHash || 'Mint transaction pending',
    certificateHash: input.certificateHash,
    status: input.status || 'valid',
    organizationLogoUrl: input.organizationLogoUrl,
    imageUrl: input.imageUrl,
    qrCodeSvg: input.qrCodeSvg,
  };
}

function escapeXml(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'No expiry';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function truncateMiddle(value: string, visible = 12): string {
  if (value.length <= visible * 2 + 3) return value;
  return `${value.slice(0, visible)}...${value.slice(-visible)}`;
}

function toRenderableImageUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('ipfs://')) {
    return `https://gateway.pinata.cloud/ipfs/${trimmed.slice('ipfs://'.length)}`;
  }

  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('data:image/')
  ) {
    return trimmed;
  }

  return null;
}

function wrapText(value: string, maxChars: number, maxLines = 2): string[] {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines;

  const clipped = lines.slice(0, maxLines);
  clipped[maxLines - 1] = `${clipped[maxLines - 1].slice(0, Math.max(0, maxChars - 1))}...`;
  return clipped;
}

function textLines(lines: string[], x: number, y: number, fontSize: number, lineHeight: number, attrs = '') {
  return lines
    .map((line, index) => {
      return `<text x="${x}" y="${y + lineHeight * index}" font-size="${fontSize}" ${attrs}>${escapeXml(line)}</text>`;
    })
    .join('');
}

function embedSvgMarkup(markup: string | null | undefined): string {
  if (!markup) return '';
  return markup
    .replace(/<\?xml[^>]*>\s*/i, '')
    .replace(/<!doctype[^>]*>\s*/i, '')
    .replace(/\r?\n/g, ' ')
    .trim();
}

function defaultLogoMarkup() {
  return `
    <circle cx="800" cy="220" r="58" fill="url(#seal)"/>
    <circle cx="800" cy="220" r="41" fill="none" stroke="#fff8d7" stroke-width="3"/>
    <text x="800" y="211" text-anchor="middle" font-family="Arial, sans-serif" font-size="19" font-weight="700" fill="#fff8d7">LITE</text>
    <text x="800" y="237" text-anchor="middle" font-family="Arial, sans-serif" font-size="19" font-weight="700" fill="#fff8d7">CERT</text>
  `;
}

export function buildCertificateNftSvg(certificate: CertificateNftImageData): string {
  const recipientLines = wrapText(certificate.recipientName, 28, 2);
  const credentialLines = wrapText(certificate.credentialType, 34, 2);
  const institutionLines = wrapText(certificate.institutionName, 42, 2);
  const roleLines = wrapText(certificate.recipientPosition, 42, 2);
  const statusText =
    certificate.status === 'valid' ? 'BLOCKCHAIN VERIFIED' : certificate.status.toUpperCase();
  const statusFill = certificate.status === 'valid' ? '#0f7b4f' : '#172033';
  const logoUrl = toRenderableImageUrl(certificate.organizationLogoUrl);
  const qrMarkup = embedSvgMarkup(certificate.qrCodeSvg);
  const recipientUnderlineY = recipientLines.length > 1 ? 725 : 690;
  const detailY = recipientLines.length > 1 ? 780 : 745;
  const roleY = recipientLines.length > 1 ? 830 : 795;
  const credentialY = recipientLines.length > 1 ? 915 : 880;
  const logoMarkup = logoUrl
    ? `<rect x="714" y="166" width="172" height="108" rx="18" fill="#ffffff" stroke="#d7b956" stroke-width="3"/>
       <image href="${escapeXml(logoUrl)}" x="734" y="184" width="132" height="72" preserveAspectRatio="xMidYMid meet"/>`
    : defaultLogoMarkup();
  const qrBlock = qrMarkup
    ? `<g transform="translate(1224 978)">${qrMarkup}</g>`
    : `<rect x="1224" y="978" width="132" height="132" fill="#ffffff" stroke="#d1d5db"/>
       <text x="1290" y="1036" text-anchor="middle" font-size="15" font-weight="700" fill="#64748b">QR</text>
       <text x="1290" y="1058" text-anchor="middle" font-size="12" fill="#64748b">available</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200" viewBox="0 0 1600 1200" role="img" aria-label="LiteCert NFT certificate for ${escapeXml(certificate.recipientName)}">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="56%" stop-color="#f7fbff"/>
      <stop offset="100%" stop-color="#fff6de"/>
    </linearGradient>
    <linearGradient id="seal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d6a928"/>
      <stop offset="100%" stop-color="#8a6500"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#0f172a" flood-opacity="0.18"/>
    </filter>
  </defs>

  <rect width="1600" height="1200" fill="#e9eef6"/>
  <rect x="70" y="70" width="1460" height="1060" rx="18" fill="url(#paper)" filter="url(#shadow)"/>
  <rect x="105" y="105" width="1390" height="990" fill="none" stroke="#0f172a" stroke-width="14"/>
  <rect x="132" y="132" width="1336" height="936" fill="none" stroke="#b88900" stroke-width="4"/>
  <rect x="160" y="160" width="1280" height="880" fill="none" stroke="#0f172a" stroke-width="2" opacity="0.26"/>

  <path d="M160 235 L235 160 M1365 160 L1440 235 M160 965 L235 1040 M1365 1040 L1440 965" stroke="#b88900" stroke-width="7" fill="none" stroke-linecap="round"/>
  ${logoMarkup}

  <g font-family="Arial, sans-serif" text-anchor="middle">
    ${textLines(institutionLines, 800, 330, 24, 30, 'text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" letter-spacing="4" fill="#8a6500"')}
    <text x="800" y="420" font-family="Georgia, serif" font-size="76" font-weight="700" letter-spacing="3" fill="#0f172a">CERTIFICATE</text>
    <text x="800" y="474" font-family="Georgia, serif" font-size="34" font-style="italic" fill="#334155">of ${escapeXml(certificate.credentialType)}</text>
    <line x1="600" y1="505" x2="1000" y2="505" stroke="#b88900" stroke-width="4"/>
  </g>

  <g font-family="Arial, sans-serif" text-anchor="middle">
    <text x="800" y="570" font-size="24" letter-spacing="5" fill="#475569">THIS CERTIFIES THAT</text>
    ${textLines(recipientLines, 800, 645, 60, 68, 'text-anchor="middle" font-family="Georgia, serif" font-weight="700" fill="#0f172a"')}
    <line x1="410" y1="${recipientUnderlineY}" x2="1190" y2="${recipientUnderlineY}" stroke="#94a3b8" stroke-width="2"/>
    <text x="800" y="${detailY}" font-size="27" fill="#334155">has been issued this credential as</text>
    ${textLines(roleLines, 800, roleY, 29, 36, 'text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" fill="#0f172a"')}
    ${textLines(credentialLines, 800, credentialY, 39, 46, 'text-anchor="middle" font-family="Georgia, serif" font-weight="700" fill="#8a6500"')}
  </g>

  <g font-family="Arial, sans-serif" font-size="21" fill="#334155">
    <text x="230" y="965" font-weight="700" fill="#0f172a">Issued</text>
    <text x="230" y="998">${escapeXml(formatDate(certificate.issueDate))}</text>
    <text x="620" y="965" font-weight="700" fill="#0f172a">Certificate No.</text>
    <text x="620" y="998" font-family="monospace">${escapeXml(certificate.certificateNumber || certificate.uniqueIdentifier)}</text>
    <text x="1085" y="965" font-weight="700" fill="#0f172a">Expiry</text>
    <text x="1085" y="998">${escapeXml(formatDate(certificate.expiryDate))}</text>
  </g>

  <g font-family="Arial, sans-serif">
    <rect x="198" y="1028" width="952" height="118" rx="16" fill="#f8fafc" stroke="#cbd5e1"/>
    <circle cx="235" cy="1060" r="12" fill="${statusFill}"/>
    <text x="262" y="1068" font-size="20" font-weight="700" fill="${statusFill}">${statusText}</text>
    <text x="222" y="1104" font-size="17" fill="#475569">Unique ID</text>
    <text x="328" y="1104" font-size="18" font-family="monospace" fill="#0f172a">${escapeXml(certificate.uniqueIdentifier)}</text>
    <text x="570" y="1104" font-size="17" fill="#475569">TX</text>
    <text x="612" y="1104" font-size="18" font-family="monospace" fill="#0f172a">${escapeXml(truncateMiddle(certificate.blockchainTxHash, 13))}</text>
    <text x="222" y="1132" font-size="17" fill="#475569">Hash</text>
    <text x="328" y="1132" font-size="18" font-family="monospace" fill="#0f172a">${escapeXml(truncateMiddle(certificate.certificateHash, 20))}</text>
    <rect x="1196" y="950" width="188" height="196" rx="16" fill="#ffffff" stroke="#cbd5e1"/>
    ${qrBlock}
    <text x="1290" y="1132" text-anchor="middle" font-size="16" font-weight="700" fill="#0f172a">Scan certificate image</text>
  </g>
</svg>`;
}

export function buildCertificateNftMetadata(
  certificate: CertificateNftImageData,
  imageUrl: string,
  policyId = 'POLICY_ID_PENDING'
) {
  const assetName = buildCertificateNftAssetName(certificate.uniqueIdentifier);

  return {
    '721': {
      [policyId]: {
        [assetName]: {
          name: `LiteCert ${certificate.uniqueIdentifier}`,
          image: imageUrl,
          mediaType: 'image/svg+xml',
          description: `Blockchain certificate issued by ${certificate.institutionName}`,
          files: [
            {
              name: `${assetName}.svg`,
              mediaType: 'image/svg+xml',
              src: imageUrl,
            },
          ],
          certificateId: certificate.uniqueIdentifier,
          certificateNumber: certificate.certificateNumber,
          institutionName: certificate.institutionName,
          certificateHash: certificate.certificateHash,
          status: certificate.status,
        },
      },
    },
  };
}

function truncateMetadataText(value: string, maxLength = 64): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}...`;
}

export function buildCertificateNftMintMetadata(
  certificate: CertificateNftImageData,
  imageUrl: string
) {
  const assetName = buildCertificateNftAssetName(certificate.uniqueIdentifier);

  return {
    name: `LiteCert ${certificate.uniqueIdentifier}`,
    image: imageUrl,
    mediaType: 'image/svg+xml',
    description: truncateMetadataText(`Certificate issued by ${certificate.institutionName}`),
    files: [
      {
        name: `${assetName}.svg`,
        mediaType: 'image/svg+xml',
        src: imageUrl,
      },
    ],
    attributes: {
      certificateId: certificate.uniqueIdentifier,
      certificateNumber: truncateMetadataText(certificate.certificateNumber),
      institutionName: truncateMetadataText(certificate.institutionName),
      certificateHash: certificate.certificateHash,
      status: certificate.status,
    },
  };
}

export function buildCertificateIssuerCopyMintMetadata(
  certificate: CertificateNftImageData,
  imageUrl: string
) {
  const assetName = buildCertificateIssuerCopyAssetName(certificate.uniqueIdentifier);
  const officialAssetName = buildCertificateNftAssetName(certificate.uniqueIdentifier);

  return {
    name: truncateMetadataText(`LiteCert ${certificate.uniqueIdentifier} Issuer Copy`),
    image: imageUrl,
    mediaType: 'image/svg+xml',
    description: truncateMetadataText(`Issuer archive copy for ${certificate.uniqueIdentifier}`),
    files: [
      {
        name: `${assetName}.svg`,
        mediaType: 'image/svg+xml',
        src: imageUrl,
      },
    ],
    attributes: {
      copyType: 'issuer_copy',
      officialAssetName,
      certificateId: certificate.uniqueIdentifier,
      certificateNumber: truncateMetadataText(certificate.certificateNumber),
      institutionName: truncateMetadataText(certificate.institutionName),
      certificateHash: certificate.certificateHash,
      status: certificate.status,
    },
  };
}
