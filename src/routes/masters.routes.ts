import { Hono } from 'hono';
import {
  departmentsController,
  fundsController,
  equipmentTypesController,
  acquisitionSourcesController,
  acquisitionMethodsController,
  buildingsController,
  roomsController,
  roomTypesController,
  planSectionsController,
} from '../controllers/masters.controller.js';

const masters = new Hono();

masters.get('/departments',           departmentsController.getAll);
masters.get('/departments/:id',       departmentsController.getById);

masters.get('/funds',                 fundsController.getAll);
masters.get('/funds/:id',             fundsController.getById);

masters.get('/equipment-types',       equipmentTypesController.getAll);
masters.get('/equipment-types/:id',   equipmentTypesController.getById);

masters.get('/acquisition-sources',   acquisitionSourcesController.getAll);
masters.get('/acquisition-sources/:id', acquisitionSourcesController.getById);

masters.get('/acquisition-methods',   acquisitionMethodsController.getAll);
masters.get('/acquisition-methods/:id', acquisitionMethodsController.getById);

masters.get('/buildings',             buildingsController.getAll);
masters.get('/buildings/:id',         buildingsController.getById);

masters.get('/room-types',            roomTypesController.getAll);
masters.get('/room-types/:id',        roomTypesController.getById);

masters.get('/rooms',                 roomsController.getAll);
masters.get('/rooms/:id',             roomsController.getById);
masters.get('/rooms/building/:buildingId', roomsController.getByBuildingId);

masters.get('/plan-sections',         planSectionsController.getAll);
masters.get('/plan-sections/:id',     planSectionsController.getById);

export default masters;