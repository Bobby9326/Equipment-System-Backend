import { pgTable, serial, integer, varchar, text, date, decimal, timestamp } from 'drizzle-orm/pg-core';
import { equipment } from './equipment';
import { users } from './users';
import { departments, buildings, rooms } from './masters';
import { attachments } from './attachments';

export const equipmentNormals = pgTable('equipment_normals', {
  id: serial('id').primaryKey(),
  equipmentId: integer('equipment_id').references(() => equipment.id).notNull(),
  reason: text('reason'),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const equipmentBorrows = pgTable('equipment_borrows', {
  id: serial('id').primaryKey(),
  equipmentId: integer('equipment_id').references(() => equipment.id).notNull(),
  borrowerName: varchar('borrower_name', { length: 255 }).notNull(),
  borrowerDepartmentId: integer('borrower_department_id').references(() => departments.id),
  borrowDate: date('borrow_date').notNull(),
  expectedReturnDate: date('expected_return_date'),
  actualReturnDate:    date('actual_return_date'),
  borrowingBuildingId: integer('borrowing_building_id').references(() => buildings.id),
  borrowingRoomId:     integer('borrowing_room_id').references(() => rooms.id),
  reason:              text('reason'),
  createdBy:           integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const equipmentRepairs = pgTable('equipment_repairs', {
  id: serial('id').primaryKey(),
  equipmentId: integer('equipment_id').references(() => equipment.id).notNull(),
  repairReason: varchar('repair_reason', { length: 255 }).notNull(),
  repairCompany: varchar('repair_company', { length: 255 }),
  cost: decimal('cost', { precision: 15, scale: 2 }),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  actualEndDate: date('actual_end_date'),
  attachmentId: integer('attachment_id').references(() => attachments.id),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const equipmentUnavailable = pgTable('equipment_unavailable', {
  id: serial('id').primaryKey(),
  equipmentId: integer('equipment_id').references(() => equipment.id).notNull(),
  reason: text('reason').notNull(),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const equipmentDisposals = pgTable('equipment_disposals', {
  id: serial('id').primaryKey(),
  equipmentId: integer('equipment_id').references(() => equipment.id).notNull(),
  disposalDate: date('disposal_date').notNull(),
  disposalMethod: varchar('disposal_method', { length: 100 }),
  cost: decimal('cost', { precision: 15, scale: 2 }),
  approvedBy: varchar('approved_by', { length: 255 }),
  reason: text('reason'),
  attachmentId: integer('attachment_id').references(() => attachments.id),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const equipmentStatusLogs = pgTable('equipment_status_logs', {
  id: serial('id').primaryKey(),
  equipmentId: integer('equipment_id').references(() => equipment.id).notNull(),
  status: varchar('status', { length: 50 }).notNull(), // 'normal' | 'borrowed' | 'repair' | 'unavailable' | 'disposed'
  referenceTable: varchar('reference_table', { length: 100 }),
  referenceId: integer('reference_id'),
  remark: text('remark'),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});