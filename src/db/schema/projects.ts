import { pgTable, serial, varchar, date, decimal, text, timestamp, integer, uuid } from 'drizzle-orm/pg-core';
import { acquisitionSources, acquisitionMethods, equipmentTypes } from './masters';

export const projects = pgTable('projects', {
  id:                  serial('id').primaryKey(),
  uuid:                uuid('uuid').unique().notNull(),
  projectNumber:       varchar('project_number', { length: 10 }).unique(),
  projectName:         varchar('project_name', { length: 255 }).notNull(),
  projectTypeId:       integer('project_type_id').references(() => equipmentTypes.id),
  projectDate:         date('project_date'),
  fiscalYear:          integer('fiscal_year'),                               // ← เพิ่มใหม่
  qtyOrdered:          integer('qty_ordered'),
  budget:              decimal('budget', { precision: 15, scale: 2 }),
  status:              varchar('status', { length: 50 }),
  acquisitionSourceId: integer('acquisition_source_id').references(() => acquisitionSources.id),
  acquisitionMethodId: integer('acquisition_method_id').references(() => acquisitionMethods.id), // ← เพิ่มใหม่
  note:                text('note'),
  updatedAt:           timestamp('updated_at').defaultNow().notNull(),
  createdAt:           timestamp('created_at').defaultNow().notNull(),
  deletedAt:           timestamp('deleted_at'),
});