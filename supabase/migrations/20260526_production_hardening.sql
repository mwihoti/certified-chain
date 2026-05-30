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

alter table public.organizations enable row level security;
alter table public.certificates enable row level security;
alter table public.issuance_jobs enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "org_public_insert" on public.organizations;
create policy "org_public_insert"
on public.organizations
for insert
to anon, authenticated
with check (true);

drop policy if exists "org_super_admin_select" on public.organizations;
create policy "org_super_admin_select"
on public.organizations
for select
to authenticated
using ((auth.jwt() ->> 'role') = 'super_admin');

drop policy if exists "org_institution_select_own" on public.organizations;
create policy "org_institution_select_own"
on public.organizations
for select
to authenticated
using (
  id::text = coalesce(auth.jwt() ->> 'institution_id', auth.uid()::text)
  and (auth.jwt() ->> 'role') in ('institution_admin', 'super_admin')
);

drop policy if exists "org_institution_update_own" on public.organizations;
create policy "org_institution_update_own"
on public.organizations
for update
to authenticated
using (
  id::text = coalesce(auth.jwt() ->> 'institution_id', auth.uid()::text)
  and (auth.jwt() ->> 'role') in ('institution_admin', 'super_admin')
)
with check (
  id::text = coalesce(auth.jwt() ->> 'institution_id', auth.uid()::text)
  and (auth.jwt() ->> 'role') in ('institution_admin', 'super_admin')
);

drop policy if exists "cert_public_lookup" on public.certificates;
create policy "cert_public_lookup"
on public.certificates
for select
to anon, authenticated
using (status in ('valid', 'revoked', 'expired'));

drop policy if exists "cert_institution_manage_own" on public.certificates;
create policy "cert_institution_manage_own"
on public.certificates
for all
to authenticated
using (
  institution_id::text = coalesce(auth.jwt() ->> 'institution_id', auth.uid()::text)
  and (auth.jwt() ->> 'role') in ('institution_admin', 'super_admin')
)
with check (
  institution_id::text = coalesce(auth.jwt() ->> 'institution_id', auth.uid()::text)
  and (auth.jwt() ->> 'role') in ('institution_admin', 'super_admin')
);

drop policy if exists "issuance_jobs_institution_manage_own" on public.issuance_jobs;
create policy "issuance_jobs_institution_manage_own"
on public.issuance_jobs
for all
to authenticated
using (
  institution_id::text = coalesce(auth.jwt() ->> 'institution_id', auth.uid()::text)
  and (auth.jwt() ->> 'role') in ('institution_admin', 'super_admin')
)
with check (
  institution_id::text = coalesce(auth.jwt() ->> 'institution_id', auth.uid()::text)
  and (auth.jwt() ->> 'role') in ('institution_admin', 'super_admin')
);

drop policy if exists "audit_logs_super_admin_read" on public.audit_logs;
create policy "audit_logs_super_admin_read"
on public.audit_logs
for select
to authenticated
using ((auth.jwt() ->> 'role') = 'super_admin');
