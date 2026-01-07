import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for development
// In production, replace with actual database
const organizations = new Map<string, any>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    
    if (id) {
      // Get specific organization
      const org = organizations.get(id);
      if (org) {
        return NextResponse.json({ success: true, data: org });
      }
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }
    
    // Filter by status if provided
    let orgs = Array.from(organizations.values());
    if (status) {
      orgs = orgs.filter(org => org.status === status);
    }
    
    return NextResponse.json({
      success: true,
      data: orgs,
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
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
      'name',
      'type',
      'email',
      'contactName',
      'phone',
      'numberOfCerts',
    ];
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Create organization record
    const organization = {
      ...body,
      id: `org-${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Store organization
    organizations.set(organization.id, organization);
    
    return NextResponse.json({
      success: true,
      data: organization,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Organization id is required' },
        { status: 400 }
      );
    }
    
    const organization = organizations.get(id);
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }
    
    // Update organization
    const updatedOrganization = {
      ...organization,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    organizations.set(id, updatedOrganization);
    
    return NextResponse.json({
      success: true,
      data: updatedOrganization,
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Organization id parameter is required' },
        { status: 400 }
      );
    }
    
    const organization = organizations.get(id);
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }
    
    // Delete organization
    organizations.delete(id);
    
    return NextResponse.json({
      success: true,
      message: 'Organization deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
