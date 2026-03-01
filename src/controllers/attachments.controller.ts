import { Context } from 'hono';
import { successResponse, errorResponse } from '../utils/response.js';
import { attachmentsService } from '../services/attachments.service.js';
import { equipmentService } from '../services/equipment.service.js';

export const attachmentsController = {
  getAll: async (c: Context) => {
    try {
      const data = await attachmentsService.getAll();
      return successResponse(c, data, 'Attachments retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getById: async (c: Context) => {
    try {
      const id = parseInt(c.req.param('id'));
      const data = await attachmentsService.getById(id);
      if (!data) return errorResponse(c, 'Attachment not found', 404);
      return successResponse(c, data, 'Attachment retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  // GET /api/equipment/:id/attachments (เรียกผ่าน equipment.routes.ts)
  getByEquipmentId: async (c: Context) => {
    try {
      const equipmentId = parseInt(c.req.param('id'));
      const data = await attachmentsService.getByEquipmentId(equipmentId);
      return successResponse(c, data, 'Attachments retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  // POST /api/attachments/upload — สำหรับ repairs, disposals, mhesi
  // multipart/form-data: file, folder(opt)
  upload: async (c: Context) => {
    try {
      const body   = await c.req.parseBody();
      const file   = body['file'];
      const folder = typeof body['folder'] === 'string' ? body['folder'] : 'general';

      if (!file || typeof file === 'string') {
        return errorResponse(c, 'กรุณาแนบไฟล์', 400);
      }

      const data = await attachmentsService.upload(file as File, folder);
      return successResponse(c, data, 'อัปโหลดไฟล์สำเร็จ', 201);
    } catch (error: any) {
      return errorResponse(c, error.message, 400);
    }
  },

  // POST /api/equipment/:id/attachments (เรียกผ่าน equipment.routes.ts)
  // multipart/form-data: files[] (หลายไฟล์) หรือ file (ไฟล์เดียว)
  uploadForEquipment: async (c: Context) => {
    try {
      const uuid = c.req.param('uuid')
      const equipment = await equipmentService.getByUuid(uuid)

      if (!equipment) {
        return c.json({ success: false, message: 'Equipment not found' }, 404)
      }
      const body = await c.req.parseBody({ all: true }); // all: true รองรับหลายไฟล์

      // รองรับทั้ง files[] และ file
      const raw = body['files'] ?? body['file'];
      const files: File[] = (Array.isArray(raw) ? raw : [raw])
        .filter((f): f is File => f instanceof File);

      if (files.length === 0) {
        return errorResponse(c, 'กรุณาแนบไฟล์', 400);
      }

      // upload ทุกไฟล์พร้อมกัน
      const results = await Promise.all(
        files.map(file => attachmentsService.uploadForEquipment(file, equipment.id))
      );

      const message = results.length > 1
        ? `อัปโหลด ${results.length} ไฟล์สำเร็จ`
        : 'อัปโหลดไฟล์สำเร็จ';

      return successResponse(c, results, message, 201);
    } catch (error: any) {
      return errorResponse(c, error.message, 400);
    }
  },

  create: async (c: Context) => {
    try {
      const body = await c.req.json();
      const data = await attachmentsService.create(body);
      return successResponse(c, data, 'Attachment created successfully', 201);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  update: async (c: Context) => {
    try {
      const id   = parseInt(c.req.param('id'));
      const body = await c.req.json();
      const data = await attachmentsService.update(id, body);
      if (!data) return errorResponse(c, 'Attachment not found', 404);
      return successResponse(c, data, 'Attachment updated successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  delete: async (c: Context) => {
    try {
      const id   = parseInt(c.req.param('id'));
      const data = await attachmentsService.delete(id);
      if (!data) return errorResponse(c, 'Attachment not found', 404);
      return successResponse(c, null, 'Attachment deleted successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  // DELETE /api/equipment/:id/attachments/:attachmentId
  deleteById: async (c: Context) => {
    try {
      const id   = parseInt(c.req.param('attachmentId'));
      const data = await attachmentsService.delete(id);
      if (!data) return errorResponse(c, 'Attachment not found', 404);
      return successResponse(c, null, 'Attachment deleted successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
};