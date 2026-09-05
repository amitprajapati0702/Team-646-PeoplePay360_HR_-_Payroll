import { z } from 'zod';

export const createEmployeeBodySchema = z.object({
  employeeCode: z.string().min(2, 'Employee code must have at least 2 characters').max(50),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  workEmail: z.string().email('Invalid email address').max(255),
  personalEmail: z.string().email('Invalid personal email').max(255).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  gender: z.string().max(20).optional().nullable(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  joiningDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Joining date must be in YYYY-MM-DD format'),
  exitDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Exit date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),

  departmentId: z.string().uuid('Invalid department ID'),
  jobPositionId: z.string().uuid('Invalid job position ID'),
  managerId: z.string().uuid('Invalid manager ID').optional().nullable(),
  workingScheduleId: z.string().uuid('Invalid working schedule ID'),
  employmentType: z
    .enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'])
    .default('FULL_TIME'),
  status: z
    .enum(['PROBATION', 'ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'])
    .default('ACTIVE'),

  // Bank Details
  bankName: z.string().max(150).optional().nullable(),
  bankAccountNumber: z.string().max(100).optional().nullable(),
  bankRoutingOrIfsc: z.string().max(50).optional().nullable(),
  bankAccountHolderName: z.string().max(200).optional().nullable(),

  avatarUrl: z.string().url('Invalid avatar URL').optional().nullable(),

  // User Account Provisioning
  createUserAccount: z.boolean().default(false),
  userPassword: z.string().min(6, 'Password must be at least 6 characters').optional(),
  userRole: z
    .enum(['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'])
    .default('EMPLOYEE'),
});

export const updateEmployeeBodySchema = createEmployeeBodySchema.partial().omit({
  createUserAccount: true,
  userPassword: true,
  userRole: true,
});

export const employeeIdParamSchema = z.object({
  id: z.string().uuid('Invalid employee ID'),
});

export const queryEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  jobPositionId: z.string().uuid().optional(),
  status: z.enum(['PROBATION', 'ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED']).optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']).optional(),
  managerId: z.string().uuid().optional(),
  sortBy: z
    .enum(['createdAt', 'firstName', 'lastName', 'employeeCode', 'joiningDate'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const kanbanQuerySchema = z.object({
  groupBy: z.enum(['department', 'status', 'employmentType']).default('status'),
});

export const updateEmployeeStatusBodySchema = z.object({
  status: z.enum(['PROBATION', 'ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED']),
  exitDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Exit date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  reason: z.string().max(500).optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeBodySchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeBodySchema>;
export type QueryEmployeesInput = z.infer<typeof queryEmployeesQuerySchema>;
export type KanbanQueryInput = z.infer<typeof kanbanQuerySchema>;
export type UpdateEmployeeStatusInput = z.infer<typeof updateEmployeeStatusBodySchema>;
