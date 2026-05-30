
import { NextResponse } from 'next/server';
import { requireInstitutionContext } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  void request;
  const context = await requireInstitutionContext();
  const { orgId } = await params;

  if (!orgId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  if (context.role !== 'super_admin' && context.institutionId !== orgId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(
    { error: 'Original Excel downloads require a storage provider and are not backed by Neon Postgres.' },
    { status: 501 }
  );
}
