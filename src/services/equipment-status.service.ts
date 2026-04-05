import { db } from '../config/database.js';
import {
  equipment,
  equipmentBorrows,
  equipmentRepairs,
  equipmentDisposals,
  auditLogs,
  users,
  equipmentAttachments,
} from '../db/schema/index.js';
import { eq, isNull, and, inArray } from 'drizzle-orm';
import { BusinessError } from '../middlewares/error.js';

// ============================================================
// CHANGE STATUS
// ============================================================

type NewStatus = 'pending' | 'normal' | 'borrowed' | 'repair' | 'unavailable' | 'disposed';

const BLOCKED_TRANSITIONS: Record<NewStatus, NewStatus[]> = {
  pending:     ['pending', 'normal', 'borrowed', 'repair', 'unavailable', 'disposed'],
  normal:      ['disposed'],
  borrowed:    ['pending','disposed'],
  repair:      ['pending','disposed'],
  unavailable: ['pending','disposed'],
  disposed:    ['pending'],
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

    const [userResult, equipmentList] = await Promise.all([
      db.select({ id: users.id }).from(users).where(eq(users.uuid, userUuid)),
      db.select({
          id:              equipment.id,
          uuid:            equipment.uuid,
          status:          equipment.status,
          equipmentCode:   equipment.equipmentCode,
          equipmentName:   equipment.equipmentName,
          equipmentNumber: equipment.equipmentNumber,
          equipmentTypeId: equipment.equipmentTypeId,
          departmentId:    equipment.departmentId,
          fiscalYear:      equipment.fiscalYear,
          price:           equipment.price,
          acquisitionDate: equipment.acquisitionDate,
          projectId:       equipment.projectId,
        })
        .from(equipment)
        .where(and(inArray(equipment.uuid, equipmentUuids), isNull(equipment.deletedAt))),
    ]);

    if (!userResult[0]) throw new BusinessError('ไม่พบผู้ใช้งาน');
    const userId = userResult[0].id;

    if (equipmentList.length !== equipmentUuids.length) {
      const foundUuids = equipmentList.map(e => e.uuid);
      const notFound   = equipmentUuids.filter(uuid => !foundUuids.includes(uuid));
      throw new BusinessError(`ไม่พบครุภัณฑ์ uuid: ${notFound.join(', ')}`);
    }

    for (const e of equipmentList) {
      const current = e.status as NewStatus;
      if (BLOCKED_TRANSITIONS[newStatus].includes(current)) {
        throw new BusinessError(`ครุภัณฑ์ ${e.equipmentCode} สถานะ "${current}" ไม่สามารถเปลี่ยนเป็น "${newStatus}" ได้`);
      }
      if (current === newStatus) {
        throw new BusinessError(`ครุภัณฑ์ ${e.equipmentCode} มีสถานะ "${current}" อยู่แล้ว`);
      }
    }

    return await db.transaction(async (tx) => {
      const results: any[] = [];

      for (const e of equipmentList) {
        const current = e.status as NewStatus;

        // ── ปิด record เก่า ──────────────────────────────────
        if (current === 'borrowed') {
          await tx.update(equipmentBorrows)
            .set({ actualReturnDate: today })
            .where(and(eq(equipmentBorrows.equipmentId, e.id), isNull(equipmentBorrows.actualReturnDate)));
        }
        if (current === 'repair') {
          await tx.update(equipmentRepairs)
            .set({ actualEndDate: today })
            .where(and(eq(equipmentRepairs.equipmentId, e.id), isNull(equipmentRepairs.actualEndDate)));
        }

        // ── build auditAfter + สร้าง record ใหม่ ─────────────
        let auditAfter: Record<string, any> = { status: newStatus };

        if (newStatus === 'normal') {
          if (current === 'pending') {
            if (!data.disbursedTo)   throw new BusinessError('disbursedTo is required');
            if (!data.disbursedDate) throw new BusinessError('disbursedDate is required');
            auditAfter = { status: 'normal', disbursedTo: data.disbursedTo, disbursedDate: data.disbursedDate, roomId: data.roomId ?? null, reason: data.reason ?? null };
          } else {
            auditAfter = { status: 'normal', reason: data.reason ?? null };
          }
        }

        if (newStatus === 'borrowed') {
          if (!data.borrowerName) throw new BusinessError('borrowerName is required');
          if (!data.borrowDate)   throw new BusinessError('borrowDate is required');

          const [record] = await tx.insert(equipmentBorrows).values({
            equipmentId:          e.id,
            borrowerName:         data.borrowerName,
            borrowerDepartmentId: data.borrowerDepartmentId ?? null,
            borrowDate:           data.borrowDate,
            expectedReturnDate:   data.expectedReturnDate   ?? null,
            borrowingBuildingId:  data.borrowingBuildingId  ?? null,
            borrowingRoomId:      data.borrowingRoomId      ?? null,
            reason:               data.reason               ?? null,
            createdBy:            userId,
          }).returning();

          auditAfter = { status: 'borrowed', borrowerName: data.borrowerName, borrowDate: data.borrowDate, expectedReturnDate: data.expectedReturnDate ?? null, borrowingBuildingId: data.borrowingBuildingId ?? null, borrowingRoomId: data.borrowingRoomId ?? null, reason: data.reason ?? null, borrowRecordId: record.id };
        }

        if (newStatus === 'repair') {
          if (!data.repairReason) throw new BusinessError('repairReason is required');
          if (!data.startDate)    throw new BusinessError('startDate is required');

          const [record] = await tx.insert(equipmentRepairs).values({
            equipmentId:   e.id,
            repairReason:  data.repairReason,
            repairCompany: data.repairCompany ?? null,
            cost:          data.cost          ?? null,
            startDate:     data.startDate,
            endDate:       data.endDate        ?? null,
            attachmentId:  data.attachmentId   ?? null,
            createdBy:     userId,
          }).returning();

          auditAfter = { status: 'repair', repairReason: data.repairReason, repairCompany: data.repairCompany ?? null, cost: data.cost ?? null, startDate: data.startDate, endDate: data.endDate ?? null, attachmentId: data.attachmentId ?? null, repairRecordId: record.id };
        }

        if (newStatus === 'unavailable') {
          if (!data.reason) throw new BusinessError('reason is required');
          auditAfter = { status: 'unavailable', reason: data.reason };
        }

        // ── disposed: copy ไป archive แล้ว hard delete ────────
        if (newStatus === 'disposed') {
          if (!data.disposalDate) throw new BusinessError('disposalDate is required');

          await tx.insert(equipmentDisposals).values({
            uuid:            e.uuid,
            equipmentCode:   e.equipmentCode,
            equipmentName:   e.equipmentName,
            equipmentNumber: e.equipmentNumber,
            equipmentTypeId: e.equipmentTypeId,
            departmentId:    e.departmentId,
            fiscalYear:      e.fiscalYear,
            price:           e.price,
            acquisitionDate: e.acquisitionDate,
            projectId:       e.projectId,
            disposalDate:    data.disposalDate,
            disposalMethod:  data.disposalMethod ?? null,
            cost:            data.cost           ?? null,
            approvedBy:      data.approvedBy     ?? null,
            reason:          data.reason         ?? null,
            attachmentId:    data.attachmentId   ?? null,
            disposedBy:      userId,
          });

          await tx.insert(auditLogs).values({
            entity:     'equipment',
            entityUuid: e.uuid,
            action:     'status_change',
            before:     { status: current },
            after:      { status: 'disposed', disposalDate: data.disposalDate, disposalMethod: data.disposalMethod ?? null, reason: data.reason ?? null },
            changedBy:  userId,
          });

          // ✅ ลบ related records ก่อน (FK constraint)
          await tx.delete(equipmentAttachments).where(eq(equipmentAttachments.equipmentId, e.id));
          await tx.delete(equipmentBorrows).where(eq(equipmentBorrows.equipmentId, e.id));
          await tx.delete(equipmentRepairs).where(eq(equipmentRepairs.equipmentId, e.id));

          await tx.delete(equipment).where(eq(equipment.id, e.id));
          results.push({ equipmentUuid: e.uuid, newStatus: 'disposed' });
          continue;
        }

        // ── อัปเดต equipment (ยกเว้น disposed) ──────────────
        const equipmentUpdate: Record<string, any> = { status: newStatus, updatedAt: new Date() };

        if (newStatus === 'normal' && current === 'pending') {
          if (data.departmentId != null) equipmentUpdate.departmentId = data.departmentId;
          if (data.buildingId   != null) equipmentUpdate.buildingId   = data.buildingId;
          if (data.roomId       != null) equipmentUpdate.roomId       = data.roomId;
          if (data.floor        != null) equipmentUpdate.floor        = data.floor;
        }
        if (newStatus === 'borrowed') {
          if (data.borrowingBuildingId != null) equipmentUpdate.buildingId = data.borrowingBuildingId;
          if (data.borrowingRoomId     != null) equipmentUpdate.roomId     = data.borrowingRoomId;
          if (data.floor               != null) equipmentUpdate.floor      = data.floor;
        }
      
        await tx.update(equipment).set(equipmentUpdate).where(eq(equipment.id, e.id));

        if (data.remark != null) {auditAfter.remark = data.remark;}
        // ── audit log ─────────────────────────────────────────
        await tx.insert(auditLogs).values({
          entity:     'equipment',
          entityUuid: e.uuid,
          action:     'status_change',
          before:     { status: current },
          after:      auditAfter,
          changedBy:  userId,
        });

        results.push({ equipmentUuid: e.uuid, newStatus });
      }

      return results;
    });
  },
};

