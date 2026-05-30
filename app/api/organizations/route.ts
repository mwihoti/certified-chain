import { NextRequest, NextResponse } from 'next/server';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
} from '@/lib/validation/organizations';
import {
  getSessionContext,
  requireInstitutionContext,
  requireSuperAdminContext,
} from '@/lib/server/auth';
import { logEvent } from '@/lib/server/logger';
import { queryOne, queryRows, type QueryParam } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

function toRecord(row: any) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    email: row.email,
    contactName: row.contact_name,
    phone: row.phone,
    numberOfCerts: row.number_of_certs,
    organizationImageName: row.organization_image_name,
    certTemplateName: row.cert_template_name,
    recipientsExcelName: row.recipients_excel_name,
    status: row.status,
    submittedAt: row.submitted_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Internal server error';
  const status =
    message === 'Authentication required'
      ? 401
      : message.includes('access required')
        ? 403
        : 500;
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const context = await getSessionContext();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');

    if (!context.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    if (id) {
      const params = [id];
      const filters = ['id = $1'];

      if (context.role !== 'super_admin') {
        if (!context.institutionId) {
          return NextResponse.json({ success: false, error: 'Institution metadata missing' }, { status: 403 });
        }
        params.push(context.institutionId);
        filters.push(`id = $${params.length}`);
      }

      const data = await queryOne<any>(
        `select * from organizations where ${filters.join(' and ')} limit 1`,
        params
      );
      if (!data) {
        return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: toRecord(data) });
    }

    const params: string[] = [];
    const filters: string[] = [];

    if (context.role === 'super_admin') {
      if (status) {
        params.push(status);
        filters.push(`status = $${params.length}`);
      }
    } else {
      if (!context.institutionId) {
        return NextResponse.json({ success: false, error: 'Institution metadata missing' }, { status: 403 });
      }
      params.push(context.institutionId);
      filters.push(`id = $${params.length}`);
    }

    const whereClause = filters.length > 0 ? `where ${filters.join(' and ')}` : '';
    const data = await queryRows<any>(
      `select * from organizations ${whereClause} order by created_at desc`,
      params
    );

    return NextResponse.json({ success: true, data: data.map(toRecord) });
  } catch (error) {
    logEvent('error', 'organizations.get_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = createOrganizationSchema.parse(await request.json());
    const sessionContext = await getSessionContext();

    const data = await queryOne<any>(
      `insert into organizations (
        name,
        type,
        email,
        contact_name,
        phone,
        number_of_certs,
        organization_image_name,
        cert_template_name,
        recipients_excel_name,
        status,
        submitted_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', now())
      returning *`,
      [
        parsed.name,
        parsed.type,
        parsed.email,
        parsed.contactName,
        parsed.phone,
        parsed.numberOfCerts,
        parsed.organizationImageName || null,
        parsed.certTemplateName || null,
        parsed.recipientsExcelName || null,
      ]
    );

    logEvent('info', 'organization.created', {
      actorId: sessionContext.user?.id ?? null,
      organizationName: parsed.name,
      email: parsed.email,
    });

    return NextResponse.json({ success: true, data: toRecord(data) }, { status: 201 });
  } catch (error) {
    logEvent('error', 'organizations.create_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const context = await requireInstitutionContext();
    const parsed = updateOrganizationSchema.parse(await request.json());

    const params: QueryParam[] = [];
    const sets: string[] = [];
    const addSet = (column: string, value: QueryParam) => {
      if (value === undefined) return;
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    };

    addSet('name', parsed.name);
    addSet('type', parsed.type);
    addSet('email', parsed.email);
    addSet('contact_name', parsed.contactName);
    addSet('phone', parsed.phone);
    addSet('number_of_certs', parsed.numberOfCerts);
    addSet('organization_image_name', parsed.organizationImageName);
    addSet('status', parsed.status);
    addSet('completed_at', parsed.completedAt);
    sets.push('updated_at = now()');

    params.push(parsed.id);
    const filters = [`id = $${params.length}`];

    if (context.role !== 'super_admin') {
      params.push(context.institutionId!);
      filters.push(`id = $${params.length}`);
    }

    const data = await queryOne<any>(
      `update organizations
       set ${sets.join(', ')}
       where ${filters.join(' and ')}
       returning *`,
      params
    );

    if (!data) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    logEvent('info', 'organization.updated', {
      actorId: context.user.id,
      organizationId: parsed.id,
    });

    return NextResponse.json({ success: true, data: toRecord(data) });
  } catch (error) {
    logEvent('error', 'organizations.update_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const context = await requireSuperAdminContext();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Organization id parameter is required' }, { status: 400 });
    }

    const data = await queryOne<{ id: string }>(
      'delete from organizations where id = $1 returning id',
      [id]
    );

    if (!data) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    logEvent('warn', 'organization.deleted', {
      actorId: context.user.id,
      organizationId: id,
    });

    return NextResponse.json({ success: true, message: 'Organization deleted successfully' });
  } catch (error) {
    logEvent('error', 'organizations.delete_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return errorResponse(error);
  }
}
