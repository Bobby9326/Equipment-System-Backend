import { randomUUID } from 'crypto';
import { db } from '../config/database.js';
import { equipment, equipmentNormals, equipmentStatusLogs, auditLogs, users } from '../db/schema/index.js';
import { eq, like, or, and, sql, isNull, inArray, desc, asc } from 'drizzle-orm';
import { BusinessError } from '../middlewares/error.js';
import { auditService } from './audit.service.js';

export const equipmentService = {
  getAll: async (filters?: {
    search?: string;
    status?: string;
    departmentId?: number;
    equipmentTypeId?: number;
    projectId?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }) => {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const offset = (page - 1) * limit;

    const conditions = [isNull(equipment.deletedAt)];

    if (filters?.search) {
      const s = `%${filters.search}%`;
      conditions.push(or(
        like(equipment.equipmentNumber, s),
        like(equipment.equipmentCode,   s),
        like(equipment.equipmentName,   s),
      )!);
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
    if (filters?.projectId) {
      conditions.push(eq(equipment.projectId, filters.projectId));
    }

    const whereClause = and(...conditions);

    const dir = filters?.sortDir === 'desc' ? desc : asc;
    const orderByCols = (() => {
      switch (filters?.sortBy) {
        case 'equipmentNumber':  return [dir(equipment.equipmentNumber)];
        case 'equipmentName':    return [dir(equipment.equipmentName)];
        case 'status': {
          const statusCase = sql`CASE ${equipment.status}
            WHEN 'normal'      THEN 0
            WHEN 'borrowed'    THEN 1
            WHEN 'repair'      THEN 2
            WHEN 'unavailable' THEN 3
            WHEN 'disposed'    THEN 4
            ELSE 99 END`;
          return [filters?.sortDir === 'desc' ? desc(statusCase) : asc(statusCase)];
        }
        case 'acquisitionDate':  return [dir(equipment.acquisitionDate), asc(equipment.equipmentNumber)];
        case 'price':            return [dir(equipment.price),           asc(equipment.equipmentNumber)];
        default:                 return [desc(equipment.createdAt)];
      }
    })();

    const data = await db
      .select({
        uuid:               equipment.uuid,
        equipmentCode:      equipment.equipmentCode,
        equipmentName:      equipment.equipmentName,
        equipmentNumber:    equipment.equipmentNumber,
        equipmentTypeId:    equipment.equipmentTypeId,
        departmentId:       equipment.departmentId,
        activityId:         equipment.activityId,
        fundId:             equipment.fundId,
        fiscalYear:         equipment.fiscalYear,
        price:              equipment.price,
        unit:               equipment.unit,
        acquisitionSourceId:equipment.acquisitionSourceId,
        acquisitionMethodId:equipment.acquisitionMethodId,
        acquisitionDate:    equipment.acquisitionDate,
        company:            equipment.company,
        sizeDetail:         equipment.sizeDetail,
        buildingId:         equipment.buildingId,
        roomId:             equipment.roomId,
        projectId:          equipment.projectId,
        status:             equipment.status,
        note:               equipment.note,
        createdAt:          equipment.createdAt,
        updatedAt:          equipment.updatedAt,
      })
      .from(equipment)
      .where(whereClause)
      .orderBy(...orderByCols)
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
    const result = await db
      .select({
        uuid:               equipment.uuid,
        equipmentCode:      equipment.equipmentCode,
        equipmentName:      equipment.equipmentName,
        equipmentNumber:    equipment.equipmentNumber,
        equipmentTypeId:    equipment.equipmentTypeId,
        departmentId:       equipment.departmentId,
        activityId:         equipment.activityId,
        fundId:             equipment.fundId,
        fiscalYear:         equipment.fiscalYear,
        price:              equipment.price,
        unit:               equipment.unit,
        acquisitionSourceId:equipment.acquisitionSourceId,
        acquisitionMethodId:equipment.acquisitionMethodId,
        acquisitionDate:    equipment.acquisitionDate,
        company:            equipment.company,
        sizeDetail:         equipment.sizeDetail,
        buildingId:         equipment.buildingId,
        roomId:             equipment.roomId,
        projectId:          equipment.projectId,
        status:             equipment.status,
        note:               equipment.note,
        createdAt:          equipment.createdAt,
        updatedAt:          equipment.updatedAt,
      })
      .from(equipment)
      .where(eq(equipment.uuid, uuid));
    return result[0] || null;
  },

  getByCode: async (equipmentCode: string) => {
    const result = await db
      .select({
        uuid:               equipment.uuid,
        equipmentCode:      equipment.equipmentCode,
        equipmentName:      equipment.equipmentName,
        equipmentNumber:    equipment.equipmentNumber,
        equipmentTypeId:    equipment.equipmentTypeId,
        departmentId:       equipment.departmentId,
        activityId:         equipment.activityId,
        fundId:             equipment.fundId,
        fiscalYear:         equipment.fiscalYear,
        price:              equipment.price,
        unit:               equipment.unit,
        acquisitionSourceId:equipment.acquisitionSourceId,
        acquisitionMethodId:equipment.acquisitionMethodId,
        acquisitionDate:    equipment.acquisitionDate,
        company:            equipment.company,
        sizeDetail:         equipment.sizeDetail,
        buildingId:         equipment.buildingId,
        roomId:             equipment.roomId,
        projectId:          equipment.projectId,
        status:             equipment.status,
        note:               equipment.note,
        createdAt:          equipment.createdAt,
        updatedAt:          equipment.updatedAt,
      })
      .from(equipment)
      .where(eq(equipment.equipmentCode, equipmentCode));
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
    const { numberPrefix, start, end, padLength = 3, userUuid, data } = params;
    const endNum = end ?? start;

    if (start > endNum) throw new BusinessError('ลำดับเริ่มต้นต้องน้อยกว่าหรือเท่ากับลำดับสิ้นสุด');
    if (endNum - start + 1 > 100) throw new BusinessError('สร้างได้ไม่เกิน 100 รายการต่อครั้ง');

    // หา user.id จาก uuid (ใช้ createdBy ใน equipmentNormals)
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.uuid, userUuid));
    if (!userResult[0]) throw new BusinessError('ไม่พบผู้ใช้งาน');
    const createdBy = userResult[0].id;

    // ตรวจ duplicate ทั้งหมดก่อน (ป้องกัน partial insert)
    const equipmentNumbers: string[] = [];
    for (let i = start; i <= endNum; i++) {
      const seq = String(i).padStart(padLength, '0');
      equipmentNumbers.push(`${numberPrefix}-${seq}`);
    }

    const duplicates = await db
      .select({ equipmentNumber: equipment.equipmentNumber })
      .from(equipment)
      .where(inArray(equipment.equipmentNumber, equipmentNumbers));

    if (duplicates.length > 0) {
      throw new BusinessError(`เลขครุภัณฑ์ซ้ำ: ${duplicates.map(d => d.equipmentNumber).join(', ')}`);
    }

    // Transaction: insert equipment → insert equipment_normals
    return await db.transaction(async (tx) => {
      const rows = equipmentNumbers.map(equipmentNumber => ({
        ...data,
        uuid: randomUUID(),
        equipmentNumber,
      }));

      // insert พร้อม id ไว้ใช้ภายใน transaction
      const createdRaw = await tx.insert(equipment).values(rows).returning();

      // insert normals + logs โดยใช้ id ภายใน
      const normals = await tx.insert(equipmentNormals).values(
        createdRaw.map(e => ({
          equipmentId: e.id,
          createdBy,
          reason: 'สร้างครุภัณฑ์ใหม่',
        }))
      ).returning();

      await tx.insert(equipmentStatusLogs).values(
        createdRaw.map((e, i) => ({
          equipmentId: e.id,
          status: 'normal' as const,
          referenceTable: 'equipment_normals',
          referenceId: normals[i].id,
          remark: 'สร้างครุภัณฑ์ใหม่',
          createdBy,
        }))
      );

      // return โดยไม่มี id
      return createdRaw.map(({ id: _, ...e }) => e);
    });
  },

  updateByUuid: async (uuid: string, data: Partial<typeof equipment.$inferInsert>, userUuid?: string) => {
    const before = await equipmentService.getByUuid(uuid);
    if (!before) return null;

    const result = await db.update(equipment)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(equipment.uuid, uuid))
      .returning({
        uuid:               equipment.uuid,
        equipmentCode:      equipment.equipmentCode,
        equipmentName:      equipment.equipmentName,
        equipmentNumber:    equipment.equipmentNumber,
        equipmentTypeId:    equipment.equipmentTypeId,
        departmentId:       equipment.departmentId,
        activityId:         equipment.activityId,
        fundId:             equipment.fundId,
        fiscalYear:         equipment.fiscalYear,
        price:              equipment.price,
        unit:               equipment.unit,
        acquisitionSourceId:equipment.acquisitionSourceId,
        acquisitionMethodId:equipment.acquisitionMethodId,
        acquisitionDate:    equipment.acquisitionDate,
        company:            equipment.company,
        sizeDetail:         equipment.sizeDetail,
        buildingId:         equipment.buildingId,
        roomId:             equipment.roomId,
        projectId:          equipment.projectId,
        status:             equipment.status,
        note:               equipment.note,
        createdAt:          equipment.createdAt,
        updatedAt:          equipment.updatedAt,
      });
    if (userUuid && result[0]) {
      await auditService.log({
        entity:     'equipment',
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
    const result = await db.update(equipment)
      .set({ deletedAt: new Date() })
      .where(eq(equipment.uuid, uuid))
      .returning({ uuid: equipment.uuid });
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

  // ประวัติการเปลี่ยนสถานะ + การแก้ไขข้อมูล รวมเป็น timeline เดียว
  getHistory: async (equipmentUuid: string) => {
    const eqRow = await db
      .select({ id: equipment.id })
      .from(equipment)
      .where(and(eq(equipment.uuid, equipmentUuid), isNull(equipment.deletedAt)));

    if (!eqRow[0]) return null;

    // 1. ประวัติเปลี่ยนสถานะ
    const statusLogs = await db
      .select({
        type:      sql<string>`'status_change'`,
        status:    equipmentStatusLogs.status,
        remark:    equipmentStatusLogs.remark,
        before:    sql<null>`null`,
        after:     sql<null>`null`,
        createdAt: equipmentStatusLogs.createdAt,
        firstName: users.firstName,
        lastName:  users.lastName,
      })
      .from(equipmentStatusLogs)
      .leftJoin(users, eq(equipmentStatusLogs.createdBy, users.id))
      .where(eq(equipmentStatusLogs.equipmentId, eqRow[0].id));

    // 2. ประวัติแก้ไขข้อมูล
    const editLogs = await db
      .select({
        type:      sql<string>`'edit'`,
        status:    sql<null>`null`,
        remark:    sql<null>`null`,
        before:    auditLogs.before,
        after:     auditLogs.after,
        createdAt: auditLogs.createdAt,
        firstName: users.firstName,
        lastName:  users.lastName,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.changedBy, users.id))
      .where(and(
        eq(auditLogs.entity,     'equipment'),
        eq(auditLogs.entityUuid, equipmentUuid)
      ));

    // 3. รวม + เรียงตาม createdAt ล่าสุดก่อน
    return [...statusLogs, ...editLogs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(log => ({
        type:      log.type,
        status:    log.status  ?? undefined,
        remark:    log.remark  ?? undefined,
        before:    log.before  ?? undefined,
        after:     log.after   ?? undefined,
        createdAt: log.createdAt,
        createdBy: `${log.firstName ?? ''} ${log.lastName ?? ''}`.trim(),
      }));
  },
};