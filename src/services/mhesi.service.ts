import { randomUUID } from 'crypto';
import { auditService } from './audit.service.js';
import { db } from '../config/database.js';
import { mhesiNumbers, mhesiAttachments, attachments, planSections, projects, users } from '../db/schema/index.js';
import { eq, like, and, isNull, or, sql, asc, desc, gte, lte } from 'drizzle-orm';
import { storageService } from './storage.service.js';

const toFileUrl = (id: number) => `/api/attachments/${id}/file`;

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
    role?: string;
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
    if (filters?.faculty)      conditions.push(eq(mhesiNumbers.faculty,      filters.faculty));
    if (filters?.role)         conditions.push(eq(mhesiNumbers.role,         filters.role));
    if (filters?.planId)       conditions.push(eq(mhesiNumbers.planId,       filters.planId));
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
        case 'date':         return [dir(mhesiNumbers.date),         asc(mhesiNumbers.mhesiNumber)];
        case 'amount':       return [dir(mhesiNumbers.amount),       asc(mhesiNumbers.mhesiNumber)];
        case 'project':      return [dir(projects.projectName),      asc(mhesiNumbers.mhesiNumber)];
        case 'faculty':      return [dir(mhesiNumbers.faculty),      asc(mhesiNumbers.mhesiNumber)];
        case 'plan':         return [dir(planSections.name),         asc(mhesiNumbers.mhesiNumber)];
        default:             return [desc(mhesiNumbers.createdAt)];
      }
    })();

    const data = await db
      .select(MHESI_SELECT)
      .from(mhesiNumbers)
      .leftJoin(projects,     eq(mhesiNumbers.projectId, projects.id))
      .leftJoin(planSections, eq(mhesiNumbers.planId,    planSections.id))
      .where(whereClause)
      .orderBy(...orderByCols)
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(mhesiNumbers)
      .where(whereClause);

    return { data, total: totalResult[0].count, page, limit };
  },

  // ✅ เพิ่ม additionalAttachments
  getByUuid: async (uuid: string) => {
    const result = await db
      .select(MHESI_SELECT)
      .from(mhesiNumbers)
      .where(and(eq(mhesiNumbers.uuid, uuid), isNull(mhesiNumbers.deletedAt)));

    if (!result[0]) return null;
    const mhesi = result[0];

    // ดึงไฟล์หลัก
    let mainAttachment = null;
    if (mhesi.attachmentId) {
      const att = await db
        .select({ id: attachments.id, fileName: attachments.fileName, fileType: attachments.fileType })
        .from(attachments)
        .where(eq(attachments.id, mhesi.attachmentId));
      if (att[0]) mainAttachment = { ...att[0], fileUrl: toFileUrl(att[0].id) };
    }

    // ดึงไฟล์เพิ่มเติม
    const mhesiRow = await db
      .select({ id: mhesiNumbers.id })
      .from(mhesiNumbers)
      .where(eq(mhesiNumbers.uuid, uuid));

    const additionalAttachments = await db
      .select({
        id:       attachments.id,
        fileName: attachments.fileName,
        fileType: attachments.fileType,
      })
      .from(mhesiAttachments)
      .innerJoin(attachments, eq(mhesiAttachments.attachmentId, attachments.id))
      .where(eq(mhesiAttachments.mhesiId, mhesiRow[0].id))
      .then(rows => rows.map(r => ({ ...r, fileUrl: toFileUrl(r.id) })));

    return {
      ...mhesi,
      mainAttachment,          // ไฟล์หลัก (1 ต่อ 1)
      additionalAttachments,   // ไฟล์เพิ่มเติม (หลายไฟล์)
    };
  },

  getByProjectId: async (projectId: number) => {
    return db
      .select(MHESI_SELECT)
      .from(mhesiNumbers)
      .where(and(eq(mhesiNumbers.projectId, projectId), isNull(mhesiNumbers.deletedAt)));
  },

  create: async (data: Omit<typeof mhesiNumbers.$inferInsert,
    'id' | 'uuid' | 'createdAt' | 'updatedAt' | 'deletedAt'
  >) => {
    const result = await db
      .insert(mhesiNumbers)
      .values({ ...data, uuid: randomUUID() })
      .returning(MHESI_SELECT);
    return result[0];
  },

  updateByUuid: async (uuid: string, data: Partial<Omit<typeof mhesiNumbers.$inferInsert,
    'id' | 'uuid' | 'createdAt' | 'deletedAt'
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

  // ✅ เพิ่ม: อัปโหลดไฟล์เพิ่มเติม
  addAttachments: async (uuid: string, files: File[], userUuid?: string) => {
    const mhesi = await db
      .select({ id: mhesiNumbers.id })
      .from(mhesiNumbers)
      .where(and(eq(mhesiNumbers.uuid, uuid), isNull(mhesiNumbers.deletedAt)));
    if (!mhesi[0]) throw new Error('ไม่พบ MHESI');

    const results = await Promise.all(
      files.map(async (file) => {
        const uploaded = await storageService.upload(file, 'mhesi');
        const [att] = await db
          .insert(attachments)
          .values({ fileName: uploaded.fileName, filePath: uploaded.filePath, fileType: uploaded.fileType })
          .returning({ id: attachments.id, fileName: attachments.fileName, fileType: attachments.fileType });

        await db.insert(mhesiAttachments).values({
          mhesiId:      mhesi[0].id,
          attachmentId: att.id,
        });

        // ✅ audit log
        if (userUuid) {
          await auditService.log({
            entity:     'mhesi',
            entityUuid: uuid,
            action:     'update',
            before:     {},
            after:      { addedAttachment: att.id, fileName: att.fileName, fileUrl: toFileUrl(att.id) },
            userUuid,
          });
        }

        return { ...att, fileUrl: toFileUrl(att.id) };
      })
    );
    return results;
  },

  // ✅ เพิ่ม: ดูไฟล์เพิ่มเติมทั้งหมด
  getAttachments: async (uuid: string) => {
    const mhesi = await db
      .select({ id: mhesiNumbers.id })
      .from(mhesiNumbers)
      .where(and(eq(mhesiNumbers.uuid, uuid), isNull(mhesiNumbers.deletedAt)));
    if (!mhesi[0]) return null;

    return db
      .select({
        id:       attachments.id,
        fileName: attachments.fileName,
        fileType: attachments.fileType,
      })
      .from(mhesiAttachments)
      .innerJoin(attachments, eq(mhesiAttachments.attachmentId, attachments.id))
      .where(eq(mhesiAttachments.mhesiId, mhesi[0].id))
      .then(rows => rows.map(r => ({ ...r, fileUrl: toFileUrl(r.id) })));
  },

  // ✅ เพิ่ม: ลบไฟล์เพิ่มเติม
  removeAttachment: async (uuid: string, attachmentId: number, userUuid?: string) => {
    const mhesi = await db
      .select({ id: mhesiNumbers.id })
      .from(mhesiNumbers)
      .where(and(eq(mhesiNumbers.uuid, uuid), isNull(mhesiNumbers.deletedAt)));
    if (!mhesi[0]) throw new Error('ไม่พบ MHESI');

    const att = await db
      .select({ id: attachments.id, fileName: attachments.fileName, filePath: attachments.filePath })
      .from(attachments)
      .where(eq(attachments.id, attachmentId));
    if (!att[0]) throw new Error('ไม่พบไฟล์');

    // ✅ audit log ก่อนลบ
    if (userUuid) {
      await auditService.log({
        entity:     'mhesi',
        entityUuid: uuid,
        action:     'update',
        before:     { removedAttachment: att[0].id, fileName: att[0].fileName },
        after:      {},
        userUuid,
      });
    }

    await db.delete(mhesiAttachments).where(
      and(
        eq(mhesiAttachments.mhesiId,      mhesi[0].id),
        eq(mhesiAttachments.attachmentId, attachmentId),
      )
    );
    await storageService.delete(att[0].filePath);
    await db.delete(attachments).where(eq(attachments.id, attachmentId));

    return { deleted: attachmentId };
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
          eq(auditLogs.entity,     'mhesi'),
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