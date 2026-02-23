import { Hono } from 'hono';
import {
  departmentsController,
  activitiesController,
  fundsController,
  equipmentTypesController,
  acquisitionSourcesController,
  acquisitionMethodsController,
  buildingsController,
  roomsController,
  roomTypesController,
  supportUnitsController,
  planSectionsController,
  projectTypesController,
} from '../controllers/masters.controller.js';

const masters = new Hono();

// Departments
masters.get('/departments', departmentsController.getAll);
masters.get('/departments/:id', departmentsController.getById);

// Activities
masters.get('/activities', activitiesController.getAll);
masters.get('/activities/:id', activitiesController.getById);

// Funds
masters.get('/funds', fundsController.getAll);
masters.get('/funds/:id', fundsController.getById);

// Equipment Types
masters.get('/equipment-types', equipmentTypesController.getAll);
masters.get('/equipment-types/:id', equipmentTypesController.getById);

// Acquisition Sources
masters.get('/acquisition-sources', acquisitionSourcesController.getAll);
masters.get('/acquisition-sources/:id', acquisitionSourcesController.getById);

// Acquisition Methods
masters.get('/acquisition-methods', acquisitionMethodsController.getAll);
masters.get('/acquisition-methods/:id', acquisitionMethodsController.getById);

// Buildings
masters.get('/buildings', buildingsController.getAll);
masters.get('/buildings/:id', buildingsController.getById);

// Room Types
masters.get('/room-types', roomTypesController.getAll);
masters.get('/room-types/:id', roomTypesController.getById);

// Rooms
masters.get('/rooms', roomsController.getAll);
masters.get('/rooms/:id', roomsController.getById);
masters.get('/rooms/building/:buildingId', roomsController.getByBuildingId);

// Support Units
masters.get('/support-units', supportUnitsController.getAll);
masters.get('/support-units/:id', supportUnitsController.getById);

// Plan Sections
masters.get('/plan-sections', planSectionsController.getAll);
masters.get('/plan-sections/:id', planSectionsController.getById);

// Project Types
masters.get('/project-types', projectTypesController.getAll);
masters.get('/project-types/:id', projectTypesController.getById);

export default masters;