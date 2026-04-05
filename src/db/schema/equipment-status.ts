import { pgTable, serial, integer, varchar, text, date, decimal, timestamp, uuid } from 'drizzle-orm/pg-core';
import { equipment } from './equipment';
import { users } from './users';
import { departments, buildings, rooms, equipmentTypes } from './masters';
import { attachments } from './attachments';
import { projects } from './projects';

// ─────────────────────────────────────────────────────────────────────────────
// BORROW — เก็บไว้เพราะต้องการ actualReturnDate IS NULL (filter ของที่ยังยืมอยู่)
// ─────────────────────────────────────────────────────────────────────────────
export const equipmentBorrows = pgTable('equipment_borrows', {
  id:                  serial('id').primaryKey(),
  equipmentId:         integer('equipment_id').references(() => equipment.id).notNull(),
  borrowerName:        varchar('borrower_name',  { length: 255 }).notNull(),
  borrowerDepartmentId:integer('borrower_department_id').references(() => departments.id),
  borrowDate:          date('borrow_date').notNull(),
  expectedReturnDate:  date('expected_return_date'),
  actualReturnDate:    date('actual_return_date'),     // NULL = ยังไม่คืน
  borrowingBuildingId: integer('borrowing_building_id').references(() => buildings.id),
  borrowingRoomId:     integer('borrowing_room_id').references(() => rooms.id),
  reason:              text('reason'),
  createdBy:           integer('created_by').references(() => users.id).notNull(),
  createdAt:           timestamp('created_at').defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// REPAIR — เก็บไว้เพราะต้องการ actualEndDate IS NULL (filter ของที่ยังซ่อมอยู่)
// ─────────────────────────────────────────────────────────────────────────────
export const equipmentRepairs = pgTable('equipment_repairs', {
  id:            serial('id').primaryKey(),
  equipmentId:   integer('equipment_id').references(() => equipment.id).notNull(),
  repairReason:  varchar('repair_reason',  { length: 255 }).notNull(),
  repairCompany: varchar('repair_company', { length: 255 }),
  cost:          decimal('cost', { precision: 15, scale: 2 }),
  startDate:     date('start_date').notNull(),
  endDate:       date('end_date'),
  actualEndDate: date('actual_end_date'),              // NULL = ยังซ่อมอยู่
  attachmentId:  integer('attachment_id').references(() => attachments.id),
  createdBy:     integer('created_by').references(() => users.id).notNull(),
  createdAt:     timestamp('created_at').defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// DISPOSALS — archive table
// ครุภัณฑ์ที่จำหน่ายแล้ว → hard delete ออกจาก equipment → copy มาเก็บที่นี่ถาวร
// ใช้ uuid เดิมของ equipment เพื่อให้ audit_logs ยังค้นหาได้
// ─────────────────────────────────────────────────────────────────────────────
export const equipmentDisposals = pgTable('equipment_disposals', {
  id:             serial('id').primaryKey(),
  uuid:           uuid('uuid').unique().notNull(),      // uuid เดิมของ equipment

  // ── ข้อมูลครุภัณฑ์ (copy มาก่อน hard delete) ──
  equipmentCode:   varchar('equipment_code',   { length: 100 }).notNull(),
  equipmentName:   varchar('equipment_name',   { length: 255 }).notNull(),
  equipmentNumber: varchar('equipment_number', { length: 100 }).notNull(),
  equipmentTypeId: integer('equipment_type_id').references(() => equipmentTypes.id),
  departmentId:    integer('department_id').references(() => departments.id),
  fiscalYear:      integer('fiscal_year'),
  price:           decimal('price', { precision: 15, scale: 2 }),
  acquisitionDate: date('acquisition_date'),
  projectId:       integer('project_id').references(() => projects.id),

  // ── ข้อมูลการจำหน่าย ──
  disposalDate:   date('disposal_date').notNull(),
  disposalMethod: varchar('disposal_method', { length: 100 }),
  cost:           decimal('cost', { precision: 15, scale: 2 }),
  approvedBy:     varchar('approved_by', { length: 255 }),
  reason:         text('reason'),
  attachmentId:   integer('attachment_id').references(() => attachments.id),

  disposedBy:     integer('disposed_by').references(() => users.id).notNull(),
  disposedAt:     timestamp('disposed_at').defaultNow().notNull(),
});


// ─────────────────────────────────────────────────────────────────────────────
// equipmentNormals     → audit_logs action='status_change' after.status='normal'
// equipmentUnavailable → audit_logs action='status_change' after.status='unavailable'
// equipmentStatusLogs  → audit_logs action='create' | 'status_change'