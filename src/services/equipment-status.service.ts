import { db } from '../config/database.js';
import {
  equipment,
  equipmentNormals,
  equipmentBorrows,
  equipmentRepairs,
  equipmentUnavailable,
  equipmentDisposals,
  equipmentStatusLogs,
  users,
} from '../db/schema/index.js';
import { eq, isNull, and, inArray } from 'drizzle-orm';
import { BusinessError } from '../middlewares/error.js';

// ============================================================
// CHANGE STATUS
// ============================================================

type NewStatus = 'normal' | 'borrowed' | 'repair' | 'unavailable' | 'disposed';

const STATUS_REFERENCE_TABLE: Record<NewStatus, string> = {
  normal:      'equipment_normals',
  borrowed:    'equipment_borrows',
  repair:      'equipment_repairs',
  unavailable: 'equipment_unavailable',
  disposed:    'equipment_disposals',
};

// สถานะต้นทางที่เปลี่ยนไปยัง newStatus ไม่ได้
const BLOCKED_TRANSITIONS: Record<NewStatus, NewStatus[]> = {
  normal:      ['disposed'],
  borrowed:    ['disposed'],
  repair:      ['disposed'],
  unavailable: ['disposed'],
  disposed:    ['normal', 'borrowed', 'repair', 'unavailable', 'disposed'],
};

export const changeStatusService = {
  change: async (params: {
    equipmentUuids: string[];
    newStatus: NewStatus;
    data: Record<string, any>;
    userUuid: string;
  }) => {
    const { equipmentUuids, newStatus, data, userUuid } = params;
    const today = new Date().toISOString().split('T')[0];

    // 1. resolve userUuid + equipmentUuids → ids ในครั้งเดียว
    const [userResult, equipmentList] = await Promise.all([
      db.select({ id: users.id }).from(users).where(eq(users.uuid, userUuid)),
      db
        .select({ id: equipment.id, uuid: equipment.uuid, status: equipment.status, equipmentCode: equipment.equipmentCode })
        .from(equipment)
        .where(and(inArray(equipment.uuid, equipmentUuids), isNull(equipment.deletedAt))),
    ]);

    if (!userResult[0]) throw new BusinessError('ไม่พบผู้ใช้งาน');
    const userId = userResult[0].id;

    if (equipmentList.length !== equipmentUuids.length) {
      const foundUuids = equipmentList.map((e) => e.uuid);
      const notFound = equipmentUuids.filter((uuid) => !foundUuids.includes(uuid));
      throw new BusinessError(`ไม่พบครุภัณฑ์ uuid: ${notFound.join(', ')}`);
    }

    for (const e of equipmentList) {
      const current = e.status as NewStatus;

      if (BLOCKED_TRANSITIONS[newStatus].includes(current)) {
        throw new BusinessError(
          `ครุภัณฑ์ ${e.equipmentCode} สถานะ "${current}" ไม่สามารถเปลี่ยนเป็น "${newStatus}" ได้`
        );
      }
      if (current === newStatus) {
        throw new BusinessError(`ครุภัณฑ์ ${e.equipmentCode} มีสถานะ "${current}" อยู่แล้ว`);
      }
    }

    // 3. Transaction
    return await db.transaction(async (tx) => {
      const results: any[] = [];

      for (const e of equipmentList) {
        const current = e.status as NewStatus;

        // --- ปิด record เก่า ---
        if (current === 'borrowed') {
          await tx
            .update(equipmentBorrows)
            .set({ actualReturnDate: today })
            .where(and(
              eq(equipmentBorrows.equipmentId, e.id),
              isNull(equipmentBorrows.actualReturnDate)
            ));
        }
        if (current === 'repair') {
          await tx
            .update(equipmentRepairs)
            .set({ actualEndDate: today })
            .where(and(
              eq(equipmentRepairs.equipmentId, e.id),
              isNull(equipmentRepairs.actualEndDate)
            ));
        }

        // --- สร้าง record ใหม่ ---
        let newRecord: any;

        if (newStatus === 'normal') {
          const [record] = await tx
            .insert(equipmentNormals)
            .values({ equipmentId: e.id, reason: data.reason, createdBy: userId })
            .returning();
          newRecord = record;
        }

        if (newStatus === 'borrowed') {
          if (!data.borrowerName) throw new BusinessError('borrowerName is required');
          if (!data.borrowDate) throw new BusinessError('borrowDate is required');
          const [record] = await tx
            .insert(equipmentBorrows)
            .values({
              equipmentId: e.id,
              borrowerName: data.borrowerName,
              borrowerDepartmentId: data.borrowerDepartmentId,
              borrowDate: data.borrowDate,
              expectedReturnDate: data.expectedReturnDate,
              reason: data.reason,
              createdBy: userId,
            })
            .returning();
          newRecord = record;
        }

        if (newStatus === 'repair') {
          if (!data.repairReason) throw new BusinessError('repairReason is required');
          if (!data.startDate) throw new BusinessError('startDate is required');
          const [record] = await tx
            .insert(equipmentRepairs)
            .values({
              equipmentId: e.id,
              repairReason: data.repairReason,
              repairCompany: data.repairCompany,
              cost: data.cost,
              startDate: data.startDate,
              endDate: data.endDate,
              attachmentId: data.attachmentId,
              createdBy: userId,
            })
            .returning();
          newRecord = record;
        }

        if (newStatus === 'unavailable') {
          if (!data.reason) throw new BusinessError('reason is required');
          const [record] = await tx
            .insert(equipmentUnavailable)
            .values({ equipmentId: e.id, reason: data.reason, createdBy: userId })
            .returning();
          newRecord = record;
        }

        if (newStatus === 'disposed') {
          if (!data.disposalDate) throw new BusinessError('disposalDate is required');
          const [record] = await tx
            .insert(equipmentDisposals)
            .values({
              equipmentId: e.id,
              disposalDate: data.disposalDate,
              disposalMethod: data.disposalMethod,
              cost: data.cost,
              approvedBy: data.approvedBy,
              reason: data.reason,
              attachmentId: data.attachmentId,
              createdBy: userId,
            })
            .returning();
          newRecord = record;
        }

        // --- อัปเดต status ครุภัณฑ์ ---
        await tx
          .update(equipment)
          .set({ status: newStatus, updatedAt: new Date() })
          .where(eq(equipment.id, e.id));

        // --- บันทึก log ---
        await tx.insert(equipmentStatusLogs).values({
          equipmentId: e.id,
          status: newStatus,
          referenceTable: STATUS_REFERENCE_TABLE[newStatus],
          referenceId: newRecord?.id,
          remark: data.remark,
          createdBy: userId,
        });

        results.push({ equipmentUuid: e.uuid, newStatus, referenceId: newRecord?.id });
      }

      return results;
    });
  },
};

