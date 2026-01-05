import { Context } from 'hono';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  assetBorrowsService,
  assetRepairsService,
  assetUnavailableService,
  assetDisposalsService,
} from '../services/asset-status.service.js';

// Generic controller factory for asset status tables
const createAssetStatusController = (service: any, name: string) => ({
  getAll: async (c: Context) => {
    try {
      const data = await service.getAll();
      return successResponse(c, data, `${name} retrieved successfully`);
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  getByAssetId: async (c: Context) => {
    try {
      const assetId = parseInt(c.req.param('assetId'));
      const data = await service.getByAssetId(assetId);
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

export const assetBorrowsController = {
  ...createAssetStatusController(assetBorrowsService, 'Asset Borrow'),
  
  returnAsset: async (c: Context) => {
    try {
      const id = parseInt(c.req.param('id'));
      const { actualReturnDate } = await c.req.json();
      
      if (!actualReturnDate) {
        return errorResponse(c, 'Actual return date is required', 400);
      }
      
      const data = await assetBorrowsService.returnAsset(id, new Date(actualReturnDate));
      
      if (!data) {
        return errorResponse(c, 'Asset borrow not found', 404);
      }
      
      return successResponse(c, data, 'Asset returned successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },
};

export const assetRepairsController = createAssetStatusController(assetRepairsService, 'Asset Repair');
export const assetUnavailableController = createAssetStatusController(assetUnavailableService, 'Asset Unavailable');
export const assetDisposalsController = createAssetStatusController(assetDisposalsService, 'Asset Disposal');