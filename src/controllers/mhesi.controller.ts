import { Context } from 'hono';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { mhesiService } from '../services/mhesi.service.js';
import { getDepartmentFilter, isAdminOrManager } from '../utils/permission.js';

export const mhesiController = {

  // ─── GET (ทุกคนเข้าถึงได้) ──────────────────────────────────

  getAll: async (c: Context) => {
    try {
      const user      = c.get('user');
      const search    = c.req.query('search');
      const projectId = c.req.query('projectId');
      const faculty   = c.req.query('faculty');
      const role      = c.req.query('role');
      const planId    = c.req.query('planId');
      const amountMin = c.req.query('amountMin');
      const amountMax = c.req.query('amountMax');
      const dateFrom  = c.req.query('dateFrom');
      const dateTo    = c.req.query('dateTo');
      const page      = parseInt(c.req.query('page')  || '1');
      const limit     = parseInt(c.req.query('limit') || '10');
      const sortBy    = c.req.query('sortBy');
      const sortDir   = c.req.query('sortDir') as 'asc' | 'desc' | undefined;

      const result = await mhesiService.getAll({
        search,
        projectId:    projectId ? parseInt(projectId) : undefined,
        faculty,
        role,
        planId:       planId    ? parseInt(planId)    : undefined,
        amountMin:    amountMin ? parseFloat(amountMin) : undefined,
        amountMax:    amountMax ? parseFloat(amountMax) : undefined,
        dateFrom,
        dateTo,
        departmentId: getDepartmentFilter(user, c.req.query('departmentId')),
        page,
        limit,
        sortBy,
        sortDir,
      });
      return paginatedResponse(c, result.data, result.total, result.page, result.limit);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getByUuid: async (c: Context) => {
    try {
      const uuid = c.req.param('uuid');
      const data = await mhesiService.getByUuid(uuid);
      if (!data) return errorResponse(c, 'MHESI number not found', 404);
      return successResponse(c, data, 'MHESI number retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getByProjectId: async (c: Context) => {
    try {
      const projectId = parseInt(c.req.param('projectId'));
      const data = await mhesiService.getByProjectId(projectId);
      return successResponse(c, data, 'MHESI numbers retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getHistory: async (c: Context) => {
    try {
      const uuid = c.req.param('uuid');
      const data = await mhesiService.getHistory(uuid);
      return successResponse(c, data, 'MHESI history retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getAttachments: async (c: Context) => {
    try {
      const uuid = c.req.param('uuid');
      const data = await mhesiService.getAttachments(uuid);
      if (data === null) return errorResponse(c, 'MHESI not found', 404);
      return successResponse(c, data, 'Attachments retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  // ─── CREATE / UPDATE / DELETE (เฉพาะ department 1) ──────────

  create: async (c: Context) => {
    try {
      const user = c.get('user');
      if (!isAdminOrManager(user)) {
        return errorResponse(c, 'ไม่มีสิทธิ์สร้างเอกสาร MHESI เฉพาะ admin หรือ department 1 เท่านั้น', 403);
      }
      const body = await c.req.json();
      if (!body.mhesiNumber) return errorResponse(c, 'mhesiNumber is required', 400);
      const data = await mhesiService.create(body);
      return successResponse(c, data, 'MHESI number created successfully', 201);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  update: async (c: Context) => {
    try {
      const user = c.get('user');
      if (!isAdminOrManager(user)) {
        return errorResponse(c, 'ไม่มีสิทธิ์แก้ไขเอกสาร MHESI เฉพาะ admin หรือ department 1 เท่านั้น', 403);
      }
      const uuid = c.req.param('uuid');
      const body = await c.req.json();
      const data = await mhesiService.updateByUuid(uuid, body, user.uuid);
      if (!data) return errorResponse(c, 'MHESI number not found', 404);
      return successResponse(c, data, 'MHESI number updated successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  delete: async (c: Context) => {
    try {
      const user = c.get('user');
      if (!isAdminOrManager(user)) {
        return errorResponse(c, 'ไม่มีสิทธิ์ลบเอกสาร MHESI เฉพาะ admin หรือ department 1 เท่านั้น', 403);
      }
      const uuid = c.req.param('uuid');
      const data = await mhesiService.deleteByUuid(uuid);
      if (!data) return errorResponse(c, 'MHESI number not found', 404);
      return successResponse(c, data, 'MHESI number deleted successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  // ✅ POST ไฟล์เพิ่มเติม (เฉพาะ department 1)
  uploadAttachments: async (c: Context) => {
    try {
      const user = c.get('user');
      if (!isAdminOrManager(user)) {
        return errorResponse(c, 'ไม่มีสิทธิ์เพิ่มไฟล์ เฉพาะ admin หรือ department 1 เท่านั้น', 403);
      }
      const uuid = c.req.param('uuid');
      const body = await c.req.parseBody({ all: true });
      const raw  = body['files'] ?? body['file'];
      const files: File[] = (Array.isArray(raw) ? raw : [raw]).filter((f): f is File => f instanceof File);
      if (files.length === 0) return errorResponse(c, 'กรุณาแนบไฟล์', 400);
      const data = await mhesiService.addAttachments(uuid, files, user.uuid);
      return successResponse(c, data, `อัปโหลด ${data.length} ไฟล์สำเร็จ`, 201);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  // ✅ DELETE ไฟล์เพิ่มเติม (เฉพาะ department 1)
  deleteAttachment: async (c: Context) => {
    try {
      const user = c.get('user');
      if (!isAdminOrManager(user)) {
        return errorResponse(c, 'ไม่มีสิทธิ์ลบไฟล์ เฉพาะ admin หรือ department 1 เท่านั้น', 403);
      }
      const uuid         = c.req.param('uuid');
      const attachmentId = parseInt(c.req.param('attachmentId'));
      const data = await mhesiService.removeAttachment(uuid, attachmentId, user.uuid);
      return successResponse(c, data, 'ลบไฟล์สำเร็จ');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
};