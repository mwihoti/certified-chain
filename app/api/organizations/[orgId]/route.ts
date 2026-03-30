

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; 


const BUCKET_NAME = 'organization-excels'; 
const getFilePath = (orgId: string) => `uploads/${orgId}/certificates.xlsx`; // Adjust filename/path as needed

export async function GET(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  const { orgId } = params;

  if (!orgId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
  }

 
  const supabase = await createClient();


  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(getFilePath(orgId));



  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Return the Excel file as a downloadable response
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${orgId}_original_certificates.xlsx"`,
      'Content-Length': buffer.length.toString(),

      'Cache-Control': 'private, max-age=0, must-revalidate',
    },
  });
}