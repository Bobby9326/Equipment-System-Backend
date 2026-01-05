import { Hono } from 'hono';
import {
  departmentsController,
  activitiesController,
  fundsController,
  assetTypesController,
  acquisitionSourcesController,
  acquisitionMethodsController,
  buildingsController,
  roomsController,
  facultiesController,
  supportUnitsController,
  plansController,
} from '../controllers/masters.controller.js';

const masters = new Hono();

// Departments
masters.get('/departments', departmentsController.getAll);
masters.get('/departments/:id', departmentsController.getById);
masters.post('/departments', departmentsController.create);
masters.put('/departments/:id', departmentsController.update);
masters.delete('/departments/:id', departmentsController.delete);

// Activities
masters.get('/activities', activitiesController.getAll);
masters.get('/activities/:id', activitiesController.getById);
masters.post('/activities', activitiesController.create);
masters.put('/activities/:id', activitiesController.update);
masters.delete('/activities/:id', activitiesController.delete);

// Funds
masters.get('/funds', fundsController.getAll);
masters.get('/funds/:id', fundsController.getById);
masters.post('/funds', fundsController.create);
masters.put('/funds/:id', fundsController.update);
masters.delete('/funds/:id', fundsController.delete);

// Asset Types
masters.get('/asset-types', assetTypesController.getAll);
masters.get('/asset-types/:id', assetTypesController.getById);
masters.post('/asset-types', assetTypesController.create);
masters.put('/asset-types/:id', assetTypesController.update);
masters.delete('/asset-types/:id', assetTypesController.delete);

// Acquisition Sources
masters.get('/acquisition-sources', acquisitionSourcesController.getAll);
masters.get('/acquisition-sources/:id', acquisitionSourcesController.getById);
masters.post('/acquisition-sources', acquisitionSourcesController.create);
masters.put('/acquisition-sources/:id', acquisitionSourcesController.update);
masters.delete('/acquisition-sources/:id', acquisitionSourcesController.delete);

// Acquisition Methods
masters.get('/acquisition-methods', acquisitionMethodsController.getAll);
masters.get('/acquisition-methods/:id', acquisitionMethodsController.getById);
masters.post('/acquisition-methods', acquisitionMethodsController.create);
masters.put('/acquisition-methods/:id', acquisitionMethodsController.update);
masters.delete('/acquisition-methods/:id', acquisitionMethodsController.delete);

// Buildings
masters.get('/buildings', buildingsController.getAll);
masters.get('/buildings/:id', buildingsController.getById);
masters.post('/buildings', buildingsController.create);
masters.put('/buildings/:id', buildingsController.update);
masters.delete('/buildings/:id', buildingsController.delete);

// Rooms
masters.get('/rooms', roomsController.getAll);
masters.get('/rooms/:id', roomsController.getById);
masters.get('/rooms/building/:buildingId', roomsController.getByBuildingId);
masters.post('/rooms', roomsController.create);
masters.put('/rooms/:id', roomsController.update);
masters.delete('/rooms/:id', roomsController.delete);

// Faculties
masters.get('/faculties', facultiesController.getAll);
masters.get('/faculties/:id', facultiesController.getById);
masters.post('/faculties', facultiesController.create);
masters.put('/faculties/:id', facultiesController.update);
masters.delete('/faculties/:id', facultiesController.delete);

// Support Units
masters.get('/support-units', supportUnitsController.getAll);
masters.get('/support-units/:id', supportUnitsController.getById);
masters.post('/support-units', supportUnitsController.create);
masters.put('/support-units/:id', supportUnitsController.update);
masters.delete('/support-units/:id', supportUnitsController.delete);

// Plans
masters.get('/plans', plansController.getAll);
masters.get('/plans/:id', plansController.getById);
masters.post('/plans', plansController.create);
masters.put('/plans/:id', plansController.update);
masters.delete('/plans/:id', plansController.delete);

export default masters;