import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

export const attachments = pgTable('attachments', {
  id: serial('id').primaryKey(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileType: varchar('file_type', { length: 100 }),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});