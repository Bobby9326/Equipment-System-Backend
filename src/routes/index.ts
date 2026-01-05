import { Hono } from 'hono';
import masters from './masters.routes.js';
import projects from './projects.routes.js';
import mhesi from './mhesi.routes.js';
import assets from './assets.routes.js';
import assetStatus from './asset-status.routes.js';
import attachments from './attachments.routes.js';

const routes = new Hono();

// API Routes
routes.route('/masters', masters);
routes.route('/projects', projects);
routes.route('/mhesi', mhesi);
routes.route('/assets', assets);
routes.route('/asset-status', assetStatus);
routes.route('/attachments', attachments);

// Health check
routes.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

export default routes;