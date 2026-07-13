import { queryRows } from '@/lib/server/db';

let authSchemaReady: Promise<void> | null = null;

export async function ensureAuthSchema() {
  authSchemaReady ??= (async () => {
    await queryRows('create extension if not exists pgcrypto');
    await queryRows(`
      create table if not exists app_users (
        id uuid primary key default gen_random_uuid(),
        email text not null,
        password_hash text not null,
        role text not null default 'holder'
          check (role in ('super_admin', 'institution_admin', 'verifier', 'holder')),
        institution_id uuid,
        institution_name text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `);
    await queryRows(
      'create unique index if not exists app_users_email_lower_idx on app_users (lower(email))'
    );
    await queryRows(`
      create table if not exists app_auth_sessions (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references app_users(id) on delete cascade,
        token_hash text not null unique,
        expires_at timestamptz not null,
        created_at timestamptz not null default now()
      )
    `);
    await queryRows(
      'create index if not exists app_auth_sessions_user_expires_idx on app_auth_sessions (user_id, expires_at)'
    );
    await queryRows(`
      create table if not exists organizations (
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
      )
    `);
  })();

  return authSchemaReady;
}
