import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export const authMiddleware = async (c: Context, next: Next) => {
  const token = getCookie(c, 'access_token');

  if (!token) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      uuid: string;
      role: string;
      departmentId: number | null;
    };
    c.set('user', payload);
    await next();
  } catch (err) {
    return c.json({ success: false, message: 'Token expired or invalid' }, 401);
  }
};

// Middleware เช็ค role
export const requireRole = (...roles: string[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    if (!user || !roles.includes(user.role)) {
      return c.json({ success: false, message: 'Forbidden' }, 403);
    }
    await next();
  };
};