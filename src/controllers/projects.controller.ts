import { Context } from 'hono';
import { successResponse, errorResponse } from '../utils/response.js';
import { projectsService } from '../services/projects.service.js';

export const projectsController = {
  getAll: async (c: Context) => {
    try {
      const search = c.req.query('search');
      const status = c.req.query('status');
      
      const data = await projectsService.getAll({ search, status });
      return successResponse(c, data, 'Projects retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getById: async (c: Context) => {
    try {
      const id = parseInt(c.req.param('id'));
      const data = await projectsService.getById(id);
      
      if (!data) {
        return errorResponse(c, 'Project not found', 404);
      }
      
      return successResponse(c, data, 'Project retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  create: async (c: Context) => {
    try {
      const body = await c.req.json();
      const data = await projectsService.create(body);
      return successResponse(c, data, 'Project created successfully', 201);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  update: async (c: Context) => {
    try {
      const id = parseInt(c.req.param('id'));
      const body = await c.req.json();
      const data = await projectsService.update(id, body);
      
      if (!data) {
        return errorResponse(c, 'Project not found', 404);
      }
      
      return successResponse(c, data, 'Project updated successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  delete: async (c: Context) => {
    try {
      const id = parseInt(c.req.param('id'));
      const data = await projectsService.delete(id);
      
      if (!data) {
        return errorResponse(c, 'Project not found', 404);
      }
      
      return successResponse(c, data, 'Project deleted successfully');
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
};