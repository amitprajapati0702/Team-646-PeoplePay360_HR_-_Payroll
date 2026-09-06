import { z } from 'zod';

const emptyToNull = (val: unknown) =>
  typeof val === 'string' && val.trim() === '' ? null : val;

export const createContractSchema = z.object({
  contractReference: z.preprocess(emptyToNull, z.string().trim().min(2).max(100).optional().nullable()),
  employeeId: z.string().uuid('Invalid employee ID'),
  departmentId: z.preprocess(emptyToNull, z.string().uuid('Invalid department ID').optional().nullable()),
  jobPositionId: z.preprocess(emptyToNull, z.string().uuid('Invalid job position ID').optional().nullable()),
  salaryStructureId: z.preprocess(emptyToNull, z.string().uuid('Invalid salary structure ID').optional().nullable()),
  structureId: z.preprocess(emptyToNull, z.string().uuid().optional().nullable()),
  workingScheduleId: z.preprocess(emptyToNull, z.string().uuid('Invalid working schedule ID').optional().nullable()),
  scheduleId: z.preprocess(emptyToNull, z.string().uuid().optional().nullable()),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD format required'),
  endDate: z.preprocess(
    emptyToNull,
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()
  ),
  wage: z.coerce.number().min(0, 'Wage must be non-negative'),
  contractType: z.preprocess(emptyToNull, z.string().optional().nullable()),
  status: z.enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'CANCELLED']).default('ACTIVE'),
  notes: z.preprocess(emptyToNull, z.string().max(1000).optional().nullable()),
  terms: z.preprocess(emptyToNull, z.string().max(1000).optional().nullable()),
});

export const updateContractSchema = createContractSchema.partial().omit({ employeeId: true });

export const contractIdParamSchema = z.object({ id: z.string().uuid() });

export const contractQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'CANCELLED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
export type ContractQueryInput = z.infer<typeof contractQuerySchema>;
