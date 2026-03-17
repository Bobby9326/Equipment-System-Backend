import { randomUUID } from 'crypto';
import { db } from '../config/database.js';
import { auditService } from './audit.service.js';
import { projects, users } from '../db/schema/index.js';
import { eq, sql, like, and, isNull, asc, desc, gte, lte } from 'drizzle-orm';

// สร้างเลขโครงการ YYYYMMDDNN (10 หลัก)
const generateProjectNumber = async (): Promise<string> => {
  const now   = new Date();
  const year  = now.getFullYear().toString();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day   = String(now.getDate()).padStart(2, '0');
  const prefix = `${year}${month}${day}`;

  // นับโครงการที่มี projectNumber ขึ้นต้นด้วย prefix นี้
  const { sql: sqlFn } = await import('drizzle-orm');
  const result = await db
    .select({ count: sqlFn<number>`count(*)` })
    .from(projects)
    .where(sqlFn`${projects.projectNumber} LIKE ${prefix + '%'}`);

  const seq = (Number(result[0].count) + 1).toString().padStart(2, '0');
  return `${prefix}${seq}`;
};

const PROJECT_SELECT = {
  id:                  projects.id,
  uuid:                projects.uuid,
  projectNumber:       projects.projectNumber,
  projectName:         projects.projectName,
  projectTypeId:       projects.projectTypeId,
  projectDate:         projects.projectDate,
  budget:              projects.budget,
  status:              projects.status,
  acquisitionSourceId: projects.acquisitionSourceId,
  note:                projects.note,
  createdAt:           projects.createdAt,
  updatedAt:           projects.updatedAt,
};

export const projectsService = {
  getAll: async (filters?: {
    search?: string;
    status?: string;
    projectTypeId?: number;
    acquisitionSourceId?: number;
    dateFrom?: string;
    dateTo?: string;
    budgetMin?: number;
    budgetMax?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }) => {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const offset = (page - 1) * limit;

    const conditions = [isNull(projects.deletedAt)];

    if (filters?.search)              conditions.push(like(projects.projectName, `%${filters.search}%`));
    if (filters?.status)              conditions.push(eq(projects.status, filters.status));
    if (filters?.projectTypeId)       conditions.push(eq(projects.projectTypeId, filters.projectTypeId));
    if (filters?.acquisitionSourceId) conditions.push(eq(projects.acquisitionSourceId, filters.acquisitionSourceId));
    if (filters?.dateFrom)            conditions.push(gte(projects.projectDate, filters.dateFrom));
    if (filters?.dateTo)              conditions.push(lte(projects.projectDate, filters.dateTo));
    if (filters?.budgetMin != null)   conditions.push(gte(projects.budget, String(filters.budgetMin)));
    if (filters?.budgetMax != null)   conditions.push(lte(projects.budget, String(filters.budgetMax)));

    const whereClause = and(...conditions);

    const dir = filters?.sortDir === 'desc' ? desc : asc;
    const orderByCols = (() => {
      switch (filters?.sortBy) {
        case 'id':                  return [dir(projects.id)];
        case 'projectName':         return [dir(projects.projectName)];
        case 'projectType':         return [dir(projects.projectTypeId)];
        case 'acquisitionSourceId': return [dir(projects.acquisitionSourceId), asc(projects.id)];
        case 'status':              return [dir(projects.status),              asc(projects.id)];
        case 'projectDate':         return [dir(projects.projectDate),         asc(projects.id)];
        case 'budget':              return [dir(projects.budget),              asc(projects.id)];
        default:                    return [desc(projects.createdAt)];
      }
    })();

    const data = await db
      .select(PROJECT_SELECT)
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

  getByUuid: async (uuid: string) => {
    const result = await db.select(PROJECT_SELECT).from(projects).where(eq(projects.uuid, uuid));
    return result[0] || null;
  },

  create: async (data: Omit<typeof projects.$inferInsert, 'id' | 'uuid' | 'createdAt' | 'updatedAt' | 'projectNumber'>) => {
    const projectNumber = await generateProjectNumber();
    const result = await db.insert(projects).values({ ...data, uuid: randomUUID(), projectNumber }).returning(PROJECT_SELECT);
    return result[0];
  },

  updateByUuid: async (uuid: string, data: Partial<typeof projects.$inferInsert>, userUuid?: string) => {
    const before = await projectsService.getByUuid(uuid);
    if (!before) return null;

    const result = await db.update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.uuid, uuid))
      .returning(PROJECT_SELECT);

    if (userUuid && result[0]) {
      await auditService.log({
        entity:     'project',
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
    const result = await db.update(projects)
      .set({ deletedAt: new Date() })
      .where(eq(projects.uuid, uuid))
      .returning({ uuid: projects.uuid });
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

  // ประวัติการแก้ไข project
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
          eq(auditLogs.entity,     'project'),
          eq(auditLogs.entityUuid, uuid)
        ))
        .orderBy(desc(auditLogs.createdAt));
    } catch (_) {}

    return editLogs.map(log => ({
      action:    log.action,
      before:    log.before,
      after:     log.after,
      createdAt: log.createdAt,
      changedBy: `${log.firstName ?? ''} ${log.lastName ?? ''}`.trim(),
    }));
  },
};