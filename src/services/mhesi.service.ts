import { randomUUID } from 'crypto';
import { auditService } from './audit.service.js';
import { db } from '../config/database.js';
import { mhesiNumbers, planSections, projects, users, attachments } from '../db/schema/index.js';
import { eq, like, and, isNull, or, sql, asc, desc, gte, lte, inArray } from 'drizzle-orm';

// fields ที่ return ออก API (ไม่มี id)
const MHESI_SELECT = {
  uuid:          mhesiNumbers.uuid,
  mhesiNumber:   mhesiNumbers.mhesiNumber,
  role:          mhesiNumbers.role,
  departmentId:  mhesiNumbers.departmentId,
  faculty:       mhesiNumbers.faculty,
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
    faculty?: string;
    role?: string;    // 'planning'|'procurement'|'contract'|'receiving'|'other'
    planId?: number;
    amountMin?: number;
    amountMax?: number;
    dateFrom?: string;
    dateTo?: string;
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
    if (filters?.faculty) conditions.push(eq(mhesiNumbers.faculty, filters.faculty));
    if (filters?.role)    conditions.push(eq(mhesiNumbers.role, filters.role));
    if (filters?.planId)        conditions.push(eq(mhesiNumbers.planId,        filters.planId));
    if (filters?.amountMin !== undefined) conditions.push(gte(mhesiNumbers.amount, String(filters.amountMin)));
    if (filters?.amountMax !== undefined) conditions.push(lte(mhesiNumbers.amount, String(filters.amountMax)));
    if (filters?.dateFrom) conditions.push(gte(mhesiNumbers.date, filters.dateFrom));
    if (filters?.dateTo)   conditions.push(lte(mhesiNumbers.date, filters.dateTo));

    const whereClause = and(...conditions);

    const dir = filters?.sortDir === 'desc' ? desc : asc;
    const orderByCols = (() => {
      switch (filters?.sortBy) {
        case 'mhesiNumber':  return [dir(mhesiNumbers.mhesiNumber)];
        case 'activityName': return [dir(mhesiNumbers.activityName)];
        case 'date':         return [dir(mhesiNumbers.date), asc(mhesiNumbers.mhesiNumber)];
        case 'amount':       return [dir(mhesiNumbers.amount), asc(mhesiNumbers.mhesiNumber)];
        case 'project':      return [dir(projects.projectName),   asc(mhesiNumbers.mhesiNumber)];
        case 'faculty':      return [dir(mhesiNumbers.faculty),    asc(mhesiNumbers.mhesiNumber)];
        case 'plan':         return [dir(planSections.name),              asc(mhesiNumbers.mhesiNumber)];
        default:             return [desc(mhesiNumbers.createdAt)];
      }
    })();

    const data = await db
      .select(MHESI_SELECT)
      .from(mhesiNumbers)
      .leftJoin(projects,     eq(mhesiNumbers.projectId,    projects.id))
      .leftJoin(planSections, eq(mhesiNumbers.planId, planSections.id))
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
  >>, userUuid?: string) => {
    const before = await mhesiService.getByUuid(uuid);
    if (!before) return null;

    const result = await db
      .update(mhesiNumbers)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(mhesiNumbers.uuid, uuid), isNull(mhesiNumbers.deletedAt)))
      .returning(MHESI_SELECT);

    if (userUuid && result[0]) {
      await auditService.log({
        entity:     'mhesi',
        entityUuid: uuid,
        action:     'update',
        before:     before as any,
        after:      result[0] as any,
        userUuid,
      });
    }
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

  // ประวัติการแก้ไข mhesi
  getHistory: async (uuid: string) => {
    let editLogs: any[] = [];
    try {
      const { auditLogs } = await import('../db/schema/index.js');
      editLogs = await db
        .select({
          action:    auditLogs.action,
          before:    auditLogs.before,
          after:     auditLogs.after,
          createdAt: auditLogs.createdAt,
          firstName: users.firstName,
          lastName:  users.lastName,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.changedBy, users.id))
        .where(and(
          eq(auditLogs.entity,     'mhesi'),
          eq(auditLogs.entityUuid, uuid)
        ))
        .orderBy(desc(auditLogs.createdAt));
    } catch (_) {}

    // รวบรวม attachmentId ทั้งหมดที่ปรากฏใน before/after
    const attachmentIds = new Set<number>();
    for (const log of editLogs) {
      if (log.before?.attachmentId) attachmentIds.add(log.before.attachmentId);
      if (log.after?.attachmentId)  attachmentIds.add(log.after.attachmentId);
    }

    // ดึง fileName จาก attachments table ครั้งเดียว
    const fileMap = new Map<number, string>();
    if (attachmentIds.size > 0) {
      const rows = await db
        .select({ id: attachments.id, fileName: attachments.fileName })
        .from(attachments)
        .where(inArray(attachments.id, [...attachmentIds]));
      for (const r of rows) fileMap.set(r.id, r.fileName);
    }

    return editLogs.map(log => ({
      action:    log.action,
      before:    log.before ? {
        ...log.before,
        attachmentFileName: log.before.attachmentId ? (fileMap.get(log.before.attachmentId) ?? null) : null,
      } : null,
      after:     log.after ? {
        ...log.after,
        attachmentFileName: log.after.attachmentId ? (fileMap.get(log.after.attachmentId) ?? null) : null,
      } : null,
      createdAt: log.createdAt,
      changedBy: `${log.firstName ?? ''} ${log.lastName ?? ''}`.trim(),
    }));
  },
};