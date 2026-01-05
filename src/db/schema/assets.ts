import { pgTable, serial, varchar, integer, decimal, date, text, timestamp } from 'drizzle-orm/pg-core';
import { 
  departments, 
  activities, 
  funds, 
  assetTypes, 
  acquisitionSources, 
  acquisitionMethods,
  buildings,
  rooms 
} from './masters';
import { projects } from './projects';

export const assets = pgTable('assets', {
  id: serial('id').primaryKey(),
  assetCode: varchar('asset_code', { length: 100 }).notNull().unique(),
  assetName: varchar('asset_name', { length: 255 }).notNull(),
  assetNumber: varchar('asset_number', { length: 100 }),
  assetTypeId: integer('asset_type_id').references(() => assetTypes.id),
  departmentId: integer('department_id').references(() => departments.id),
  activityId: integer('activity_id').references(() => activities.id),
  fundId: integer('fund_id').references(() => funds.id),
  fiscalYearId: integer('fiscal_year_id'),
  price: decimal('price', { precision: 15, scale: 2 }),
  unitId: integer('unit_id'),
  acquisitionSourceId: integer('acquisition_source_id').references(() => acquisitionSources.id),
  acquisitionMethodId: integer('acquisition_method_id').references(() => acquisitionMethods.id),
  acquisitionDate: date('acquisition_date'),
  company: varchar('company', { length: 255 }),
  sizeDetail: text('size_detail'),
  buildingId: integer('building_id').references(() => buildings.id),
  roomId: integer('room_id').references(() => rooms.id),
  projectId: integer('project_id').references(() => projects.id),
  status: varchar('status', { length: 50 }).default('available'),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});