import { Hono } from 'hono';
import { equipmentController } from '../controllers/equipment.controller.js';

const assets = new Hono();

assets.get('/', equipmentController.getAll);
assets.get('/stats', equipmentController.getStats);
assets.get('/:id', equipmentController.getById);
assets.get('/code/:code', equipmentController.getByCode);
assets.post('/', equipmentController.create);
assets.put('/:id', equipmentController.update);
assets.patch('/:id/status', equipmentController.updateStatus);
assets.delete('/:id', equipmentController.delete);

export default assets;