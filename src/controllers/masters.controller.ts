import { Context } from 'hono';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  departmentsService,
  activitiesService,
  fundsService,
  assetTypesService,
  acquisitionSourcesService,
  acquisitionMethodsService,
  buildingsService,
  roomsService,
  facultiesService,
  supportUnitsService,
  plansService,
} from '../services/masters.service.js';

// Generic controller factory for master tables
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
      const id = parseInt(c.req.param('id'));
      const data = await service.getById(id);
      
      if (!data) {
        return errorResponse(c, `${name} not found`, 404);
      }
      
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
      
      if (!data) {
        return errorResponse(c, `${name} not found`, 404);
      }
      
      return successResponse(c, data, `${name} updated successfully`);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  delete: async (c: Context) => {
    try {
      const id = parseInt(c.req.param('id'));
      const data = await service.delete(id);
      
      if (!data) {
        return errorResponse(c, `${name} not found`, 404);
      }
      
      return successResponse(c, data, `${name} deleted successfully`);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
});

export const departmentsController = createMasterController(departmentsService, 'Department');
export const activitiesController = createMasterController(activitiesService, 'Activity');
export const fundsController = createMasterController(fundsService, 'Fund');
export const assetTypesController = createMasterController(assetTypesService, 'Asset Type');
export const acquisitionSourcesController = createMasterController(acquisitionSourcesService, 'Acquisition Source');
export const acquisitionMethodsController = createMasterController(acquisitionMethodsService, 'Acquisition Method');
export const buildingsController = createMasterController(buildingsService, 'Building');
export const facultiesController = createMasterController(facultiesService, 'Faculty');
export const supportUnitsController = createMasterController(supportUnitsService, 'Support Unit');
export const plansController = createMasterController(plansService, 'Plan');

// Rooms controller with additional method
export const roomsController = {
  ...createMasterController(roomsService, 'Room'),
  
  getByBuildingId: async (c: Context) => {
    try {
      const buildingId = parseInt(c.req.param('buildingId'));
      const data = await roomsService.getByBuildingId(buildingId);
      return successResponse(c, data, 'Rooms retrieved successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
};