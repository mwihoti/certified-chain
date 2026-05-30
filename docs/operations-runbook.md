# Operations Runbook

## Monitoring Baseline

Capture and alert on:

- API 5xx rate
- issuance job failure count
- issuance reconciliation backlog
- verification latency
- wallet submission failure rate
- Blockfrost error rate
- Supabase query failures

## Structured Events

The app now emits structured logs for:

- `certificate.created`
- `certificate.updated`
- `certificate.revoked`
- `organization.created`
- `organization.updated`
- `organization.deleted`
- `issuance.job_created`
- `issuance.job_persisted`
- `issuance.job_create_failed`
- `issuance.job_finalize_failed`
- `pinata.upload_success`
- `pinata.upload_failed`

Forward these logs to your host logging platform and build alerts from them.

## Incident: Blockfrost outage

1. Confirm whether failures are read-only verification failures or issuance-time failures.
2. Stop batch issuance if wallet submissions depend on Blockfrost-backed contract reads.
3. Keep issuance jobs in `pending` or `failed`; do not manually create certificate rows without reconciliation.
4. Re-run reconciliation for failed jobs after service recovery.

## Incident: Supabase outage

1. Disable new issuance from the UI.
2. Do not allow direct “fire and forget” blockchain submissions.
3. Queue operational follow-up for any jobs that were submitted on chain during the outage window.
4. Reconcile by `unique_identifier` and `blockchain_tx_hash` after recovery.

## Incident: Wallet submission succeeded but certificate missing

1. Find the issuance job by institution and recipient payload.
2. Check whether the job is `failed` or still `pending`.
3. Retry `PATCH /api/issuance/[jobId]` with the original transaction result.
4. Confirm the certificate row is created and the job moves to `persisted`.

## Incident: Unauthorized access report

1. Confirm the user role and JWT claims.
2. Verify the user’s `institution_id` matches the organization/certificate owner.
3. Review Supabase RLS policies from the current migration.
4. Review structured logs for the affected event window.

## Release Checklist

- Apply the latest Supabase migration.
- Verify JWT claims include `role` and `institution_id`.
- Run `bun run test`.
- Run a live issuance on the target Cardano environment.
- Verify public lookup and institution-scoped listing.
- Verify revocation flow.
