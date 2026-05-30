# Certified Chain

Certified Chain is a Next.js application for issuing, storing, and verifying blockchain-backed certificates. Institutions issue credentials through a wallet-connected workflow, certificate records are persisted in Neon Postgres, and verification reads both application state and Cardano anchoring data.

## Production Trust Model

- Certificate records live in Neon Postgres.
- Public verification queries certificate status by certificate number or unique identifier.
- Cardano anchoring stores a certificate hash and identifier reference, not the raw certificate payload.
- Institutions can revoke certificates in the application database and, when the Aiken contract is configured, on-chain as well.
- Issuance now uses a durable `issuance_jobs` table so retries reconcile against a reserved server-side job instead of creating duplicate certificate rows.
- Midnight zero-knowledge proof support is present in the repo but should be treated as experimental until fully deployed and operated.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS and shadcn/ui
- Neon Postgres for application tables, users, and sessions
- Cardano via Mesh SDK and Blockfrost
- Optional Aiken contract for trustless registry/revocation
- Optional Midnight integration for privacy-preserving proofs

## Main Product Flows

### Institution issuance

1. Institution admin signs in.
2. The app creates a server-side issuance job in `/api/issuance`.
3. The client submits the Cardano transaction from the connected wallet.
4. The transaction result is reconciled through `/api/issuance/[jobId]`.
5. The certificate row is persisted exactly once and linked back to the issuance job.

### Verification

1. Verifier looks up a certificate by `certificateNumber` or `uniqueIdentifier`.
2. The app loads the certificate record from Neon Postgres.
3. The UI checks Cardano metadata and, if configured, the contract UTxO state.
4. Status is rendered as `valid`, `revoked`, or `expired`.

### Revocation

1. Institution admin opens the dashboard.
2. The app optionally submits an on-chain revocation if the contract path is active.
3. The certificate row is updated to `revoked`.

## Environment

Use [.env.example](/home/mwihotidan/work/startups/certified-chain/.env.example) as the source of required variables.

Important:

- `NEXT_PUBLIC_*` values are browser-visible.
- Keep Pinata secrets server-side only.
- Use a dedicated Blockfrost project per environment.
- Do not point development builds at production Supabase, Neon, or Cardano infrastructure.

## Database and RLS

Neon SQL migrations now live under [neon/migrations](/home/mwihotidan/work/startups/certified-chain/neon/migrations).

The older Supabase migration remains in [supabase/migrations](/home/mwihotidan/work/startups/certified-chain/supabase/migrations/20260526_production_hardening.sql) for reference, but it uses Supabase-specific RLS helpers and should not be applied directly to Neon.

The Neon schema introduces:

- `organizations`
- `app_users`
- `app_auth_sessions`
- `certificates`
- `issuance_jobs`
- `audit_logs`
- App-enforced institution scoping in the Next.js API routes

Before deploying, make sure institution users in `app_users` include:

- `role`
- `institution_id` for institution admins

## Local Development

```bash
bun install
bun run dev
```

Run tests with:

```bash
bun run test
```

## Route Ownership

- `/institution/*` is the supported institution-facing flow.
- Legacy `/admin/*` prototype issuance pages were removed from the product surface.

## Docs

- [docs/production-trust-model.md](/home/mwihotidan/work/startups/certified-chain/docs/production-trust-model.md)
- [docs/operations-runbook.md](/home/mwihotidan/work/startups/certified-chain/docs/operations-runbook.md)

## Launch Positioning

This repo is now structured for a production path, but production readiness still depends on:

- applying the Neon migration
- configuring JWT claims consistently
- deploying monitoring and alerting in your hosting environment
- validating the full issuance flow against live infrastructure
