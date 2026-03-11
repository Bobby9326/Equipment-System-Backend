import { Hono } from 'hono';
import {
  changeStatusController,
  equipmentNormalsController,
  equipmentBorrowsController,
  equipmentRepairsController,
  equipmentUnavailableController,
  equipmentDisposalsController,
  equipmentStatusLogsController,
} from '../controllers/equipment-status.controller.js';

const equipmentStatus = new Hono();

// Change Status — เส้นหลัก
equipmentStatus.post('/change', changeStatusController.change);

// Equipment Normals
equipmentStatus.get('/normals',                          equipmentNormalsController.getAll);
equipmentStatus.get('/normals/equipment/:uuid',          equipmentNormalsController.getByEquipmentUuid);
equipmentStatus.get('/normals/:id',                      equipmentNormalsController.getById);
equipmentStatus.put('/normals/:id',                      equipmentNormalsController.update);
equipmentStatus.delete('/normals/:id',                   equipmentNormalsController.delete);

// Equipment Borrows
equipmentStatus.get('/borrows',                          equipmentBorrowsController.getAll);
equipmentStatus.get('/borrows/equipment/:uuid',          equipmentBorrowsController.getByEquipmentUuid);
equipmentStatus.get('/borrows/:id',                      equipmentBorrowsController.getById);
equipmentStatus.put('/borrows/:id',                      equipmentBorrowsController.update);
equipmentStatus.delete('/borrows/:id',                   equipmentBorrowsController.delete);

// Equipment Repairs
equipmentStatus.get('/repairs',                          equipmentRepairsController.getAll);
equipmentStatus.get('/repairs/equipment/:uuid',          equipmentRepairsController.getByEquipmentUuid);
equipmentStatus.get('/repairs/:id',                      equipmentRepairsController.getById);
equipmentStatus.put('/repairs/:id',                      equipmentRepairsController.update);
equipmentStatus.delete('/repairs/:id',                   equipmentRepairsController.delete);

// Equipment Unavailable
equipmentStatus.get('/unavailable',                      equipmentUnavailableController.getAll);
equipmentStatus.get('/unavailable/equipment/:uuid',      equipmentUnavailableController.getByEquipmentUuid);
equipmentStatus.get('/unavailable/:id',                  equipmentUnavailableController.getById);
equipmentStatus.put('/unavailable/:id',                  equipmentUnavailableController.update);
equipmentStatus.delete('/unavailable/:id',               equipmentUnavailableController.delete);

// Equipment Disposals
equipmentStatus.get('/disposals',                        equipmentDisposalsController.getAll);
equipmentStatus.get('/disposals/equipment/:uuid',        equipmentDisposalsController.getByEquipmentUuid);
equipmentStatus.get('/disposals/:id',                    equipmentDisposalsController.getById);
equipmentStatus.put('/disposals/:id',                    equipmentDisposalsController.update);
equipmentStatus.delete('/disposals/:id',                 equipmentDisposalsController.delete);

// Status Logs (read only)
equipmentStatus.get('/logs',                             equipmentStatusLogsController.getAll);
equipmentStatus.get('/logs/equipment/:uuid',             equipmentStatusLogsController.getByEquipmentUuid);

export default equipmentStatus;