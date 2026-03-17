import { Context } from 'hono';
import { successResponse, errorResponse } from '../utils/response.js';
import { usersService } from '../services/users.service.js';

export const usersController = {
  getAll: async (c: Context) => {
    try {
      const search       = c.req.query('search');
      const role         = c.req.query('role');
      const departmentId = c.req.query('departmentId');

      const data = await usersService.getAll({
        search,
        role,
        departmentId: departmentId ? parseInt(departmentId) : undefined,
      });
      return successResponse(c, data, 'Users retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getByUuid: async (c: Context) => {
    try {
      const uuid = c.req.param('uuid');
      const data = await usersService.getByUuid(uuid);
      if (!data) return errorResponse(c, 'User not found', 404);
      return successResponse(c, data, 'User retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  create: async (c: Context) => {
    try {
      const body = await c.req.json();
      if (!body.email) return errorResponse(c, 'email is required', 400);
      if (!body.role)  return errorResponse(c, 'role is required', 400);

      const data = await usersService.create(body);
      return successResponse(c, data, 'User created successfully', 201);
    } catch (error: any) {
      return errorResponse(c, error.message, error.statusCode ?? 500);
    }
  },

  update: async (c: Context) => {
    try {
      const uuid = c.req.param('uuid');
      const body = await c.req.json();
      const data = await usersService.updateByUuid(uuid, body);
      if (!data) return errorResponse(c, 'User not found', 404);
      return successResponse(c, data, 'User updated successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, error.statusCode ?? 500);
    }
  },

  delete: async (c: Context) => {
    try {
      const user = c.get('user');
      const uuid = c.req.param('uuid');

      // ป้องกัน admin ลบตัวเอง
      if (user.uuid === uuid) return errorResponse(c, 'ไม่สามารถลบ account ตัวเองได้', 400);

      const data = await usersService.deleteByUuid(uuid);
      if (!data) return errorResponse(c, 'User not found', 404);
      return successResponse(c, data, 'User deleted successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
};