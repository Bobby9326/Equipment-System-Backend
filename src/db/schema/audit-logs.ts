import { pgTable, serial, varchar, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const auditLogs = pgTable('audit_logs', {
  id:         serial('id').primaryKey(),
  entity:     varchar('entity',      { length: 50 }).notNull(), // 'equipment' | 'mhesi' | 'project'
  entityUuid: varchar('entity_uuid', { length: 36 }).notNull(),
  action:     varchar('action',      { length: 20 }).notNull(), // 'create' | 'update' | 'status_change' | 'delete'
  before:     jsonb('before').notNull(),
  after:      jsonb('after').notNull(),
  changedBy:  integer('changed_by').references(() => users.id),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
});