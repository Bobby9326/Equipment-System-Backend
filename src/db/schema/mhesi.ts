import { pgTable, serial, varchar, integer, date, decimal, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { departments, planSections } from './masters';
import { projects } from './projects';
import { attachments } from './attachments';

export const mhesiNumbers = pgTable('mhesi_numbers', {
  id:           serial('id').primaryKey(),
  uuid:         uuid('uuid').unique().notNull(),
  mhesiNumber:  varchar('mhesi_number', { length: 50 }).notNull(),
  role:         varchar('role', { length: 50 }), // 'planning'|'procurement'|'contract'|'receiving'|'other'
  faculty:      varchar('faculty', { length: 255 }),
  departmentId: integer('department_id').references(() => departments.id),
  planId:       integer('plan_id').references(() => planSections.id),
  projectId:    integer('project_id').references(() => projects.id),
  activityName: varchar('activity_name', { length: 255 }),
  date:         date('date'),
  amount:       decimal('amount', { precision: 15, scale: 2 }),
  note:         text('note'),
  attachmentId: integer('attachment_id').references(() => attachments.id),
  createdAt:    timestamp('created_at').defaultNow().notNull(),
  updatedAt:    timestamp('updated_at').defaultNow().notNull(),
  deletedAt:    timestamp('deleted_at'),
});