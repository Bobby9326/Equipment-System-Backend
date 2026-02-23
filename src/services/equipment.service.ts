import { db } from '../config/database.js';
import { equipment } from '../db/schema/index.js';
import { eq, like, and, sql } from 'drizzle-orm';

export const equipmentService = {
  getAll: async (filters?: {
    search?: string;
    status?: string;
    departmentId?: number;
    equipmentTypeId?: number;
    page?: number;
    limit?: number;
  }) => {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (filters?.search) {
      conditions.push(like(equipment.equipmentName, `%${filters.search}%`));
    }
    if (filters?.status) {
      conditions.push(eq(equipment.status, filters.status));
    }
    if (filters?.departmentId) {
      conditions.push(eq(equipment.departmentId, filters.departmentId));
    }
    if (filters?.equipmentTypeId) {
      conditions.push(eq(equipment.equipmentTypeId, filters.equipmentTypeId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(equipment)
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(equipment)
      .where(whereClause);

    return {
      data,
      total: totalResult[0].count,
      page,
      limit,
    };
  },

  getById: async (id: number) => {
    const result = await db.select().from(equipment).where(eq(equipment.id, id));
    return result[0] || null;
  },

  getByCode: async (equipmentCode: string) => {
    const result = await db.select().from(equipment).where(eq(equipment.equipmentCode, equipmentCode));
    return result[0] || null;
  },

  create: async (data: typeof equipment.$inferInsert) => {
    const result = await db.insert(equipment).values(data).returning();
    return result[0];
  },

  update: async (id: number, data: Partial<typeof equipment.$inferInsert>) => {
    const result = await db.update(equipment)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(equipment.id, id))
      .returning();
    return result[0] || null;
  },

  delete: async (id: number) => {
    const result = await db.update(equipment)
      .set({ deletedAt: new Date() })
      .where(eq(equipment.id, id))
      .returning();
    return result[0] || null;
  },

  updateStatus: async (id: number, status: string) => {
    const result = await db.update(equipment)
      .set({ status, updatedAt: new Date() })
      .where(eq(equipment.id, id))
      .returning();
    return result[0] || null;
  },

  getStats: async () => {
    const total = await db.select({ count: sql<number>`count(*)` }).from(equipment);

    const byStatus = await db
      .select({
        status: equipment.status,
        count: sql<number>`count(*)`,
      })
      .from(equipment)
      .groupBy(equipment.status);

    const byDepartment = await db
      .select({
        departmentId: equipment.departmentId,
        count: sql<number>`count(*)`,
      })
      .from(equipment)
      .groupBy(equipment.departmentId);

    return {
      total: total[0].count,
      byStatus,
      byDepartment,
    };
  },
};