import { z } from 'zod';

export const issuanceDraftSchema = z.object({
  recipientName: z.string().trim().min(2).max(160),
  recipientEmail: z.string().email(),
  recipientPosition: z.string().trim().min(2).max(160),
  credentialType: z.string().trim().min(2).max(160),
  issueDate: z.string().trim().min(4).max(32),
  expiryDate: z.string().trim().max(32).optional().or(z.literal('')),
});

export const issuanceFinalizeSchema = z.object({
  txHash: z.string().trim().min(10).max(128),
  txIndex: z.number().int().nonnegative().default(0),
  certificateHash: z.string().trim().min(10).max(128),
  uniqueIdentifier: z.string().trim().min(3).max(64),
  errorMessage: z.string().trim().max(1000).optional(),
});