// ============================================================
// INDIVIDUAL STATUS TABLES — GET / UPDATE / DELETE เท่านั้น
// (ไม่มี create เพราะสร้างผ่าน changeStatus แทน)
// ============================================================

// helper: แปลง equipment uuid → id
const resolveEquipmentId = async (uuid: string): Promise<number> => {
  const result = await db
    .select({ id: equipment.id })
    .from(equipment)
    .where(and(eq(equipment.uuid, uuid), isNull(equipment.deletedAt)));
  if (!result[0]) throw new BusinessError('ไม่พบครุภัณฑ์');
  return result[0].id;
};

export const equipmentNormalsService = {
  getAll: async () =>
    db
      .select({
        equipmentUuid: equipment.uuid,
        reason:               equipmentNormals.reason,
        createdBy:            users.firstName,
        createdAt:            equipmentNormals.createdAt,
      })
      .from(equipmentNormals)
      .leftJoin(equipment, eq(equipmentNormals.equipmentId, equipment.id))
      .leftJoin(users, eq(equipmentNormals.createdBy, users.id)),

  getByEquipmentUuid: async (uuid: string) => {
    const equipmentId = await resolveEquipmentId(uuid);
    return db
      .select({
        equipmentUuid: equipment.uuid,
        reason:               equipmentNormals.reason,
        createdBy:            users.firstName,
        createdAt:            equipmentNormals.createdAt,
      })
      .from(equipmentNormals)
      .leftJoin(equipment, eq(equipmentNormals.equipmentId, equipment.id))
      .leftJoin(users, eq(equipmentNormals.createdBy, users.id))
      .where(eq(equipmentNormals.equipmentId, equipmentId));
  },

  getById: async (id: number) => {
    const result = await db
      .select({
        equipmentUuid: equipment.uuid,
        reason:               equipmentNormals.reason,
        createdBy:            users.firstName,
        createdAt:            equipmentNormals.createdAt,
      })
      .from(equipmentNormals)
      .leftJoin(equipment, eq(equipmentNormals.equipmentId, equipment.id))
      .leftJoin(users, eq(equipmentNormals.createdBy, users.id))
      .where(eq(equipmentNormals.id, id));
    return result[0] || null;
  },

  update: async (id: number, data: Partial<typeof equipmentNormals.$inferInsert>) => {
    const result = await db.update(equipmentNormals).set(data).where(eq(equipmentNormals.id, id)).returning();
    return result[0] || null;
  },

  delete: async (id: number) => {
    const result = await db.delete(equipmentNormals).where(eq(equipmentNormals.id, id)).returning();
    return result[0] || null;
  },
};

