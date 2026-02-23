import { pgTable, serial, varchar, integer, char } from 'drizzle-orm/pg-core';

export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
});

export const activities = pgTable('activities', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
});

export const funds = pgTable('funds', {
  id: serial('id').primaryKey(),
  fundCode: char('fund_code', { length: 4 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
});

export const equipmentTypes = pgTable('equipment_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
});

export const acquisitionSources = pgTable('acquisition_sources', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
});

export const acquisitionMethods = pgTable('acquisition_methods', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
});

export const buildings = pgTable('buildings', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
});

export const roomTypes = pgTable('room_types', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 255 }).notNull(),
});

export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  buildingId: integer("building_id").references(() => buildings.id),
  roomTypeId: integer('room_type_id').references(() => roomTypes.id),
  name: varchar('name', { length: 255 }).notNull(),
});

export const supportUnits = pgTable('support_units', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
});

export const planSections = pgTable('plan_sections', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
});

export const projectTypes = pgTable('project_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
});