import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { employeeStatusEnum, employmentTypeEnum } from './enums.js';
import { users } from './users.js';
import { departments, jobPositions, workingSchedules } from './organization.js';
import { contracts } from './contracts.js';
import { attendances } from './attendance.js';
import { timeOffAllocations, timeOffRequests } from './time-off.js';
import { payslips } from './payroll.js';

export const employees = pgTable(
  'employees',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }).unique(),
    employeeCode: varchar('employee_code', { length: 50 }).notNull().unique(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    workEmail: varchar('work_email', { length: 255 }).notNull().unique(),
    personalEmail: varchar('personal_email', { length: 255 }),
    phone: varchar('phone', { length: 30 }),
    gender: varchar('gender', { length: 20 }),
    dateOfBirth: date('date_of_birth'),
    joiningDate: date('joining_date').notNull(),
    exitDate: date('exit_date'),

    // Organizational references
    departmentId: uuid('department_id')
      .notNull()
      .references(() => departments.id, { onDelete: 'restrict' }),
    jobPositionId: uuid('job_position_id')
      .notNull()
      .references(() => jobPositions.id, { onDelete: 'restrict' }),
    managerId: uuid('manager_id'),
    workingScheduleId: uuid('working_schedule_id')
      .notNull()
      .references(() => workingSchedules.id, { onDelete: 'restrict' }),
    employmentType: employmentTypeEnum('employment_type').notNull().default('FULL_TIME'),
    status: employeeStatusEnum('status').notNull().default('ACTIVE'),

    // Bank Details
    bankName: varchar('bank_name', { length: 150 }),
    bankAccountNumber: varchar('bank_account_number', { length: 100 }),
    bankRoutingOrIfsc: varchar('bank_routing_or_ifsc', { length: 50 }),
    bankAccountHolderName: varchar('bank_account_holder_name', { length: 200 }),

    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_employees_department').on(table.departmentId),
    index('idx_employees_job_position').on(table.jobPositionId),
    index('idx_employees_manager').on(table.managerId),
    index('idx_employees_status').on(table.status),
    index('idx_employees_type').on(table.employmentType),
  ]
);

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
    relationName: 'departmentEmployees',
  }),
  jobPosition: one(jobPositions, {
    fields: [employees.jobPositionId],
    references: [jobPositions.id],
  }),
  manager: one(employees, {
    fields: [employees.managerId],
    references: [employees.id],
    relationName: 'managerSubordinates',
  }),
  directReports: many(employees, {
    relationName: 'managerSubordinates',
  }),
  workingSchedule: one(workingSchedules, {
    fields: [employees.workingScheduleId],
    references: [workingSchedules.id],
  }),
  contracts: many(contracts),
  attendances: many(attendances),
  timeOffAllocations: many(timeOffAllocations),
  timeOffRequests: many(timeOffRequests),
  payslips: many(payslips),
}));
