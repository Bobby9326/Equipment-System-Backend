import { Context } from 'hono';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  departmentsService,
  fundsService,
  equipmentTypesService,
  acquisitionSourcesService,
  acquisitionMethodsService,
  buildingsService,
  roomsService,
  roomTypesService,
  planSectionsService,
} from '../services/masters.service.js';

const createMasterController = (service: any, name: string) => ({
  getAll: async (c: Context) => {
    try {
      const data = await service.getAll();
      return successResponse(c, data, `${name} retrieved successfully`);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
  getById: async (c: Context) => {
    try {
      const id   = parseInt(c.req.param('id'));
      const data = await service.getById(id);
      if (!data) return errorResponse(c, `${name} not found`, 404);
      return successResponse(c, data, `${name} retrieved successfully`);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
});

export const departmentsController        = createMasterController(departmentsService,        'Department');
export const fundsController              = createMasterController(fundsService,              'Fund');
export const equipmentTypesController     = createMasterController(equipmentTypesService,     'Equipment Type');
export const acquisitionSourcesController = createMasterController(acquisitionSourcesService, 'Acquisition Source');
export const acquisitionMethodsController = createMasterController(acquisitionMethodsService, 'Acquisition Method');
export const buildingsController          = createMasterController(buildingsService,          'Building');
export const roomTypesController          = createMasterController(roomTypesService,          'Room Type');
export const planSectionsController       = createMasterController(planSectionsService,       'Plan Section');

export const roomsController = {
  ...createMasterController(roomsService, 'Room'),
  getByBuildingId: async (c: Context) => {
    try {
      const buildingId = parseInt(c.req.param('buildingId'));
      const data       = await roomsService.getByBuildingId(buildingId);
      return successResponse(c, data, 'Rooms retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
};