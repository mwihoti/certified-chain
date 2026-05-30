create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  email text not null,
  contact_name text not null,
  phone text not null,
  number_of_certs integer not null default 0,
  organization_image_name text,
  cert_template_name text,
  recipients_excel_name text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  unique_identifier text not null unique,
  certificate_number text not null unique,
  recipient_name text not null,
  recipient_email text not null,
  recipient_position text not null,
  credential_type text not null,
  issue_date date not null,
  expiry_date date,
  institution_id uuid not null references public.organizations(id) on delete cascade,
  institution_name text not null,
  blockchain_tx_hash text not null,
  blockchain_tx_index integer not null default 0,
  certificate_hash text not null,
  status text not null default 'valid' check (status in ('valid', 'revoked', 'expired')),
  revoked_at timestamptz,
  revoked_reason text,
  revoke_tx_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.issuance_jobs (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.organizations(id) on delete cascade,
  institution_name text not null,
  idempotency_key text not null,
  recipient_name text not null,
  recipient_email text not null,
  recipient_position text not null,
  credential_type text not null,
  issue_date date not null,
  expiry_date date,
  unique_identifier text not null unique,
  certificate_number text not null unique,
  certificate_hash text not null,
  status text not null default 'pending' check (status in ('pending', 'submitted', 'persisted', 'failed')),
  blockchain_tx_hash text,
  blockchain_tx_index integer,
  error_message text,
  certificate_id uuid references public.certificates(id) on delete set null,
  last_submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, idempotency_key)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_role text,
  event text not null,
  subject_type text not null,
  subject_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists certificates_institution_created_idx
  on public.certificates (institution_id, created_at desc);

create index if not exists issuance_jobs_institution_created_idx
  on public.issuance_jobs (institution_id, created_at desc);

create index if not exists organizations_status_created_idx
  on public.organizations (status, created_at desc);
