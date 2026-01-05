import { db } from '../config/database.js';
import { assets } from '../db/schema/index.js';
import { eq, like, and, sql } from 'drizzle-orm';

export const assetsService = {
  getAll: async (filters?: {
    search?: string;
    status?: string;
    departmentId?: number;
    assetTypeId?: number;
    page?: number;
    limit?: number;
  }) => {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const offset = (page - 1) * limit;

    let conditions = [];

    if (filters?.search) {
      conditions.push(like(assets.assetName, `%${filters.search}%`));
    }

    if (filters?.status) {
      conditions.push(eq(assets.status, filters.status));
    }

    if (filters?.departmentId) {
      conditions.push(eq(assets.departmentId, filters.departmentId));
    }

    if (filters?.assetTypeId) {
      conditions.push(eq(assets.assetTypeId, filters.assetTypeId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(assets)
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(assets)
      .where(whereClause);

    return {
      data,
      total: totalResult[0].count,
      page,
      limit,
    };
  },

  getById: async (id: number) => {
    const result = await db.select().from(assets).where(eq(assets.id, id));
    return result[0] || null;
  },

  getByCode: async (assetCode: string) => {
    const result = await db.select().from(assets).where(eq(assets.assetCode, assetCode));
    return result[0] || null;
  },

  create: async (data: typeof assets.$inferInsert) => {
    const result = await db.insert(assets).values(data).returning();
    return result[0];
  },

  update: async (id: number, data: Partial<typeof assets.$inferInsert>) => {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };
    const result = await db.update(assets)
      .set(updateData)
      .where(eq(assets.id, id))
      .returning();
    return result[0] || null;
  },

  delete: async (id: number) => {
    const result = await db.delete(assets).where(eq(assets.id, id)).returning();
    return result[0] || null;
  },

  updateStatus: async (id: number, status: string) => {
    const result = await db.update(assets)
      .set({ status, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();
    return result[0] || null;
  },

  getStats: async () => {
    const total = await db.select({ count: sql<number>`count(*)` }).from(assets);
    
    const byStatus = await db
      .select({
        status: assets.status,
        count: sql<number>`count(*)`,
      })
      .from(assets)
      .groupBy(assets.status);

    const byDepartment = await db
      .select({
        departmentId: assets.departmentId,
        count: sql<number>`count(*)`,
      })
      .from(assets)
      .groupBy(assets.departmentId);

    return {
      total: total[0].count,
      byStatus,
      byDepartment,
    };
  },
};