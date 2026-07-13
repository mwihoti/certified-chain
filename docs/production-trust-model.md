# Production Trust Model

## System of record

- Neon Postgres is the application system of record for certificate lifecycle state.
- Cardano is the anchoring and public verification layer for certificate fingerprints and transaction history.
- Midnight Network is the privacy layer for zero-knowledge proof verification.

## What is stored where

### Neon Postgres

- Institution and organization metadata
- Full certificate record
- Issuance job lifecycle
- Revocation state
- Audit logs

### Cardano

- Certificate hash (SHA-256 of certificate data)
- Unique identifier
- Issuer reference
- Transaction history
- NFT metadata (CIP-721) with IPFS-hosted certificate image

### Midnight Network

- Certificate ledger state (encrypted witness data)
- ZK proof verification records
- Revocation status (privacy-preserving)

### Not stored on chain

- Raw recipient certificate payload
- Recipient email beyond what the application database already stores
- Recipient name, position, credential type, or dates (only hashes)
- Organization admin credentials

## Verification semantics

A certificate is considered valid when:

1. the certificate exists in Neon Postgres,
2. its status is `valid`,
3. its Cardano transaction metadata can be found, and
4. if the contract path is active, the contract UTxO is present and not revoked.

## Issuance semantics

Issuance is a two-phase flow:

1. Reserve an issuance job in Neon Postgres.
2. Submit the blockchain transaction and finalize the job.

This gives the app an idempotent recovery point when the wallet submission succeeds but the application write path fails.

## Revocation semantics

- Application revocation is authoritative for user-facing status.
- On-chain revocation is an additional trust signal when the Aiken contract path is deployed.
- If the contract path is not deployed, revocation remains database-backed and the UI must present that distinction honestly.

## Midnight privacy layer

Midnight zero-knowledge proof support is implemented in the codebase. The following must be true before operating in production:

- The Midnight contract is deployed and `NEXT_PUBLIC_MIDNIGHT_CONTRACT_ADDRESS` is set.
- The `@midnight-ntwrk/midnight-js-*` packages are installed and resolvable at runtime.
- `MIDNIGHT_DEPLOYER_MNEMONIC` is securely stored (server-only, never exposed to the browser).
- Proof generation is tested end to end (issue → prove → verify).
- Support procedures exist for proof failures.

### Contract deployment

The Midnight contract is written in Compact and compiled with `compactc` (version 0.31.1, language version 0.23).

To compile the contract:

```bash
cd contracts/midnight-certs
compactc src/certificate_proof.compact dist/
```

This produces:
- `dist/contract/index.ts` — TypeScript bindings for the contract
- `dist/keys/` — Proving and verification keys
- `dist/zkir/` — Circuit intermediate representations

To deploy the contract to Midnight testnet:

```bash
bun run scripts/deploy-midnight.ts
```

### Hash alignment

The Compact contract uses `persistentHash<Vector<4, Bytes<64>>>` (Poseidon hash over a prime field) to compute certificate data hashes. The TypeScript helpers in `lib/midnight/helpers.ts` currently use SHA-256 as a placeholder.

**TODO (Phase 13)**: Replace SHA-256 with Poseidon hash from `@midnight-ntwrk/compact-runtime` to ensure hash alignment between TypeScript and Compact.

Until then, the hash mismatch means:
- TypeScript computes SHA-256 hashes
- Compact computes Poseidon hashes
- These will NOT match until the alignment is completed

### Witness structure

The Compact contract witness structure (all fields are `Bytes<64>`):

```compact
struct CertificateWitness {
  recipient_name: Bytes<64>;
  credential_type: Bytes<64>;
  issue_date: Bytes<64>;
  institution_id: Bytes<64>;
}
```

The TypeScript `CertificateWitness` interface in `lib/midnight/helpers.ts` must match this structure exactly.

When Midnight is configured:
- Certificate issuance anchors a privacy-preserving record on the Midnight ledger alongside the Cardano NFT.
- Cardano transaction metadata (label 674 and CIP-721) contains **only hashes and identifiers** — no recipient name, email, position, credential type, or dates.
- Certificate holders can generate ZK proofs at `/proof` to verify credentials without revealing personal data.
- Verifiers can validate ZK proofs at `/verify` using the Midnight network.

When Midnight is not configured, the application functions normally on Cardano-only mode. Midnight errors during issuance or revocation are caught independently and never roll back Cardano operations.
