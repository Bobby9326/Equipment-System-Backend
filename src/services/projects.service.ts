import { db } from '../config/database.js';
import { projects } from '../db/schema/index.js';
import { eq, sql, like, and, isNull, asc, desc } from 'drizzle-orm';

export const projectsService = {
  getAll: async (filters?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }) => {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const offset = (page - 1) * limit;

    const conditions = [isNull(projects.deletedAt)];

    if (filters?.search) {
      conditions.push(like(projects.projectName, `%${filters.search}%`));
    }

    if (filters?.status) {
      conditions.push(eq(projects.status, filters.status));
    }

    const whereClause = and(...conditions);

    const dir = filters?.sortDir === 'desc' ? desc : asc;
    const orderByCols = (() => {
      switch (filters?.sortBy) {
        case 'id':          return [dir(projects.id)];
        case 'projectName': return [dir(projects.projectName)];
        case 'projectType': return [dir(projects.projectTypeId)];
        case 'projectDate': return [dir(projects.projectDate), asc(projects.id)];
        case 'budget':      return [dir(projects.budget),      asc(projects.id)];
        default:            return [desc(projects.createdAt)];
      }
    })();

    const data = await db
      .select()
      .from(projects)
      .where(whereClause)
      .orderBy(...orderByCols)
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(whereClause);

    return {
      data,
      total: totalResult[0].count,
      page,
      limit,
    };
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