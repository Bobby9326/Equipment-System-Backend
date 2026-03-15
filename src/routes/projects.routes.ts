import { Hono } from 'hono';
import { projectsController } from '../controllers/projects.controller.js';

const projects = new Hono();

projects.get('/',               projectsController.getAll);
projects.get('/stats',          projectsController.getStats);
projects.get('/:uuid/history',  projectsController.getHistory);
projects.get('/:uuid',          projectsController.getByUuid);
projects.post('/',              projectsController.create);
projects.put('/:uuid',          projectsController.update);
projects.delete('/:uuid',       projectsController.delete);

export default projects;