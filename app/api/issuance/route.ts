import { NextRequest, NextResponse } from 'next/server';
import { requireInstitutionContext } from '@/lib/server/auth';
import { logEvent } from '@/lib/server/logger';
import { issuanceDraftSchema } from '@/lib/validation/issuance';
import {
  buildDraftArtifacts,
  buildIssuanceIdempotencyKey,
} from '@/lib/server/issuance';
import type { IssuanceDraft } from '@/lib/server/issuance';
import { queryOne } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

function toJob(row: any) {
  return {
    id: row.id,
    institutionId: row.institution_id,
    institutionName: row.institution_name,
    uniqueIdentifier: row.unique_identifier,
    certificateNumber: row.certificate_number,
    certificateHash: row.certificate_hash,
    status: row.status,
    blockchainTxHash: row.blockchain_tx_hash,
    blockchainTxIndex: row.blockchain_tx_index,
    errorMessage: row.error_message,
    certificateId: row.certificate_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    draft: {
      recipientName: row.recipient_name,
      recipientEmail: row.recipient_email,
      recipientPosition: row.recipient_position,
      credentialType: row.credential_type,
      issueDate: row.issue_date,
      expiryDate: row.expiry_date,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireInstitutionContext();
    const draft = issuanceDraftSchema.parse(await request.json());
    const normalizedDraft: IssuanceDraft = {
      recipientName: draft.recipientName,
      recipientEmail: draft.recipientEmail,
      recipientPosition: draft.recipientPosition,
      credentialType: draft.credentialType,
      issueDate: draft.issueDate,
      expiryDate: draft.expiryDate || '',
      institutionId: context.institutionId!,
      institutionName: context.institutionName || '',
    };
    const idempotencyKey = buildIssuanceIdempotencyKey(context.institutionId!, normalizedDraft);

    const existing = await queryOne<any>(
      `select *
       from issuance_jobs
       where institution_id = $1 and idempotency_key = $2
       limit 1`,
      [context.institutionId!, idempotencyKey]
    );

    if (existing) {
      return NextResponse.json({ success: true, data: toJob(existing), reused: true });
    }

    const [certificateCountResult, jobCountResult] = await Promise.all([
      queryOne<{ count: number }>(
        'select count(*)::int as count from certificates where institution_id = $1',
        [context.institutionId!]
      ),
      queryOne<{ count: number }>(
        'select count(*)::int as count from issuance_jobs where institution_id = $1',
        [context.institutionId!]
      ),
    ]);

    const entryNumber = (certificateCountResult?.count ?? 0) + (jobCountResult?.count ?? 0) + 1;
    const artifacts = buildDraftArtifacts(
      normalizedDraft,
      context.institutionName || 'Institution',
      entryNumber
    );

    const data = await queryOne<any>(
      `insert into issuance_jobs (
        institution_id,
        institution_name,
        idempotency_key,
        recipient_name,
        recipient_email,
        recipient_position,
        credential_type,
        issue_date,
        expiry_date,
        unique_identifier,
        certificate_number,
        certificate_hash,
        status
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending')
      returning *`,
      [
        context.institutionId,
        context.institutionName,
        idempotencyKey,
        draft.recipientName,
        draft.recipientEmail,
        draft.recipientPosition,
        draft.credentialType,
        draft.issueDate,
        draft.expiryDate || null,
        artifacts.identifier.fullIdentifier,
        artifacts.certificateNumber,
        artifacts.certificateHash,
      ]
    );

    logEvent('info', 'issuance.job_created', {
      actorId: context.user.id,
      institutionId: context.institutionId,
      jobId: data.id,
      uniqueIdentifier: data.unique_identifier,
    });

    return NextResponse.json({ success: true, data: toJob(data) }, { status: 201 });
  } catch (error) {
    logEvent('error', 'issuance.job_create_failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Authentication required'
        ? 401
        : message.includes('access required')
          ? 403
          : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
