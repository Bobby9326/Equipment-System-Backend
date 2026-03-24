import { Context } from 'hono';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { projectsService } from '../services/projects.service.js';
import { isAdminOrManager } from '../utils/permission.js';

export const projectsController = {

  // ─── GET (ทุกคนเข้าถึงได้) ──────────────────────────────────

  getAll: async (c: Context) => {
    try {
      const search              = c.req.query('search');
      const status              = c.req.query('status');
      const projectTypeId       = c.req.query('projectTypeId')       ? parseInt(c.req.query('projectTypeId')!)       : undefined;
      const acquisitionSourceId = c.req.query('acquisitionSourceId') ? parseInt(c.req.query('acquisitionSourceId')!) : undefined;
      const acquisitionMethodId = c.req.query('acquisitionMethodId') ? parseInt(c.req.query('acquisitionMethodId')!) : undefined;
      const fiscalYear          = c.req.query('fiscalYear')          ? parseInt(c.req.query('fiscalYear')!)          : undefined;
      const dateFrom            = c.req.query('dateFrom');
      const dateTo              = c.req.query('dateTo');
      const budgetMin           = c.req.query('budgetMin')  ? parseFloat(c.req.query('budgetMin')!)  : undefined;
      const budgetMax           = c.req.query('budgetMax')  ? parseFloat(c.req.query('budgetMax')!)  : undefined;
      const page                = parseInt(c.req.query('page')  || '1');
      const limit               = parseInt(c.req.query('limit') || '10');
      const sortBy              = c.req.query('sortBy');
      const sortDir             = c.req.query('sortDir') as 'asc' | 'desc' | undefined;

      const result = await projectsService.getAll({
        search, status, projectTypeId, acquisitionSourceId, acquisitionMethodId,
        fiscalYear, dateFrom, dateTo, budgetMin, budgetMax,
        page, limit, sortBy, sortDir,
      });
      return paginatedResponse(c, result.data, result.total, result.page, result.limit);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getByUuid: async (c: Context) => {
    try {
      const uuid = c.req.param('uuid');
      const data = await projectsService.getByUuid(uuid);
      if (!data) return errorResponse(c, 'Project not found', 404);
      return successResponse(c, data, 'Project retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getStats: async (c: Context) => {
    try {
      const data = await projectsService.getStats();
      return successResponse(c, data, 'Project statistics retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getHistory: async (c: Context) => {
    try {
      const uuid = c.req.param('uuid');
      const data = await projectsService.getHistory(uuid);
      return successResponse(c, data, 'Project history retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  // ─── CREATE / UPDATE / DELETE (เฉพาะ department 1) ──────────

  create: async (c: Context) => {
    try {
      const user = c.get('user');
      if (!isAdminOrManager(user)) {
        return errorResponse(c, 'ไม่มีสิทธิ์สร้างโครงการ เฉพาะ admin หรือ department 1 เท่านั้น', 403);
      }
      const body = await c.req.json();
      const data = await projectsService.create(body);
      return successResponse(c, data, 'Project created successfully', 201);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  update: async (c: Context) => {
    try {
      const user = c.get('user');
      if (!isAdminOrManager(user)) {
        return errorResponse(c, 'ไม่มีสิทธิ์แก้ไขโครงการ เฉพาะ admin หรือ department 1 เท่านั้น', 403);
      }
      const uuid = c.req.param('uuid');
      const body = await c.req.json();
      const data = await projectsService.updateByUuid(uuid, body, user.uuid);
      if (!data) return errorResponse(c, 'Project not found', 404);
      return successResponse(c, data, 'Project updated successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  delete: async (c: Context) => {
    try {
      const user = c.get('user');
      if (!isAdminOrManager(user)) {
        return errorResponse(c, 'ไม่มีสิทธิ์ลบโครงการ เฉพาะ admin หรือ department 1 เท่านั้น', 403);
      }
      const uuid = c.req.param('uuid');
      const data = await projectsService.deleteByUuid(uuid);
      if (!data) return errorResponse(c, 'Project not found', 404);
      return successResponse(c, data, 'Project deleted successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
};