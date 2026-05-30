import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/auth-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();

  return NextResponse.json({
    success: true,
    user,
  });
}
