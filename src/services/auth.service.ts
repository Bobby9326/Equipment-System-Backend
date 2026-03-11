import { db } from '../config/database.js';
import { users, refreshTokens, departments } from '../db/schema/index.js';
import { eq, and, gt, lt, isNull } from 'drizzle-orm';
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
  d.setDate(d.getDate() + 7);
  return d;
};

// ============================================================
// AUTH SERVICE
// ============================================================

export const authService = {

  getGoogleAuthUrl: () => {
    return googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
      prompt: 'consent',
    });
  },

  handleGoogleCallback: async (code: string) => {
    // 1. Exchange code → Google tokens
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    // 2. Get Google user info
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userInfoRes.ok) throw new BusinessError('ไม่สามารถดึงข้อมูลจาก Google ได้');

    const googleUser = await userInfoRes.json() as {
      email: string;
      given_name: string;
      family_name: string;
    };

    // 3. หา user จาก email — ต้องมีในระบบก่อน (admin เพิ่มให้)
    const existing = await db
      .select()
      .from(users)
      .where(and(
        eq(users.email, googleUser.email),
        isNull(users.deletedAt)
      ));

    if (!existing[0]) throw new BusinessError('ไม่พบบัญชีผู้ใช้งานในระบบ กรุณาติดต่อผู้ดูแล');

    const user = existing[0];

    // 4. สร้าง tokens
    const accessToken = signAccessToken({
      uuid:         user.uuid,
      role:         user.role,
      departmentId: user.departmentId ?? null,
    });

    const rawRefreshToken = randomUUID();
    await db.insert(refreshTokens).values({
      userId:    user.id,
      token:     hashToken(rawRefreshToken),
      expiresAt: getRefreshExpiry(),
    });

    return { user, accessToken, refreshToken: rawRefreshToken };
  },

  // ดึงข้อมูล profile เต็ม — ใช้กับ GET /auth/me และหน้า profile
  getProfile: async (userUuid: string) => {
    const result = await db
      .select({
        uuid:           users.uuid,
        email:          users.email,
        firstName:      users.firstName,
        lastName:       users.lastName,
        role:           users.role,
        departmentId:   users.departmentId,
        departmentName: departments.name,
        createdAt:      users.createdAt,
      })
      .from(users)
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .where(and(
        eq(users.uuid, userUuid),
        isNull(users.deletedAt)
      ));

    return result[0] || null;
  },

  // Refresh access token
  refreshAccessToken: async (rawRefreshToken: string) => {
    const hashed = hashToken(rawRefreshToken);

    const result = await db
      .select({ userId: refreshTokens.userId })
      .from(refreshTokens)
      .where(and(
        eq(refreshTokens.token, hashed),
        gt(refreshTokens.expiresAt, new Date())
      ));

    if (!result[0]) throw new BusinessError('Refresh token ไม่ถูกต้องหรือหมดอายุ');

    const user = await db
      .select({ uuid: users.uuid, role: users.role, departmentId: users.departmentId })
      .from(users)
      .where(and(
        eq(users.id, result[0].userId),
        isNull(users.deletedAt)
      ));

    if (!user[0]) throw new BusinessError('ไม่พบผู้ใช้งาน');

    const accessToken = signAccessToken({
      uuid:         user[0].uuid,
      role:         user[0].role,
      departmentId: user[0].departmentId ?? null,
    });

    return { accessToken };
  },

  logout: async (rawRefreshToken: string) => {
    await db.delete(refreshTokens).where(
      eq(refreshTokens.token, hashToken(rawRefreshToken))
    );
  },

  cleanupExpiredTokens: async () => {
    await db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, new Date()));
  },
};