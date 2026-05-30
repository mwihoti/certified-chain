import { z } from 'zod';

export const certificateStatusSchema = z.enum(['valid', 'revoked', 'expired']);

export const certificateLookupSchema = z.object({
  uniqueId: z.string().trim().min(1).optional(),
  certNumber: z.string().trim().min(1).optional(),
  institutionId: z.string().trim().min(1).optional(),
});

export const certificateUpdateSchema = z.object({
  uniqueIdentifier: z.string().trim().min(1),
  status: certificateStatusSchema.optional(),
  revokedAt: z.string().datetime().optional(),
  revokedReason: z.string().trim().max(500).optional(),
});

export const revokeCertificateSchema = z.object({
  revokeTxHash: z.string().trim().min(1).max(128).optional(),
});
