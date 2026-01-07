// app/api/organizations/[orgId]/excel/route.ts
// Next.js App Router Route Handler (recommended for Next.js 13+ / 14+)

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Your server-side Supabase client

// Example bucket and path convention – adjust to your setup
const BUCKET_NAME = 'organization-excels'; // Your Supabase storage bucket
const getFilePath = (orgId: string) => `uploads/${orgId}/certificates.xlsx`; // Adjust filename/path as needed

export async function GET(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const { orgId } = params;

  if (!orgId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
  }

 
  const supabase = createClient();

  // Download the file from Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(getFilePath(orgId));


  // Convert Blob → ArrayBuffer → Buffer (Node.js compatible)
  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Return the Excel file as a downloadable response
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${orgId}_original_certificates.xlsx"`,
      'Content-Length': buffer.length.toString(),
      // Optional: cache control
      'Cache-Control': 'private, max-age=0, must-revalidate',
    },
  });
}