export const equipmentBorrowsService = {
  getAll: async () =>
    db
      .select({
        equipmentUuid: equipment.uuid,
        borrowerName:         equipmentBorrows.borrowerName,
        borrowerDepartmentId: equipmentBorrows.borrowerDepartmentId,
        borrowDate:           equipmentBorrows.borrowDate,
        expectedReturnDate:   equipmentBorrows.expectedReturnDate,
        actualReturnDate:     equipmentBorrows.actualReturnDate,
        reason:               equipmentBorrows.reason,
        createdBy:            users.firstName,
        createdAt:            equipmentBorrows.createdAt,
      })
      .from(equipmentBorrows)
      .leftJoin(equipment, eq(equipmentBorrows.equipmentId, equipment.id))
      .leftJoin(users, eq(equipmentBorrows.createdBy, users.id)),

  getByEquipmentUuid: async (uuid: string) => {
    const equipmentId = await resolveEquipmentId(uuid);
    return db
      .select({
        equipmentUuid: equipment.uuid,
        borrowerName:         equipmentBorrows.borrowerName,
        borrowerDepartmentId: equipmentBorrows.borrowerDepartmentId,
        borrowDate:           equipmentBorrows.borrowDate,
        expectedReturnDate:   equipmentBorrows.expectedReturnDate,
        actualReturnDate:     equipmentBorrows.actualReturnDate,
        reason:               equipmentBorrows.reason,
        createdBy:            users.firstName,
        createdAt:            equipmentBorrows.createdAt,
      })
      .from(equipmentBorrows)
      .leftJoin(equipment, eq(equipmentBorrows.equipmentId, equipment.id))
      .leftJoin(users, eq(equipmentBorrows.createdBy, users.id))
      .where(eq(equipmentBorrows.equipmentId, equipmentId));
  },

  getById: async (id: number) => {
    const result = await db
      .select({
        equipmentUuid: equipment.uuid,
        borrowerName:         equipmentBorrows.borrowerName,
        borrowerDepartmentId: equipmentBorrows.borrowerDepartmentId,
        borrowDate:           equipmentBorrows.borrowDate,
        expectedReturnDate:   equipmentBorrows.expectedReturnDate,
        actualReturnDate:     equipmentBorrows.actualReturnDate,
        reason:               equipmentBorrows.reason,
        createdBy:            users.firstName,
        createdAt:            equipmentBorrows.createdAt,
      })
      .from(equipmentBorrows)
      .leftJoin(equipment, eq(equipmentBorrows.equipmentId, equipment.id))
      .leftJoin(users, eq(equipmentBorrows.createdBy, users.id))
      .where(eq(equipmentBorrows.id, id));
    return result[0] || null;
  },

  update: async (id: number, data: Partial<typeof equipmentBorrows.$inferInsert>) => {
    const result = await db.update(equipmentBorrows).set(data).where(eq(equipmentBorrows.id, id)).returning();
    return result[0] || null;
  },

  delete: async (id: number) => {
    const result = await db.delete(equipmentBorrows).where(eq(equipmentBorrows.id, id)).returning();
    return result[0] || null;
  },
};

