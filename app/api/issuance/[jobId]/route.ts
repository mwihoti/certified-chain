import { NextRequest, NextResponse } from 'next/server';
import { requireInstitutionContext } from '@/lib/server/auth';
import { logEvent } from '@/lib/server/logger';
import { issuanceFinalizeSchema } from '@/lib/validation/issuance';
import { queryOne, queryRows } from '@/lib/server/db';
import { issueCertificateOnMidnight, isMidnightServerConfigured } from '@/lib/server/midnight';

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
    midnightCertId: row.midnight_cert_id,
    midnightCertDataHash: row.midnight_cert_data_hash,
    midnightTxHash: row.midnight_tx_hash,
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

function toCertificate(row: any) {
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

async function fetchScopedJob(context: Awaited<ReturnType<typeof requireInstitutionContext>>, jobId: string) {
  const params = [jobId];
  const filters = ['id = $1'];

  if (context.role !== 'super_admin') {
    params.push(context.institutionId!);
    filters.push(`institution_id = $${params.length}`);
  }

  return await queryOne<any>(
    `select * from issuance_jobs where ${filters.join(' and ')} limit 1`,
    params
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const context = await requireInstitutionContext();
    const { jobId } = await params;
    const data = await fetchScopedJob(context, jobId);

    if (!data) {
      return NextResponse.json({ success: false, error: 'Issuance job not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: toJob(data) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
    const context = await requireInstitutionContext();
    const { jobId } = await params;

  try {
    const parsed = issuanceFinalizeSchema.parse(await request.json());
    const job = await fetchScopedJob(context, jobId);

    if (!job) {
      return NextResponse.json({ success: false, error: 'Issuance job not found' }, { status: 404 });
    }

    if (job.unique_identifier !== parsed.uniqueIdentifier) {
      return NextResponse.json(
        { success: false, error: 'Submitted unique identifier does not match the reserved issuance job' },
        { status: 409 }
      );
    }

    if (job.status === 'persisted' && job.certificate_id) {
      const existingCertificate = await queryOne<any>(
        'select * from certificates where id = $1 limit 1',
        [job.certificate_id]
      );

      return NextResponse.json({
        success: true,
        data: {
          job: toJob(job),
          certificate: existingCertificate ? toCertificate(existingCertificate) : null,
        },
      });
    }

    const existingCertificate = await queryOne<any>(
      'select * from certificates where unique_identifier = $1 limit 1',
      [job.unique_identifier]
    );

    if (existingCertificate) {
      const updatedJob = await queryOne<any>(
        `update issuance_jobs
         set status = 'persisted',
             blockchain_tx_hash = $1,
             blockchain_tx_index = $2,
             certificate_id = $3,
             error_message = null,
             updated_at = now(),
             last_submitted_at = now()
         where id = $4
         returning *`,
        [parsed.txHash, parsed.txIndex, existingCertificate.id, jobId]
      );

      if (!updatedJob) {
        throw new Error('Failed to reconcile issuance job');
      }

      return NextResponse.json({
        success: true,
        data: {
          job: toJob(updatedJob),
          certificate: toCertificate(existingCertificate),
          reconciled: true,
        },
      });
    }

    const persistRows = await queryRows<{ certificate: any; job: any }>(
      `with inserted_certificate as (
        insert into certificates (
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
        returning *
      ),
      updated_job as (
        update issuance_jobs
        set status = 'persisted',
            blockchain_tx_hash = $11,
            blockchain_tx_index = $12,
            certificate_id = (select id from inserted_certificate),
            error_message = null,
            updated_at = now(),
            last_submitted_at = now()
        where id = $14
        returning *
      )
      select
        row_to_json(inserted_certificate) as certificate,
        row_to_json(updated_job) as job
      from inserted_certificate, updated_job`,
      [
        job.unique_identifier,
        job.certificate_number,
        job.recipient_name,
        job.recipient_email,
        job.recipient_position,
        job.credential_type,
        job.issue_date,
        job.expiry_date,
        job.institution_id,
        job.institution_name,
        parsed.txHash,
        parsed.txIndex ?? 0,
        parsed.certificateHash,
        jobId,
      ]
    );
    const certificateInsert = persistRows[0]?.certificate;
    const updatedJob = persistRows[0]?.job;

    if (!certificateInsert || !updatedJob) {
      throw new Error('Failed to persist issuance job');
    }

    logEvent('info', 'issuance.job_persisted', {
      actorId: context.user.id,
      institutionId: context.institutionId,
      jobId,
      certificateId: certificateInsert.id,
      txHash: parsed.txHash,
    });

    // Anchor the certificate on Midnight (privacy layer).
    // Errors here must NOT roll back the Cardano persistence.
    let midnightTxHash: string | undefined;
    if (
      isMidnightServerConfigured() &&
      updatedJob.midnight_cert_id &&
      !updatedJob.midnight_tx_hash
    ) {
      try {
        const result = await issueCertificateOnMidnight({
          unique_identifier: updatedJob.unique_identifier,
          institution_id: updatedJob.institution_id,
          midnight_cert_id: updatedJob.midnight_cert_id,
          midnight_cert_data_hash: updatedJob.midnight_cert_data_hash,
        });
        midnightTxHash = result.txHash;

        await queryRows(
          `update issuance_jobs set midnight_tx_hash = $1, updated_at = now() where id = $2`,
          [midnightTxHash, jobId]
        );
        await queryRows(
          `update certificates set midnight_tx_hash = $1, midnight_cert_id = $2, updated_at = now() where id = $3`,
          [midnightTxHash, updatedJob.midnight_cert_id, certificateInsert.id]
        );

        logEvent('info', 'issuance.midnight_anchored', {
          jobId,
          midnightTxHash,
        });
      } catch (midnightError) {
        logEvent('warn', 'issuance.midnight_anchor_failed', {
          jobId,
          error: midnightError instanceof Error ? midnightError.message : String(midnightError),
        });
      }
    }

    // Refetch to include midnight_tx_hash if it was set
    const finalJob = midnightTxHash
      ? await queryOne<any>(`select * from issuance_jobs where id = $1`, [jobId])
      : updatedJob;
    const finalCert = midnightTxHash
      ? await queryOne<any>(`select * from certificates where id = $1`, [certificateInsert.id])
      : certificateInsert;

    return NextResponse.json({
      success: true,
      data: {
        job: toJob(finalJob),
        certificate: toCertificate(finalCert),
      },
    });
  } catch (error) {
    await queryRows(
      `update issuance_jobs
       set status = 'failed',
           error_message = $1,
           updated_at = now()
       where id = $2`,
      [error instanceof Error ? error.message : 'Unknown error', jobId]
    );

    logEvent('error', 'issuance.job_finalize_failed', {
      actorId: context.user.id,
      institutionId: context.institutionId,
      jobId,
      error: error instanceof Error ? error.message : String(error),
    });

    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
