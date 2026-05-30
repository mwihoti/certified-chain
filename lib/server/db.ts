import { neon } from '@neondatabase/serverless';

export type QueryParam = string | number | boolean | null | Date | undefined;

let sqlClient: ReturnType<typeof neon> | null = null;

function getSqlClient() {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  if (!sqlClient) {
    sqlClient = neon(databaseUrl);
  }

  return sqlClient;
}

export async function queryRows<T>(text: string, params: QueryParam[] = []) {
  return getSqlClient().query(text, params) as Promise<T[]>;
}

export async function queryOne<T>(text: string, params: QueryParam[] = []) {
  const rows = await queryRows<T>(text, params);
  return rows[0] ?? null;
}

export function isUniqueViolation(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  );
}
