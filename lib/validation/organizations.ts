import { z } from 'zod';

export const organizationStatusSchema = z.enum(['pending', 'approved', 'rejected']);

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  type: z.string().trim().min(2).max(80),
  email: z.string().email(),
  contactName: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(7).max(32),
  numberOfCerts: z.number().int().nonnegative(),
  organizationImageName: z.string().trim().max(255).optional(),
  certTemplateName: z.string().trim().max(255).optional(),
  recipientsExcelName: z.string().trim().max(255).optional(),
});

export const updateOrganizationSchema = createOrganizationSchema
  .partial()
  .extend({
    id: z.string().uuid().or(z.string().trim().min(1)),
    status: organizationStatusSchema.optional(),
    completedAt: z.string().datetime().optional(),
  });
