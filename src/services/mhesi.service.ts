import { db } from '../config/database.js';
import { mhesiNumbers } from '../db/schema/index.js';
import { eq, like, or } from 'drizzle-orm';

export const mhesiService = {
  getAll: async (filters?: { search?: string; projectId?: number; departmentId?: number }) => {
    let query = db.select().from(mhesiNumbers);

    if (filters?.search) {
      query = query.where(
        or(
          like(mhesiNumbers.mhesiNumber, `%${filters.search}%`),
          like(mhesiNumbers.activityName, `%${filters.search}%`)
        )
      ) as any;
    }

    if (filters?.projectId) {
      query = query.where(eq(mhesiNumbers.projectId, filters.projectId)) as any;
    }

    if (filters?.departmentId) {
      query = query.where(eq(mhesiNumbers.departmentId, filters.departmentId)) as any;
    }

    return await query;
  },

  getById: async (id: number) => {
    const result = await db.select().from(mhesiNumbers).where(eq(mhesiNumbers.id, id));
    return result[0] || null;
  },

  getByProjectId: async (projectId: number) => {
    return await db.select().from(mhesiNumbers).where(eq(mhesiNumbers.projectId, projectId));
  },

  create: async (data: typeof mhesiNumbers.$inferInsert) => {
    const result = await db.insert(mhesiNumbers).values(data).returning();
    return result[0];
  },

  update: async (id: number, data: Partial<typeof mhesiNumbers.$inferInsert>) => {
    const result = await db.update(mhesiNumbers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(mhesiNumbers.id, id))
      .returning();
    return result[0] || null;
  },

  delete: async (id: number) => {
    const result = await db.update(mhesiNumbers)
      .set({ deletedAt: new Date() })
      .where(eq(mhesiNumbers.id, id))
      .returning();
    return result[0] || null;
  },
};