import { cors } from 'hono/cors';

export const corsConfig = cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 600,
  credentials: true,
});