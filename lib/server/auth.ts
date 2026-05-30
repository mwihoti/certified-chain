import { getCurrentUser } from '@/lib/server/auth-store';
import type { AuthUser } from '@/app/auth/types';

export type AppRole = 'super_admin' | 'institution_admin' | 'verifier' | 'holder';

export interface SessionContext {
  user: AuthUser | null;
  role: AppRole | null;
  institutionId: string | null;
  institutionName: string | null;
}

function normalizeRole(rawRole: unknown): AppRole | null {
  switch (rawRole) {
    case 'super_admin':
    case 'institution_admin':
    case 'verifier':
    case 'holder':
      return rawRole;
    case 'admin':
      return 'super_admin';
    case 'institution':
      return 'institution_admin';
    case 'user':
      return 'holder';
    default:
      return null;
  }
}

export async function getSessionContext(): Promise<SessionContext> {
  const user = await getCurrentUser();
  const role = normalizeRole(user?.role);

  return {
    user,
    role,
    institutionId:
      user?.institution_id ??
      (role === 'institution_admin' ? user?.id ?? null : null),
    institutionName: user?.institution_name ?? null,
  };
}

export async function requireAuthenticatedContext(): Promise<SessionContext> {
  const context = await getSessionContext();
  if (!context.user) {
    throw new Error('Authentication required');
  }
  return context;
}

export async function requireInstitutionContext(): Promise<SessionContext> {
  const context = await requireAuthenticatedContext();
  if (context.role !== 'institution_admin' && context.role !== 'super_admin') {
    throw new Error('Institution access required');
  }
  if (!context.institutionId && context.role !== 'super_admin') {
    throw new Error('Institution metadata is missing for the current user');
  }
  return context;
}

export async function requireSuperAdminContext(): Promise<SessionContext> {
  const context = await requireAuthenticatedContext();
  if (context.role !== 'super_admin') {
    throw new Error('Super admin access required');
  }
  return context;
}
