import { Context } from 'hono';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  changeStatusService,
  equipmentBorrowsService,
  equipmentRepairsService,
  equipmentDisposalsService,
} from '../services/equipment-status.service.js';

// ============================================================
// CHANGE STATUS
// ============================================================

export const changeStatusController = {
  change: async (c: Context) => {
    try {
      const user = c.get('user');
      const { equipmentUuids, newStatus, data } = await c.req.json();

      if (!Array.isArray(equipmentUuids) || equipmentUuids.length === 0)
        return errorResponse(c, 'equipmentUuids must be a non-empty array', 400);
      if (!newStatus)
        return errorResponse(c, 'newStatus is required', 400);

      const validStatuses = ['pending', 'normal', 'borrowed', 'repair', 'unavailable', 'disposed'];
      if (!validStatuses.includes(newStatus))
        return errorResponse(c, `newStatus must be one of: ${validStatuses.join(', ')}`, 400);

      const result = await changeStatusService.change({
        equipmentUuids,
        newStatus,
        data: data || {},
        userUuid: user.uuid,
      });

      return successResponse(c, result, `เปลี่ยนสถานะครุภัณฑ์ ${result.length} รายการเป็น "${newStatus}" สำเร็จ`);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
};

// ============================================================
// BORROWS — GET / UPDATE / DELETE
// ============================================================

export const equipmentBorrowsController = {
  getAll: async (c: Context) => {
    try {
      return successResponse(c, await equipmentBorrowsService.getAll(), 'Equipment Borrows retrieved successfully');
    } catch (error: any) { return errorResponse(c, error.message, 500); }
  },

  getByEquipmentUuid: async (c: Context) => {
    try {
      return successResponse(c, await equipmentBorrowsService.getByEquipmentUuid(c.req.param('uuid')), 'Equipment Borrows retrieved successfully');
    } catch (error: any) { return errorResponse(c, error.message, 500); }
  },

  getById: async (c: Context) => {
    try {
      const data = await equipmentBorrowsService.getById(parseInt(c.req.param('id')));
      if (!data) return errorResponse(c, 'Equipment Borrow not found', 404);
      return successResponse(c, data, 'Equipment Borrow retrieved successfully');
    } catch (error: any) { return errorResponse(c, error.message, 500); }
  },

  update: async (c: Context) => {
    try {
      const data = await equipmentBorrowsService.update(parseInt(c.req.param('id')), await c.req.json());
      if (!data) return errorResponse(c, 'Equipment Borrow not found', 404);
      return successResponse(c, data, 'Equipment Borrow updated successfully');
    } catch (error: any) { return errorResponse(c, error.message, 500); }
  },

  delete: async (c: Context) => {
    try {
      const data = await equipmentBorrowsService.delete(parseInt(c.req.param('id')));
      if (!data) return errorResponse(c, 'Equipment Borrow not found', 404);
      return successResponse(c, data, 'Equipment Borrow deleted successfully');
    } catch (error: any) { return errorResponse(c, error.message, 500); }
  },
};

// ============================================================
// REPAIRS — GET / UPDATE / DELETE
// ============================================================

export const equipmentRepairsController = {
  getAll: async (c: Context) => {
    try {
      return successResponse(c, await equipmentRepairsService.getAll(), 'Equipment Repairs retrieved successfully');
    } catch (error: any) { return errorResponse(c, error.message, 500); }
  },

  getByEquipmentUuid: async (c: Context) => {
    try {
      return successResponse(c, await equipmentRepairsService.getByEquipmentUuid(c.req.param('uuid')), 'Equipment Repairs retrieved successfully');
    } catch (error: any) { return errorResponse(c, error.message, 500); }
  },

  getById: async (c: Context) => {
    try {
      const data = await equipmentRepairsService.getById(parseInt(c.req.param('id')));
      if (!data) return errorResponse(c, 'Equipment Repair not found', 404);
      return successResponse(c, data, 'Equipment Repair retrieved successfully');
    } catch (error: any) { return errorResponse(c, error.message, 500); }
  },

  update: async (c: Context) => {
    try {
      const data = await equipmentRepairsService.update(parseInt(c.req.param('id')), await c.req.json());
      if (!data) return errorResponse(c, 'Equipment Repair not found', 404);
      return successResponse(c, data, 'Equipment Repair updated successfully');
    } catch (error: any) { return errorResponse(c, error.message, 500); }
  },

  delete: async (c: Context) => {
    try {
      const data = await equipmentRepairsService.delete(parseInt(c.req.param('id')));
      if (!data) return errorResponse(c, 'Equipment Repair not found', 404);
      return successResponse(c, data, 'Equipment Repair deleted successfully');
    } catch (error: any) { return errorResponse(c, error.message, 500); }
  },
};

// ============================================================
// DISPOSALS — READ ONLY (archive)
// ============================================================

export const equipmentDisposalsController = {
  getAll: async (c: Context) => {
    try {
      return successResponse(c, await equipmentDisposalsService.getAll(), 'Equipment Disposals retrieved successfully');
    } catch (error: any) { return errorResponse(c, error.message, 500); }
  },

  getByUuid: async (c: Context) => {
    try {
      const data = await equipmentDisposalsService.getByUuid(c.req.param('uuid'));
      if (!data) return errorResponse(c, 'Equipment Disposal not found', 404);
      return successResponse(c, data, 'Equipment Disposal retrieved successfully');
    } catch (error: any) { return errorResponse(c, error.message, 500); }
  },
};