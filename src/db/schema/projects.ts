import { pgTable, serial, varchar, date, decimal, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { acquisitionSources } from './masters';

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  projectName: varchar('project_name', { length: 255 }).notNull(),
  projectType: varchar('project_type', { length: 100 }),
  projectDate: date('project_date'),
  budget: decimal('budget', { precision: 15, scale: 2 }),
  status: varchar('status', { length: 50 }),
  acquisitionSourceId: integer('acquisition_source_id').references(() => acquisitionSources.id),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});