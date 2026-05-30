import type { AuthUser } from '@/app/auth/types';

export async function getCurrentSessionUser(): Promise<AuthUser | null> {
  const response = await fetch('/api/auth/session', {
    credentials: 'include',
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.user ?? null;
}
