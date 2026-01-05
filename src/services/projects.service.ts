import { db } from '../config/database.js';
import { projects } from '../db/schema/index.js';
import { eq, sql, like } from 'drizzle-orm';

export const projectsService = {
  getAll: async (filters?: { search?: string; status?: string }) => {
    let query = db.select().from(projects);

    if (filters?.search) {
      query = query.where(like(projects.projectName, `%${filters.search}%`)) as any;
    }

    if (filters?.status) {
      query = query.where(eq(projects.status, filters.status)) as any;
    }

    return await query;
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
      .set(data)
      .where(eq(projects.id, id))
      .returning();
    return result[0] || null;
  },

  delete: async (id: number) => {
    const result = await db.delete(projects).where(eq(projects.id, id)).returning();
    return result[0] || null;
  },

  getStats: async () => {
    const total = await db.select({ count: sql<number>`count(*)` }).from(projects);
    const byStatus = await db
      .select({
        status: projects.status,
        count: sql<number>`count(*)`,
      })
      .from(projects)
      .groupBy(projects.status);

    return {
      total: total[0].count,
      byStatus,
    };
  },
};