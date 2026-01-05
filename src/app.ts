import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import { corsConfig } from './middlewares/cors.js';
import { loggerMiddleware } from './middlewares/logger.js';
import { errorHandler } from './middlewares/error.js';
import routes from './routes/index.js';
import { swaggerConfig } from './config/swagger.js';

const app = new Hono();

// Global Middlewares
app.use('*', corsConfig);
app.use('*', loggerMiddleware);
app.use('*', errorHandler);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Asset Management API',
    version: '1.0.0',
    documentation: '/docs',
    health: '/api/health',
  });
});

// Swagger Documentation
app.get('/swagger.json', (c) => {
  return c.json(swaggerConfig);
});

app.get('/docs', swaggerUI({ url: '/swagger.json' }));

// API Routes
app.route('/api', routes);

// 404 Handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      message: 'Route not found',
      path: c.req.path,
    },
    404
  );
});

export default app;