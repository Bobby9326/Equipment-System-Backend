import { randomUUID } from 'crypto';
import { db } from '../config/database.js';
import {
  equipment,
  equipmentBorrows,
  equipmentRepairs,
  auditLogs,
  users,
  mhesiNumbers,
  projects,
} from '../db/schema/index.js';
import { eq, like, or, and, sql, isNull, inArray, desc, asc, gte, lte } from 'drizzle-orm';
import { BusinessError } from '../middlewares/error.js';
import { auditService } from './audit.service.js';

// ─────────────────────────────────────────────
// SELECT columns ที่ใช้ซ้ำหลายที่
// ─────────────────────────────────────────────
const EQUIPMENT_SELECT = {
  uuid:                 equipment.uuid,
  equipmentCode:        equipment.equipmentCode,
  equipmentName:        equipment.equipmentName,
  equipmentNumber:      equipment.equipmentNumber,
  equipmentTypeId:      equipment.equipmentTypeId,
  departmentId:         equipment.departmentId,
  activity:             equipment.activity,
  fundId:               equipment.fundId,
  fiscalYear:           equipment.fiscalYear,
  price:                equipment.price,
  unit:                 equipment.unit,
  acquisitionSourceId:  equipment.acquisitionSourceId,
  acquisitionMethodId:  equipment.acquisitionMethodId,
  acquisitionDate:      equipment.acquisitionDate,
  company:              equipment.company,
  sizeDetail:           equipment.sizeDetail,
  buildingId:           equipment.buildingId,
  roomId:               equipment.roomId,
  floor:                equipment.floor,
  warrantyYears:        equipment.warrantyYears,
  warrantyMonths:       equipment.warrantyMonths,
  warrantyEnd:          equipment.warrantyEnd,
  warrantyAttachmentId: equipment.warrantyAttachmentId,
  projectId:            equipment.projectId,
  receivingMhesiId:     equipment.receivingMhesiId,
  status:               equipment.status,
  note:                 equipment.note,
  createdAt:            equipment.createdAt,
  updatedAt:            equipment.updatedAt,
};

