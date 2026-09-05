import { z } from 'zod';

const emptyToNull = (val: unknown) =>
  typeof val === 'string' && val.trim() === '' ? null : val;

// ─── Leave Types ───────────────────────────────────────────────
export const createLeaveTypeSchema = z.object({
  name: z.string().trim().min(1).max(100),
  code: z.string().trim().min(1).max(50),
  unit: z.enum(['DAYS', 'HOURS']).default('DAYS'),
  requiresAllocation: z.boolean().default(true),
  isPaid: z.boolean().default(true),
  colorCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  isActive: z.boolean().default(true),
});

export const updateLeaveTypeSchema = createLeaveTypeSchema.partial();

// ─── Leave Allocations ─────────────────────────────────────────
export const createLeaveAllocationSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  timeOffTypeId: z.string().uuid('Invalid leave type ID'),
  allocatedUnits: z.number().min(0).max(365),
  validityStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  validityEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.preprocess(emptyToNull, z.string().max(500).optional().nullable()),
});

export const updateLeaveAllocationSchema = createLeaveAllocationSchema.partial().omit({ employeeId: true, timeOffTypeId: true });

export const approveAllocationSchema = z.object({
  action: z.enum(['APPROVE', 'REFUSE']),
  notes: z.preprocess(emptyToNull, z.string().optional().nullable()),
});

// ─── Leave Requests ────────────────────────────────────────────
export const createLeaveRequestSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  timeOffTypeId: z.string().uuid('Invalid leave type ID'),
  timeOffAllocationId: z.preprocess(emptyToNull, z.string().uuid().optional().nullable()),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  requestedUnits: z.number().min(0.5).max(365),
  reason: z.preprocess(emptyToNull, z.string().max(500).optional().nullable()),
});

export const updateLeaveRequestSchema = createLeaveRequestSchema.partial().omit({ employeeId: true });

export const approveRequestSchema = z.object({
  action: z.enum(['APPROVE', 'REFUSE', 'CANCEL']),
  refusalReason: z.preprocess(emptyToNull, z.string().max(500).optional().nullable()),
});

// ─── Shared ─────────────────────────────────────────────────────
export const idParamSchema = z.object({ id: z.string().uuid() });

export const leaveTypeQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.preprocess((v) => v === 'true' ? true : v === 'false' ? false : undefined, z.boolean().optional()),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const allocationQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  timeOffTypeId: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REFUSED', 'CANCELLED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const requestQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  timeOffTypeId: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REFUSED', 'CANCELLED']).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateLeaveTypeInput = z.infer<typeof createLeaveTypeSchema>;
export type UpdateLeaveTypeInput = z.infer<typeof updateLeaveTypeSchema>;
export type CreateLeaveAllocationInput = z.infer<typeof createLeaveAllocationSchema>;
export type UpdateLeaveAllocationInput = z.infer<typeof updateLeaveAllocationSchema>;
export type ApproveAllocationInput = z.infer<typeof approveAllocationSchema>;
export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;
export type UpdateLeaveRequestInput = z.infer<typeof updateLeaveRequestSchema>;
export type ApproveRequestInput = z.infer<typeof approveRequestSchema>;
