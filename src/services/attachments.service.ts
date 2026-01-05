import { db } from '../config/database.js';
import { attachments } from '../db/schema/index.js';
import { eq, and } from 'drizzle-orm';

export const attachmentsService = {
  getAll: async () => {
    return await db.select().from(attachments);
  },

  getByReference: async (refType: string, refId: number) => {
    return await db
      .select()
      .from(attachments)
      .where(and(eq(attachments.refType, refType), eq(attachments.refId, refId)));
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

  deleteByReference: async (refType: string, refId: number) => {
    const result = await db
      .delete(attachments)
      .where(and(eq(attachments.refType, refType), eq(attachments.refId, refId)))
      .returning();
    return result;
  },
};