export const equipmentService = {
  getAll: async (filters?: {
    search?: string;
    status?: string;
    excludeStatus?: string;
    departmentId?: number;
    equipmentTypeId?: number;
    acquisitionSourceId?: number;
    fiscalYear?: number;
    priceMin?: number;
    priceMax?: number;
    buildingId?: number;
    roomId?: number;
    projectId?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }) => {
    const page   = filters?.page  || 1;
    const limit  = filters?.limit || 10;
    const offset = (page - 1) * limit;

    const conditions = [isNull(equipment.deletedAt)];

    if (filters?.search) {
      const s = `%${filters.search}%`;
      conditions.push(or(like(equipment.equipmentNumber, s), like(equipment.equipmentCode, s), like(equipment.equipmentName, s))!);
    }
    if (filters?.status)              conditions.push(eq(equipment.status,              filters.status));
    if (filters?.excludeStatus)       conditions.push(sql`${equipment.status} != ${filters.excludeStatus}`);
    if (filters?.departmentId)        conditions.push(eq(equipment.departmentId,        filters.departmentId));
    if (filters?.equipmentTypeId)     conditions.push(eq(equipment.equipmentTypeId,     filters.equipmentTypeId));
    if (filters?.acquisitionSourceId) conditions.push(eq(equipment.acquisitionSourceId, filters.acquisitionSourceId));
    if (filters?.fiscalYear)          conditions.push(eq(equipment.fiscalYear,          filters.fiscalYear));
    if (filters?.priceMin != null)    conditions.push(gte(equipment.price, String(filters.priceMin)));
    if (filters?.priceMax != null)    conditions.push(lte(equipment.price, String(filters.priceMax)));
    if (filters?.buildingId)          conditions.push(eq(equipment.buildingId,          filters.buildingId));
    if (filters?.roomId)              conditions.push(eq(equipment.roomId,              filters.roomId));
    if (filters?.projectId)           conditions.push(eq(equipment.projectId,           filters.projectId));

    const whereClause = and(...conditions);

    const dir = filters?.sortDir === 'desc' ? desc : asc;
    const orderByCols = (() => {
      switch (filters?.sortBy) {
        case 'equipmentNumber': return [dir(equipment.equipmentNumber)];
        case 'equipmentName':   return [dir(equipment.equipmentName)];
        case 'status': {
          const statusCase = sql`CASE ${equipment.status} WHEN 'pending' THEN 0 WHEN 'normal' THEN 1 WHEN 'borrowed' THEN 2 WHEN 'repair' THEN 3 WHEN 'unavailable' THEN 4 ELSE 99 END`;
          return [filters?.sortDir === 'desc' ? desc(statusCase) : asc(statusCase)];
        }
        case 'acquisitionDate': return [dir(equipment.acquisitionDate), asc(equipment.equipmentNumber)];
        case 'price':           return [dir(equipment.price),           asc(equipment.equipmentNumber)];
        default:                return [desc(equipment.createdAt)];
      }
    })();

    const rawData = await db
      .select({ ...EQUIPMENT_SELECT, borrowingBuildingId: equipmentBorrows.borrowingBuildingId, borrowingRoomId: equipmentBorrows.borrowingRoomId })
      .from(equipment)
      .leftJoin(equipmentBorrows, and(eq(equipmentBorrows.equipmentId, equipment.id), isNull(equipmentBorrows.actualReturnDate)))
      .where(whereClause)
      .orderBy(...orderByCols)
      .limit(limit)
      .offset(offset);

    const data = rawData.map(({ borrowingBuildingId, borrowingRoomId, ...row }) => ({
      ...row,
      buildingId: row.status === 'borrowed' ? (borrowingBuildingId ?? row.buildingId) : row.buildingId,
      roomId:     row.status === 'borrowed' ? (borrowingRoomId     ?? row.roomId)     : row.roomId,
    }));

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(equipment)
      .where(whereClause);

    return { data, total: totalResult[0].count, page, limit };
  },

  // ─────────────────────────────────────────────
  // getByUuid — trace กลับหา project / mhesi
  // disbursement อ่านจาก audit_logs แทน equipmentNormals
  // ─────────────────────────────────────────────
  getByUuid: async (uuid: string) => {
    const result = await db
      .select(EQUIPMENT_SELECT)
      .from(equipment)
      .where(and(eq(equipment.uuid, uuid), isNull(equipment.deletedAt)));

    if (!result[0]) return null;
    const eq_ = result[0];

    const [projectData, mhesiList, receivingMhesi, disbursementLog] = await Promise.all([
      eq_.projectId
        ? db.select({ id: projects.id, uuid: projects.uuid, projectNumber: projects.projectNumber, projectName: projects.projectName, qtyOrdered: projects.qtyOrdered, budget: projects.budget, status: projects.status, projectDate: projects.projectDate })
            .from(projects).where(eq(projects.id, eq_.projectId))
        : Promise.resolve([]),

      eq_.projectId
        ? db.select({ uuid: mhesiNumbers.uuid, mhesiNumber: mhesiNumbers.mhesiNumber, role: mhesiNumbers.role, date: mhesiNumbers.date, amount: mhesiNumbers.amount, activityName: mhesiNumbers.activityName, attachmentId: mhesiNumbers.attachmentId })
            .from(mhesiNumbers).where(and(eq(mhesiNumbers.projectId, eq_.projectId), isNull(mhesiNumbers.deletedAt))).orderBy(asc(mhesiNumbers.createdAt))
        : Promise.resolve([]),

      eq_.receivingMhesiId
        ? db.select({ uuid: mhesiNumbers.uuid, mhesiNumber: mhesiNumbers.mhesiNumber, role: mhesiNumbers.role, date: mhesiNumbers.date, activityName: mhesiNumbers.activityName })
            .from(mhesiNumbers).where(eq(mhesiNumbers.id, eq_.receivingMhesiId))
        : Promise.resolve([]),

      // ดึง disbursement จาก audit_logs (status_change → normal)
      db.select({ after: auditLogs.after, createdAt: auditLogs.createdAt })
        .from(auditLogs)
        .where(and(eq(auditLogs.entity, 'equipment'), eq(auditLogs.entityUuid, uuid), eq(auditLogs.action, 'status_change'), sql`${auditLogs.after}->>'status' = 'normal'`))
        .orderBy(desc(auditLogs.createdAt))
        .limit(1),
    ]);

    const disbursement = disbursementLog[0]?.after ?? null;

    return {
      ...eq_,
      project:        (projectData as any[])[0]    ?? null,
      mhesiList:      mhesiList as any[],
      receivingMhesi: (receivingMhesi as any[])[0] ?? null,
      disbursement,
    };
  },

  getByCode: async (equipmentCode: string) => {
    const result = await db.select(EQUIPMENT_SELECT).from(equipment)
      .where(and(eq(equipment.equipmentCode, equipmentCode), isNull(equipment.deletedAt)));
    return result[0] || null;
  },

  getByNumber: async (equipmentNumber: string) => {
    const result = await db.select({ uuid: equipment.uuid }).from(equipment)
      .where(and(eq(equipment.equipmentNumber, equipmentNumber), isNull(equipment.deletedAt)));
    return result[0] || null;
  },

  // ─────────────────────────────────────────────
  // create — log ลง audit_logs action='create' แทน equipmentStatusLogs
  // ─────────────────────────────────────────────
  create: async (params: {
    numberPrefix: string;
    start: number;
    end?: number;
    padLength?: number;
    userUuid: string;
    data: Omit<typeof equipment.$inferInsert, 'equipmentNumber'>;
  }) => {
    const { numberPrefix, start, end, padLength = 4, userUuid, data } = params;
    const endNum = end ?? start;

    if (start > endNum) throw new BusinessError('ลำดับเริ่มต้นต้องน้อยกว่าหรือเท่ากับลำดับสิ้นสุด');
    if (endNum - start + 1 > 100) throw new BusinessError('สร้างได้ไม่เกิน 100 รายการต่อครั้ง');

    // resolve receivingMhesiId: UUID → integer
    let resolvedData: typeof data = { ...data };
    if (data.receivingMhesiId && typeof data.receivingMhesiId === 'string' && (data.receivingMhesiId as string).includes('-')) {
      const mhesiRow = await db.select({ id: mhesiNumbers.id }).from(mhesiNumbers).where(eq(mhesiNumbers.uuid, data.receivingMhesiId as string));
      if (!mhesiRow[0]) throw new BusinessError('ไม่พบใบตรวจรับ MHESI');
      resolvedData = { ...data, receivingMhesiId: mhesiRow[0].id };
    }

    const userResult = await db.select({ id: users.id }).from(users).where(eq(users.uuid, userUuid));
    if (!userResult[0]) throw new BusinessError('ไม่พบผู้ใช้งาน');
    const userId = userResult[0].id;

    const equipmentNumbers: string[] = [];
    for (let i = start; i <= endNum; i++) {
      equipmentNumbers.push(`${numberPrefix}-${String(i).padStart(padLength, '0')}`);
    }

    const duplicates = await db.select({ equipmentNumber: equipment.equipmentNumber }).from(equipment)
      .where(inArray(equipment.equipmentNumber, equipmentNumbers));
    if (duplicates.length > 0) throw new BusinessError(`เลขครุภัณฑ์ซ้ำ: ${duplicates.map(d => d.equipmentNumber).join(', ')}`);

    return await db.transaction(async (tx) => {
      const rows = equipmentNumbers.map(equipmentNumber => ({
        ...resolvedData,
        uuid:            randomUUID(),
        equipmentNumber,
        status:          'pending' as const,
      }));

      const createdRaw = await tx.insert(equipment).values(rows).returning();

      // ✅ log ลง audit_logs แทน equipmentStatusLogs
      await tx.insert(auditLogs).values(
        createdRaw.map(e => ({
          entity:     'equipment' as const,
          entityUuid: e.uuid,
          action:     'create' as const,
          before:     {},
          after:      { status: 'pending', equipmentName: e.equipmentName, equipmentNumber: e.equipmentNumber },
          changedBy:  userId,
        }))
      );

      return createdRaw.map(({ id: _, ...e }) => e);
    });
  },

  updateByUuid: async (uuid: string, data: Partial<typeof equipment.$inferInsert>, userUuid?: string) => {
    // resolve receivingMhesiId: UUID → integer
    let resolvedData: typeof data = { ...data };
    if (data.receivingMhesiId && typeof data.receivingMhesiId === 'string' && (data.receivingMhesiId as string).includes('-')) {
      const mhesiRow = await db.select({ id: mhesiNumbers.id }).from(mhesiNumbers).where(eq(mhesiNumbers.uuid, data.receivingMhesiId as string));
      if (!mhesiRow[0]) throw new BusinessError('ไม่พบใบตรวจรับ MHESI');
      resolvedData = { ...data, receivingMhesiId: mhesiRow[0].id };
    }

    const beforeResult = await db.select(EQUIPMENT_SELECT).from(equipment)
      .where(and(eq(equipment.uuid, uuid), isNull(equipment.deletedAt)));
    if (!beforeResult[0]) return null;
    const before = beforeResult[0];

    const result = await db.update(equipment)
      .set({ ...resolvedData, updatedAt: new Date() })
      .where(and(eq(equipment.uuid, uuid), isNull(equipment.deletedAt)))
      .returning(EQUIPMENT_SELECT);

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

  deleteByUuid: async (uuid: string, userUuid?: string) => {
    const before = await db.select(EQUIPMENT_SELECT).from(equipment)
      .where(and(eq(equipment.uuid, uuid), isNull(equipment.deletedAt)));
    if (!before[0]) return null;

    const result = await db.update(equipment)
      .set({ deletedAt: new Date() })
      .where(and(eq(equipment.uuid, uuid), isNull(equipment.deletedAt)))
      .returning({ uuid: equipment.uuid });

    if (userUuid && result[0]) {
      await auditService.log({
        entity:     'equipment',
        entityUuid: uuid,
        action:     'delete',
        before:     before[0] as any,
        after:      {},
        userUuid,
      });
    }
    return result[0] || null;
  },

  getStats: async (departmentId?: number) => {
    const ALL_STATUSES = ['pending', 'normal', 'borrowed', 'repair', 'unavailable'] as const;
    const conditions = [isNull(equipment.deletedAt)];
    if (departmentId) conditions.push(eq(equipment.departmentId, departmentId));
    const whereClause = and(...conditions);

    const [totalResult, statusRows, byDepartment] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(equipment).where(whereClause),
      db.select({ status: equipment.status, count: sql<number>`count(*)` }).from(equipment).where(whereClause).groupBy(equipment.status),
      db.select({ departmentId: equipment.departmentId, count: sql<number>`count(*)` }).from(equipment).where(whereClause).groupBy(equipment.departmentId),
    ]);

    const statusMap = Object.fromEntries(statusRows.map(r => [r.status, Number(r.count)]));
    const byStatus  = ALL_STATUSES.map(status => ({ status, count: statusMap[status] ?? 0 }));

    return { total: totalResult[0].count, byStatus, byDepartment };
  },

  // ─────────────────────────────────────────────
  // getActivityStats — ดึงจาก audit_logs แทน equipmentStatusLogs
  // ─────────────────────────────────────────────
  getActivityStats: async (period: 'week' | 'month' | 'fiscal', departmentId?: number) => {
    const now    = new Date();
    const ranges: { start: Date; end: Date; label: string }[] = [];

    if (period === 'week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(now.getDate() - i);
        const start = new Date(d); start.setHours(0,0,0,0);
        const end   = new Date(d); end.setHours(23,59,59,999);
        const names = ['อา','จ','อ','พ','พฤ','ศ','ส'];
        ranges.push({ start, end, label: `${names[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}` });
      }
    } else if (period === 'month') {
      for (let i = 3; i >= 0; i--) {
        const end = new Date(now); end.setDate(now.getDate() - i * 7); end.setHours(23,59,59,999);
        const start = new Date(end); start.setDate(end.getDate() - 6); start.setHours(0,0,0,0);
        ranges.push({ start, end, label: `สัปดาห์ที่ ${4 - i}` });
      }
    } else {
      const thMonth = now.getMonth();
      const fyStart = thMonth >= 9 ? new Date(now.getFullYear(), 9, 1) : new Date(now.getFullYear() - 1, 9, 1);
      const names   = ['ต.ค.','พ.ย.','ธ.ค.','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.'];
      for (let i = 0; i < 12; i++) {
        const d = new Date(fyStart); d.setMonth(fyStart.getMonth() + i);
        ranges.push({ start: new Date(d.getFullYear(), d.getMonth(), 1), end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999), label: names[i] });
      }
    }

    const from = ranges[0].start;
    const to   = ranges[ranges.length - 1].end;

    // ดึงจาก audit_logs action='status_change'
    const conditions: any[] = [
      eq(auditLogs.entity, 'equipment'),
      eq(auditLogs.action, 'status_change'),
      sql`${auditLogs.createdAt} >= ${from.toISOString()}`,
      sql`${auditLogs.createdAt} <= ${to.toISOString()}`,
    ];

    if (departmentId) {
      conditions.push(sql`EXISTS (
        SELECT 1 FROM equipment e
        WHERE e.uuid = ${auditLogs.entityUuid}
        AND e.department_id = ${departmentId}
      )`);
    }

    const logs = await db
      .select({ createdAt: auditLogs.createdAt, after: auditLogs.after })
      .from(auditLogs)
      .where(and(...conditions));

    const datasets: Record<string, number[]> = {
      normal:      new Array(ranges.length).fill(0),
      borrowed:    new Array(ranges.length).fill(0),
      repair:      new Array(ranges.length).fill(0),
      unavailable: new Array(ranges.length).fill(0),
    };

    for (const log of logs) {
      const logDate = new Date(log.createdAt);
      const idx     = ranges.findIndex(r => logDate >= r.start && logDate <= r.end);
      if (idx === -1) continue;
      const s = (log.after as any)?.status ?? '';
      if (s in datasets) datasets[s][idx]++;
    }

    return {
      labels: ranges.map(r => r.label),
      datasets: [
        { label: 'เบิกจ่าย',       data: datasets.normal,      color: '#27ae60' },
        { label: 'ยืม',            data: datasets.borrowed,    color: '#2980b9' },
        { label: 'ซ่อม',           data: datasets.repair,      color: '#f39c12' },
        { label: 'ไม่พร้อมใช้งาน', data: datasets.unavailable, color: '#e74c3c' },
      ],
    };
  },

  // ─────────────────────────────────────────────
  // getHistory — ดึงทั้งหมดจาก audit_logs
  // ─────────────────────────────────────────────
  getHistory: async (equipmentUuid: string) => {
    const logs = await db
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
      .where(and(eq(auditLogs.entity, 'equipment'), eq(auditLogs.entityUuid, equipmentUuid)))
      .orderBy(desc(auditLogs.createdAt));

    // ดึงประวัติซ่อมเพิ่มเติม (เพราะ repair มี referenceId ไปที่ equipmentRepairs)
    const repairLogs = await db
      .select({ repairReason: equipmentRepairs.repairReason, repairCompany: equipmentRepairs.repairCompany, cost: equipmentRepairs.cost, startDate: equipmentRepairs.startDate, endDate: equipmentRepairs.endDate, actualEndDate: equipmentRepairs.actualEndDate, attachmentId: equipmentRepairs.attachmentId, id: equipmentRepairs.id })
      .from(equipmentRepairs)
      .leftJoin(equipment, eq(equipmentRepairs.equipmentId, equipment.id))
      .where(eq(equipment.uuid, equipmentUuid));

    const repairMap = Object.fromEntries(repairLogs.map(r => [r.id, r]));

    return logs.map(log => {
      const base = {
        action:    log.action,
        before:    log.before,
        after:     log.after,
        createdAt: log.createdAt,
        createdBy: `${log.firstName ?? ''} ${log.lastName ?? ''}`.trim(),
      };

      const after = log.after as any;

      // เพิ่ม detail ของ repair จาก repairMap
      if (after?.status === 'repair' && after?.repairRecordId) {
        const r = repairMap[after.repairRecordId];
        if (r) return { ...base, detail: { repairReason: r.repairReason, repairCompany: r.repairCompany, cost: r.cost, startDate: r.startDate, endDate: r.endDate, actualEndDate: r.actualEndDate, attachmentId: r.attachmentId } };
      }

      return base;
    });
  },
};