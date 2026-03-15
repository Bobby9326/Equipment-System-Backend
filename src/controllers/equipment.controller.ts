import { Context } from 'hono';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { equipmentService } from '../services/equipment.service.js';
import { getDepartmentFilter, isAdminOrManager } from '../utils/permission.js';

export const equipmentController = {
  getAll: async (c: Context) => {
    try {
      const user = c.get('user');
      const search = c.req.query('search');
      const status = c.req.query('status');
      const equipmentTypeId = c.req.query('equipmentTypeId');
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '10');
      const sortBy = c.req.query('sortBy');
      const sortDir = c.req.query('sortDir') as 'asc' | 'desc' | undefined;

      const result = await equipmentService.getAll({
        search,
        status,
        departmentId: getDepartmentFilter(user, c.req.query('departmentId')),
        equipmentTypeId: equipmentTypeId ? parseInt(equipmentTypeId) : undefined,
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
      const user = c.get('user');
      const uuid = c.req.param('uuid');
      const data = await equipmentService.getByUuid(uuid);

      if (!data) return errorResponse(c, 'Equipment not found', 404);

      if (!isAdminOrManager(user) && data.departmentId !== user.departmentId) {
        return errorResponse(c, 'ไม่มีสิทธิ์เข้าถึงครุภัณฑ์นี้', 403);
      }

      return successResponse(c, data, 'Equipment retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getByCode: async (c: Context) => {
    try {
      const user = c.get('user');
      const code = c.req.param('code');
      const data = await equipmentService.getByCode(code);

      if (!data) return errorResponse(c, 'Equipment not found', 404);

      if (!isAdminOrManager(user) && data.departmentId !== user.departmentId) {
        return errorResponse(c, 'ไม่มีสิทธิ์เข้าถึงครุภัณฑ์นี้', 403);
      }

      return successResponse(c, data, 'Equipment retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  create: async (c: Context) => {
    try {
      const user = c.get('user');
      const { numberPrefix, start, end, padLength, ...equipmentData } = await c.req.json();

      if (!equipmentData.equipmentCode) return errorResponse(c, 'equipmentCode is required', 400);
      if (!numberPrefix) return errorResponse(c, 'numberPrefix is required', 400);
      if (start === undefined || isNaN(Number(start))) return errorResponse(c, 'start must be a number', 400);
      if (end !== undefined && Number(end) < Number(start)) return errorResponse(c, 'end must be >= start', 400);

      if (!isAdminOrManager(user) && equipmentData.departmentId !== user.departmentId) {
        return errorResponse(c, 'ไม่มีสิทธิ์สร้างครุภัณฑ์ใน department อื่น', 403);
      }

      const result = await equipmentService.create({
        numberPrefix,
        start: Number(start),
        end: end !== undefined ? Number(end) : undefined,
        padLength: padLength ? Number(padLength) : undefined,
        userUuid: user.uuid,
        data: equipmentData,
      });

      const message = result.length > 1 ? `สร้างครุภัณฑ์สำเร็จ ${result.length} รายการ` : 'Equipment created successfully';
      return successResponse(c, result, message, 201);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  update: async (c: Context) => {
    try {
      const user = c.get('user');
      const uuid = c.req.param('uuid');
      const body = await c.req.json();

      const existing = await equipmentService.getByUuid(uuid);
      if (!existing) return errorResponse(c, 'Equipment not found', 404);

      if (!isAdminOrManager(user) && existing.departmentId !== user.departmentId) {
        return errorResponse(c, 'ไม่มีสิทธิ์แก้ไขครุภัณฑ์ใน department อื่น', 403);
      }

      if (body.equipmentCode) {
        const dup = await equipmentService.getByCode(body.equipmentCode);
        if (dup && dup.uuid !== uuid) return errorResponse(c, 'Equipment code already exists', 400);
      }

      const data = await equipmentService.updateByUuid(uuid, body, user.uuid);
      return successResponse(c, data, 'Equipment updated successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  delete: async (c: Context) => {
    try {
      const user = c.get('user');
      const uuid = c.req.param('uuid');

      const existing = await equipmentService.getByUuid(uuid);
      if (!existing) return errorResponse(c, 'Equipment not found', 404);

      if (!isAdminOrManager(user) && existing.departmentId !== user.departmentId) {
        return errorResponse(c, 'ไม่มีสิทธิ์ลบครุภัณฑ์ใน department อื่น', 403);
      }

      const data = await equipmentService.deleteByUuid(uuid);
      return successResponse(c, data, 'Equipment deleted successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getHistory: async (c: Context) => {
    try {
      const user = c.get('user');
      const uuid = c.req.param('uuid');

      const equipment = await equipmentService.getByUuid(uuid);
      if (!equipment) return errorResponse(c, 'Equipment not found', 404);

      if (!isAdminOrManager(user) && equipment.departmentId !== user.departmentId) {
        return errorResponse(c, 'ไม่มีสิทธิ์เข้าถึงครุภัณฑ์นี้', 403);
      }

      const data = await equipmentService.getHistory(uuid);
      return successResponse(c, data, 'Equipment history retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getStats: async (c: Context) => {
    try {
      const user = c.get('user');
      const departmentId = isAdminOrManager(user) ? undefined : user.departmentId ?? undefined;
      const data = await equipmentService.getStats(departmentId);
      return successResponse(c, data, 'Equipment statistics retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
};