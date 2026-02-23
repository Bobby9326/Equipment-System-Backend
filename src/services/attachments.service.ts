import { db } from '../config/database.js';
import { attachments } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';

export const attachmentsService = {
  getAll: async () => {
    return await db.select().from(attachments);
  },

  getById: async (id: number) => {
    const result = await db.select().from(attachments).where(eq(attachments.id, id));
    return result[0] || null;
  },

  create: async (data: typeof attachments.$inferInsert) => {
    const result = await db.insert(attachments).values(data).returning();
    return result[0];
  },

  update: async (id: number, data: Partial<typeof attachments.$inferInsert>) => {
    const result = await db.update(attachments)
      .set(data)
      .where(eq(attachments.id, id))
      .returning();
    return result[0] || null;
  },

  delete: async (id: number) => {
    const result = await db.delete(attachments).where(eq(attachments.id, id)).returning();
    return result[0] || null;
  },
};