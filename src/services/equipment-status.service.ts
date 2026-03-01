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
    equipmentIds: number[];
    newStatus: NewStatus;
    data: Record<string, any>;
    userUuid: string;
  }) => {
    const { equipmentIds, newStatus, data, userUuid } = params;
    const today = new Date().toISOString().split('T')[0];

    // 1. หา userId จาก userUuid
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.uuid, userUuid));
    if (!userResult[0]) throw new BusinessError('ไม่พบผู้ใช้งาน');
    const userId = userResult[0].id;

    // 2. ตรวจสอบครุภัณฑ์ทุกตัวก่อน transaction
    const equipmentList = await db
      .select({ id: equipment.id, status: equipment.status, equipmentCode: equipment.equipmentCode })
      .from(equipment)
      .where(inArray(equipment.id, equipmentIds));

    if (equipmentList.length !== equipmentIds.length) {
      const foundIds = equipmentList.map((e) => e.id);
      const notFound = equipmentIds.filter((id) => !foundIds.includes(id));
      throw new BusinessError(`ไม่พบครุภัณฑ์ id: ${notFound.join(', ')}`);
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

        results.push({ equipmentId: e.id, newStatus, referenceId: newRecord?.id });
      }

      return results;
    });
  },
};

// ============================================================
// INDIVIDUAL STATUS TABLES — GET / UPDATE / DELETE เท่านั้น
// (ไม่มี create เพราะสร้างผ่าน changeStatus แทน)
// ============================================================

export const equipmentNormalsService = {
  getAll: async () => await db.select().from(equipmentNormals),

  getByEquipmentId: async (equipmentId: number) =>
    await db.select().from(equipmentNormals).where(eq(equipmentNormals.equipmentId, equipmentId)),

  getById: async (id: number) => {
    const result = await db.select().from(equipmentNormals).where(eq(equipmentNormals.id, id));
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
  getAll: async () => await db.select().from(equipmentBorrows),

  getByEquipmentId: async (equipmentId: number) =>
    await db.select().from(equipmentBorrows).where(eq(equipmentBorrows.equipmentId, equipmentId)),

  getById: async (id: number) => {
    const result = await db.select().from(equipmentBorrows).where(eq(equipmentBorrows.id, id));
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
  getAll: async () => await db.select().from(equipmentRepairs),

  getByEquipmentId: async (equipmentId: number) =>
    await db.select().from(equipmentRepairs).where(eq(equipmentRepairs.equipmentId, equipmentId)),

  getById: async (id: number) => {
    const result = await db.select().from(equipmentRepairs).where(eq(equipmentRepairs.id, id));
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
  getAll: async () => await db.select().from(equipmentUnavailable),

  getByEquipmentId: async (equipmentId: number) =>
    await db.select().from(equipmentUnavailable).where(eq(equipmentUnavailable.equipmentId, equipmentId)),

  getById: async (id: number) => {
    const result = await db.select().from(equipmentUnavailable).where(eq(equipmentUnavailable.id, id));
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
  getAll: async () => await db.select().from(equipmentDisposals),

  getByEquipmentId: async (equipmentId: number) =>
    await db.select().from(equipmentDisposals).where(eq(equipmentDisposals.equipmentId, equipmentId)),

  getById: async (id: number) => {
    const result = await db.select().from(equipmentDisposals).where(eq(equipmentDisposals.id, id));
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
  getAll: async () => await db.select().from(equipmentStatusLogs),

  getByEquipmentId: async (equipmentId: number) =>
    await db.select().from(equipmentStatusLogs).where(eq(equipmentStatusLogs.equipmentId, equipmentId)),
};