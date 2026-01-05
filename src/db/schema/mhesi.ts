import { pgTable, serial, varchar, integer, date, decimal, text, timestamp } from 'drizzle-orm/pg-core';
import { faculties, supportUnits, plans } from './masters';
import { projects } from './projects';

export const mhesiNumbers = pgTable('mhesi_numbers', {
  id: serial('id').primaryKey(),
  mhesiNumber: varchar('mhesi_number', { length: 100 }).notNull(),
  facultyId: integer('faculty_id').references(() => faculties.id),
  supportUnitId: integer('support_unit_id').references(() => supportUnits.id),
  planId: integer('plan_id').references(() => plans.id),
  projectId: integer('project_id').references(() => projects.id),
  activityName: varchar('activity_name', { length: 255 }),
  date: date('date'),
  amount: decimal('amount', { precision: 15, scale: 2 }),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});