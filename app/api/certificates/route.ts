import { NextRequest, NextResponse } from 'next/server';
import { requireInstitutionContext, requireSuperAdminContext, getSessionContext } from '@/lib/server/auth';
import { logEvent } from '@/lib/server/logger';
import { buildCertificateNumber } from '@/lib/domain/certificates';
import {
  certificateLookupSchema,
  certificateUpdateSchema,
  revokeCertificateSchema,
} from '@/lib/validation/certificates';
import { isUniqueViolation, queryOne, queryRows } from '@/lib/server/db';
import { revokeCertificateOnMidnight, isMidnightServerConfigured } from '@/lib/server/midnight';

export const dynamic = 'force-dynamic';

function toRecord(row: any) {
  return {
    id: row.id,
    uniqueIdentifier: row.unique_identifier,
    certificateNumber: row.certificate_number,
    recipientName: row.recipient_name,
    recipientEmail: row.recipient_email,
    recipientPosition: row.recipient_position,
    credentialType: row.credential_type,
    issueDate: row.issue_date,
    expiryDate: row.expiry_date,
    institutionId: row.institution_id,
    institutionName: row.institution_name,
    blockchainTxHash: row.blockchain_tx_hash,
    blockchainTxIndex: row.blockchain_tx_index ?? 0,
    certificateHash: row.certificate_hash,
    midnightTxHash: row.midnight_tx_hash,
    midnightCertId: row.midnight_cert_id,
    midnightRevokeTxHash: row.midnight_revoke_tx_hash,
    status: row.status,
    revokedAt: row.revoked_at,
    revokedReason: row.revoked_reason,
    revokeTxHash: row.revoke_tx_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Internal server error';
  const status =
    message === 'Authentication required'
      ? 401
      : message.includes('access required')
        ? 403
        : 500;

  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const context = await getSessionContext();
    const { searchParams } = new URL(request.url);
    const parsed = certificateLookupSchema.parse({
      uniqueId: searchParams.get('uniqueId') ?? undefined,
      certNumber: searchParams.get('certNumber') ?? undefined,
      institutionId: searchParams.get('institutionId') ?? undefined,
    });

    if (parsed.uniqueId) {
      const data = await queryOne<any>(
        'select * from certificates where unique_identifier = $1 limit 1',
        [parsed.uniqueId]
      );

      if (!data) {
        return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: toRecord(data) });
    }

    if (parsed.certNumber) {
      const data = await queryOne<any>(
        'select * from certificates where certificate_number = $1 limit 1',
        [parsed.certNumber]
      );

      if (!data) {
        return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: toRecord(data) });
    }

    if (!context.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required for certificate listings' },
        { status: 401 }
      );
    }

    const filters: string[] = [];
    const params: string[] = [];

    if (context.role === 'super_admin') {
      if (parsed.institutionId) {
        params.push(parsed.institutionId);
        filters.push(`institution_id = $${params.length}`);
      }
    } else {
      if (!context.institutionId) {
        return NextResponse.json({ success: false, error: 'Institution metadata missing' }, { status: 403 });
      }
      params.push(context.institutionId);
      filters.push(`institution_id = $${params.length}`);
    }

    const whereClause = filters.length > 0 ? `where ${filters.join(' and ')}` : '';
    const data = await queryRows<any>(
      `select * from certificates ${whereClause} order by created_at desc`,
      params
    );

    return NextResponse.json({ success: true, data: data.map(toRecord) });
  } catch (error) {
    logEvent('error', 'certificates.get_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireInstitutionContext();
    const body = await request.json();

    if (!body.uniqueIdentifier || !body.recipientName || !body.blockchainTxHash || !body.certificateHash) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const institutionId =
      context.role === 'super_admin'
        ? body.institutionId
        : context.institutionId;

    const institutionName =
      context.role === 'super_admin'
        ? body.institutionName
        : context.institutionName;

    if (!institutionId || !institutionName) {
      return NextResponse.json({ success: false, error: 'Institution context is required' }, { status: 400 });
    }

    const certificateNumber =
      body.certificateNumber || buildCertificateNumber(institutionName, Date.now() % 100000);

    let data: any;
    try {
      data = await queryOne<any>(
        `insert into certificates (
          unique_identifier,
          certificate_number,
          recipient_name,
          recipient_email,
          recipient_position,
          credential_type,
          issue_date,
          expiry_date,
          institution_id,
          institution_name,
          blockchain_tx_hash,
          blockchain_tx_index,
          certificate_hash,
          status
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'valid')
        returning *`,
        [
          body.uniqueIdentifier,
          certificateNumber,
          body.recipientName,
          body.recipientEmail,
          body.recipientPosition,
          body.credentialType,
          body.issueDate,
          body.expiryDate || null,
          institutionId,
          institutionName,
          body.blockchainTxHash,
          body.blockchainTxIndex ?? 0,
          body.certificateHash,
        ]
      );
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      return NextResponse.json(
        { success: false, error: 'Certificate with this unique identifier already exists' },
        { status: 409 }
      );
    }

    logEvent('info', 'certificate.created', {
      actorId: context.user.id,
      institutionId,
      uniqueIdentifier: body.uniqueIdentifier,
    });

    return NextResponse.json({ success: true, data: toRecord(data) }, { status: 201 });
  } catch (error) {
    logEvent('error', 'certificates.create_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const context = await requireInstitutionContext();
    const parsed = certificateUpdateSchema.parse(await request.json());

    const params = [
      parsed.status,
      parsed.revokedAt ?? null,
      parsed.revokedReason ?? null,
      parsed.uniqueIdentifier,
    ];
    const filters = ['unique_identifier = $4'];

    if (context.role !== 'super_admin') {
      params.push(context.institutionId!);
      filters.push(`institution_id = $${params.length}`);
    }

    const data = await queryOne<any>(
      `update certificates
       set status = $1,
           revoked_at = $2,
           revoked_reason = $3,
           updated_at = now()
       where ${filters.join(' and ')}
       returning *`,
      params
    );

    if (!data) {
      return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });
    }

    logEvent('info', 'certificate.updated', {
      actorId: context.user.id,
      uniqueIdentifier: parsed.uniqueIdentifier,
      status: parsed.status,
    });

    return NextResponse.json({ success: true, data: toRecord(data) });
  } catch (error) {
    logEvent('error', 'certificates.update_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const context = await requireInstitutionContext();
    const { searchParams } = new URL(request.url);
    const uniqueId = searchParams.get('uniqueId');

    if (!uniqueId) {
      return NextResponse.json({ success: false, error: 'uniqueId parameter is required' }, { status: 400 });
    }

    const parsed = revokeCertificateSchema.parse(await request.json().catch(() => ({})));

    const params = [parsed.revokeTxHash || null, uniqueId];
    const filters = ['unique_identifier = $2'];

    if (context.role !== 'super_admin') {
      params.push(context.institutionId!);
      filters.push(`institution_id = $${params.length}`);
    }

    const data = await queryOne<any>(
      `update certificates
       set status = 'revoked',
           revoked_at = now(),
           revoke_tx_hash = $1,
           updated_at = now()
       where ${filters.join(' and ')}
       returning *`,
      params
    );

    if (!data) {
      return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });
    }

    logEvent('warn', 'certificate.revoked', {
      actorId: context.user.id,
      uniqueIdentifier: uniqueId,
      revokeTxHash: parsed.revokeTxHash ?? null,
    });

    // Revoke on Midnight (privacy layer). Errors must NOT roll back Cardano revocation.
    if (isMidnightServerConfigured() && data.institution_id) {
      try {
        const result = await revokeCertificateOnMidnight(uniqueId, data.institution_id);
        await queryOne<any>(
          `update certificates set midnight_revoke_tx_hash = $1, updated_at = now() where unique_identifier = $2`,
          [result.txHash, uniqueId]
        );
        data.midnight_revoke_tx_hash = result.txHash;

        logEvent('info', 'certificate.midnight_revoked', {
          uniqueIdentifier: uniqueId,
          midnightRevokeTxHash: result.txHash,
        });
      } catch (midnightError) {
        logEvent('warn', 'certificate.midnight_revoke_failed', {
          uniqueIdentifier: uniqueId,
          error: midnightError instanceof Error ? midnightError.message : String(midnightError),
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Certificate revoked successfully', data: toRecord(data) });
  } catch (error) {
    logEvent('error', 'certificates.revoke_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return errorResponse(error);
  }
}
