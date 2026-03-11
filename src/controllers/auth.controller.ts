import { Context } from 'hono';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import { authService } from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import env from '../config/env.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'Lax' as const,
  path: '/',
};

export const authController = {
  // GET /api/auth/google — redirect ไป Google
  googleLogin: (c: Context) => {
    const url = authService.getGoogleAuthUrl();
    return c.redirect(url);
  },

  // GET /api/auth/google/callback — Google redirect กลับมา
  googleCallback: async (c: Context) => {
    try {
      const code = c.req.query('code');
      if (!code) return c.redirect(`${env.FRONTEND_URL}/login?error=no_code`);

      const { accessToken, refreshToken } = await authService.handleGoogleCallback(code);

      // Set cookies
      setCookie(c, 'access_token', accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 60 * 15, // 15 นาที
      });
      setCookie(c, 'refresh_token', refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 60 * 60 * 24 * 7, // 7 วัน
      });

      return c.redirect(`${env.FRONTEND_URL}/auth/callback?success=true`);
    } catch (error: any) {
      return c.redirect(`${env.FRONTEND_URL}/login?error=${encodeURIComponent(error.message)}`);
    }
  },

  // POST /api/auth/refresh — ขอ access token ใหม่
  refresh: async (c: Context) => {
    try {
      const refreshToken = getCookie(c, 'refresh_token');
      if (!refreshToken) return errorResponse(c, 'Refresh token not found', 401);

      const { accessToken } = await authService.refreshAccessToken(refreshToken);

      setCookie(c, 'access_token', accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 60 * 15,
      });

      return successResponse(c, null, 'Token refreshed successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 401);
    }
  },

  // POST /api/auth/logout
  logout: async (c: Context) => {
    try {
      const refreshToken = getCookie(c, 'refresh_token');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      deleteCookie(c, 'access_token');
      deleteCookie(c, 'refresh_token');

      return successResponse(c, null, 'Logged out successfully');
    } catch (error: any) {
      return errorResponse(c, error.message, 500);
    }
  },

  // GET /api/auth/me — ดึงข้อมูล user ปัจจุบัน
  me: async (c: Context) => {
    const user = c.get('user')
    const profile = await authService.getProfile(user.uuid)
    if (!profile) return errorResponse(c, 'User not found', 404)
    return successResponse(c, profile)
  }
};