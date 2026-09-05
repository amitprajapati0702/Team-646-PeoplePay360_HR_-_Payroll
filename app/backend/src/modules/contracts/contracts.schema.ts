import { z } from 'zod';

const emptyToNull = (val: unknown) =>
  typeof val === 'string' && val.trim() === '' ? null : val;

export const createContractSchema = z.object({
  contractReference: z.string().trim().min(2).max(100),
  employeeId: z.string().uuid('Invalid employee ID'),
  departmentId: z.string().uuid('Invalid department ID'),
  jobPositionId: z.string().uuid('Invalid job position ID'),
  salaryStructureId: z.string().uuid('Invalid salary structure ID'),
  workingScheduleId: z.string().uuid('Invalid working schedule ID'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD format required'),
  endDate: z.preprocess(
    emptyToNull,
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()
  ),
  wage: z.number().min(0, 'Wage must be non-negative'),
  status: z.enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'CANCELLED']).default('DRAFT'),
  notes: z.preprocess(emptyToNull, z.string().max(1000).optional().nullable()),
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
