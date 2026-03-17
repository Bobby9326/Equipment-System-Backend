import { randomUUID } from 'crypto';
import { db } from '../config/database.js';
import { users } from '../db/schema/index.js';
import { departments } from '../db/schema/index.js';
import { eq, like, and, isNull, desc } from 'drizzle-orm';
import { BusinessError } from '../middlewares/error.js';

const USER_SELECT = {
  uuid:         users.uuid,
  email:        users.email,
  firstName:    users.firstName,
  lastName:     users.lastName,
  role:         users.role,
  departmentId: users.departmentId,
  createdAt:    users.createdAt,
};

const USER_SELECT_WITH_DEPT = {
  uuid:           users.uuid,
  email:          users.email,
  firstName:      users.firstName,
  lastName:       users.lastName,
  role:           users.role,
  departmentId:   users.departmentId,
  departmentName: departments.name,
  createdAt:      users.createdAt,
};

export const usersService = {
  getAll: async (filters?: { search?: string; role?: string; departmentId?: number }) => {
    const conditions = [isNull(users.deletedAt)];

    if (filters?.search) {
      const s = `%${filters.search}%`;
      conditions.push(
        // search ชื่อ หรือ email
        eq(users.email, filters.search) as any ||
        like(users.firstName, s) as any ||
        like(users.lastName,  s) as any
      );
    }
    if (filters?.role)         conditions.push(eq(users.role,         filters.role));
    if (filters?.departmentId) conditions.push(eq(users.departmentId, filters.departmentId));

    return db
      .select(USER_SELECT_WITH_DEPT)
      .from(users)
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .where(and(...conditions))
      .orderBy(desc(users.createdAt));
  },

  getByUuid: async (uuid: string) => {
    const result = await db
      .select(USER_SELECT_WITH_DEPT)
      .from(users)
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .where(and(eq(users.uuid, uuid), isNull(users.deletedAt)));
    return result[0] || null;
  },

  create: async (data: {
    email:        string;
    firstName?:   string;
    lastName?:    string;
    role:         string;
    departmentId?: number;
  }) => {
    const VALID_ROLES = ['admin', 'manager', 'user'];
    if (!VALID_ROLES.includes(data.role)) {
      throw new BusinessError(`role ต้องเป็น: ${VALID_ROLES.join(', ')}`);
    }

    // ตรวจ email ซ้ำ
    const existing = await db
      .select({ uuid: users.uuid })
      .from(users)
      .where(eq(users.email, data.email));
    if (existing[0]) throw new BusinessError('email นี้มีในระบบแล้ว');

    const result = await db
      .insert(users)
      .values({ ...data, uuid: randomUUID() })
      .returning(USER_SELECT);
    return result[0];
  },

  updateByUuid: async (uuid: string, data: {
    firstName?:    string;
    lastName?:     string;
    role?:         string;
    departmentId?: number | null;
  }) => {
    const VALID_ROLES = ['admin', 'manager', 'user'];
    if (data.role && !VALID_ROLES.includes(data.role)) {
      throw new BusinessError(`role ต้องเป็น: ${VALID_ROLES.join(', ')}`);
    }

    const result = await db
      .update(users)
      .set(data)
      .where(and(eq(users.uuid, uuid), isNull(users.deletedAt)))
      .returning(USER_SELECT);
    return result[0] || null;
  },

  deleteByUuid: async (uuid: string) => {
    const result = await db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(and(eq(users.uuid, uuid), isNull(users.deletedAt)))
      .returning({ uuid: users.uuid });
    return result[0] || null;
  },
};