import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  numeric,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { contractStatusEnum } from './enums.js';
import { employees } from './employees.js';
import { departments, jobPositions, workingSchedules } from './organization.js';
import { salaryStructures } from './salary-structures.js';
import { payslips } from './payroll.js';

export const contracts = pgTable(
  'contracts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contractReference: varchar('contract_reference', { length: 100 }).notNull().unique(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    departmentId: uuid('department_id')
      .notNull()
      .references(() => departments.id, { onDelete: 'restrict' }),
    jobPositionId: uuid('job_position_id')
      .notNull()
      .references(() => jobPositions.id, { onDelete: 'restrict' }),
    salaryStructureId: uuid('salary_structure_id')
      .notNull()
      .references(() => salaryStructures.id, { onDelete: 'restrict' }),
    workingScheduleId: uuid('working_schedule_id')
      .notNull()
      .references(() => workingSchedules.id, { onDelete: 'restrict' }),

    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    wage: numeric('wage', { precision: 15, scale: 2 }).notNull().default('0.00'),
    status: contractStatusEnum('status').notNull().default('DRAFT'),

    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_contracts_employee_dates').on(table.employeeId, table.startDate, table.endDate),
    index('idx_contracts_status').on(table.status),
  ]
);

export const contractsRelations = relations(contracts, ({ one, many }) => ({
  employee: one(employees, {
    fields: [contracts.employeeId],
    references: [employees.id],
  }),
  department: one(departments, {
    fields: [contracts.departmentId],
    references: [departments.id],
  }),
  jobPosition: one(jobPositions, {
    fields: [contracts.jobPositionId],
    references: [jobPositions.id],
  }),
  salaryStructure: one(salaryStructures, {
    fields: [contracts.salaryStructureId],
    references: [salaryStructures.id],
  }),
  workingSchedule: one(workingSchedules, {
    fields: [contracts.workingScheduleId],
    references: [workingSchedules.id],
  }),
  payslips: many(payslips),
}));
