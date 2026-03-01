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

// Change Status — เส้นหลักสำหรับเปลี่ยนสถานะ
equipmentStatus.post('/change', changeStatusController.change);

// Equipment Normals — GET / PUT / DELETE เท่านั้น
equipmentStatus.get('/normals', equipmentNormalsController.getAll);
equipmentStatus.get('/normals/equipment/:equipmentId', equipmentNormalsController.getByEquipmentId);
equipmentStatus.get('/normals/:id', equipmentNormalsController.getById);
equipmentStatus.put('/normals/:id', equipmentNormalsController.update);
equipmentStatus.delete('/normals/:id', equipmentNormalsController.delete);

// Equipment Borrows — GET / PUT / DELETE เท่านั้น
equipmentStatus.get('/borrows', equipmentBorrowsController.getAll);
equipmentStatus.get('/borrows/equipment/:equipmentId', equipmentBorrowsController.getByEquipmentId);
equipmentStatus.get('/borrows/:id', equipmentBorrowsController.getById);
equipmentStatus.put('/borrows/:id', equipmentBorrowsController.update);
equipmentStatus.delete('/borrows/:id', equipmentBorrowsController.delete);

// Equipment Repairs — GET / PUT / DELETE เท่านั้น
equipmentStatus.get('/repairs', equipmentRepairsController.getAll);
equipmentStatus.get('/repairs/equipment/:equipmentId', equipmentRepairsController.getByEquipmentId);
equipmentStatus.get('/repairs/:id', equipmentRepairsController.getById);
equipmentStatus.put('/repairs/:id', equipmentRepairsController.update);
equipmentStatus.delete('/repairs/:id', equipmentRepairsController.delete);

// Equipment Unavailable — GET / PUT / DELETE เท่านั้น
equipmentStatus.get('/unavailable', equipmentUnavailableController.getAll);
equipmentStatus.get('/unavailable/equipment/:equipmentId', equipmentUnavailableController.getByEquipmentId);
equipmentStatus.get('/unavailable/:id', equipmentUnavailableController.getById);
equipmentStatus.put('/unavailable/:id', equipmentUnavailableController.update);
equipmentStatus.delete('/unavailable/:id', equipmentUnavailableController.delete);

// Equipment Disposals — GET / PUT / DELETE เท่านั้น
equipmentStatus.get('/disposals', equipmentDisposalsController.getAll);
equipmentStatus.get('/disposals/equipment/:equipmentId', equipmentDisposalsController.getByEquipmentId);
equipmentStatus.get('/disposals/:id', equipmentDisposalsController.getById);
equipmentStatus.put('/disposals/:id', equipmentDisposalsController.update);
equipmentStatus.delete('/disposals/:id', equipmentDisposalsController.delete);

// Equipment Status Logs — GET เท่านั้น (สร้างอัตโนมัติผ่าน /change)
equipmentStatus.get('/logs', equipmentStatusLogsController.getAll);
equipmentStatus.get('/logs/equipment/:equipmentId', equipmentStatusLogsController.getByEquipmentId);

export default equipmentStatus;