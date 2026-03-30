import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');

    if (id) {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: toRecord(data) });
    }

    let query = supabase.from('organizations').select('*').order('created_at', { ascending: false });
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data: (data || []).map(toRecord) });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const requiredFields = ['name', 'type', 'email', 'contactName', 'phone', 'numberOfCerts'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ success: false, error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: body.name,
        type: body.type,
        email: body.email,
        contact_name: body.contactName,
        phone: body.phone,
        number_of_certs: body.numberOfCerts,
        organization_image_name: body.organizationImageName || null,
        cert_template_name: body.certTemplateName || null,
        recipients_excel_name: body.recipientsExcelName || null,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: toRecord(data) }, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Organization id is required' }, { status: 400 });
    }

    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.contactName !== undefined) dbUpdates.contact_name = updates.contactName;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.numberOfCerts !== undefined) dbUpdates.number_of_certs = updates.numberOfCerts;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;

    const { data, error } = await supabase
      .from('organizations')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: toRecord(data) });
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Organization id parameter is required' }, { status: 400 });
    }

    const { error } = await supabase.from('organizations').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
