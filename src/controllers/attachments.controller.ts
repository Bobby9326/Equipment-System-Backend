import { Context } from 'hono';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
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

  // GET /api/attachments/:id         → metadata เท่านั้น
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

  // GET /api/attachments/:id/file     → ส่งไฟล์จริงออกไป (stream)
  download: async (c: Context) => {
    try {
      const id = parseInt(c.req.param('id'));
      const data = await attachmentsService.getById(id);
      if (!data) return errorResponse(c, 'Attachment not found', 404);

      // แปลง filePath (/uploads/...) → path จริงในระบบ
      const localPath = join('.', data.filePath);
      if (!existsSync(localPath)) return errorResponse(c, 'File not found on disk', 404);

      const buffer = await readFile(localPath);

      c.header('Content-Type', data.fileType ?? 'application/octet-stream');
      c.header('Content-Disposition', `inline; filename="${data.fileName ?? 'file'}"`); 
      c.header('Content-Length', String(buffer.length));
      c.header('Cache-Control', 'private, max-age=3600');

      return c.body(buffer);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  // GET /api/equipment/:uuid/attachments (เรียกผ่าน equipment.routes.ts)
  getByEquipmentId: async (c: Context) => {
    try {
      const uuid = c.req.param('uuid');
      const data = await attachmentsService.getByEquipmentUuid(uuid);
      if (data === null) return errorResponse(c, 'Equipment not found', 404);
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

  // POST /api/equipment/:uuid/attachments (เรียกผ่าน equipment.routes.ts)
  // multipart/form-data: files[] (หลายไฟล์) หรือ file (ไฟล์เดียว)
  uploadForEquipment: async (c: Context) => {
    try {
      const uuid = c.req.param('uuid')
      const equipment = await equipmentService.getByUuid(uuid)

      if (!equipment) {
        return c.json({ success: false, message: 'Equipment not found' }, 404)
      }
      const equipmentId = await attachmentsService.getEquipmentIdByUuid(uuid);
      if (!equipmentId) return errorResponse(c, 'Equipment not found', 404);
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
        files.map(file => attachmentsService.uploadForEquipment(file, equipmentId!, uuid, c.get('user')?.uuid))
      );

      const message = results.length > 1
        ? `อัปโหลด ${results.length} ไฟล์สำเร็จ`
        : 'อัปโหลดไฟล์สำเร็จ';

      return successResponse(c, results, message, 201);
    } catch (error: any) {
      return errorResponse(c, error.message, 400);
    }
  },

  // POST /api/equipment/attachments
  // multipart/form-data: uuids (JSON array string) + files[]
  bulkUploadForEquipment: async (c: Context) => {
    try {
      const body = await c.req.parseBody({ all: true });
      const uuidsRaw = body['uuids'];
      if (!uuidsRaw || typeof uuidsRaw !== 'string')
        return errorResponse(c, 'uuids is required (JSON array string)', 400);
      const uuids: string[] = JSON.parse(uuidsRaw);
      if (!uuids.length) return errorResponse(c, 'uuids must not be empty', 400);

      const filesRaw = body['files'];
      const files: File[] = (Array.isArray(filesRaw) ? filesRaw : [filesRaw])
        .filter((f): f is File => f instanceof File);
      if (!files.length) return errorResponse(c, 'files is required', 400);

      const result = await attachmentsService.bulkUploadForEquipment(files, uuids, c.get('user')?.uuid);
      return successResponse(c, result, 'อัปโหลดและผูกไฟล์สำเร็จ', 201);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
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

  // DELETE /api/equipment/:uuid/attachments/:attachmentId
  deleteById: async (c: Context) => {
    try {
      const uuid         = c.req.param('uuid');
      const attachmentId = parseInt(c.req.param('attachmentId'));

      const list = await attachmentsService.getByEquipmentUuid(uuid) ?? [];
      if (!list.some(a => a.id === attachmentId))
        return errorResponse(c, 'Attachment not found', 404);

      // ลบ junction + ลบไฟล์จริงถ้าไม่มี equipment อื่นใช้
      const equipmentId = await attachmentsService.getEquipmentIdByUuid(uuid);
      if (!equipmentId) return errorResponse(c, 'Equipment not found', 404);
      await attachmentsService.deleteForEquipment(equipmentId, attachmentId);
      return successResponse(c, null, 'Attachment deleted successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
};