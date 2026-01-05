import { serve } from '@hono/node-server';
import app from './app.js';
import env from './config/env.js';

const port = parseInt(env.PORT);

console.log(`🚀 Starting Asset Management API...`);
console.log(`📝 Environment: ${env.NODE_ENV}`);
console.log(`🔗 Database: ${env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'Connected'}`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ Server is running on http://localhost:${port}`);
console.log(`📚 API Documentation: http://localhost:${port}/docs`);
console.log(`💚 Health Check: http://localhost:${port}/api/health`);