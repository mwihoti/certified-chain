import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for development
// In production, replace with actual database
const certificates = new Map<string, any>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uniqueId = searchParams.get('uniqueId');
    const certNumber = searchParams.get('certNumber');
    
    if (uniqueId) {
      // Search by unique identifier
      const cert = certificates.get(uniqueId);
      if (cert) {
        return NextResponse.json({ success: true, data: cert });
      }
      return NextResponse.json(
        { success: false, error: 'Certificate not found' },
        { status: 404 }
      );
    }
    
    if (certNumber) {
      // Search by certificate number
      const cert = Array.from(certificates.values()).find(
        c => c.certificateNumber === certNumber
      );
      if (cert) {
        return NextResponse.json({ success: true, data: cert });
      }
      return NextResponse.json(
        { success: false, error: 'Certificate not found' },
        { status: 404 }
      );
    }
    
    // Return all certificates (paginated in production)
    return NextResponse.json({
      success: true,
      data: Array.from(certificates.values()),
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'uniqueIdentifier',
      'certificateNumber',
      'recipientName',
      'recipientEmail',
      'recipientPosition',
      'credentialType',
      'issueDate',
      'institutionId',
      'institutionName',
      'blockchainTxHash',
      'certificateHash',
    ];
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Check if certificate already exists
    if (certificates.has(body.uniqueIdentifier)) {
      return NextResponse.json(
        { success: false, error: 'Certificate with this unique identifier already exists' },
        { status: 409 }
      );
    }
    
    // Create certificate record
    const certificate = {
      ...body,
      id: `cert-${Date.now()}`,
      status: 'valid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Store certificate
    certificates.set(body.uniqueIdentifier, certificate);
    
    // Also index by certificate number for quick lookup
    certificates.set(`cert_num_${body.certificateNumber}`, certificate);
    
    return NextResponse.json({
      success: true,
      data: certificate,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating certificate:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { uniqueIdentifier, ...updates } = body;
    
    if (!uniqueIdentifier) {
      return NextResponse.json(
        { success: false, error: 'uniqueIdentifier is required' },
        { status: 400 }
      );
    }
    
    const certificate = certificates.get(uniqueIdentifier);
    if (!certificate) {
      return NextResponse.json(
        { success: false, error: 'Certificate not found' },
        { status: 404 }
      );
    }
    
    // Update certificate
    const updatedCertificate = {
      ...certificate,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    certificates.set(uniqueIdentifier, updatedCertificate);
    
    return NextResponse.json({
      success: true,
      data: updatedCertificate,
    });
  } catch (error) {
    console.error('Error updating certificate:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uniqueId = searchParams.get('uniqueId');
    
    if (!uniqueId) {
      return NextResponse.json(
        { success: false, error: 'uniqueId parameter is required' },
        { status: 400 }
      );
    }
    
    const certificate = certificates.get(uniqueId);
    if (!certificate) {
      return NextResponse.json(
        { success: false, error: 'Certificate not found' },
        { status: 404 }
      );
    }
    
    // Soft delete - mark as revoked instead of deleting
    certificate.status = 'revoked';
    certificate.revokedAt = new Date().toISOString();
    certificate.updatedAt = new Date().toISOString();
    
    certificates.set(uniqueId, certificate);
    
    return NextResponse.json({
      success: true,
      message: 'Certificate revoked successfully',
      data: certificate,
    });
  } catch (error) {
    console.error('Error revoking certificate:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
