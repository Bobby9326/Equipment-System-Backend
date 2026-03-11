import { Context } from 'hono';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  changeStatusService,
  equipmentNormalsService,
  equipmentBorrowsService,
  equipmentRepairsService,
  equipmentUnavailableService,
  equipmentDisposalsService,
  equipmentStatusLogsService,
} from '../services/equipment-status.service.js';
import { isAdminOrManager } from '../utils/permission.js';

// ============================================================
// CHANGE STATUS — เส้นหลักสำหรับเปลี่ยนสถานะครุภัณฑ์
// POST /api/equipment-status/change
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

      const validStatuses = ['normal', 'borrowed', 'repair', 'unavailable', 'disposed'];
      if (!validStatuses.includes(newStatus))
        return errorResponse(c, `newStatus must be one of: ${validStatuses.join(', ')}`, 400);

      const result = await changeStatusService.change({
        equipmentUuids,
        newStatus,
        data: data || {},
        userUuid: user.uuid,
      });

      return successResponse(
        c,
        result,
        `เปลี่ยนสถานะครุภัณฑ์ ${result.length} รายการเป็น "${newStatus}" สำเร็จ`
      );
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
};

// ============================================================
// INDIVIDUAL STATUS TABLES — GET / UPDATE / DELETE เท่านั้น
// (ไม่มี create เพราะสร้างผ่าน changeStatus แทน)
// ============================================================

const createReadUpdateDeleteController = (service: any, name: string) => ({
  getAll: async (c: Context) => {
    try {
      const data = await service.getAll();
      return successResponse(c, data, `${name} retrieved successfully`);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getByEquipmentUuid: async (c: Context) => {
    try {
      const uuid = c.req.param('uuid');
      const data = await service.getByEquipmentUuid(uuid);
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

export const equipmentNormalsController     = createReadUpdateDeleteController(equipmentNormalsService,     'Equipment Normal');
export const equipmentBorrowsController     = createReadUpdateDeleteController(equipmentBorrowsService,     'Equipment Borrow');
export const equipmentRepairsController     = createReadUpdateDeleteController(equipmentRepairsService,     'Equipment Repair');
export const equipmentUnavailableController = createReadUpdateDeleteController(equipmentUnavailableService, 'Equipment Unavailable');
export const equipmentDisposalsController   = createReadUpdateDeleteController(equipmentDisposalsService,   'Equipment Disposal');

// Status Logs — read only
export const equipmentStatusLogsController = {
  getAll: async (c: Context) => {
    try {
      const data = await equipmentStatusLogsService.getAll();
      return successResponse(c, data, 'Equipment status logs retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getByEquipmentUuid: async (c: Context) => {
    try {
      const uuid = c.req.param('uuid');
      const data = await equipmentStatusLogsService.getByEquipmentUuid(uuid);
      return successResponse(c, data, 'Equipment status logs retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
};