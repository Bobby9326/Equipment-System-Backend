import { Hono } from 'hono';
import { projectsController } from '../controllers/projects.controller.js';

const projects = new Hono();

projects.get('/', projectsController.getAll);
projects.get('/stats', projectsController.getStats);
projects.get('/:id', projectsController.getById);
projects.post('/', projectsController.create);
projects.put('/:id', projectsController.update);
projects.delete('/:id', projectsController.delete);

export default projects;