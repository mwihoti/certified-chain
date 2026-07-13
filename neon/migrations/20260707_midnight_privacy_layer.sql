-- Midnight privacy layer: store Midnight transaction references
-- alongside Cardano transaction hashes.

alter table public.certificates
  add column if not exists midnight_tx_hash text,
  add column if not exists midnight_cert_id text,
  add column if not exists midnight_revoke_tx_hash text;

alter table public.issuance_jobs
  add column if not exists midnight_cert_id text,
  add column if not exists midnight_cert_data_hash text,
  add column if not exists midnight_tx_hash text;

create index if not exists certificates_midnight_cert_id_idx
  on public.certificates (midnight_cert_id);
