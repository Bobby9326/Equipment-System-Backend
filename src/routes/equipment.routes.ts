import { Hono } from 'hono';
import { equipmentController } from '../controllers/equipment.controller.js';
import { attachmentsController } from '../controllers/attachments.controller.js';

const equipment = new Hono();

equipment.get('/', equipmentController.getAll);
equipment.get('/stats',          equipmentController.getStats);
equipment.get('/stats/activity', equipmentController.getActivityStats);
equipment.get('/code/:code', equipmentController.getByCode);
equipment.get('/:uuid/history', equipmentController.getHistory);
equipment.get('/:uuid', equipmentController.getByUuid);
equipment.post('/', equipmentController.create);
equipment.put('/:uuid', equipmentController.update);
equipment.delete('/:uuid', equipmentController.delete);

// equipment.routes.ts
equipment.post('/attachments', attachmentsController.bulkUploadForEquipment);
equipment.post('/:uuid/attachments', attachmentsController.uploadForEquipment);
equipment.get('/:uuid/attachments', attachmentsController.getByEquipmentId);
equipment.delete('/:uuid/attachments/:attachmentId', attachmentsController.deleteById);
export default equipment;