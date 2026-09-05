import { z } from 'zod';

export const createPayrunSchema = z.object({
  name: z.string().trim().min(1).max(150),
  batchCode: z.string().trim().min(2).max(50),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  defaultSalaryStructureId: z.string().uuid('Invalid salary structure ID').optional(),
  employeeIds: z.array(z.string().uuid()).min(1, 'At least one employee is required'),
  notes: z.string().max(1000).optional().nullable(),
});

export const updatePayrunSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  notes: z.string().max(1000).optional().nullable(),
  status: z.enum(['DRAFT', 'COMPUTING', 'COMPUTED', 'VALIDATED', 'PAID', 'CANCELLED']).optional(),
});

export const payrunIdParamSchema = z.object({ id: z.string().uuid() });

export const payrunQuerySchema = z.object({
  status: z.enum(['DRAFT', 'COMPUTING', 'COMPUTED', 'VALIDATED', 'PAID', 'CANCELLED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const payrunActionSchema = z.object({
  action: z.enum(['VALIDATE', 'MARK_PAID', 'CANCEL']),
  notes: z.string().max(500).optional().nullable(),
});

export type CreatePayrunInput = z.infer<typeof createPayrunSchema>;
export type UpdatePayrunInput = z.infer<typeof updatePayrunSchema>;
export type PayrunQueryInput = z.infer<typeof payrunQuerySchema>;
export type PayrunActionInput = z.infer<typeof payrunActionSchema>;
