import { Hono } from 'hono';
import {
  changeStatusController,
  equipmentBorrowsController,
  equipmentRepairsController,
  equipmentDisposalsController,
} from '../controllers/equipment-status.controller.js';

const equipmentStatus = new Hono();

// ── Change Status (เส้นหลัก) ─────────────────────────────────
equipmentStatus.post('/change', changeStatusController.change);

// ── Borrows ──────────────────────────────────────────────────
equipmentStatus.get('/borrows',                 equipmentBorrowsController.getAll);
equipmentStatus.get('/borrows/equipment/:uuid', equipmentBorrowsController.getByEquipmentUuid);
equipmentStatus.get('/borrows/:id',             equipmentBorrowsController.getById);
equipmentStatus.put('/borrows/:id',             equipmentBorrowsController.update);
equipmentStatus.delete('/borrows/:id',          equipmentBorrowsController.delete);

// ── Repairs ──────────────────────────────────────────────────
equipmentStatus.get('/repairs',                 equipmentRepairsController.getAll);
equipmentStatus.get('/repairs/equipment/:uuid', equipmentRepairsController.getByEquipmentUuid);
equipmentStatus.get('/repairs/:id',             equipmentRepairsController.getById);
equipmentStatus.put('/repairs/:id',             equipmentRepairsController.update);
equipmentStatus.delete('/repairs/:id',          equipmentRepairsController.delete);

// ── Disposals (archive, read only) ───────────────────────────
equipmentStatus.get('/disposals',               equipmentDisposalsController.getAll);
equipmentStatus.get('/disposals/:uuid',         equipmentDisposalsController.getByUuid);

export default equipmentStatus;