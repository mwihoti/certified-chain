import { NextRequest, NextResponse } from "next/server";
import { requireInstitutionContext } from '@/lib/server/auth';
import { logEvent } from '@/lib/server/logger';
import { pinFileToIpfs } from '@/lib/server/pinata';

export const dynamic = 'force-dynamic';

interface ErrorResponse {
  error: string;
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireInstitutionContext();
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image uploads are allowed' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File exceeds 5MB limit' }, { status: 400 });
    }

    const data = await pinFileToIpfs(file, {
        actorId: context.user.id,
    });

    return NextResponse.json({
      imgHash: data.imgHash,
      pinSize: data.pinSize,
      timestamp: data.timestamp,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    logEvent('error', 'pinata.upload_failed', { error: errorMessage });
    return NextResponse.json(
      { error: errorMessage } as ErrorResponse,
      { status: 500 }
    );
  }
}
