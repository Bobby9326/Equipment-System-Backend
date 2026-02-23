import { Context } from 'hono';
import { successResponse, errorResponse } from '../utils/response.js';
import { mhesiService } from '../services/mhesi.service.js';

export const mhesiController = {
  getAll: async (c: Context) => {
    try {
      const search = c.req.query('search');
      const projectId = c.req.query('projectId');
      const departmentId = c.req.query('departmentId');

      const data = await mhesiService.getAll({
        search,
        projectId: projectId ? parseInt(projectId) : undefined,
        departmentId: departmentId ? parseInt(departmentId) : undefined,
      });
      return successResponse(c, data, 'MHESI numbers retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getById: async (c: Context) => {
    try {
      const id = parseInt(c.req.param('id'));
      const data = await mhesiService.getById(id);

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
      const data = await mhesiService.create(body);
      return successResponse(c, data, 'MHESI number created successfully', 201);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  update: async (c: Context) => {
    try {
      const id = parseInt(c.req.param('id'));
      const body = await c.req.json();
      const data = await mhesiService.update(id, body);

      if (!data) return errorResponse(c, 'MHESI number not found', 404);

      return successResponse(c, data, 'MHESI number updated successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  delete: async (c: Context) => {
    try {
      const id = parseInt(c.req.param('id'));
      const data = await mhesiService.delete(id);

      if (!data) return errorResponse(c, 'MHESI number not found', 404);

      return successResponse(c, data, 'MHESI number deleted successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
};