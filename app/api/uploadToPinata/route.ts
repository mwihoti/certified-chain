import { NextRequest, NextResponse } from "next/server";

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

interface ErrorResponse {
  error: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;

    if (!pinataApiKey || !pinataSecretApiKey) {
      return NextResponse.json(
        { error: "Pinata API keys not configured" },
        { status: 500 }
      );
    }

    // Create FormData for Pinata
    const pinataFormData = new FormData();
    pinataFormData.append("file", file);

    // Upload to Pinata
    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
      body: pinataFormData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Pinata upload error");
      return NextResponse.json(
        { error: "Failed to upload to Pinata" },
        { status: response.status }
      );
    }

    const data: PinataResponse = await response.json();

    return NextResponse.json({
      imgHash: data.IpfsHash,
      pinSize: data.PinSize,
      timestamp: data.Timestamp,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("Upload error");
    return NextResponse.json(
      { error: errorMessage } as ErrorResponse,
      { status: 500 }
    );
  }
}
