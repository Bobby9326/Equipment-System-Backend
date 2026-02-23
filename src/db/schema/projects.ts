import { pgTable, serial, varchar, date, decimal, text, timestamp, integer, uuid } from 'drizzle-orm/pg-core';
import { acquisitionSources, projectTypes } from './masters';

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').unique().notNull(),
  projectName: varchar('project_name', { length: 255 }).notNull(),
  projectTypeId: integer('project_type_id').references(() => projectTypes.id),
  projectDate: date('project_date'),
  budget: decimal('budget', { precision: 15, scale: 2 }),
  status: varchar('status', { length: 50 }),
  acquisitionSourceId: integer('acquisition_source_id').references(() => acquisitionSources.id),
  note: text('note'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});