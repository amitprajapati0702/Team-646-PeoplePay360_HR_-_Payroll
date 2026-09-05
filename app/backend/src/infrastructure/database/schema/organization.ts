import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  numeric,
  integer,
  time,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { dayOfWeekEnum } from './enums.js';
import { employees } from './employees.js';

export const departments = pgTable('departments', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  managerId: uuid('manager_id'),
  parentDepartmentId: uuid('parent_department_id'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  manager: one(employees, {
    fields: [departments.managerId],
    references: [employees.id],
    relationName: 'departmentManager',
  }),
  parentDepartment: one(departments, {
    fields: [departments.parentDepartmentId],
    references: [departments.id],
    relationName: 'parentDepartment',
  }),
  childDepartments: many(departments, { relationName: 'parentDepartment' }),
  jobPositions: many(jobPositions),
  employees: many(employees, { relationName: 'departmentEmployees' }),
}));

export const jobPositions = pgTable('job_positions', {
  id: uuid('id').defaultRandom().primaryKey(),
  departmentId: uuid('department_id')
    .notNull()
    .references(() => departments.id, { onDelete: 'restrict' }),
  title: varchar('title', { length: 150 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const jobPositionsRelations = relations(jobPositions, ({ one, many }) => ({
  department: one(departments, {
    fields: [jobPositions.departmentId],
    references: [departments.id],
  }),
  employees: many(employees),
}));

export const workingSchedules = pgTable('working_schedules', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  scheduleType: varchar('schedule_type', { length: 50 }).notNull().default('STANDARD'),
  totalWeeklyHours: numeric('total_weekly_hours', { precision: 5, scale: 2 })
    .notNull()
    .default('40.00'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const workingSchedulesRelations = relations(workingSchedules, ({ many }) => ({
  lines: many(workingScheduleLines),
  employees: many(employees),
}));

export const workingScheduleLines = pgTable(
  'working_schedule_lines',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workingScheduleId: uuid('working_schedule_id')
      .notNull()
      .references(() => workingSchedules.id, { onDelete: 'cascade' }),
    dayOfWeek: dayOfWeekEnum('day_of_week').notNull(),
    workFrom: time('work_from').notNull(),
    workTo: time('work_to').notNull(),
    breakDurationMinutes: integer('break_duration_minutes').notNull().default(60),
    dailyWorkingHours: numeric('daily_working_hours', { precision: 4, scale: 2 }),
  },
  (table) => [
    unique('uq_schedule_day').on(table.workingScheduleId, table.dayOfWeek),
  ]
);

export const workingScheduleLinesRelations = relations(workingScheduleLines, ({ one }) => ({
  workingSchedule: one(workingSchedules, {
    fields: [workingScheduleLines.workingScheduleId],
    references: [workingSchedules.id],
  }),
}));
