import { Context } from 'hono';
import { successResponse, errorResponse } from '../utils/response.js';
import { db } from '../config/database.js';
import { attachments, equipmentAttachments } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { storageService } from '../services/storage.service.js';

export const equipmentAttachmentController = {

  // POST /api/equipment/:id/attachments
  // multipart/form-data: file
  upload: async (c: Context) => {
    try {
      const equipmentId = parseInt(c.req.param('id'));
      const body = await c.req.parseBody();
      const file = body['file'];

      if (!file || typeof file === 'string') {
        return errorResponse(c, 'กรุณาแนบไฟล์', 400);
      }

      // 1. upload ไฟล์
      const result = await storageService.upload(file as File, 'equipment');

      // 2. บันทึก metadata
      const [attachment] = await db.insert(attachments).values({
        fileName: result.fileName,
        filePath: result.filePath,
        fileType: result.fileType,
      }).returning();

      // 3. link กับ equipment
      await db.insert(equipmentAttachments).values({
        equipmentId,
        attachmentId: attachment.id,
      });

      return successResponse(c, attachment, 'อัปโหลดไฟล์สำเร็จ', 201);
    } catch (error: any) {
      return errorResponse(c, error.message, 400);
    }
  },

  // GET /api/equipment/:id/attachments
  getByEquipmentId: async (c: Context) => {
    try {
      const equipmentId = parseInt(c.req.param('id'));

      const data = await db
        .select({
          id: attachments.id,
          fileName: attachments.fileName,
          filePath: attachments.filePath,
          fileType: attachments.fileType,
        })
        .from(equipmentAttachments)
        .innerJoin(attachments, eq(equipmentAttachments.attachmentId, attachments.id))
        .where(eq(equipmentAttachments.equipmentId, equipmentId));

      return successResponse(c, data, 'Attachments retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  // DELETE /api/equipment/:id/attachments/:attachmentId
  delete: async (c: Context) => {
    try {
      const equipmentId   = parseInt(c.req.param('id'));
      const attachmentId  = parseInt(c.req.param('attachmentId'));

      // ดึง attachment
      const attachment = await db
        .select()
        .from(attachments)
        .where(eq(attachments.id, attachmentId));

      if (!attachment[0]) return errorResponse(c, 'Attachment not found', 404);

      // ลบ junction
      await db.delete(equipmentAttachments).where(
        eq(equipmentAttachments.equipmentId, equipmentId)
      );

      // ลบไฟล์ + record
      await storageService.delete(attachment[0].filePath);
      await db.delete(attachments).where(eq(attachments.id, attachmentId));

      return successResponse(c, null, 'Attachment deleted successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
};