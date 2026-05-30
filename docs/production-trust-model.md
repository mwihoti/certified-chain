# Production Trust Model

## System of record

- Supabase is the application system of record for certificate lifecycle state.
- Cardano is the anchoring and public verification layer for certificate fingerprints and transaction history.

## What is stored where

### Supabase

- Institution and organization metadata
- Full certificate record
- Issuance job lifecycle
- Revocation state

### Cardano

- Certificate hash
- Unique identifier
- Issuer reference
- Transaction history

### Not stored on chain

- Raw recipient certificate payload
- Recipient email beyond what the application database already stores
- Organization admin credentials

## Verification semantics

A certificate is considered valid when:

1. the certificate exists in Supabase,
2. its status is `valid`,
3. its Cardano transaction metadata can be found, and
4. if the contract path is active, the contract UTxO is present and not revoked.

## Issuance semantics

Issuance is a two-phase flow:

1. Reserve an issuance job in Supabase.
2. Submit the blockchain transaction and finalize the job.

This gives the app an idempotent recovery point when the wallet submission succeeds but the application write path fails.

## Revocation semantics

- Application revocation is authoritative for user-facing status.
- On-chain revocation is an additional trust signal when the Aiken contract path is deployed.
- If the contract path is not deployed, revocation remains database-backed and the UI must present that distinction honestly.

## Experimental features

Midnight zero-knowledge proof support exists in the codebase but should not be marketed as live production functionality unless:

- the Midnight contract is deployed,
- the SDK dependency path is available in the runtime,
- proof generation is tested end to end, and
- support procedures exist for proof failures.
