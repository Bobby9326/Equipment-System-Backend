import { db } from '../config/database.js';
import { attachments, equipmentAttachments } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { storageService } from './storage.service.js';

export const attachmentsService = {
  getAll: async () => {
    return await db.select().from(attachments);
  },

  getById: async (id: number) => {
    const result = await db.select().from(attachments).where(eq(attachments.id, id));
    return result[0] || null;
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
  uploadForEquipment: async (file: File, equipmentId: number) => {
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

    return attachment;
  },

  // ดึงไฟล์ทั้งหมดของ equipment
  getByEquipmentId: async (equipmentId: number) => {
    return await db
      .select({
        id: attachments.id,
        fileName: attachments.fileName,
        filePath: attachments.filePath,
        fileType: attachments.fileType,
        uploadedAt: attachments.uploadedAt,
      })
      .from(equipmentAttachments)
      .innerJoin(attachments, eq(equipmentAttachments.attachmentId, attachments.id))
      .where(eq(equipmentAttachments.equipmentId, equipmentId));
  },

  create: async (data: typeof attachments.$inferInsert) => {
    const result = await db.insert(attachments).values(data).returning();
    return result[0];
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