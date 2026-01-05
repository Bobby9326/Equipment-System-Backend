import { pgTable, serial, varchar, timestamp, integer } from 'drizzle-orm/pg-core';
import { departments } from './masters';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  departmentId: integer('department_id').references(() => departments.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});