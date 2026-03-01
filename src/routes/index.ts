import { Hono } from 'hono';
import masters from './masters.routes.js';
import projects from './projects.routes.js';
import mhesi from './mhesi.routes.js';
import equipment from './equipment.routes.js';
import equipmentStatus from './equipment-status.routes.js';
import attachments from './attachments.routes.js';
import auth from './auth.routes.js';
import { authMiddleware } from '../middlewares/auth.js';

const routes = new Hono();

routes.use('/masters/*', authMiddleware);
routes.use('/equipment/*', authMiddleware);
routes.use('/equipment-status/*', authMiddleware);
routes.use('/projects/*', authMiddleware);
routes.use('/mhesi/*', authMiddleware);
routes.use('/attachments/*', authMiddleware);

// API Routes
routes.route('/masters', masters);
routes.route('/projects', projects);
routes.route('/mhesi', mhesi);
routes.route('/equipment', equipment);
routes.route('/equipment-status', equipmentStatus);
routes.route('/attachments', attachments);
routes.route('/auth', auth);

// Health check
routes.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

export default routes;