import { Context } from 'hono';
import { successResponse, errorResponse } from '../utils/response.js';
import { attachmentsService } from '../services/attachments.service.js';

export const attachmentsController = {
  getAll: async (c: Context) => {
    try {
      const data = await attachmentsService.getAll();
      return successResponse(c, data, 'Attachments retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getByReference: async (c: Context) => {
    try {
      const refType = c.req.param('refType');
      const refId = parseInt(c.req.param('refId'));
      const data = await attachmentsService.getByReference(refType, refId);
      return successResponse(c, data, 'Attachments retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getById: async (c: Context) => {
    try {
      const id = parseInt(c.req.param('id'));
      const data = await attachmentsService.getById(id);
      
      if (!data) {
        return errorResponse(c, 'Attachment not found', 404);
      }
      
      return successResponse(c, data, 'Attachment retrieved successfully');
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
      const id = parseInt(c.req.param('id'));
      const body = await c.req.json();
      const data = await attachmentsService.update(id, body);
      
      if (!data) {
        return errorResponse(c, 'Attachment not found', 404);
      }
      
      return successResponse(c, data, 'Attachment updated successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  delete: async (c: Context) => {
    try {
      const id = parseInt(c.req.param('id'));
      const data = await attachmentsService.delete(id);
      
      if (!data) {
        return errorResponse(c, 'Attachment not found', 404);
      }
      
      return successResponse(c, data, 'Attachment deleted successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  deleteByReference: async (c: Context) => {
    try {
      const refType = c.req.param('refType');
      const refId = parseInt(c.req.param('refId'));
      const data = await attachmentsService.deleteByReference(refType, refId);
      return successResponse(c, data, 'Attachments deleted successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
};