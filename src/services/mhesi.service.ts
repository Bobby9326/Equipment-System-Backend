import { randomUUID } from 'crypto';
import { db } from '../config/database.js';
import { mhesiNumbers, supportUnits, planSections, projects } from '../db/schema/index.js';
import { eq, like, and, isNull, or, sql, asc, desc } from 'drizzle-orm';

// fields ที่ return ออก API (ไม่มี id)
const MHESI_SELECT = {
  uuid:          mhesiNumbers.uuid,
  mhesiNumber:   mhesiNumbers.mhesiNumber,
  departmentId:  mhesiNumbers.departmentId,
  supportUnitId: mhesiNumbers.supportUnitId,
  planId:        mhesiNumbers.planId,
  projectId:     mhesiNumbers.projectId,
  activityName:  mhesiNumbers.activityName,
  date:          mhesiNumbers.date,
  amount:        mhesiNumbers.amount,
  note:          mhesiNumbers.note,
  attachmentId:  mhesiNumbers.attachmentId,
  createdAt:     mhesiNumbers.createdAt,
  updatedAt:     mhesiNumbers.updatedAt,
};

export const mhesiService = {
  getAll: async (filters?: {
    search?: string;
    projectId?: number;
    departmentId?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }) => {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const offset = (page - 1) * limit;

    const conditions = [isNull(mhesiNumbers.deletedAt)];

    if (filters?.search) {
      conditions.push(
        or(
          like(mhesiNumbers.mhesiNumber,  `%${filters.search}%`),
          like(mhesiNumbers.activityName, `%${filters.search}%`)
        ) as any
      );
    }
    if (filters?.projectId)    conditions.push(eq(mhesiNumbers.projectId,    filters.projectId));
    if (filters?.departmentId) conditions.push(eq(mhesiNumbers.departmentId, filters.departmentId));

    const whereClause = and(...conditions);

    const dir = filters?.sortDir === 'desc' ? desc : asc;
    const orderByCols = (() => {
      switch (filters?.sortBy) {
        case 'mhesiNumber':  return [dir(mhesiNumbers.mhesiNumber)];
        case 'activityName': return [dir(mhesiNumbers.activityName)];
        case 'date':         return [dir(mhesiNumbers.date), asc(mhesiNumbers.mhesiNumber)];
        case 'amount':       return [dir(mhesiNumbers.amount), asc(mhesiNumbers.mhesiNumber)];
        case 'project':      return [dir(projects.projectName),   asc(mhesiNumbers.mhesiNumber)];
        case 'supportUnit':  return [dir(supportUnits.name),      asc(mhesiNumbers.mhesiNumber)];
        case 'plan':         return [dir(planSections.name),       asc(mhesiNumbers.mhesiNumber)];
        default:             return [desc(mhesiNumbers.createdAt)];
      }
    })();

    const data = await db
      .select(MHESI_SELECT)
      .from(mhesiNumbers)
      .leftJoin(projects,     eq(mhesiNumbers.projectId,    projects.id))
      .leftJoin(supportUnits, eq(mhesiNumbers.supportUnitId, supportUnits.id))
      .leftJoin(planSections, eq(mhesiNumbers.planId,        planSections.id))
      .where(whereClause)
      .orderBy(...orderByCols)
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(mhesiNumbers)
      .where(whereClause);

    return {
      data,
      total: totalResult[0].count,
      page,
      limit,
    };
  },

  getByUuid: async (uuid: string) => {
    const result = await db
      .select(MHESI_SELECT)
      .from(mhesiNumbers)
      .where(and(eq(mhesiNumbers.uuid, uuid), isNull(mhesiNumbers.deletedAt)));
    return result[0] || null;
  },

  getByProjectId: async (projectId: number) => {
    return db
      .select(MHESI_SELECT)
      .from(mhesiNumbers)
      .where(and(eq(mhesiNumbers.projectId, projectId), isNull(mhesiNumbers.deletedAt)));
  },

  create: async (data: Omit<typeof mhesiNumbers.$inferInsert,
    | 'id' | 'uuid' | 'createdAt' | 'updatedAt' | 'deletedAt'
  >) => {
    const result = await db
      .insert(mhesiNumbers)
      .values({ ...data, uuid: randomUUID() })
      .returning(MHESI_SELECT);
    return result[0];
  },

  updateByUuid: async (uuid: string, data: Partial<Omit<typeof mhesiNumbers.$inferInsert,
    | 'id' | 'uuid' | 'createdAt' | 'deletedAt'
  >>) => {
    const result = await db
      .update(mhesiNumbers)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(mhesiNumbers.uuid, uuid), isNull(mhesiNumbers.deletedAt)))
      .returning(MHESI_SELECT);
    return result[0] || null;
  },

  deleteByUuid: async (uuid: string) => {
    const result = await db
      .update(mhesiNumbers)
      .set({ deletedAt: new Date() })
      .where(and(eq(mhesiNumbers.uuid, uuid), isNull(mhesiNumbers.deletedAt)))
      .returning({ uuid: mhesiNumbers.uuid });
    return result[0] || null;
  },
};