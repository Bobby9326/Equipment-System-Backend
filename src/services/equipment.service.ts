import { randomUUID } from 'crypto';
import { db } from '../config/database.js';
import { equipment } from '../db/schema/index.js';
import { eq, like, and, sql, isNull } from 'drizzle-orm';
import { BusinessError } from '../middlewares/error.js';

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

    const conditions = [isNull(equipment.deletedAt)];

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

    const whereClause = and(...conditions);

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

  getByUuid: async (uuid: string) => {
    const result = await db.select().from(equipment).where(eq(equipment.uuid, uuid));
    return result[0] || null;
  },

  getByCode: async (equipmentCode: string) => {
    const result = await db.select().from(equipment).where(eq(equipment.equipmentCode, equipmentCode));
    return result[0] || null;
  },

  create: async (params: {
    numberPrefix: string;
    start: number;
    end?: number;
    padLength?: number;
    userUuid: string;
    data: Omit<typeof equipment.$inferInsert, 'equipmentNumber'>;
  }) => {
    const { numberPrefix, start, end, padLength = 3, data } = params;
    const endNum = end ?? start;

    if (start > endNum) throw new BusinessError('ลำดับเริ่มต้นต้องน้อยกว่าหรือเท่ากับลำดับสิ้นสุด');
    if (endNum - start + 1 > 100) throw new BusinessError('สร้างได้ไม่เกิน 100 รายการต่อครั้ง');

    const rows: (typeof equipment.$inferInsert)[] = [];

    for (let i = start; i <= endNum; i++) {
      const seq = String(i).padStart(padLength, '0');
      const equipmentNumber = `${numberPrefix}-${seq}`;

      const existing = await db.select().from(equipment).where(eq(equipment.equipmentNumber, equipmentNumber));
      if (existing[0]) throw new BusinessError(`เลขครุภัณฑ์ ${equipmentNumber} มีอยู่ในระบบแล้ว`);

      rows.push({ ...data, uuid: randomUUID(), equipmentNumber });
    }

    return await db.insert(equipment).values(rows).returning();
  },

  updateByUuid: async (uuid: string, data: Partial<typeof equipment.$inferInsert>) => {
    const result = await db.update(equipment)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(equipment.uuid, uuid))
      .returning();
    return result[0] || null;
  },

  deleteByUuid: async (uuid: string) => {
    const result = await db.update(equipment)
      .set({ deletedAt: new Date() })
      .where(eq(equipment.uuid, uuid))
      .returning();
    return result[0] || null;
  },

  getStats: async (departmentId?: number) => {
    const conditions = [isNull(equipment.deletedAt)];
    if (departmentId) conditions.push(eq(equipment.departmentId, departmentId));
    const whereClause = and(...conditions);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(equipment)
      .where(whereClause);

    const byStatus = await db
      .select({ status: equipment.status, count: sql<number>`count(*)` })
      .from(equipment)
      .where(whereClause)
      .groupBy(equipment.status);

    const byDepartment = await db
      .select({ departmentId: equipment.departmentId, count: sql<number>`count(*)` })
      .from(equipment)
      .where(whereClause)
      .groupBy(equipment.departmentId);

    return { total: total[0].count, byStatus, byDepartment };
  },
};