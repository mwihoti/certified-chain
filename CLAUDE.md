# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LiteCert** — a blockchain-based certificate verification system built on Cardano. Institutions issue certificates whose data is hashed and recorded on the Cardano blockchain, enabling tamper-proof verification.

## Commands

```bash
# Development
pnpm dev          # Start Next.js dev server (webpack mode)
pnpm build        # Production build (webpack mode)
pnpm start        # Start production server
pnpm lint         # ESLint

# Note: No test suite is configured yet
```

The project uses `--webpack` explicitly in dev/build commands due to Cardano/WASM library requirements.

## Architecture

### Tech Stack
- **Framework**: Next.js (App Router) with React 18 + TypeScript
- **Blockchain**: Cardano via MeshSDK (`@meshsdk/core`, `@meshsdk/react`), Blockfrost API for queries
- **Auth/DB**: Supabase (configured but auth is not enforced yet — demo accepts any password)
- **UI**: Tailwind CSS + shadcn/ui (Radix UI primitives)
- **State**: TanStack Query (React Query) for server state
- **Forms**: React Hook Form + Zod

### Key Portals
- `/institution` — Issue and manage certificates; batch upload via Excel
- `/user` — Retrieve personal certificates
- `/verify` — Verify certificate authenticity
- `/admin` — Admin management of institutions and certificates
- `/auth/register` — Institution registration

### Certificate Lifecycle
1. Institution uploads Excel file → parsed via `lib/services/excel.ts`
2. For each row: generate unique ID (`ORG_USR_##` format) via `lib/services/cardano.ts`
3. Hash certificate data with SHA256 (`crypto-js`)
4. Build Cardano transaction metadata and submit via MeshJS wallet (Eternl)
5. Store `txHash`, `uniqueIdentifier`, `certificateHash` to `/api/certificates`
6. Return updated Excel with blockchain fields filled in

### Unique Identifier Format
`ORG_USR_NN` where:
- `ORG` = first 3 letters of org name (alpha only, uppercase)
- `USR` = first 3 letters/initials of recipient name (uppercase)
- `NN` = 2-digit padded entry number

### API Routes (`app/api/`)
| Route | Purpose |
|---|---|
| `/api/certificates` | CRUD for certificates — GET by `uniqueId` or `certNumber` |
| `/api/organizations` | Institution registration management |
| `/api/organizations/[orgId]` | Per-org file downloads |
| `/api/uploadToPinata` | Upload to IPFS via Pinata |

**Important**: API routes currently use in-memory Maps for storage (development only). Production requires replacing with Supabase or another DB.

### Supabase Clients
- `lib/supabase/client.ts` — browser client (use in Client Components)
- `lib/supabase/server.ts` — server client using cookies (use in Server Components and API routes)

### webpack Config
`next.config.ts` has significant webpack customization:
- Enables WASM and top-level await for Cardano/MeshSDK
- Polyfills `Buffer` for browser
- Transpiles MeshSDK, Cardano SDK, libsodium
- Do not remove these without understanding the impact on blockchain functionality

### Supabase Tables Required
These tables must exist in your Supabase project before the app works:

```sql
-- certificates
create table certificates (
  id uuid primary key default gen_random_uuid(),
  unique_identifier text unique not null,
  certificate_number text not null,
  recipient_name text not null,
  recipient_email text not null,
  recipient_position text not null,
  credential_type text not null,
  issue_date date not null,
  expiry_date date,
  institution_id text not null,
  institution_name text not null,
  blockchain_tx_hash text not null,
  certificate_hash text not null,
  status text not null default 'valid',
  revoked_at timestamptz,
  revoked_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- organizations
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  email text not null,
  contact_name text not null,
  phone text not null,
  number_of_certs integer not null,
  organization_image_name text,
  cert_template_name text,
  recipients_excel_name text,
  status text not null default 'pending',
  submitted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

Institution name and ID are read from `user.user_metadata` in the Supabase auth session (`institution_name`, `institution_id` fields).

## Smart Contracts

### Aiken (Cardano) — `contracts/litecert-registry/`
```bash
# 1. Install Aiken: https://aiken-lang.org/installation-instructions
aiken build                            # compiles → plutus.json
cat plutus.json | jq -r ".validators[0].compiledCode"  # copy to .env.local
pnpm tsx scripts/deploy-contract.ts    # prints contract address per network
```
- Validator: `validators/registry.ak` — only the issuing institution (by pkh) can revoke
- `lib/contracts/registry.ts` — loads compiled code from `NEXT_PUBLIC_CONTRACT_COMPILED_CODE`
- `lib/contracts/config.ts` — contract addresses and constants
- `lib/services/contract.ts` — `issueOnChain`, `revokeOnChain`, `verifyOnChain`

When `NEXT_PUBLIC_CONTRACT_COMPILED_CODE` is set, `submitCertificateToBlockchain` locks a UTxO at the contract address with the certificate hash as an inline datum instead of writing metadata only. Revocation spends the UTxO on-chain.

### Midnight (Privacy Layer) — `contracts/midnight-certs/`
```bash
# Install Midnight toolchain: https://docs.midnight.network/getting-started
cd contracts/midnight-certs
bun install
bun run build                           # compiles certificate_proof.compact
cd ../..
bun run deploy:midnight                 # deploys contract, prints address
bun run test:midnight                   # runs compact-test suite
```
- Contract: `src/certificate_proof.compact` — 5 ZK circuits: issue, prove_validity, prove_credential_type, prove_not_expired, revoke
- `lib/midnight/helpers.ts` — hash alignment helpers (encodeBytes, computeCertDataHash, certIdToBytes32, deriveInstitutionKeyHash)
- `lib/services/midnight.ts` — client-side proof generation: proveValidity, proveCredentialType, proveNotExpired, verifyZKProof
- `lib/server/midnight.ts` — server-side issuance/revocation: issueCertificateOnMidnight, revokeCertificateOnMidnight
- `app/proof/page.tsx` — holder-facing ZK proof generation UI
- Requires `NEXT_PUBLIC_MIDNIGHT_CONTRACT_ADDRESS` and `MIDNIGHT_DEPLOYER_MNEMONIC` to be active
- Cardano metadata (label 674 + CIP-721) contains only hashes and identifiers — no personal data

### New Supabase columns needed (add to existing tables)
```sql
alter table certificates add column blockchain_tx_index integer not null default 0;
alter table certificates add column revoke_tx_hash text;
```

## Environment Variables

Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_CARDANO_NETWORK=preview
NEXT_PUBLIC_BLOCKFROST_PROJECT_ID=...
NEXT_PUBLIC_BLOCKFROST_API_KEY=...
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...
# Optional:
PINATA_API_KEY=...
PINATA_SECRET_API_KEY=...
DATABASE_URL=...
```

## TypeScript Notes
- Strict mode is **disabled** (`strict: false` in `tsconfig.json`)
- Module resolution is `NodeNext`
- Path alias: `@/*` maps to the repo root
