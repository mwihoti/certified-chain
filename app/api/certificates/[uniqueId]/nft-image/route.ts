import { NextRequest, NextResponse } from 'next/server';
import { buildCertificateNftSvg } from '@/lib/domain/certificate-nft';
import { queryOne } from '@/lib/server/db';
import { logEvent } from '@/lib/server/logger';
import {
  buildCertificateQrCodeSvg,
  certificateNftSelectSql,
  issuanceJobNftSelectSql,
  resolveEmbeddableOrganizationLogoUrl,
  toCertificateNftImageDataFromRow,
} from '@/lib/server/certificate-nft';

export const dynamic = 'force-dynamic';

export async function GET(
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

    return new NextResponse(buildCertificateNftSvg(certificate), {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    logEvent('error', 'certificate.nft_image_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: 'Failed to render NFT image' }, { status: 500 });
  }
}
