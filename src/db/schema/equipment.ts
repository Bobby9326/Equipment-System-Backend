import { pgTable, serial, varchar, integer, decimal, date, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import {
  departments,
  funds,
  equipmentTypes,
  acquisitionSources,
  acquisitionMethods,
  buildings,
  rooms,
} from './masters';
import { projects } from './projects';
import { mhesiNumbers } from './mhesi';
import { attachments } from './attachments';

export const equipment = pgTable('equipment', {
  id:                  serial('id').primaryKey(),
  uuid:                uuid('uuid').unique().notNull(),
  equipmentCode:       varchar('equipment_code',    { length: 100 }).notNull(),
  equipmentName:       varchar('equipment_name',    { length: 255 }).notNull(),
  equipmentNumber:     varchar('equipment_number',  { length: 100 }).notNull().unique(),
  equipmentTypeId:     integer('equipment_type_id').references(() => equipmentTypes.id),
  departmentId:        integer('department_id').references(() => departments.id),
  activity:            varchar('activity',           { length: 255 }),
  fundId:              integer('fund_id').references(() => funds.id),
  fiscalYear:          integer('fiscal_year'),
  price:               decimal('price',              { precision: 15, scale: 2 }),
  unit:                varchar('unit',               { length: 100 }),
  acquisitionSourceId: integer('acquisition_source_id').references(() => acquisitionSources.id),
  acquisitionMethodId: integer('acquisition_method_id').references(() => acquisitionMethods.id),
  acquisitionDate:     date('acquisition_date'),
  company:             varchar('company',            { length: 255 }),
  sizeDetail:          text('size_detail'),
  buildingId:          integer('building_id').references(() => buildings.id),
  roomId:              integer('room_id').references(() => rooms.id),
  floor:               varchar('floor',              { length: 50 }),   // ✅ ชั้นที่ตั้ง
  warrantyYears:       integer('warranty_years'),                        // ✅ ระยะเวลาประกัน (ปี)
  warrantyMonths:      integer('warranty_months'),                       // ✅ ระยะเวลาประกัน (เดือน)
  warrantyEnd:         date('warranty_end'),                             // ✅ วันหมดประกัน
  warrantyAttachmentId: integer('warranty_attachment_id').references(() => attachments.id), // ✅ ใบประกัน
  projectId:           integer('project_id').references(() => projects.id),
  receivingMhesiId:    integer('receiving_mhesi_id').references(() => mhesiNumbers.id),
  status:              varchar('status',             { length: 50 }).default('pending'),
  note:                text('note'),
  createdAt:           timestamp('created_at').defaultNow().notNull(),
  updatedAt:           timestamp('updated_at').defaultNow().notNull(),
  deletedAt:           timestamp('deleted_at'),
});

export const equipmentAttachments = pgTable('equipment_attachments', {
  id:           serial('id').primaryKey(),
  equipmentId:  integer('equipment_id').references(() => equipment.id).notNull(),
  attachmentId: integer('attachment_id').references(() => attachments.id).notNull(),
});