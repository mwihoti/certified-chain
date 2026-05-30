import { createHash } from 'crypto';
import {
  buildCertificateNumber,
  generateUniqueIdentifier,
  hashCertificateData,
  type CertificateData,
} from '@/lib/domain/certificates';

export interface IssuanceDraft extends CertificateData {}

export function buildIssuanceIdempotencyKey(
  institutionId: string,
  draft: IssuanceDraft
): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        institutionId,
        recipientName: draft.recipientName.trim().toLowerCase(),
        recipientEmail: draft.recipientEmail.trim().toLowerCase(),
        recipientPosition: draft.recipientPosition.trim().toLowerCase(),
        credentialType: draft.credentialType.trim().toLowerCase(),
        issueDate: draft.issueDate,
        expiryDate: draft.expiryDate || '',
      })
    )
    .digest('hex');
}

export function buildDraftArtifacts(
  draft: IssuanceDraft,
  institutionName: string,
  entryNumber: number
) {
  const identifier = generateUniqueIdentifier(institutionName, draft.recipientName, entryNumber);
  const certificateHash = hashCertificateData(draft);
  const certificateNumber = buildCertificateNumber(institutionName, entryNumber);

  return {
    identifier,
    certificateHash,
    certificateNumber,
  };
}
