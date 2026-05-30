import { logEvent } from '@/lib/server/logger';

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export async function pinFileToIpfs(file: File, eventContext: Record<string, unknown> = {}) {
  const rawPinataJwt = process.env.PINATA_JWT?.trim();
  const rawPinataApiKey = process.env.PINATA_API_KEY?.trim();
  const rawPinataSecretApiKey = process.env.PINATA_SECRET_API_KEY?.trim();
  const shiftedKeySecret =
    rawPinataJwt &&
    !rawPinataJwt.startsWith('eyJ') &&
    rawPinataApiKey &&
    !rawPinataApiKey.startsWith('eyJ') &&
    rawPinataSecretApiKey?.startsWith('eyJ');
  const pinataApiKey = shiftedKeySecret ? rawPinataJwt : rawPinataApiKey;
  const pinataSecretApiKey = shiftedKeySecret ? rawPinataApiKey : rawPinataSecretApiKey;
  const pinataJwt = rawPinataJwt?.startsWith('eyJ')
    ? rawPinataJwt
    : !pinataApiKey || !pinataSecretApiKey || pinataSecretApiKey.startsWith('eyJ')
      ? [rawPinataApiKey, rawPinataSecretApiKey].find((value) => value?.startsWith('eyJ'))
      : undefined;

  if (!pinataJwt && (!pinataApiKey || !pinataSecretApiKey || pinataSecretApiKey.startsWith('eyJ'))) {
    throw new Error('Pinata API keys not configured');
  }

  const pinataFormData = new FormData();
  pinataFormData.append('file', file);

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: pinataJwt
      ? { Authorization: `Bearer ${pinataJwt}` }
      : {
          pinata_api_key: pinataApiKey!,
          pinata_secret_api_key: pinataSecretApiKey!,
        },
    body: pinataFormData,
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    logEvent('error', 'pinata.upload_failed', {
      ...eventContext,
      fileName: file.name,
      status: response.status,
      details: details.slice(0, 240),
    });
    throw new Error(
      details ? `Failed to upload to Pinata: ${details.slice(0, 160)}` : 'Failed to upload to Pinata'
    );
  }

  const data: PinataResponse = await response.json();
  logEvent('info', 'pinata.upload_success', {
    ...eventContext,
    fileName: file.name,
    size: file.size,
    ipfsHash: data.IpfsHash,
  });

  return {
    imgHash: data.IpfsHash,
    pinSize: data.PinSize,
    timestamp: data.Timestamp,
  };
}
