import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  bigserial,
  index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './users.js';

/**
 * Audit Logs Table: Provides immutable compliance and activity tracking across the system,
 * capturing mutation actions, acting users, and before/after JSONB state snapshots.
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 50 }).notNull(), // CREATE, UPDATE, DELETE, VALIDATE, COMPUTE, EXPORT_PDF, SEND_EMAIL
    entityName: varchar('entity_name', { length: 100 }).notNull(), // employees, contracts, payruns, payslips, etc.
    entityId: uuid('entity_id').notNull(),
    payloadBefore: jsonb('payload_before'),
    payloadAfter: jsonb('payload_after'),
    ipAddress: varchar('ip_address', { length: 45 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_audit_logs_entity').on(table.entityName, table.entityId),
    index('idx_audit_logs_user').on(table.userId),
  ]
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
