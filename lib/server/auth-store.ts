import { pbkdf2 as pbkdf2Callback, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';
import { isUniqueViolation, queryOne, queryRows } from '@/lib/server/db';
import { ensureAuthSchema } from '@/lib/server/auth-schema';
import type { AuthUser, SignUpCredentials } from '@/app/auth/types';

const pbkdf2 = promisify(pbkdf2Callback);

const AUTH_COOKIE_NAME = 'certified_chain_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const PASSWORD_HASH_ITERATIONS = 210_000;
const PASSWORD_HASH_KEYLEN = 32;
const PASSWORD_HASH_DIGEST = 'sha256';

type AppUserRow = {
  id: string;
  email: string;
  password_hash: string;
  role: AuthUser['role'];
  institution_id: string | null;
  institution_name: string | null;
  created_at: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeRole(role: SignUpCredentials['metadata'] extends infer M ? M extends { role?: infer R } ? R : never : never) {
  return role ?? 'holder';
}

function toAuthUser(row: AppUserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    institution_id: row.institution_id ?? undefined,
    institution_name: row.institution_name ?? undefined,
    created_at: row.created_at,
  };
}

function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('base64url');
  const derived = await pbkdf2(
    password,
    salt,
    PASSWORD_HASH_ITERATIONS,
    PASSWORD_HASH_KEYLEN,
    PASSWORD_HASH_DIGEST
  );
  return `pbkdf2_${PASSWORD_HASH_DIGEST}$${PASSWORD_HASH_ITERATIONS}$${salt}$${derived.toString('base64url')}`;
}

async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, iterationsText, salt, hash] = storedHash.split('$');
  if (algorithm !== `pbkdf2_${PASSWORD_HASH_DIGEST}` || !iterationsText || !salt || !hash) {
    return false;
  }

  const iterations = Number(iterationsText);
  if (!Number.isSafeInteger(iterations) || iterations <= 0) {
    return false;
  }

  const expected = Buffer.from(hash, 'base64url');
  const actual = await pbkdf2(password, salt, iterations, expected.length, PASSWORD_HASH_DIGEST);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function setSessionCookie(userId: string) {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashSessionToken(token);

  await queryRows(
    `insert into app_auth_sessions (user_id, token_hash, expires_at)
     values ($1, $2, now() + ($3::int * interval '1 second'))`,
    [userId, tokenHash, SESSION_MAX_AGE_SECONDS]
  );

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function createUserSession(email: string, password: string) {
  await ensureAuthSchema();

  const user = await queryOne<AppUserRow>(
    'select * from app_users where lower(email) = lower($1) limit 1',
    [normalizeEmail(email)]
  );

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return { user: null, error: 'Invalid email or password' };
  }

  await setSessionCookie(user.id);
  return { user: toAuthUser(user), error: null };
}

export async function registerUser({ email, password, metadata }: SignUpCredentials) {
  await ensureAuthSchema();

  const normalizedEmail = normalizeEmail(email);
  const passwordHash = await hashPassword(password);
  const role = normalizeRole(metadata?.role);
  const institutionName = metadata?.institution_name ?? normalizedEmail;

  try {
    const user =
      role === 'institution_admin'
        ? await queryOne<AppUserRow>(
            `with new_user as (
              insert into app_users (email, password_hash, role, institution_name)
              values ($1, $2, $3, $4)
              returning *
            ),
            organization as (
              insert into organizations (
                id,
                name,
                type,
                email,
                contact_name,
                phone,
                number_of_certs,
                status,
                submitted_at,
                updated_at
              )
              select id, $4, 'institution', $1, $4, '', 0, 'pending', now(), now()
              from new_user
              on conflict (id) do update set
                name = excluded.name,
                email = excluded.email,
                contact_name = excluded.contact_name,
                updated_at = now()
              returning id, name
            )
            update app_users
            set institution_id = (select id from organization),
                institution_name = (select name from organization),
                updated_at = now()
            where id = (select id from new_user)
            returning *`,
            [normalizedEmail, passwordHash, role, institutionName]
          )
        : await queryOne<AppUserRow>(
            `insert into app_users (email, password_hash, role, institution_id, institution_name)
             values ($1, $2, $3, $4, $5)
             returning *`,
            [
              normalizedEmail,
              passwordHash,
              role,
              metadata?.institution_id ?? null,
              metadata?.institution_name ?? null,
            ]
          );

    if (!user) {
      return { user: null, error: 'Failed to create account' };
    }

    await setSessionCookie(user.id);
    return { user: toAuthUser(user), error: null };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { user: null, error: 'An account with this email already exists' };
    }

    console.error('[registerUser]', error instanceof Error ? error.message : error);
    const message = error instanceof Error ? error.message : 'Failed to create account';
    return { user: null, error: message };
  }
}

export async function getCurrentUser() {
  await ensureAuthSchema();

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const user = await queryOne<AppUserRow>(
    `select app_users.*
     from app_auth_sessions
     join app_users on app_users.id = app_auth_sessions.user_id
     where app_auth_sessions.token_hash = $1
       and app_auth_sessions.expires_at > now()
     limit 1`,
    [hashSessionToken(token)]
  );

  return user ? toAuthUser(user) : null;
}

export async function clearCurrentSession() {
  await ensureAuthSchema();

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (token) {
    await queryRows('delete from app_auth_sessions where token_hash = $1', [hashSessionToken(token)]);
  }

  cookieStore.delete(AUTH_COOKIE_NAME);
}
