import { pgTable, serial, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { mhesiNumbers } from './mhesi';
import { users } from './users';

export const mhesiEditLogs = pgTable('mhesi_edit_logs', {
  id:        serial('id').primaryKey(),
  mhesiId:   integer('mhesi_id').references(() => mhesiNumbers.id).notNull(),
  remark:    text('remark'),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
