import { db } from '../config/database.js';
import { attachments, equipmentAttachments, equipment } from '../db/schema/index.js';
import { eq, and, inArray, isNull } from 'drizzle-orm';
import { storageService } from './storage.service.js';
import { auditService } from './audit.service.js';

const toFileUrl = (id: number) => `/api/attachments/${id}/file`;

export const attachmentsService = {
  getAll: async () => {
    return await db.select().from(attachments);
  },

  getById: async (id: number) => {
    const result = await db
      .select({
        id:         attachments.id,
        fileName:   attachments.fileName,
        filePath:   attachments.filePath,
        fileType:   attachments.fileType,
        uploadedAt: attachments.uploadedAt,
      })
      .from(attachments)
      .where(eq(attachments.id, id));
    if (!result[0]) return null;
    return { ...result[0], fileUrl: toFileUrl(result[0].id) };
  },

  // upload ไฟล์ทั่วไป (repairs, disposals, mhesi — เอา id ไปใส่ใน FK)
  upload: async (file: File, folder: string = 'general') => {
    const result = await storageService.upload(file, folder);
    const [attachment] = await db.insert(attachments).values({
      fileName: result.fileName,
      filePath: result.filePath,
      fileType: result.fileType,
    }).returning();
    return attachment;
  },

  // upload + link กับ equipment ผ่าน junction table
  uploadForEquipment: async (file: File, equipmentId: number, equipmentUuid?: string, userUuid?: string) => {
    const result = await storageService.upload(file, 'equipment');
    const [attachment] = await db.insert(attachments).values({
      fileName: result.fileName,
      filePath: result.filePath,
      fileType: result.fileType,
    }).returning();

    await db.insert(equipmentAttachments).values({
      equipmentId,
      attachmentId: attachment.id,
    });

    // log การแนบไฟล์
    if (equipmentUuid && userUuid) {
      try {
        await auditService.log({
          entity:     'equipment',
          entityUuid: equipmentUuid,
          action:     'update',
          before:     {},
          after:      { attachmentId: attachment.id, fileName: attachment.fileName, fileUrl: toFileUrl(attachment.id) },
          userUuid,
        });
      } catch (_) {}
    }

    return { ...attachment, fileUrl: toFileUrl(attachment.id) };
  },

  // ดึงไฟล์ทั้งหมดของ equipment — รับ uuid หรือ id ก็ได้
  getByEquipmentId: async (equipmentId: number) => {
    return await db
      .select({
        id:         attachments.id,
        fileName:   attachments.fileName,
        filePath:   attachments.filePath,
        fileType:   attachments.fileType,
        uploadedAt: attachments.uploadedAt,
      })
      .from(equipmentAttachments)
      .innerJoin(attachments, eq(equipmentAttachments.attachmentId, attachments.id))
      .where(eq(equipmentAttachments.equipmentId, equipmentId))
      .then(rows => rows.map(r => ({ ...r, fileUrl: toFileUrl(r.id) })));
  },

  getByEquipmentUuid: async (uuid: string) => {
    const eq_ = await db
      .select({ id: equipment.id })
      .from(equipment)
      .where(and(eq(equipment.uuid, uuid), isNull(equipment.deletedAt)));
    if (!eq_[0]) return null;
    return await db
      .select({
        id:         attachments.id,
        fileName:   attachments.fileName,
        filePath:   attachments.filePath,
        fileType:   attachments.fileType,
        uploadedAt: attachments.uploadedAt,
      })
      .from(equipmentAttachments)
      .innerJoin(attachments, eq(equipmentAttachments.attachmentId, attachments.id))
      .where(eq(equipmentAttachments.equipmentId, eq_[0].id))
      .then(rows => rows.map(r => ({ ...r, fileUrl: toFileUrl(r.id) })));
  },

  // อัปโหลดหลายไฟล์ครั้งเดียว ผูกกับหลาย uuid — ไฟล์จริงบันทึกแค่ครั้งเดียว
  bulkUploadForEquipment: async (files: File[], uuids: string[], userUuid?: string) => {
    const equipmentList = await db
      .select({ id: equipment.id, uuid: equipment.uuid })
      .from(equipment)
      .where(and(inArray(equipment.uuid, uuids), isNull(equipment.deletedAt)));

    if (equipmentList.length !== uuids.length) {
      const found = equipmentList.map(e => e.uuid);
      const missing = uuids.filter(u => !found.includes(u));
      throw new Error(`ไม่พบครุภัณฑ์: ${missing.join(', ')}`);
    }

    // upload ไฟล์จริง (ไฟล์ละ 1 ครั้ง)
    const uploadedIds = await Promise.all(
      files.map(async file => {
        const result = await storageService.upload(file, 'equipment');
        const [att] = await db.insert(attachments).values({
          fileName: result.fileName,
          filePath: result.filePath,
          fileType: result.fileType,
        }).returning({ id: attachments.id });
        return att.id;
      })
    );

    // link junction rows เท่านั้น (ไม่ copy ไฟล์)
    const junctionRows = equipmentList.flatMap(e =>
      uploadedIds.map(attachmentId => ({ equipmentId: e.id, attachmentId }))
    );
    await db.insert(equipmentAttachments).values(junctionRows).onConflictDoNothing();

    // log การแนบไฟล์ให้ทุก uuid
    if (userUuid) {
      try {
        await Promise.all(uuids.map(uuid =>
          auditService.log({
            entity:     'equipment',
            entityUuid: uuid,
            action:     'update',
            before:     {},
            after:      { uploadedFiles: uploadedIds.length, fileUrls: uploadedIds.map(toFileUrl) },
            userUuid,
          })
        ));
      } catch (_) {}
    }

    return {
      uploadedFiles:   uploadedIds.length,
      linkedEquipment: equipmentList.length,
      totalLinks:      junctionRows.length,
    };
  },

  // helper: แปลง uuid → equipmentId
  getEquipmentIdByUuid: async (uuid: string): Promise<number | null> => {
    const result = await db
      .select({ id: equipment.id })
      .from(equipment)
      .where(and(eq(equipment.uuid, uuid), isNull(equipment.deletedAt)));
    return result[0]?.id ?? null;
  },

  // ลบ junction row — ลบไฟล์จริงเฉพาะถ้าไม่มี equipment อื่นใช้อยู่
  deleteForEquipment: async (equipmentId: number, attachmentId: number) => {
    await db.delete(equipmentAttachments).where(
      and(
        eq(equipmentAttachments.equipmentId, equipmentId),
        eq(equipmentAttachments.attachmentId, attachmentId)
      )
    );
    const stillUsed = await db
      .select({ id: equipmentAttachments.equipmentId })
      .from(equipmentAttachments)
      .where(eq(equipmentAttachments.attachmentId, attachmentId));

    if (stillUsed.length === 0) {
      const att = await db
        .select({ filePath: attachments.filePath })
        .from(attachments)
        .where(eq(attachments.id, attachmentId));
      if (att[0]) {
        await storageService.delete(att[0].filePath);
        await db.delete(attachments).where(eq(attachments.id, attachmentId));
      }
    }
  },

  create: async (data: typeof attachments.$inferInsert) => {
    const result = await db.insert(attachments).values(data).returning();
    return { ...result[0], fileUrl: toFileUrl(result[0].id) };
  },

  update: async (id: number, data: Partial<typeof attachments.$inferInsert>) => {
    const result = await db.update(attachments)
      .set(data)
      .where(eq(attachments.id, id))
      .returning();
    return result[0] || null;
  },

  // ลบ attachment + ไฟล์จาก storage
  delete: async (id: number) => {
    const existing = await db.select().from(attachments).where(eq(attachments.id, id));
    if (!existing[0]) return null;

    await storageService.delete(existing[0].filePath);
    const result = await db.delete(attachments).where(eq(attachments.id, id)).returning();
    return result[0] || null;
  },
};