export const equipmentRepairsService = {
  getAll: async () =>
    db
      .select({
        equipmentUuid: equipment.uuid,
        repairReason:         equipmentRepairs.repairReason,
        repairCompany:        equipmentRepairs.repairCompany,
        cost:                 equipmentRepairs.cost,
        startDate:            equipmentRepairs.startDate,
        endDate:              equipmentRepairs.endDate,
        actualEndDate:        equipmentRepairs.actualEndDate,
        attachmentId:         equipmentRepairs.attachmentId,
        createdBy:            users.firstName,
        createdAt:            equipmentRepairs.createdAt,
      })
      .from(equipmentRepairs)
      .leftJoin(equipment, eq(equipmentRepairs.equipmentId, equipment.id))
      .leftJoin(users, eq(equipmentRepairs.createdBy, users.id)),

  getByEquipmentUuid: async (uuid: string) => {
    const equipmentId = await resolveEquipmentId(uuid);
    return db
      .select({
        equipmentUuid: equipment.uuid,
        repairReason:         equipmentRepairs.repairReason,
        repairCompany:        equipmentRepairs.repairCompany,
        cost:                 equipmentRepairs.cost,
        startDate:            equipmentRepairs.startDate,
        endDate:              equipmentRepairs.endDate,
        actualEndDate:        equipmentRepairs.actualEndDate,
        attachmentId:         equipmentRepairs.attachmentId,
        createdBy:            users.firstName,
        createdAt:            equipmentRepairs.createdAt,
      })
      .from(equipmentRepairs)
      .leftJoin(equipment, eq(equipmentRepairs.equipmentId, equipment.id))
      .leftJoin(users, eq(equipmentRepairs.createdBy, users.id))
      .where(eq(equipmentRepairs.equipmentId, equipmentId));
  },

  getById: async (id: number) => {
    const result = await db
      .select({
        equipmentUuid: equipment.uuid,
        repairReason:         equipmentRepairs.repairReason,
        repairCompany:        equipmentRepairs.repairCompany,
        cost:                 equipmentRepairs.cost,
        startDate:            equipmentRepairs.startDate,
        endDate:              equipmentRepairs.endDate,
        actualEndDate:        equipmentRepairs.actualEndDate,
        attachmentId:         equipmentRepairs.attachmentId,
        createdBy:            users.firstName,
        createdAt:            equipmentRepairs.createdAt,
      })
      .from(equipmentRepairs)
      .leftJoin(equipment, eq(equipmentRepairs.equipmentId, equipment.id))
      .leftJoin(users, eq(equipmentRepairs.createdBy, users.id))
      .where(eq(equipmentRepairs.id, id));
    return result[0] || null;
  },

  update: async (id: number, data: Partial<typeof equipmentRepairs.$inferInsert>) => {
    const result = await db.update(equipmentRepairs).set(data).where(eq(equipmentRepairs.id, id)).returning();
    return result[0] || null;
  },

  delete: async (id: number) => {
    const result = await db.delete(equipmentRepairs).where(eq(equipmentRepairs.id, id)).returning();
    return result[0] || null;
  },
};

export const equipmentUnavailableService = {
  getAll: async () =>
    db
      .select({
        equipmentUuid: equipment.uuid,
        reason:               equipmentUnavailable.reason,
        createdBy:            users.firstName,
        createdAt:            equipmentUnavailable.createdAt,
      })
      .from(equipmentUnavailable)
      .leftJoin(equipment, eq(equipmentUnavailable.equipmentId, equipment.id))
      .leftJoin(users, eq(equipmentUnavailable.createdBy, users.id)),

  getByEquipmentUuid: async (uuid: string) => {
    const equipmentId = await resolveEquipmentId(uuid);
    return db
      .select({
        equipmentUuid: equipment.uuid,
        reason:               equipmentUnavailable.reason,
        createdBy:            users.firstName,
        createdAt:            equipmentUnavailable.createdAt,
      })
      .from(equipmentUnavailable)
      .leftJoin(equipment, eq(equipmentUnavailable.equipmentId, equipment.id))
      .leftJoin(users, eq(equipmentUnavailable.createdBy, users.id))
      .where(eq(equipmentUnavailable.equipmentId, equipmentId));
  },

  getById: async (id: number) => {
    const result = await db
      .select({
        equipmentUuid: equipment.uuid,
        reason:               equipmentUnavailable.reason,
        createdBy:            users.firstName,
        createdAt:            equipmentUnavailable.createdAt,
      })
      .from(equipmentUnavailable)
      .leftJoin(equipment, eq(equipmentUnavailable.equipmentId, equipment.id))
      .leftJoin(users, eq(equipmentUnavailable.createdBy, users.id))
      .where(eq(equipmentUnavailable.id, id));
    return result[0] || null;
  },

  update: async (id: number, data: Partial<typeof equipmentUnavailable.$inferInsert>) => {
    const result = await db.update(equipmentUnavailable).set(data).where(eq(equipmentUnavailable.id, id)).returning();
    return result[0] || null;
  },

  delete: async (id: number) => {
    const result = await db.delete(equipmentUnavailable).where(eq(equipmentUnavailable.id, id)).returning();
    return result[0] || null;
  },
};

