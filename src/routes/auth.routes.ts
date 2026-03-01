import { Hono } from 'hono';
import { authController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.js';

const auth = new Hono();

auth.get('/google', authController.googleLogin);
auth.get('/google/callback', authController.googleCallback);
auth.post('/refresh', authController.refresh);
auth.post('/logout', authController.logout);
auth.get('/me', authMiddleware, authController.me);

export default auth;