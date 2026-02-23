import { db } from '../config/database.js';
import { projects } from '../db/schema/index.js';
import { eq, sql, like, and, isNull } from 'drizzle-orm';

export const projectsService = {
  getAll: async (filters?: { search?: string; status?: string }) => {
    const conditions = [isNull(projects.deletedAt)];

    if (filters?.search) {
      conditions.push(like(projects.projectName, `%${filters.search}%`));
    }

    if (filters?.status) {
      conditions.push(eq(projects.status, filters.status));
    }

    return await db.select().from(projects).where(and(...conditions));
  },

  getById: async (id: number) => {
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result[0] || null;
  },

  create: async (data: typeof projects.$inferInsert) => {
    const result = await db.insert(projects).values(data).returning();
    return result[0];
  },

  update: async (id: number, data: Partial<typeof projects.$inferInsert>) => {
    const result = await db.update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return result[0] || null;
  },

  delete: async (id: number) => {
    const result = await db.update(projects)
      .set({ deletedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return result[0] || null;
  },

  getStats: async () => {
    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(isNull(projects.deletedAt));

    const byStatus = await db
      .select({
        status: projects.status,
        count: sql<number>`count(*)`,
      })
      .from(projects)
      .where(isNull(projects.deletedAt))
      .groupBy(projects.status);

    return {
      total: total[0].count,
      byStatus,
    };
  },
};