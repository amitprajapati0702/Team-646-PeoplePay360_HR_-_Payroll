import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  numeric,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { timeOffUnitEnum, workflowStatusEnum } from './enums.js';
import { employees } from './employees.js';
import { users } from './users.js';

export const timeOffTypes = pgTable('time_off_types', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(), // SICK, PAID, CASUAL, UNPAID
  unit: timeOffUnitEnum('unit').notNull().default('DAYS'),
  requiresAllocation: boolean('requires_allocation').notNull().default(true),
  isPaid: boolean('is_paid').notNull().default(true),
  colorCode: varchar('color_code', { length: 10 }).default('#3B82F6'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const timeOffTypesRelations = relations(timeOffTypes, ({ many }) => ({
  allocations: many(timeOffAllocations),
  requests: many(timeOffRequests),
}));

export const timeOffAllocations = pgTable(
  'time_off_allocations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    timeOffTypeId: uuid('time_off_type_id')
      .notNull()
      .references(() => timeOffTypes.id, { onDelete: 'restrict' }),

    allocatedUnits: numeric('allocated_units', { precision: 6, scale: 2 }).notNull(),
    takenUnits: numeric('taken_units', { precision: 6, scale: 2 }).notNull().default('0.00'),

    validityStart: date('validity_start').notNull(),
    validityEnd: date('validity_end').notNull(),
    status: workflowStatusEnum('status').notNull().default('DRAFT'),

    approvedByUserId: uuid('approved_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_time_off_alloc_emp').on(
      table.employeeId,
      table.validityStart,
      table.validityEnd
    ),
  ]
);

export const timeOffAllocationsRelations = relations(
  timeOffAllocations,
  ({ one, many }) => ({
    employee: one(employees, {
      fields: [timeOffAllocations.employeeId],
      references: [employees.id],
    }),
    timeOffType: one(timeOffTypes, {
      fields: [timeOffAllocations.timeOffTypeId],
      references: [timeOffTypes.id],
    }),
    approvedByUser: one(users, {
      fields: [timeOffAllocations.approvedByUserId],
      references: [users.id],
    }),
    requests: many(timeOffRequests),
  })
);

export const timeOffRequests = pgTable(
  'time_off_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    timeOffTypeId: uuid('time_off_type_id')
      .notNull()
      .references(() => timeOffTypes.id, { onDelete: 'restrict' }),
    timeOffAllocationId: uuid('time_off_allocation_id').references(
      () => timeOffAllocations.id,
      { onDelete: 'set null' }
    ),

    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    requestedUnits: numeric('requested_units', { precision: 5, scale: 2 }).notNull(),

    status: workflowStatusEnum('status').notNull().default('SUBMITTED'),
    reason: text('reason'),
    refusalReason: text('refusal_reason'),

    approvedByUserId: uuid('approved_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_time_off_requests_emp').on(table.employeeId, table.status),
    index('idx_time_off_requests_dates').on(table.startDate, table.endDate),
  ]
);

export const timeOffRequestsRelations = relations(timeOffRequests, ({ one }) => ({
  employee: one(employees, {
    fields: [timeOffRequests.employeeId],
    references: [employees.id],
  }),
  timeOffType: one(timeOffTypes, {
    fields: [timeOffRequests.timeOffTypeId],
    references: [timeOffTypes.id],
  }),
  allocation: one(timeOffAllocations, {
    fields: [timeOffRequests.timeOffAllocationId],
    references: [timeOffAllocations.id],
  }),
  approvedByUser: one(users, {
    fields: [timeOffRequests.approvedByUserId],
    references: [users.id],
  }),
}));
