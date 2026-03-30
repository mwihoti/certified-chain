import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function toRecord(row: any) {
  return {
    id: row.id,
    uniqueIdentifier: row.unique_identifier,
    certificateNumber: row.certificate_number,
    recipientName: row.recipient_name,
    recipientEmail: row.recipient_email,
    recipientPosition: row.recipient_position,
    credentialType: row.credential_type,
    issueDate: row.issue_date,
    expiryDate: row.expiry_date,
    institutionId: row.institution_id,
    institutionName: row.institution_name,
    blockchainTxHash: row.blockchain_tx_hash,
    blockchainTxIndex: row.blockchain_tx_index ?? 0,
    certificateHash: row.certificate_hash,
    status: row.status,
    revokedAt: row.revoked_at,
    revokedReason: row.revoked_reason,
    revokeTxHash: row.revoke_tx_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const uniqueId = searchParams.get('uniqueId');
    const certNumber = searchParams.get('certNumber');
    const institutionId = searchParams.get('institutionId');

    if (uniqueId) {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('unique_identifier', uniqueId)
        .single();

      if (error || !data) {
        return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: toRecord(data) });
    }

    if (certNumber) {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('certificate_number', certNumber)
        .single();

      if (error || !data) {
        return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: toRecord(data) });
    }

    let query = supabase.from('certificates').select('*').order('created_at', { ascending: false });

    if (institutionId) {
      query = query.eq('institution_id', institutionId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data: (data || []).map(toRecord) });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const requiredFields = [
      'uniqueIdentifier', 'certificateNumber', 'recipientName', 'recipientEmail',
      'recipientPosition', 'credentialType', 'issueDate', 'institutionId',
      'institutionName', 'blockchainTxHash', 'certificateHash',
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ success: false, error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from('certificates')
      .insert({
        unique_identifier: body.uniqueIdentifier,
        certificate_number: body.certificateNumber,
        recipient_name: body.recipientName,
        recipient_email: body.recipientEmail,
        recipient_position: body.recipientPosition,
        credential_type: body.credentialType,
        issue_date: body.issueDate,
        expiry_date: body.expiryDate || null,
        institution_id: body.institutionId,
        institution_name: body.institutionName,
        blockchain_tx_hash: body.blockchainTxHash,
        blockchain_tx_index: body.blockchainTxIndex ?? 0,
        certificate_hash: body.certificateHash,
        status: 'valid',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Certificate with this unique identifier already exists' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, data: toRecord(data) }, { status: 201 });
  } catch (error) {
    console.error('Error creating certificate:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { uniqueIdentifier, ...updates } = body;

    if (!uniqueIdentifier) {
      return NextResponse.json({ success: false, error: 'uniqueIdentifier is required' }, { status: 400 });
    }

    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.revokedAt !== undefined) dbUpdates.revoked_at = updates.revokedAt;
    if (updates.revokedReason !== undefined) dbUpdates.revoked_reason = updates.revokedReason;

    const { data, error } = await supabase
      .from('certificates')
      .update(dbUpdates)
      .eq('unique_identifier', uniqueIdentifier)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: toRecord(data) });
  } catch (error) {
    console.error('Error updating certificate:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const uniqueId = searchParams.get('uniqueId');

    if (!uniqueId) {
      return NextResponse.json({ success: false, error: 'uniqueId parameter is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));

    const { data, error } = await supabase
      .from('certificates')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoke_tx_hash: body.revokeTxHash || null,
        updated_at: new Date().toISOString(),
      })
      .eq('unique_identifier', uniqueId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Certificate revoked successfully', data: toRecord(data) });
  } catch (error) {
    console.error('Error revoking certificate:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
