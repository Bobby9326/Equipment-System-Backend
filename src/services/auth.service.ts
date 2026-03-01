import { db } from '../config/database.js';
import { users, refreshTokens } from '../db/schema/index.js';
import { eq, and, gt, lt } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { BusinessError } from '../middlewares/error.js';
import env from '../config/env.js';

const googleClient = new OAuth2Client(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI
);

// ============================================================
// HELPERS
// ============================================================

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

const signAccessToken = (payload: { uuid: string; role: string; departmentId: number | null }) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });

const getRefreshExpiry = (): Date => {
  const d = new Date();
  d.setDate(d.getDate() + 7); // 7 days
  return d;
};

// ============================================================
// AUTH SERVICE
// ============================================================

export const authService = {
  // สร้าง Google OAuth URL สำหรับ redirect
  getGoogleAuthUrl: () => {
    return googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
      prompt: 'consent',
    });
  },

  // Exchange code → get Google profile → ตรวจสอบ user → สร้าง tokens
  handleGoogleCallback: async (code: string) => {
    // 1. Exchange code for tokens
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    // 2. Get Google user info
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userInfoRes.ok) throw new BusinessError('ไม่สามารถดึงข้อมูลจาก Google ได้');

    const googleUser = await userInfoRes.json() as {
      id: string;
      email: string;
      given_name: string;
      family_name: string;
    };

    // 3. ตรวจสอบ user ในระบบ (ไม่สร้างใหม่)
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, googleUser.email));

    if (!existingUser[0]) {
      throw new BusinessError('อีเมลนี้ไม่มีสิทธิ์เข้าใช้งานระบบ');
    }

    if (existingUser[0].deletedAt) {
      throw new BusinessError('บัญชีนี้ถูกระงับการใช้งาน');
    }

    const user = existingUser[0];

    // 4. สร้าง tokens
    const accessToken = signAccessToken({
      uuid: user.uuid,
      role: user.role ?? 'user',
      departmentId: user.departmentId ?? null,
    });

    const rawRefreshToken = randomUUID();
    const hashedRefreshToken = hashToken(rawRefreshToken);

    await db.insert(refreshTokens).values({
      userId: user.id,
      token: hashedRefreshToken,
      expiresAt: getRefreshExpiry(),
    });

    return { user, accessToken, refreshToken: rawRefreshToken };
  },

  // Refresh access token
  refreshAccessToken: async (rawRefreshToken: string) => {
    const hashed = hashToken(rawRefreshToken);
    const now = new Date();

    const result = await db
      .select({ id: refreshTokens.id, userId: refreshTokens.userId })
      .from(refreshTokens)
      .where(and(
        eq(refreshTokens.token, hashed),
        gt(refreshTokens.expiresAt, now)
      ));

    if (!result[0]) throw new BusinessError('Refresh token ไม่ถูกต้องหรือหมดอายุ');

    const user = await db
      .select({ id: users.id, uuid: users.uuid, role: users.role, departmentId: users.departmentId })
      .from(users)
      .where(eq(users.id, result[0].userId));

    if (!user[0]) throw new BusinessError('ไม่พบผู้ใช้งาน');

    const accessToken = signAccessToken({
      uuid: user[0].uuid,
      role: user[0].role ?? 'user',
      departmentId: user[0].departmentId ?? null,
    });

    return { accessToken };
  },

  // Logout — ลบ refresh token
  logout: async (rawRefreshToken: string) => {
    const hashed = hashToken(rawRefreshToken);
    await db.delete(refreshTokens).where(eq(refreshTokens.token, hashed));
  },

  // ลบ refresh token ที่หมดอายุทั้งหมด (cleanup)
  cleanupExpiredTokens: async () => {
    await db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, new Date()));
  },
};