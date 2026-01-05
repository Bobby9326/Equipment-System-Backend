import { Context } from 'hono';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { assetsService } from '../services/assets.service.js';

export const assetsController = {
  getAll: async (c: Context) => {
    try {
      const search = c.req.query('search');
      const status = c.req.query('status');
      const departmentId = c.req.query('departmentId');
      const assetTypeId = c.req.query('assetTypeId');
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '10');

      const result = await assetsService.getAll({
        search,
        status,
        departmentId: departmentId ? parseInt(departmentId) : undefined,
        assetTypeId: assetTypeId ? parseInt(assetTypeId) : undefined,
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
      const data = await assetsService.getById(id);
      
      if (!data) {
        return errorResponse(c, 'Asset not found', 404);
      }
      
      return successResponse(c, data, 'Asset retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getByCode: async (c: Context) => {
    try {
      const code = c.req.param('code');
      const data = await assetsService.getByCode(code);
      
      if (!data) {
        return errorResponse(c, 'Asset not found', 404);
      }
      
      return successResponse(c, data, 'Asset retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  create: async (c: Context) => {
    try {
      const body = await c.req.json();
      
      // Check if asset code already exists
      const existing = await assetsService.getByCode(body.assetCode);
      if (existing) {
        return errorResponse(c, 'Asset code already exists', 400);
      }
      
      const data = await assetsService.create(body);
      return successResponse(c, data, 'Asset created successfully', 201);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  update: async (c: Context) => {
    try {
      const id = parseInt(c.req.param('id'));
      const body = await c.req.json();
      
      // If updating asset code, check for duplicates
      if (body.assetCode) {
        const existing = await assetsService.getByCode(body.assetCode);
        if (existing && existing.id !== id) {
          return errorResponse(c, 'Asset code already exists', 400);
        }
      }
      
      const data = await assetsService.update(id, body);
      
      if (!data) {
        return errorResponse(c, 'Asset not found', 404);
      }
      
      return successResponse(c, data, 'Asset updated successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  delete: async (c: Context) => {
    try {
      const id = parseInt(c.req.param('id'));
      const data = await assetsService.delete(id);
      
      if (!data) {
        return errorResponse(c, 'Asset not found', 404);
      }
      
      return successResponse(c, data, 'Asset deleted successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  updateStatus: async (c: Context) => {
    try {
      const id = parseInt(c.req.param('id'));
      const { status } = await c.req.json();
      
      if (!status) {
        return errorResponse(c, 'Status is required', 400);
      }
      
      const data = await assetsService.updateStatus(id, status);
      
      if (!data) {
        return errorResponse(c, 'Asset not found', 404);
      }
      
      return successResponse(c, data, 'Asset status updated successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getStats: async (c: Context) => {
    try {
      const data = await assetsService.getStats();
      return successResponse(c, data, 'Asset statistics retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
};