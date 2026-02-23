import { Context } from 'hono';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { equipmentService } from '../services/equipment.service.js';

export const equipmentController = {
  getAll: async (c: Context) => {
    try {
      const search = c.req.query('search');
      const status = c.req.query('status');
      const departmentId = c.req.query('departmentId');
      const equipmentTypeId = c.req.query('equipmentTypeId');
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '10');

      const result = await equipmentService.getAll({
        search,
        status,
        departmentId: departmentId ? parseInt(departmentId) : undefined,
        equipmentTypeId: equipmentTypeId ? parseInt(equipmentTypeId) : undefined,
        page,
        limit,
      });

      return paginatedResponse(c, result.data, result.total, result.page, result.limit);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getById: async (c: Context) => {
    try {
      const id = parseInt(c.req.param('id'));
      const data = await equipmentService.getById(id);

      if (!data) return errorResponse(c, 'Equipment not found', 404);

      return successResponse(c, data, 'Equipment retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getByCode: async (c: Context) => {
    try {
      const code = c.req.param('code');
      const data = await equipmentService.getByCode(code);

      if (!data) return errorResponse(c, 'Equipment not found', 404);

      return successResponse(c, data, 'Equipment retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  create: async (c: Context) => {
    try {
      const body = await c.req.json();

      const existing = await equipmentService.getByCode(body.equipmentCode);
      if (existing) return errorResponse(c, 'Equipment code already exists', 400);

      const data = await equipmentService.create(body);
      return successResponse(c, data, 'Equipment created successfully', 201);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  update: async (c: Context) => {
    try {
      const id = parseInt(c.req.param('id'));
      const body = await c.req.json();

      if (body.equipmentCode) {
        const existing = await equipmentService.getByCode(body.equipmentCode);
        if (existing && existing.id !== id) return errorResponse(c, 'Equipment code already exists', 400);
      }

      const data = await equipmentService.update(id, body);

      if (!data) return errorResponse(c, 'Equipment not found', 404);

      return successResponse(c, data, 'Equipment updated successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  delete: async (c: Context) => {
    try {
      const id = parseInt(c.req.param('id'));
      const data = await equipmentService.delete(id);

      if (!data) return errorResponse(c, 'Equipment not found', 404);

      return successResponse(c, data, 'Equipment deleted successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  updateStatus: async (c: Context) => {
    try {
      const id = parseInt(c.req.param('id'));
      const { status } = await c.req.json();

      if (!status) return errorResponse(c, 'Status is required', 400);

      const data = await equipmentService.updateStatus(id, status);

      if (!data) return errorResponse(c, 'Equipment not found', 404);

      return successResponse(c, data, 'Equipment status updated successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getStats: async (c: Context) => {
    try {
      const data = await equipmentService.getStats();
      return successResponse(c, data, 'Equipment statistics retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
};