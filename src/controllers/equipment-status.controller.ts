import { Context } from 'hono';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  equipmentNormalsService,
  equipmentBorrowsService,
  equipmentRepairsService,
  equipmentUnavailableService,
  equipmentDisposalsService,
  equipmentStatusLogsService,
} from '../services/equipment-status.service.js';

// Generic controller factory for equipment status tables
const createEquipmentStatusController = (service: any, name: string) => ({
  getAll: async (c: Context) => {
    try {
      const data = await service.getAll();
      return successResponse(c, data, `${name} retrieved successfully`);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getByEquipmentId: async (c: Context) => {
    try {
      const equipmentId = parseInt(c.req.param('equipmentId'));
      const data = await service.getByEquipmentId(equipmentId);
      return successResponse(c, data, `${name} retrieved successfully`);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getById: async (c: Context) => {
    try {
      const id = parseInt(c.req.param('id'));
      const data = await service.getById(id);

      if (!data) return errorResponse(c, `${name} not found`, 404);

      return successResponse(c, data, `${name} retrieved successfully`);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  create: async (c: Context) => {
    try {
      const body = await c.req.json();
      const data = await service.create(body);
      return successResponse(c, data, `${name} created successfully`, 201);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  update: async (c: Context) => {
    try {
      const id = parseInt(c.req.param('id'));
      const body = await c.req.json();
      const data = await service.update(id, body);

      if (!data) return errorResponse(c, `${name} not found`, 404);

      return successResponse(c, data, `${name} updated successfully`);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  delete: async (c: Context) => {
    try {
      const id = parseInt(c.req.param('id'));
      const data = await service.delete(id);

      if (!data) return errorResponse(c, `${name} not found`, 404);

      return successResponse(c, data, `${name} deleted successfully`);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
});

export const equipmentNormalsController = createEquipmentStatusController(equipmentNormalsService, 'Equipment Normal');

export const equipmentBorrowsController = {
  ...createEquipmentStatusController(equipmentBorrowsService, 'Equipment Borrow'),

  returnEquipment: async (c: Context) => {
    try {
      const id = parseInt(c.req.param('id'));
      const { actualReturnDate } = await c.req.json();

      if (!actualReturnDate) return errorResponse(c, 'Actual return date is required', 400);

      const data = await equipmentBorrowsService.returnEquipment(id, new Date(actualReturnDate));

      if (!data) return errorResponse(c, 'Equipment borrow not found', 404);

      return successResponse(c, data, 'Equipment returned successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
};

export const equipmentRepairsController = createEquipmentStatusController(equipmentRepairsService, 'Equipment Repair');
export const equipmentUnavailableController = createEquipmentStatusController(equipmentUnavailableService, 'Equipment Unavailable');
export const equipmentDisposalsController = createEquipmentStatusController(equipmentDisposalsService, 'Equipment Disposal');

// Status Logs controller (read + create only)
export const equipmentStatusLogsController = {
  getAll: async (c: Context) => {
    try {
      const data = await equipmentStatusLogsService.getAll();
      return successResponse(c, data, 'Equipment status logs retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getByEquipmentId: async (c: Context) => {
    try {
      const equipmentId = parseInt(c.req.param('equipmentId'));
      const data = await equipmentStatusLogsService.getByEquipmentId(equipmentId);
      return successResponse(c, data, 'Equipment status logs retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  create: async (c: Context) => {
    try {
      const body = await c.req.json();
      const data = await equipmentStatusLogsService.create(body);
      return successResponse(c, data, 'Equipment status log created successfully', 201);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
};