// ============================================================
// BORROWS — ยังใช้ table เพราะต้องการ actualReturnDate IS NULL
// ============================================================

const resolveEquipmentId = async (uuid: string): Promise<number> => {
  const result = await db.select({ id: equipment.id }).from(equipment)
    .where(and(eq(equipment.uuid, uuid), isNull(equipment.deletedAt)));
  if (!result[0]) throw new BusinessError('ไม่พบครุภัณฑ์');
  return result[0].id;
};

export const equipmentBorrowsService = {
  getAll: async () =>
    db.select({ equipmentUuid: equipment.uuid, equipmentNumber: equipment.equipmentNumber, borrowerName: equipmentBorrows.borrowerName, borrowerDepartmentId: equipmentBorrows.borrowerDepartmentId, borrowDate: equipmentBorrows.borrowDate, expectedReturnDate: equipmentBorrows.expectedReturnDate, actualReturnDate: equipmentBorrows.actualReturnDate, borrowingBuildingId: equipmentBorrows.borrowingBuildingId, borrowingRoomId: equipmentBorrows.borrowingRoomId, reason: equipmentBorrows.reason, createdBy: users.firstName, createdAt: equipmentBorrows.createdAt })
    .from(equipmentBorrows).leftJoin(equipment, eq(equipmentBorrows.equipmentId, equipment.id)).leftJoin(users, eq(equipmentBorrows.createdBy, users.id)),

  getByEquipmentUuid: async (uuid: string) => {
    const equipmentId = await resolveEquipmentId(uuid);
    return db.select({ equipmentUuid: equipment.uuid, equipmentNumber: equipment.equipmentNumber, borrowerName: equipmentBorrows.borrowerName, borrowerDepartmentId: equipmentBorrows.borrowerDepartmentId, borrowDate: equipmentBorrows.borrowDate, expectedReturnDate: equipmentBorrows.expectedReturnDate, actualReturnDate: equipmentBorrows.actualReturnDate, borrowingBuildingId: equipmentBorrows.borrowingBuildingId, borrowingRoomId: equipmentBorrows.borrowingRoomId, reason: equipmentBorrows.reason, createdBy: users.firstName, createdAt: equipmentBorrows.createdAt })
    .from(equipmentBorrows).leftJoin(equipment, eq(equipmentBorrows.equipmentId, equipment.id)).leftJoin(users, eq(equipmentBorrows.createdBy, users.id))
    .where(eq(equipmentBorrows.equipmentId, equipmentId));
  },

  getById: async (id: number) => {
    const result = await db.select({ equipmentUuid: equipment.uuid, equipmentNumber: equipment.equipmentNumber, borrowerName: equipmentBorrows.borrowerName, borrowerDepartmentId: equipmentBorrows.borrowerDepartmentId, borrowDate: equipmentBorrows.borrowDate, expectedReturnDate: equipmentBorrows.expectedReturnDate, actualReturnDate: equipmentBorrows.actualReturnDate, borrowingBuildingId: equipmentBorrows.borrowingBuildingId, borrowingRoomId: equipmentBorrows.borrowingRoomId, reason: equipmentBorrows.reason, createdBy: users.firstName, createdAt: equipmentBorrows.createdAt })
    .from(equipmentBorrows).leftJoin(equipment, eq(equipmentBorrows.equipmentId, equipment.id)).leftJoin(users, eq(equipmentBorrows.createdBy, users.id))
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

// ============================================================
// REPAIRS — ยังใช้ table เพราะต้องการ actualEndDate IS NULL
// ============================================================

export const equipmentRepairsService = {
  getAll: async () =>
    db.select({ equipmentUuid: equipment.uuid, equipmentNumber: equipment.equipmentNumber, repairReason: equipmentRepairs.repairReason, repairCompany: equipmentRepairs.repairCompany, cost: equipmentRepairs.cost, startDate: equipmentRepairs.startDate, endDate: equipmentRepairs.endDate, actualEndDate: equipmentRepairs.actualEndDate, attachmentId: equipmentRepairs.attachmentId, createdBy: users.firstName, createdAt: equipmentRepairs.createdAt })
    .from(equipmentRepairs).leftJoin(equipment, eq(equipmentRepairs.equipmentId, equipment.id)).leftJoin(users, eq(equipmentRepairs.createdBy, users.id)),

  getByEquipmentUuid: async (uuid: string) => {
    const equipmentId = await resolveEquipmentId(uuid);
    return db.select({ equipmentUuid: equipment.uuid, equipmentNumber: equipment.equipmentNumber, repairReason: equipmentRepairs.repairReason, repairCompany: equipmentRepairs.repairCompany, cost: equipmentRepairs.cost, startDate: equipmentRepairs.startDate, endDate: equipmentRepairs.endDate, actualEndDate: equipmentRepairs.actualEndDate, attachmentId: equipmentRepairs.attachmentId, createdBy: users.firstName, createdAt: equipmentRepairs.createdAt })
    .from(equipmentRepairs).leftJoin(equipment, eq(equipmentRepairs.equipmentId, equipment.id)).leftJoin(users, eq(equipmentRepairs.createdBy, users.id))
    .where(eq(equipmentRepairs.equipmentId, equipmentId));
  },

  getById: async (id: number) => {
    const result = await db.select({ equipmentUuid: equipment.uuid, equipmentNumber: equipment.equipmentNumber, repairReason: equipmentRepairs.repairReason, repairCompany: equipmentRepairs.repairCompany, cost: equipmentRepairs.cost, startDate: equipmentRepairs.startDate, endDate: equipmentRepairs.endDate, actualEndDate: equipmentRepairs.actualEndDate, attachmentId: equipmentRepairs.attachmentId, createdBy: users.firstName, createdAt: equipmentRepairs.createdAt })
    .from(equipmentRepairs).leftJoin(equipment, eq(equipmentRepairs.equipmentId, equipment.id)).leftJoin(users, eq(equipmentRepairs.createdBy, users.id))
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

// ============================================================
// DISPOSALS — READ ONLY archive (ไม่มี update/delete)
// ============================================================

export const equipmentDisposalsService = {
  getAll: async () => db.select().from(equipmentDisposals),

  getByUuid: async (uuid: string) => {
    const result = await db.select().from(equipmentDisposals).where(eq(equipmentDisposals.uuid, uuid));
    return result[0] || null;
  },
};