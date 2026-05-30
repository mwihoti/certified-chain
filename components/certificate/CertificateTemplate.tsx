"use client";

interface CertificateTemplateProps {
  recipientName: string;
  recipientEmail?: string;
  recipientPosition: string;
  credentialType: string;
  issueDate: string;
  expiryDate?: string;
  institutionName: string;
  organizationLogo?: string;
  transactionHash: string;
  uniqueIdentifier: string;
  certificateNumber?: string;
  status?: 'valid' | 'revoked' | 'expired';
}

export default function CertificateTemplate({
  recipientName,
  credentialType,
  institutionName,
  uniqueIdentifier,
  certificateNumber,
}: CertificateTemplateProps) {
  const encodedId = encodeURIComponent(uniqueIdentifier);
  const imageUrl = `/api/certificates/${encodedId}/nft-image`;
  const metadataUrl = `/api/certificates/${encodedId}/nft-metadata`;
  const displayId = certificateNumber || uniqueIdentifier;

  return (
    <section className="w-full max-w-5xl mx-auto">
      <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
        <img
          src={imageUrl}
          alt={`${credentialType} certificate NFT image for ${recipientName} issued by ${institutionName}`}
          className="block h-auto w-full bg-white"
        />
      </div>
      <div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          NFT image asset for <span className="font-mono text-foreground">{displayId}</span>
        </span>
        <div className="flex gap-3">
          <a className="font-medium text-primary hover:underline" href={imageUrl} target="_blank" rel="noreferrer">
            Open image
          </a>
          <a className="font-medium text-primary hover:underline" href={metadataUrl} target="_blank" rel="noreferrer">
            View 721 metadata
          </a>
        </div>
      </div>
    </section>
  );
}

