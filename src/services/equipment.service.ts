import { randomUUID } from 'crypto';
import { db } from '../config/database.js';
import {
  equipment,
  equipmentNormals,
  equipmentStatusLogs,
  equipmentBorrows,
  equipmentRepairs,
  equipmentUnavailable,
  equipmentDisposals,
  auditLogs,
  users,
  mhesiNumbers,
  projects,
} from '../db/schema/index.js';
import { eq, like, or, and, sql, isNull, isNotNull, inArray, desc, asc, gte, lte } from 'drizzle-orm';
import { BusinessError } from '../middlewares/error.js';
import { auditService } from './audit.service.js';

// ─────────────────────────────────────────────
// SELECT columns ที่ใช้ซ้ำหลายที่
// ─────────────────────────────────────────────
const EQUIPMENT_SELECT = {
  uuid:                equipment.uuid,
  equipmentCode:       equipment.equipmentCode,
  equipmentName:       equipment.equipmentName,
  equipmentNumber:     equipment.equipmentNumber,
  equipmentTypeId:     equipment.equipmentTypeId,
  departmentId:        equipment.departmentId,
  activity:            equipment.activity,
  fundId:              equipment.fundId,
  fiscalYear:          equipment.fiscalYear,
  price:               equipment.price,
  unit:                equipment.unit,
  acquisitionSourceId: equipment.acquisitionSourceId,
  acquisitionMethodId: equipment.acquisitionMethodId,
  acquisitionDate:     equipment.acquisitionDate,
  company:             equipment.company,
  sizeDetail:          equipment.sizeDetail,
  buildingId:          equipment.buildingId,
  roomId:              equipment.roomId,
  floor:               equipment.floor,
  warrantyYears:       equipment.warrantyYears,
  warrantyMonths:      equipment.warrantyMonths,
  warrantyEnd:         equipment.warrantyEnd,
  warrantyAttachmentId: equipment.warrantyAttachmentId,
  projectId:           equipment.projectId,
  receivingMhesiId:    equipment.receivingMhesiId,
  status:              equipment.status,
  note:                equipment.note,
  createdAt:           equipment.createdAt,
  updatedAt:           equipment.updatedAt,
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
          const statusCase = sql`CASE ${equipment.status}
            WHEN 'pending'     THEN 0
            WHEN 'normal'      THEN 1
            WHEN 'borrowed'    THEN 2
            WHEN 'repair'      THEN 3
            WHEN 'unavailable' THEN 4
            WHEN 'disposed'    THEN 5
            ELSE 99 END`;
          return [filters?.sortDir === 'desc' ? desc(statusCase) : asc(statusCase)];
        }
        case 'acquisitionDate': return [dir(equipment.acquisitionDate), asc(equipment.equipmentNumber)];
        case 'price':           return [dir(equipment.price),           asc(equipment.equipmentNumber)];
        default:                return [desc(equipment.createdAt)];
      }
    })();

    const rawData = await db
      .select({
        ...EQUIPMENT_SELECT,
        // ตำแหน่งที่ยืมอยู่ (null ถ้าไม่ได้ยืม)
        borrowingBuildingId: equipmentBorrows.borrowingBuildingId,
        borrowingRoomId:     equipmentBorrows.borrowingRoomId,
      })
      .from(equipment)
      .leftJoin(
        equipmentBorrows,
        and(
          eq(equipmentBorrows.equipmentId, equipment.id),
          isNull(equipmentBorrows.actualReturnDate), // เฉพาะที่ยังไม่คืน
        )
      )
      .where(whereClause)
      .orderBy(...orderByCols)
      .limit(limit)
      .offset(offset);

    // override buildingId/roomId เมื่อ status = borrowed
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
  // getByUuid — เพิ่ม trace กลับหา project / mhesi / disbursement
  // ─────────────────────────────────────────────
  getByUuid: async (uuid: string) => {
    const result = await db
      .select(EQUIPMENT_SELECT)
      .from(equipment)
      .where(and(eq(equipment.uuid, uuid), isNull(equipment.deletedAt)));

    if (!result[0]) return null;
    const eq_ = result[0];

    // ดึงข้อมูล trace พร้อมกันทั้งหมด
    const [projectData, mhesiList, receivingMhesi, disbursement] = await Promise.all([
      // project ที่ผูกอยู่
      eq_.projectId
        ? db.select({
            id:            projects.id,
            uuid:          projects.uuid,
            projectNumber: projects.projectNumber,
            projectName:   projects.projectName,
            qtyOrdered:    projects.qtyOrdered,
            budget:        projects.budget,
            status:        projects.status,
            projectDate:   projects.projectDate,
          })
          .from(projects)
          .where(eq(projects.id, eq_.projectId))
        : Promise.resolve([]),

      // MHESI ทุกฉบับของ project นี้ (trace เอกสารต้นทาง)
      eq_.projectId
        ? db.select({
            uuid:         mhesiNumbers.uuid,
            mhesiNumber:  mhesiNumbers.mhesiNumber,
            role:         mhesiNumbers.role,
            date:         mhesiNumbers.date,
            amount:       mhesiNumbers.amount,
            activityName: mhesiNumbers.activityName,
            attachmentId: mhesiNumbers.attachmentId,
          })
          .from(mhesiNumbers)
          .where(and(
            eq(mhesiNumbers.projectId, eq_.projectId),
            isNull(mhesiNumbers.deletedAt),
          ))
          .orderBy(asc(mhesiNumbers.createdAt))
        : Promise.resolve([]),

      // ใบตรวจรับที่เครื่องนี้มา (ระบุรอบ)
      eq_.receivingMhesiId
        ? db.select({
            uuid:         mhesiNumbers.uuid,
            mhesiNumber:  mhesiNumbers.mhesiNumber,
            role:         mhesiNumbers.role,
            date:         mhesiNumbers.date,
            activityName: mhesiNumbers.activityName,
          })
          .from(mhesiNumbers)
          .where(eq(mhesiNumbers.id, eq_.receivingMhesiId))
        : Promise.resolve([]),

      // ข้อมูลการเบิกจ่าย (ถ้ามี)
      db.select({
          id:            equipmentNormals.id,
          disbursedTo:   equipmentNormals.disbursedTo,
          disbursedDate: equipmentNormals.disbursedDate,
          roomId:        equipmentNormals.roomId,
          reason:        equipmentNormals.reason,
          createdAt:     equipmentNormals.createdAt,
        })
        .from(equipmentNormals)
        .where(and(
          eq(equipmentNormals.equipmentId,
            // ดึง id จาก uuid — ใช้ subquery-like ผ่าน join ไม่ได้ในที่นี้ ใช้ getById แทน
            // NOTE: เราต้องการ equipment.id ซึ่งไม่อยู่ใน EQUIPMENT_SELECT
            // แก้โดย query id แยก หรือ include id ใน select ชั่วคราว
            // ทำผ่าน subquery ด้านล่าง
            sql`(SELECT id FROM equipment WHERE uuid = ${uuid} AND deleted_at IS NULL)`
          ),
          isNotNull(equipmentNormals.disbursedTo),
        ))
        .orderBy(desc(equipmentNormals.createdAt))
        .limit(1),
    ]);

    return {
      ...eq_,
      project:        (projectData as any[])[0]  ?? null,  // project ต้นทาง
      mhesiList:      mhesiList as any[],                   // เอกสารทุกฉบับของ project
      receivingMhesi: (receivingMhesi as any[])[0] ?? null, // ใบตรวจรับที่เครื่องนี้มา
      disbursement:   (disbursement as any[])[0]   ?? null, // ข้อมูลเบิกจ่าย
    };
  },

  getByCode: async (equipmentCode: string) => {
    const result = await db
      .select(EQUIPMENT_SELECT)
      .from(equipment)
      .where(and(eq(equipment.equipmentCode, equipmentCode), isNull(equipment.deletedAt)));
    return result[0] || null;
  },

  getByNumber: async (equipmentNumber: string) => {
    const result = await db
      .select({ uuid: equipment.uuid })
      .from(equipment)
      .where(and(eq(equipment.equipmentNumber, equipmentNumber), isNull(equipment.deletedAt)));
    return result[0] || null;
  },

  // ─────────────────────────────────────────────
  // create — แก้ bug: ลงทะเบียนใหม่ต้องเป็น pending ไม่ insert normals
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

    // ✅ resolve receivingMhesiId: UUID string → integer id
    let resolvedData: typeof data = { ...data };
    if (data.receivingMhesiId && typeof data.receivingMhesiId === 'string' && (data.receivingMhesiId as string).includes('-')) {
      const mhesiRow = await db
        .select({ id: mhesiNumbers.id })
        .from(mhesiNumbers)
        .where(eq(mhesiNumbers.uuid, data.receivingMhesiId as string));
      if (!mhesiRow[0]) throw new BusinessError('ไม่พบใบตรวจรับ MHESI');
      resolvedData = { ...data, receivingMhesiId: mhesiRow[0].id };
    }

    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.uuid, userUuid));
    if (!userResult[0]) throw new BusinessError('ไม่พบผู้ใช้งาน');
    const createdBy = userResult[0].id;

    // สร้าง equipment numbers
    const equipmentNumbers: string[] = [];
    for (let i = start; i <= endNum; i++) {
      const seq = String(i).padStart(padLength, '0');
      equipmentNumbers.push(`${numberPrefix}-${seq}`);
    }

    // ตรวจ duplicate ก่อน
    const duplicates = await db
      .select({ equipmentNumber: equipment.equipmentNumber })
      .from(equipment)
      .where(inArray(equipment.equipmentNumber, equipmentNumbers));

    if (duplicates.length > 0) {
      throw new BusinessError(`เลขครุภัณฑ์ซ้ำ: ${duplicates.map(d => d.equipmentNumber).join(', ')}`);
    }

    // Transaction: insert equipment → log status 'pending'
    // ✅ ไม่ insert equipmentNormals เพราะยังไม่ได้เบิกจ่าย
    return await db.transaction(async (tx) => {
      const rows = equipmentNumbers.map(equipmentNumber => ({
        ...resolvedData,   // ✅ ใช้ resolvedData (receivingMhesiId เป็น integer แล้ว)
        uuid:            randomUUID(),
        equipmentNumber,
        status:          'pending' as const,
      }));

      const createdRaw = await tx.insert(equipment).values(rows).returning();

      // ✅ บันทึก status log เป็น 'pending' เท่านั้น ไม่ insert normals
      await tx.insert(equipmentStatusLogs).values(
        createdRaw.map(e => ({
          equipmentId:    e.id,
          status:         'pending' as const,
          remark:         'สร้างครุภัณฑ์ใหม่',
          createdBy,
        }))
      );

      return createdRaw.map(({ id: _, ...e }) => e);
    });
  },

  updateByUuid: async (uuid: string, data: Partial<typeof equipment.$inferInsert>, userUuid?: string) => {
    
    // ✅ แก้: ดึง before เฉพาะ EQUIPMENT_SELECT ไม่ต้องการ trace fields
    const beforeResult = await db
      .select(EQUIPMENT_SELECT)
      .from(equipment)
      .where(and(eq(equipment.uuid, uuid), isNull(equipment.deletedAt)));
    
    if (!beforeResult[0]) return null;
    const before = beforeResult[0];

    const result = await db
      .update(equipment)
      .set({ ...data, updatedAt: new Date() })
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

  deleteByUuid: async (uuid: string) => {
    const result = await db
      .update(equipment)
      .set({ deletedAt: new Date() })
      .where(and(eq(equipment.uuid, uuid), isNull(equipment.deletedAt)))
      .returning({ uuid: equipment.uuid });
    return result[0] || null;
  },

 getStats: async (departmentId?: number) => {
    const ALL_STATUSES = ['pending', 'normal', 'borrowed', 'repair', 'unavailable', 'disposed'] as const;

    // ✅ แก้: เพิ่ม departmentId filter ใน conditions
    const conditions = [isNull(equipment.deletedAt)];
    if (departmentId) conditions.push(eq(equipment.departmentId, departmentId));
    const whereClause = and(...conditions);

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(equipment)
      .where(whereClause);  // ← เปลี่ยนจาก isNull(equipment.deletedAt)

    const statusRows = await db
      .select({ status: equipment.status, count: sql<number>`count(*)` })
      .from(equipment)
      .where(whereClause)   // ← เปลี่ยนจาก isNull(equipment.deletedAt)
      .groupBy(equipment.status);

    const statusMap = Object.fromEntries(statusRows.map(r => [r.status, Number(r.count)]));
    const byStatus = ALL_STATUSES.map(status => ({
      status,
      count: statusMap[status] ?? 0,
    }));

    const byDepartment = await db
      .select({ departmentId: equipment.departmentId, count: sql<number>`count(*)` })
      .from(equipment)
      .where(whereClause)   // ← เปลี่ยนตรงนี้ด้วย
      .groupBy(equipment.departmentId);

    return { total: totalResult[0].count, byStatus, byDepartment };
  },

  // ─────────────────────────────────────────────
  // ─────────────────────────────────────────────
  // getActivityStats — สถิติการใช้งานสำหรับ Dashboard
  // period: 'week' | 'month' | 'fiscal'
  // ─────────────────────────────────────────────
  getActivityStats: async (period: 'week' | 'month' | 'fiscal', departmentId?: number) => {
    const now   = new Date();
    let labels: string[] = [];
    let ranges: { start: Date; end: Date; label: string }[] = [];

    if (period === 'week') {
      // 7 วันย้อนหลัง (จันทร์ถึงวันนี้)
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const start = new Date(d); start.setHours(0,0,0,0);
        const end   = new Date(d); end.setHours(23,59,59,999);
        const dayNames = ['อา','จ','อ','พ','พฤ','ศ','ส'];
        ranges.push({ start, end, label: `${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}` });
      }
    } else if (period === 'month') {
      // 4 สัปดาห์ย้อนหลัง
      for (let i = 3; i >= 0; i--) {
        const end   = new Date(now);
        end.setDate(now.getDate() - i * 7);
        end.setHours(23,59,59,999);
        const start = new Date(end);
        start.setDate(end.getDate() - 6);
        start.setHours(0,0,0,0);
        ranges.push({ start, end, label: `สัปดาห์ที่ ${4 - i}` });
      }
    } else {
      // ปีงบประมาณปัจจุบัน: ต.ค. ปีก่อน - ก.ย. ปีนี้
      const thMonth  = now.getMonth(); // 0-based
      const fyStart  = thMonth >= 9
        ? new Date(now.getFullYear(), 9, 1)   // ต.ค. ปีนี้
        : new Date(now.getFullYear() - 1, 9, 1); // ต.ค. ปีก่อน
      const monthNames = ['ต.ค.','พ.ย.','ธ.ค.','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.'];
      for (let i = 0; i < 12; i++) {
        const d = new Date(fyStart);
        d.setMonth(fyStart.getMonth() + i);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        ranges.push({ start, end, label: monthNames[i] });
      }
    }

    // ดึง status_logs ทั้งหมดในช่วงเวลา
    const from = ranges[0].start;
    const to   = ranges[ranges.length - 1].end;

    const deptConditions: any[] = [
      sql`${equipmentStatusLogs.createdAt} >= ${from.toISOString()}`,
      sql`${equipmentStatusLogs.createdAt} <= ${to.toISOString()}`,
    ];

    // กรอง department ผ่าน join equipment
    if (departmentId) {
      deptConditions.push(eq(equipment.departmentId, departmentId));
    }

    const logs = await db
      .select({
        createdAt: equipmentStatusLogs.createdAt,
        status:    equipmentStatusLogs.status,
      })
      .from(equipmentStatusLogs)
      .leftJoin(equipment, eq(equipmentStatusLogs.equipmentId, equipment.id))
      .where(and(...deptConditions));

    // นับตาม range
    const datasets: Record<string, number[]> = {
      normal:      new Array(ranges.length).fill(0),
      borrowed:    new Array(ranges.length).fill(0),
      repair:      new Array(ranges.length).fill(0),
      unavailable: new Array(ranges.length).fill(0),
      disposed:    new Array(ranges.length).fill(0),
    };

    for (const log of logs) {
      const logDate = new Date(log.createdAt);
      const idx = ranges.findIndex(r => logDate >= r.start && logDate <= r.end);
      if (idx === -1) continue;
      const s = log.status ?? 'normal';
      if (s in datasets) datasets[s][idx]++;
    }

    return {
      labels: ranges.map(r => r.label),
      datasets: [
        { label: 'เบิกจ่าย',       data: datasets.normal,      color: '#27ae60' },
        { label: 'ยืม',            data: datasets.borrowed,    color: '#2980b9' },
        { label: 'ซ่อม',           data: datasets.repair,      color: '#f39c12' },
        { label: 'ไม่พร้อมใช้งาน', data: datasets.unavailable, color: '#e74c3c' },
        { label: 'จำหน่าย',        data: datasets.disposed,    color: '#95a5a6' },
      ],
    };
  },

  // getHistory — แก้ bug: เติม . หน้า where()
  // ─────────────────────────────────────────────
  getHistory: async (equipmentUuid: string) => {
    const eqRow = await db
      .select({ id: equipment.id })
      .from(equipment)
      .where(and(eq(equipment.uuid, equipmentUuid), isNull(equipment.deletedAt)));

    if (!eqRow[0]) return null;
    const equipmentId = eqRow[0].id;

    // 1. ประวัติเปลี่ยนสถานะ
    const statusLogs = await db
      .select({
        type:                sql<string>`'status_change'`,
        status:              equipmentStatusLogs.status,
        remark:              equipmentStatusLogs.remark,
        referenceTable:      equipmentStatusLogs.referenceTable,
        before:              sql<null>`null`,
        after:               sql<null>`null`,
        createdAt:           equipmentStatusLogs.createdAt,
        firstName:           users.firstName,
        lastName:            users.lastName,
        borrowerName:        equipmentBorrows.borrowerName,
        borrowDate:          equipmentBorrows.borrowDate,
        expectedReturnDate:  equipmentBorrows.expectedReturnDate,
        borrowReason:        equipmentBorrows.reason,
        borrowingBuildingId: equipmentBorrows.borrowingBuildingId,
        borrowingRoomId:     equipmentBorrows.borrowingRoomId,
        repairReason:        equipmentRepairs.repairReason,
        repairStartDate:     equipmentRepairs.startDate,
        repairEndDate:       equipmentRepairs.endDate,
        repairCompany:       equipmentRepairs.repairCompany,
        repairCost:          equipmentRepairs.cost,
        repairAttachmentId:  equipmentRepairs.attachmentId,
        unavailableReason:   equipmentUnavailable.reason,
        disposalDate:        equipmentDisposals.disposalDate,
        disposalMethod:      equipmentDisposals.disposalMethod,
        disposalApprovedBy:  equipmentDisposals.approvedBy,
        disposalCost:        equipmentDisposals.cost,
        disposalReason:      equipmentDisposals.reason,
        disposalAttachmentId:equipmentDisposals.attachmentId,
      })
      .from(equipmentStatusLogs)
      .leftJoin(users, eq(equipmentStatusLogs.createdBy, users.id))
      .leftJoin(equipmentBorrows,    and(eq(equipmentStatusLogs.referenceTable, 'equipment_borrows'),     eq(equipmentStatusLogs.referenceId, equipmentBorrows.id)))
      .leftJoin(equipmentRepairs,    and(eq(equipmentStatusLogs.referenceTable, 'equipment_repairs'),     eq(equipmentStatusLogs.referenceId, equipmentRepairs.id)))
      .leftJoin(equipmentUnavailable,and(eq(equipmentStatusLogs.referenceTable, 'equipment_unavailable'), eq(equipmentStatusLogs.referenceId, equipmentUnavailable.id)))
      .leftJoin(equipmentDisposals,  and(eq(equipmentStatusLogs.referenceTable, 'equipment_disposals'),   eq(equipmentStatusLogs.referenceId, equipmentDisposals.id)))
      .where(eq(equipmentStatusLogs.equipmentId, equipmentId));  // ✅ แก้ bug: เติม .

    // 2. ประวัติเบิกจ่าย (equipmentNormals ที่มี disbursedTo)
    const disbursementLogs = await db
      .select({
        type:          sql<string>`'disbursement'`,
        status:        sql<null>`null`,
        remark:        sql<null>`null`,
        before:        sql<null>`null`,
        after:         sql<null>`null`,
        disbursedTo:   equipmentNormals.disbursedTo,
        disbursedDate: equipmentNormals.disbursedDate,
        roomId:        equipmentNormals.roomId,
        reason:        equipmentNormals.reason,
        createdAt:     equipmentNormals.createdAt,
        firstName:     users.firstName,
        lastName:      users.lastName,
      })
      .from(equipmentNormals)
      .leftJoin(users, eq(equipmentNormals.createdBy, users.id))
      .where(and(                              // ✅ แก้ bug: เติม .where() ไม่ใช่ where()
        eq(equipmentNormals.equipmentId, equipmentId),
        isNotNull(equipmentNormals.disbursedTo),
      ));

    // 3. ประวัติแนบไฟล์
    let attachmentLogs: any[] = [];
    try {
      attachmentLogs = await db
        .select({
          type:      sql<string>`'attachment_add'`,
          status:    sql<null>`null`,
          remark:    sql<null>`null`,
          before:    sql<null>`null`,
          after:     auditLogs.after,
          createdAt: auditLogs.createdAt,
          firstName: users.firstName,
          lastName:  users.lastName,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.changedBy, users.id))
        .where(and(
          eq(auditLogs.entity,     'equipment_attachment'),
          eq(auditLogs.entityUuid, equipmentUuid),
        ));
    } catch (_) {}

    // 4. ประวัติแก้ไขข้อมูล
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
        eq(auditLogs.entityUuid, equipmentUuid),
      ));

    // รวม + เรียงตาม createdAt ล่าสุดก่อน
    return [...statusLogs, ...disbursementLogs, ...attachmentLogs, ...editLogs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((log: any) => {
        const base = {
          type:      log.type,
          status:    log.status    ?? undefined,
          remark:    log.remark    ?? undefined,
          before:    log.before    ?? undefined,
          after:     log.after     ?? undefined,
          createdAt: log.createdAt,
          createdBy: `${log.firstName ?? ''} ${log.lastName ?? ''}`.trim(),
        };
        if (log.referenceTable === 'equipment_borrows') {
          return { ...base, detail: { borrowerName: log.borrowerName, borrowDate: log.borrowDate, expectedReturnDate: log.expectedReturnDate, borrowingBuildingId: log.borrowingBuildingId ?? null, borrowingRoomId: log.borrowingRoomId ?? null, reason: log.borrowReason } };
        }
        if (log.referenceTable === 'equipment_repairs') {
          return { ...base, detail: { repairReason: log.repairReason, startDate: log.repairStartDate, endDate: log.repairEndDate, repairCompany: log.repairCompany, cost: log.repairCost, attachmentId: log.repairAttachmentId ?? null, fileUrl: log.repairAttachmentId ? `/api/attachments/${log.repairAttachmentId}/file` : null } };
        }
        if (log.referenceTable === 'equipment_unavailable') {
          return { ...base, detail: { reason: log.unavailableReason } };
        }
        if (log.referenceTable === 'equipment_disposals') {
          return { ...base, detail: { disposalDate: log.disposalDate, disposalMethod: log.disposalMethod, approvedBy: log.disposalApprovedBy, disposalCost: log.disposalCost, reason: log.disposalReason, attachmentId: log.disposalAttachmentId ?? null, fileUrl: log.disposalAttachmentId ? `/api/attachments/${log.disposalAttachmentId}/file` : null } };
        }
        if (log.type === 'disbursement') {
          return { ...base, detail: { disbursedTo: log.disbursedTo, disbursedDate: log.disbursedDate, roomId: log.roomId, reason: log.reason } };
        }
        if (log.type === 'attachment_add') {
          return { ...base, detail: log.after };
        }
        return base;
      });
  },
};