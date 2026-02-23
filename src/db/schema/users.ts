import { pgTable, serial, varchar, timestamp, integer, uuid } from 'drizzle-orm/pg-core';
import { departments } from './masters';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').unique().notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  role: varchar('role', { length: 50 }).notNull(),
  departmentId: integer('department_id').references(() => departments.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});