export const equipmentDisposalsService = {
  getAll: async () =>
    db
      .select({
        equipmentUuid: equipment.uuid,
        disposalDate:         equipmentDisposals.disposalDate,
        disposalMethod:       equipmentDisposals.disposalMethod,
        cost:                 equipmentDisposals.cost,
        approvedBy:           equipmentDisposals.approvedBy,
        reason:               equipmentDisposals.reason,
        attachmentId:         equipmentDisposals.attachmentId,
        createdBy:            users.firstName,
        createdAt:            equipmentDisposals.createdAt,
      })
      .from(equipmentDisposals)
      .leftJoin(equipment, eq(equipmentDisposals.equipmentId, equipment.id))
      .leftJoin(users, eq(equipmentDisposals.createdBy, users.id)),

  getByEquipmentUuid: async (uuid: string) => {
    const equipmentId = await resolveEquipmentId(uuid);
    return db
      .select({
        equipmentUuid: equipment.uuid,
        disposalDate:         equipmentDisposals.disposalDate,
        disposalMethod:       equipmentDisposals.disposalMethod,
        cost:                 equipmentDisposals.cost,
        approvedBy:           equipmentDisposals.approvedBy,
        reason:               equipmentDisposals.reason,
        attachmentId:         equipmentDisposals.attachmentId,
        createdBy:            users.firstName,
        createdAt:            equipmentDisposals.createdAt,
      })
      .from(equipmentDisposals)
      .leftJoin(equipment, eq(equipmentDisposals.equipmentId, equipment.id))
      .leftJoin(users, eq(equipmentDisposals.createdBy, users.id))
      .where(eq(equipmentDisposals.equipmentId, equipmentId));
  },

  getById: async (id: number) => {
    const result = await db
      .select({
        equipmentUuid: equipment.uuid,
        disposalDate:         equipmentDisposals.disposalDate,
        disposalMethod:       equipmentDisposals.disposalMethod,
        cost:                 equipmentDisposals.cost,
        approvedBy:           equipmentDisposals.approvedBy,
        reason:               equipmentDisposals.reason,
        attachmentId:         equipmentDisposals.attachmentId,
        createdBy:            users.firstName,
        createdAt:            equipmentDisposals.createdAt,
      })
      .from(equipmentDisposals)
      .leftJoin(equipment, eq(equipmentDisposals.equipmentId, equipment.id))
      .leftJoin(users, eq(equipmentDisposals.createdBy, users.id))
      .where(eq(equipmentDisposals.id, id));
    return result[0] || null;
  },

  update: async (id: number, data: Partial<typeof equipmentDisposals.$inferInsert>) => {
    const result = await db.update(equipmentDisposals).set(data).where(eq(equipmentDisposals.id, id)).returning();
    return result[0] || null;
  },

  delete: async (id: number) => {
    const result = await db.delete(equipmentDisposals).where(eq(equipmentDisposals.id, id)).returning();
    return result[0] || null;
  },
};

export const equipmentStatusLogsService = {
  getAll: async () =>
    db
      .select({
        equipmentUuid:  equipment.uuid,
        status:         equipmentStatusLogs.status,
        referenceTable: equipmentStatusLogs.referenceTable,
        referenceId:    equipmentStatusLogs.referenceId,
        remark:         equipmentStatusLogs.remark,
        createdBy:      users.firstName,
        createdAt:      equipmentStatusLogs.createdAt,
      })
      .from(equipmentStatusLogs)
      .leftJoin(equipment, eq(equipmentStatusLogs.equipmentId, equipment.id))
      .leftJoin(users, eq(equipmentStatusLogs.createdBy, users.id)),

  getByEquipmentUuid: async (uuid: string) => {
    const equipmentId = await resolveEquipmentId(uuid);
    return db
      .select({
        equipmentUuid: equipment.uuid,
        status:        equipmentStatusLogs.status,
        referenceTable:equipmentStatusLogs.referenceTable,
        referenceId:   equipmentStatusLogs.referenceId,
        remark:        equipmentStatusLogs.remark,
        createdBy:     users.firstName,
        createdAt:     equipmentStatusLogs.createdAt,
      })
      .from(equipmentStatusLogs)
      .leftJoin(equipment, eq(equipmentStatusLogs.equipmentId, equipment.id))
      .leftJoin(users, eq(equipmentStatusLogs.createdBy, users.id))
      .where(eq(equipmentStatusLogs.equipmentId, equipmentId));
  },
};