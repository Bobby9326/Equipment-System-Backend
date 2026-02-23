import { Hono } from 'hono';
import {
  equipmentNormalsController,
  equipmentBorrowsController,
  equipmentRepairsController,
  equipmentUnavailableController,
  equipmentDisposalsController,
  equipmentStatusLogsController,
} from '../controllers/equipment-status.controller.js';

const equipmentStatus = new Hono();

// Equipment Normals
equipmentStatus.get('/normals', equipmentNormalsController.getAll);
equipmentStatus.get('/normals/:id', equipmentNormalsController.getById);
equipmentStatus.get('/normals/equipment/:equipmentId', equipmentNormalsController.getByEquipmentId);
equipmentStatus.post('/normals', equipmentNormalsController.create);
equipmentStatus.put('/normals/:id', equipmentNormalsController.update);
equipmentStatus.delete('/normals/:id', equipmentNormalsController.delete);

// Equipment Borrows
equipmentStatus.get('/borrows', equipmentBorrowsController.getAll);
equipmentStatus.get('/borrows/:id', equipmentBorrowsController.getById);
equipmentStatus.get('/borrows/equipment/:equipmentId', equipmentBorrowsController.getByEquipmentId);
equipmentStatus.post('/borrows', equipmentBorrowsController.create);
equipmentStatus.put('/borrows/:id', equipmentBorrowsController.update);
equipmentStatus.patch('/borrows/:id/return', equipmentBorrowsController.returnEquipment);
equipmentStatus.delete('/borrows/:id', equipmentBorrowsController.delete);

// Equipment Repairs
equipmentStatus.get('/repairs', equipmentRepairsController.getAll);
equipmentStatus.get('/repairs/:id', equipmentRepairsController.getById);
equipmentStatus.get('/repairs/equipment/:equipmentId', equipmentRepairsController.getByEquipmentId);
equipmentStatus.post('/repairs', equipmentRepairsController.create);
equipmentStatus.put('/repairs/:id', equipmentRepairsController.update);
equipmentStatus.delete('/repairs/:id', equipmentRepairsController.delete);

// Equipment Unavailable
equipmentStatus.get('/unavailable', equipmentUnavailableController.getAll);
equipmentStatus.get('/unavailable/:id', equipmentUnavailableController.getById);
equipmentStatus.get('/unavailable/equipment/:equipmentId', equipmentUnavailableController.getByEquipmentId);
equipmentStatus.post('/unavailable', equipmentUnavailableController.create);
equipmentStatus.put('/unavailable/:id', equipmentUnavailableController.update);
equipmentStatus.delete('/unavailable/:id', equipmentUnavailableController.delete);

// Equipment Disposals
equipmentStatus.get('/disposals', equipmentDisposalsController.getAll);
equipmentStatus.get('/disposals/:id', equipmentDisposalsController.getById);
equipmentStatus.get('/disposals/equipment/:equipmentId', equipmentDisposalsController.getByEquipmentId);
equipmentStatus.post('/disposals', equipmentDisposalsController.create);
equipmentStatus.put('/disposals/:id', equipmentDisposalsController.update);
equipmentStatus.delete('/disposals/:id', equipmentDisposalsController.delete);

// Equipment Status Logs (read + create only)
equipmentStatus.get('/logs', equipmentStatusLogsController.getAll);
equipmentStatus.get('/logs/equipment/:equipmentId', equipmentStatusLogsController.getByEquipmentId);
equipmentStatus.post('/logs', equipmentStatusLogsController.create);

export default equipmentStatus;