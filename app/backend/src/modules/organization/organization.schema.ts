import { z } from 'zod';

// ─── Departments ───────────────────────────────────────────────
export const createDepartmentSchema = z.object({
  code: z.string().trim().min(2).max(50),
  name: z.string().trim().min(1).max(150),
  managerId: z.string().uuid().optional().nullable(),
  parentDepartmentId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

// ─── Job Positions ─────────────────────────────────────────────
export const createJobPositionSchema = z.object({
  departmentId: z.string().uuid('Invalid department ID'),
  title: z.string().trim().min(1).max(150),
  code: z.string().trim().min(1).max(50),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateJobPositionSchema = createJobPositionSchema.partial();

// ─── Working Schedules ─────────────────────────────────────────
const scheduleLineSchema = z.object({
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  workFrom: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM'),
  workTo: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM'),
  breakDurationMinutes: z.number().int().min(0).max(480).default(60),
  dailyWorkingHours: z.number().min(0).max(24).optional(),
});

export const createWorkingScheduleSchema = z.object({
  name: z.string().trim().min(1).max(150),
  code: z.string().trim().min(1).max(50),
  scheduleType: z.string().default('STANDARD'),
  totalWeeklyHours: z.number().min(0).max(168).default(40),
  isActive: z.boolean().default(true),
  lines: z.array(scheduleLineSchema).optional(),
});

export const updateWorkingScheduleSchema = createWorkingScheduleSchema.partial();

// ─── Shared ─────────────────────────────────────────────────────
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID'),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().optional(),
  isActive: z.preprocess((v) => {
    if (v === 'true') return true;
    if (v === 'false') return false;
    return undefined;
  }, z.boolean().optional()),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type CreateJobPositionInput = z.infer<typeof createJobPositionSchema>;
export type UpdateJobPositionInput = z.infer<typeof updateJobPositionSchema>;
export type CreateWorkingScheduleInput = z.infer<typeof createWorkingScheduleSchema>;
export type UpdateWorkingScheduleInput = z.infer<typeof updateWorkingScheduleSchema>;
export type ListQueryInput = z.infer<typeof listQuerySchema>;
