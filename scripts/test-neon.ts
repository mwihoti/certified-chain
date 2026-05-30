import fs from 'node:fs';
import path from 'node:path';
import { queryOne, queryRows } from '../lib/server/db.ts';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;

  const envFile = fs.readFileSync(envPath, 'utf8');
  for (const line of envFile.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1);
    process.env[key] ??= value;
  }
}

loadEnvLocal();
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
await queryRows('create unique index if not exists app_users_email_lower_idx on app_users (lower(email))');
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

const database = await queryOne<{ database_name: string; schema_name: string }>(
  'select current_database() as database_name, current_schema() as schema_name'
);
const counts = await queryOne<{
  organizations: number;
  app_users: number;
  app_auth_sessions: number;
  certificates: number;
  issuance_jobs: number;
}>(
  `select
    (select count(*)::int from organizations) as organizations,
    (select count(*)::int from app_users) as app_users,
    (select count(*)::int from app_auth_sessions) as app_auth_sessions,
    (select count(*)::int from certificates) as certificates,
    (select count(*)::int from issuance_jobs) as issuance_jobs`
);

console.log('Neon connection OK');
console.log(`Database: ${database?.database_name ?? 'unknown'}`);
console.log(`Schema: ${database?.schema_name ?? 'unknown'}`);
console.log(
  `Rows: organizations=${counts?.organizations ?? 0}, app_users=${counts?.app_users ?? 0}, app_auth_sessions=${counts?.app_auth_sessions ?? 0}, certificates=${counts?.certificates ?? 0}, issuance_jobs=${counts?.issuance_jobs ?? 0}`
);
