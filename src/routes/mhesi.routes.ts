import { Hono } from 'hono';
import { mhesiController } from '../controllers/mhesi.controller.js';

const mhesi = new Hono();

mhesi.get('/', mhesiController.getAll);
mhesi.get('/:id', mhesiController.getById);
mhesi.get('/project/:projectId', mhesiController.getByProjectId);
mhesi.post('/', mhesiController.create);
mhesi.put('/:id', mhesiController.update);
mhesi.delete('/:id', mhesiController.delete);

export default mhesi;