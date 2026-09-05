import {
  pgTable,
  uuid,
  text,
  date,
  numeric,
  boolean,
  timestamp,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { attendanceStatusEnum } from './enums.js';
import { employees } from './employees.js';
import { users } from './users.js';

export const attendances = pgTable(
  'attendances',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    attendanceDate: date('attendance_date').notNull(),
    checkIn: timestamp('check_in', { withTimezone: true }).notNull(),
    checkOut: timestamp('check_out', { withTimezone: true }),

    workedHours: numeric('worked_hours', { precision: 5, scale: 2 }).default('0.00'),
    overtimeHours: numeric('overtime_hours', { precision: 5, scale: 2 }).default('0.00'),
    status: attendanceStatusEnum('status').notNull().default('PRESENT'),

    // Audit and Manual Correction tracking
    isManuallyEdited: boolean('is_manually_edited').notNull().default(false),
    editedByUserId: uuid('edited_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    editReason: text('edit_reason'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    unique('uq_employee_daily_attendance').on(table.employeeId, table.attendanceDate),
    index('idx_attendances_employee_date').on(table.employeeId, table.attendanceDate),
    index('idx_attendances_date_status').on(table.attendanceDate, table.status),
  ]
);

export const attendancesRelations = relations(attendances, ({ one }) => ({
  employee: one(employees, {
    fields: [attendances.employeeId],
    references: [employees.id],
  }),
  editedByUser: one(users, {
    fields: [attendances.editedByUserId],
    references: [users.id],
  }),
}));
