import { randomUUID } from 'crypto';
import { db } from '../config/database.js';
import { auditService } from './audit.service.js';
import { projects, users, equipment, mhesiNumbers } from '../db/schema/index.js';
import { eq, sql, like, and, isNull, asc, desc, gte, lte } from 'drizzle-orm';

// สร้างเลขโครงการ YYYYMMDDNN (10 หลัก)
const generateProjectNumber = async (): Promise<string> => {
  const now    = new Date();
  const year   = now.getFullYear().toString();
  const month  = String(now.getMonth() + 1).padStart(2, '0');
  const day    = String(now.getDate()).padStart(2, '0');
  const prefix = `${year}${month}${day}`;

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(sql`${projects.projectNumber} LIKE ${prefix + '%'}`);

  const seq = (Number(result[0].count) + 1).toString().padStart(2, '0');
  return `${prefix}${seq}`;
};

// ✅ เพิ่ม fiscalYear และ acquisitionMethodId
const PROJECT_SELECT = {
  id:                  projects.id,
  uuid:                projects.uuid,
  projectNumber:       projects.projectNumber,
  projectName:         projects.projectName,
  projectTypeId:       projects.projectTypeId,
  projectDate:         projects.projectDate,
  fiscalYear:          projects.fiscalYear,
  qtyOrdered:          projects.qtyOrdered,
  budget:              projects.budget,
  status:              projects.status,
  acquisitionSourceId: projects.acquisitionSourceId,
  acquisitionMethodId: projects.acquisitionMethodId,
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
    acquisitionMethodId?: number;
    fiscalYear?: number;
    dateFrom?: string;
    dateTo?: string;
    budgetMin?: number;
    budgetMax?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }) => {
    const page   = filters?.page  || 1;
    const limit  = filters?.limit || 10;
    const offset = (page - 1) * limit;

    const conditions = [isNull(projects.deletedAt)];

    if (filters?.search)              conditions.push(like(projects.projectName, `%${filters.search}%`));
    if (filters?.status)              conditions.push(eq(projects.status,              filters.status));
    if (filters?.projectTypeId)       conditions.push(eq(projects.projectTypeId,       filters.projectTypeId));
    if (filters?.acquisitionSourceId) conditions.push(eq(projects.acquisitionSourceId, filters.acquisitionSourceId));
    if (filters?.acquisitionMethodId) conditions.push(eq(projects.acquisitionMethodId, filters.acquisitionMethodId));
    if (filters?.fiscalYear)          conditions.push(eq(projects.fiscalYear,          filters.fiscalYear));
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
        case 'fiscalYear':          return [dir(projects.fiscalYear),          asc(projects.id)];
        case 'acquisitionSourceId': return [dir(projects.acquisitionSourceId), asc(projects.id)];
        case 'acquisitionMethodId': return [dir(projects.acquisitionMethodId), asc(projects.id)];
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

    return { data, total: totalResult[0].count, page, limit };
  },

  getByUuid: async (uuid: string) => {
    const result = await db
      .select(PROJECT_SELECT)
      .from(projects)
      .where(and(eq(projects.uuid, uuid), isNull(projects.deletedAt)));

    if (!result[0]) return null;
    const project = result[0];

    const [summary, mhesiList] = await Promise.all([
      db.select({
          total:       sql<number>`count(*)`,
          pending:     sql<number>`count(*) filter (where ${equipment.status} = 'pending')`,
          normal:      sql<number>`count(*) filter (where ${equipment.status} = 'normal')`,
          borrowed:    sql<number>`count(*) filter (where ${equipment.status} = 'borrowed')`,
          repair:      sql<number>`count(*) filter (where ${equipment.status} = 'repair')`,
          unavailable: sql<number>`count(*) filter (where ${equipment.status} = 'unavailable')`,
          disposed:    sql<number>`count(*) filter (where ${equipment.status} = 'disposed')`,
        })
        .from(equipment)
        .where(and(eq(equipment.projectId, project.id), isNull(equipment.deletedAt))),

      db.select({
          uuid:         mhesiNumbers.uuid,
          mhesiNumber:  mhesiNumbers.mhesiNumber,
          role:         mhesiNumbers.role,
          date:         mhesiNumbers.date,
          amount:       mhesiNumbers.amount,
          activityName: mhesiNumbers.activityName,
          attachmentId: mhesiNumbers.attachmentId,
          createdAt:    mhesiNumbers.createdAt,
        })
        .from(mhesiNumbers)
        .where(and(
          eq(mhesiNumbers.projectId, project.id),
          isNull(mhesiNumbers.deletedAt),
        ))
        .orderBy(asc(mhesiNumbers.createdAt)),
    ]);

    return {
      ...project,
      equipmentSummary: {
        qtyOrdered:  project.qtyOrdered ?? 0,
        registered:  Number(summary[0].total),
        pending:     Number(summary[0].pending),
        normal:      Number(summary[0].normal),
        borrowed:    Number(summary[0].borrowed),
        repair:      Number(summary[0].repair),
        unavailable: Number(summary[0].unavailable),
        disposed:    Number(summary[0].disposed),
      },
      mhesiList,
    };
  },

  create: async (data: Omit<typeof projects.$inferInsert,
    'id' | 'uuid' | 'createdAt' | 'updatedAt' | 'projectNumber'
  >) => {
    const projectNumber = await generateProjectNumber();
    const result = await db
      .insert(projects)
      .values({ ...data, uuid: randomUUID(), projectNumber })
      .returning(PROJECT_SELECT);
    return result[0];
  },

  updateByUuid: async (uuid: string, data: Partial<typeof projects.$inferInsert>, userUuid?: string) => {
    const before = await projectsService.getByUuid(uuid);
    if (!before) return null;

    const result = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(projects.uuid, uuid), isNull(projects.deletedAt)))
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
    const result = await db
      .update(projects)
      .set({ deletedAt: new Date() })
      .where(and(eq(projects.uuid, uuid), isNull(projects.deletedAt)))
      .returning({ uuid: projects.uuid });
    return result[0] || null;
  },

  getStats: async () => {
    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(isNull(projects.deletedAt));

    const byStatus = await db
      .select({ status: projects.status, count: sql<number>`count(*)` })
      .from(projects)
      .where(isNull(projects.deletedAt))
      .groupBy(projects.status);

    return { total: total[0].count, byStatus };
  },

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
          eq(auditLogs.entityUuid, uuid),
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