import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  numeric,
  integer,
  boolean,
  timestamp,
  jsonb,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { payrunStatusEnum, payslipStatusEnum } from './enums.js';
import { users } from './users.js';
import { employees } from './employees.js';
import { contracts } from './contracts.js';
import {
  salaryStructures,
  salaryRules,
  salaryRuleCategories,
} from './salary-structures.js';

/**
 * Payruns Table: Represents monthly/periodic payroll execution batches,
 * aggregating status, date ranges, total gross/deductions/net, and approval workflows.
 */
export const payruns = pgTable(
  'payruns',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 150 }).notNull(),
    batchCode: varchar('batch_code', { length: 50 }).notNull().unique(),
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    defaultSalaryStructureId: uuid('default_salary_structure_id').references(
      () => salaryStructures.id,
      { onDelete: 'restrict' }
    ),

    status: payrunStatusEnum('status').notNull().default('DRAFT'),
    totalGrossAmount: numeric('total_gross_amount', { precision: 18, scale: 2 }).default(
      '0.00'
    ),
    totalDeductionAmount: numeric('total_deduction_amount', {
      precision: 18,
      scale: 2,
    }).default('0.00'),
    totalNetAmount: numeric('total_net_amount', { precision: 18, scale: 2 }).default(
      '0.00'
    ),
    totalPayslipCount: integer('total_payslip_count').default(0),

    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    validatedByUserId: uuid('validated_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    validatedAt: timestamp('validated_at', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),

    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_payruns_period_status').on(
      table.periodStart,
      table.periodEnd,
      table.status
    ),
  ]
);

export const payrunsRelations = relations(payruns, ({ one, many }) => ({
  defaultSalaryStructure: one(salaryStructures, {
    fields: [payruns.defaultSalaryStructureId],
    references: [salaryStructures.id],
  }),
  createdByUser: one(users, {
    fields: [payruns.createdByUserId],
    references: [users.id],
    relationName: 'payrunCreator',
  }),
  validatedByUser: one(users, {
    fields: [payruns.validatedByUserId],
    references: [users.id],
    relationName: 'payrunValidator',
  }),
  payslips: many(payslips),
}));

/**
 * Payslips Table: Stores individual employee paycheck calculations per payrun batch,
 * tracking worked days, financials, pre-flight validation warnings, and delivery status.
 */
export const payslips = pgTable(
  'payslips',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    payslipNumber: varchar('payslip_number', { length: 100 }).notNull().unique(),
    payrunId: uuid('payrun_id')
      .notNull()
      .references(() => payruns.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'restrict' }),
    contractId: uuid('contract_id')
      .notNull()
      .references(() => contracts.id, { onDelete: 'restrict' }),
    salaryStructureId: uuid('salary_structure_id')
      .notNull()
      .references(() => salaryStructures.id, { onDelete: 'restrict' }),

    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    status: payslipStatusEnum('status').notNull().default('DRAFT'),

    // Time summary
    plannedWorkingDays: numeric('planned_working_days', {
      precision: 5,
      scale: 2,
    })
      .notNull()
      .default('0.00'),
    actualWorkedDays: numeric('actual_worked_days', {
      precision: 5,
      scale: 2,
    })
      .notNull()
      .default('0.00'),
    approvedLeaveDays: numeric('approved_leave_days', {
      precision: 5,
      scale: 2,
    })
      .notNull()
      .default('0.00'),
    unpaidLeaveDays: numeric('unpaid_leave_days', {
      precision: 5,
      scale: 2,
    })
      .notNull()
      .default('0.00'),

    // Computed financial amounts
    baseWage: numeric('base_wage', { precision: 15, scale: 2 })
      .notNull()
      .default('0.00'),
    grossAmount: numeric('gross_amount', { precision: 15, scale: 2 })
      .notNull()
      .default('0.00'),
    deductionAmount: numeric('deduction_amount', { precision: 15, scale: 2 })
      .notNull()
      .default('0.00'),
    netAmount: numeric('net_amount', { precision: 15, scale: 2 })
      .notNull()
      .default('0.00'),

    // Validation warnings (e.g. missing bank details, overlapping payslip)
    validationWarnings: jsonb('validation_warnings')
      .$type<string[]>()
      .notNull()
      .default([]),

    pdfStoragePath: text('pdf_storage_path'),
    isEmailSent: boolean('is_email_sent').notNull().default(false),
    emailSentAt: timestamp('email_sent_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    unique('uq_employee_payrun').on(table.payrunId, table.employeeId),
    index('idx_payslips_payrun').on(table.payrunId),
    index('idx_payslips_employee').on(table.employeeId),
    index('idx_payslips_period').on(table.periodStart, table.periodEnd),
    index('idx_payslips_status').on(table.status),
  ]
);

export const payslipsRelations = relations(payslips, ({ one, many }) => ({
  payrun: one(payruns, {
    fields: [payslips.payrunId],
    references: [payruns.id],
  }),
  employee: one(employees, {
    fields: [payslips.employeeId],
    references: [employees.id],
  }),
  contract: one(contracts, {
    fields: [payslips.contractId],
    references: [contracts.id],
  }),
  salaryStructure: one(salaryStructures, {
    fields: [payslips.salaryStructureId],
    references: [salaryStructures.id],
  }),
  lines: many(payslipLines),
}));

/**
 * Payslip Lines Table: Stores itemized breakdown amounts and calculation rates
 * for every salary rule applied to a payslip.
 */
export const payslipLines = pgTable(
  'payslip_lines',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    payslipId: uuid('payslip_id')
      .notNull()
      .references(() => payslips.id, { onDelete: 'cascade' }),
    salaryRuleId: uuid('salary_rule_id').references(() => salaryRules.id, {
      onDelete: 'restrict',
    }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => salaryRuleCategories.id, { onDelete: 'restrict' }),

    name: varchar('name', { length: 150 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    categoryCode: varchar('category_code', { length: 50 }).notNull(), // BASIC, ALW, GROSS, DED, NET
    sequence: integer('sequence').notNull(),

    rate: numeric('rate', { precision: 6, scale: 3 }).default('0.000'),
    baseAmount: numeric('base_amount', { precision: 15, scale: 2 }).default('0.00'),
    totalAmount: numeric('total_amount', { precision: 15, scale: 2 })
      .notNull()
      .default('0.00'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_payslip_lines_payslip_cat').on(table.payslipId, table.categoryCode),
  ]
);

export const payslipLinesRelations = relations(payslipLines, ({ one }) => ({
  payslip: one(payslips, {
    fields: [payslipLines.payslipId],
    references: [payslips.id],
  }),
  salaryRule: one(salaryRules, {
    fields: [payslipLines.salaryRuleId],
    references: [salaryRules.id],
  }),
  category: one(salaryRuleCategories, {
    fields: [payslipLines.categoryId],
    references: [salaryRuleCategories.id],
  }),
}));
