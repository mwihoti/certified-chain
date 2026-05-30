import { NextRequest, NextResponse } from 'next/server';
import {
  buildCertificateNftAssetName,
  buildCertificateNftSvg,
} from '@/lib/domain/certificate-nft';
import { queryOne } from '@/lib/server/db';
import { logEvent } from '@/lib/server/logger';
import { pinFileToIpfs } from '@/lib/server/pinata';
import {
  buildCertificateQrCodeSvg,
  certificateNftSelectSql,
  issuanceJobNftSelectSql,
  resolveEmbeddableOrganizationLogoUrl,
  toCertificateNftImageDataFromRow,
} from '@/lib/server/certificate-nft';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    const { uniqueId } = await params;
    const decodedUniqueId = decodeURIComponent(uniqueId);
    let row = await queryOne<any>(certificateNftSelectSql, [decodedUniqueId]);
    if (!row) {
      row = await queryOne<any>(issuanceJobNftSelectSql, [decodedUniqueId]);
    }

    if (!row) {
      return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });
    }

    const imageUrl = `${request.nextUrl.origin}/api/certificates/${encodeURIComponent(
      decodedUniqueId
    )}/nft-image`;
    const organizationLogoUrl = await resolveEmbeddableOrganizationLogoUrl(row.organization_image_name);
    const certificate = toCertificateNftImageDataFromRow(row, {
      imageUrl,
      qrCodeSvg: buildCertificateQrCodeSvg(imageUrl),
      organizationLogoUrl,
    });
    const svg = buildCertificateNftSvg(certificate);
    const file = new File(
      [svg],
      `${buildCertificateNftAssetName(certificate.uniqueIdentifier)}.svg`,
      { type: 'image/svg+xml' }
    );
    const data = await pinFileToIpfs(file, {
      uniqueIdentifier: certificate.uniqueIdentifier,
      source: 'certificate_nft_image',
    });

    return NextResponse.json({
      success: true,
      image: `ipfs://${data.imgHash}`,
      imgHash: data.imgHash,
      pinSize: data.pinSize,
      timestamp: data.timestamp,
    });
  } catch (error) {
    logEvent('error', 'certificate.nft_image_pin_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to pin NFT image' },
      { status: 500 }
    );
  }
}
