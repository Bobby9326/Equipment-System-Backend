import { Context } from 'hono';
import { successResponse, errorResponse } from '../utils/response.js';
import { mhesiService } from '../services/mhesi.service.js';
import { getDepartmentFilter } from '../utils/permission.js';

export const mhesiController = {
  getAll: async (c: Context) => {
    try {
      const user      = c.get('user');
      const search    = c.req.query('search');
      const projectId = c.req.query('projectId');

      const data = await mhesiService.getAll({
        search,
        projectId:    projectId ? parseInt(projectId) : undefined,
        departmentId: getDepartmentFilter(user, c.req.query('departmentId')),
      });
      return successResponse(c, data, 'MHESI numbers retrieved successfully');
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

  create: async (c: Context) => {
    try {
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
      const uuid = c.req.param('uuid');
      const body = await c.req.json();
      const data = await mhesiService.updateByUuid(uuid, body);
      if (!data) return errorResponse(c, 'MHESI number not found', 404);
      return successResponse(c, data, 'MHESI number updated successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  delete: async (c: Context) => {
    try {
      const uuid = c.req.param('uuid');
      const data = await mhesiService.deleteByUuid(uuid);
      if (!data) return errorResponse(c, 'MHESI number not found', 404);
      return successResponse(c, data, 'MHESI number deleted successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
};