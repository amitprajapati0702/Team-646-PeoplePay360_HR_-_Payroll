import { z } from 'zod';

const emptyToNull = (val: unknown) =>
  typeof val === 'string' && val.trim() === '' ? null : val;

export const createAttendanceSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  attendanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD format required').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  checkIn: z.string().optional(),
  checkInTime: z.preprocess(emptyToNull, z.string().optional().nullable()),
  checkOut: z.preprocess(emptyToNull, z.string().optional().nullable()),
  checkOutTime: z.preprocess(emptyToNull, z.string().optional().nullable()),
  workedHours: z.coerce.number().optional(),
  overtimeHours: z.coerce.number().optional(),
  status: z
    .enum(['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'OVERTIME', 'EXCEPTION', 'ON_LEAVE'])
    .default('PRESENT'),
  editReason: z.preprocess(emptyToNull, z.string().max(500).optional().nullable()),
  notes: z.preprocess(emptyToNull, z.string().max(500).optional().nullable()),
});

export const updateAttendanceSchema = createAttendanceSchema.partial().omit({ employeeId: true });

export const attendanceIdParamSchema = z.object({ id: z.string().uuid() });

export const attendanceQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'OVERTIME', 'EXCEPTION']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type AttendanceQueryInput = z.infer<typeof attendanceQuerySchema>;
