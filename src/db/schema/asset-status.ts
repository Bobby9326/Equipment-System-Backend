import { pgTable, serial, integer, varchar, text, date, decimal, timestamp } from 'drizzle-orm/pg-core';
import { assets } from './assets';
import { users } from './users';

export const assetBorrows = pgTable('asset_borrows', {
  id: serial('id').primaryKey(),
  assetId: integer('asset_id').references(() => assets.id).notNull(),
  borrowerName: varchar('borrower_name', { length: 255 }).notNull(),
  borrowerDepartment: varchar('borrower_department', { length: 255 }),
  borrowDate: date('borrow_date').notNull(),
  expectedReturnDate: date('expected_return_date'),
  actualReturnDate: date('actual_return_date'),
  reason: text('reason'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const assetRepairs = pgTable('asset_repairs', {
  id: serial('id').primaryKey(),
  assetId: integer('asset_id').references(() => assets.id).notNull(),
  repairReason: text('repair_reason').notNull(),
  repairCompany: varchar('repair_company', { length: 255 }),
  cost: decimal('cost', { precision: 15, scale: 2 }),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const assetUnavailable = pgTable('asset_unavailable', {
  id: serial('id').primaryKey(),
  assetId: integer('asset_id').references(() => assets.id).notNull(),
  reason: text('reason').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const assetDisposals = pgTable('asset_disposals', {
  id: serial('id').primaryKey(),
  assetId: integer('asset_id').references(() => assets.id).notNull(),
  disposalDate: date('disposal_date').notNull(),
  disposalMethod: varchar('disposal_method', { length: 100 }),
  disposalReason: text('disposal_reason'),
  approvedBy: varchar('approved_by', { length: 255 }),
  documentNo: varchar('document_no', { length: 100 }),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});