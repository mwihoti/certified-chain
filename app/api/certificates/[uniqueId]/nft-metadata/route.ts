import { NextRequest, NextResponse } from 'next/server';
import {
  buildCertificateNftMetadata,
} from '@/lib/domain/certificate-nft';
import { queryOne } from '@/lib/server/db';
import { logEvent } from '@/lib/server/logger';
import {
  certificateNftSelectSql,
  issuanceJobNftSelectSql,
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

    const certificate = toCertificateNftImageDataFromRow(row);
    const imageUrl = `${request.nextUrl.origin}/api/certificates/${encodeURIComponent(
      certificate.uniqueIdentifier
    )}/nft-image`;

    return NextResponse.json(buildCertificateNftMetadata(certificate, imageUrl));
  } catch (error) {
    logEvent('error', 'certificate.nft_metadata_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: 'Failed to render NFT metadata' }, { status: 500 });
  }
}
