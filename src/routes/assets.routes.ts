import { Hono } from 'hono';
import { assetsController } from '../controllers/assets.controller.js';

const assets = new Hono();

assets.get('/', assetsController.getAll);
assets.get('/stats', assetsController.getStats);
assets.get('/:id', assetsController.getById);
assets.get('/code/:code', assetsController.getByCode);
assets.post('/', assetsController.create);
assets.put('/:id', assetsController.update);
assets.patch('/:id/status', assetsController.updateStatus);
assets.delete('/:id', assetsController.delete);

export default assets;