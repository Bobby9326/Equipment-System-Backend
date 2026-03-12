import { Hono } from 'hono';
import { mhesiController } from '../controllers/mhesi.controller.js';

const mhesi = new Hono();

mhesi.get('/', mhesiController.getAll);
mhesi.get('/:uuid', mhesiController.getByUuid)
mhesi.get('/project/:projectId', mhesiController.getByProjectId);
mhesi.post('/', mhesiController.create);
mhesi.put('/:uuid', mhesiController.update)
mhesi.delete('/:uuid', mhesiController.delete)

export default mhesi;