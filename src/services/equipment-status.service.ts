import { db } from '../config/database.js';
import {
  equipmentNormals,
  equipmentBorrows,
  equipmentRepairs,
  equipmentUnavailable,
  equipmentDisposals,
  equipmentStatusLogs,
} from '../db/schema/index.js';
import { eq } from 'drizzle-orm';

// Equipment Normals Service
export const equipmentNormalsService = {
  getAll: async () => await db.select().from(equipmentNormals),

  getByEquipmentId: async (equipmentId: number) =>
    await db.select().from(equipmentNormals).where(eq(equipmentNormals.equipmentId, equipmentId)),

  getById: async (id: number) => {
    const result = await db.select().from(equipmentNormals).where(eq(equipmentNormals.id, id));
    return result[0] || null;
  },

  create: async (data: typeof equipmentNormals.$inferInsert) => {
    const result = await db.insert(equipmentNormals).values(data).returning();
    return result[0];
  },

  update: async (id: number, data: Partial<typeof equipmentNormals.$inferInsert>) => {
    const result = await db.update(equipmentNormals).set(data).where(eq(equipmentNormals.id, id)).returning();
    return result[0] || null;
  },

  delete: async (id: number) => {
    const result = await db.delete(equipmentNormals).where(eq(equipmentNormals.id, id)).returning();
    return result[0] || null;
  },
};

// Equipment Borrows Service
export const equipmentBorrowsService = {
  getAll: async () => await db.select().from(equipmentBorrows),

  getByEquipmentId: async (equipmentId: number) =>
    await db.select().from(equipmentBorrows).where(eq(equipmentBorrows.equipmentId, equipmentId)),

  getById: async (id: number) => {
    const result = await db.select().from(equipmentBorrows).where(eq(equipmentBorrows.id, id));
    return result[0] || null;
  },

  create: async (data: typeof equipmentBorrows.$inferInsert) => {
    const result = await db.insert(equipmentBorrows).values(data).returning();
    return result[0];
  },

  update: async (id: number, data: Partial<typeof equipmentBorrows.$inferInsert>) => {
    const result = await db.update(equipmentBorrows).set(data).where(eq(equipmentBorrows.id, id)).returning();
    return result[0] || null;
  },

  delete: async (id: number) => {
    const result = await db.delete(equipmentBorrows).where(eq(equipmentBorrows.id, id)).returning();
    return result[0] || null;
  },

  returnEquipment: async (id: number, actualReturnDate: Date) => {
    const result = await db.update(equipmentBorrows)
      .set({ actualReturnDate: actualReturnDate.toISOString().split('T')[0] })
      .where(eq(equipmentBorrows.id, id))
      .returning();
    return result[0] || null;
  },
};

// Equipment Repairs Service
export const equipmentRepairsService = {
  getAll: async () => await db.select().from(equipmentRepairs),

  getByEquipmentId: async (equipmentId: number) =>
    await db.select().from(equipmentRepairs).where(eq(equipmentRepairs.equipmentId, equipmentId)),

  getById: async (id: number) => {
    const result = await db.select().from(equipmentRepairs).where(eq(equipmentRepairs.id, id));
    return result[0] || null;
  },

  create: async (data: typeof equipmentRepairs.$inferInsert) => {
    const result = await db.insert(equipmentRepairs).values(data).returning();
    return result[0];
  },

  update: async (id: number, data: Partial<typeof equipmentRepairs.$inferInsert>) => {
    const result = await db.update(equipmentRepairs).set(data).where(eq(equipmentRepairs.id, id)).returning();
    return result[0] || null;
  },

  delete: async (id: number) => {
    const result = await db.delete(equipmentRepairs).where(eq(equipmentRepairs.id, id)).returning();
    return result[0] || null;
  },
};

// Equipment Unavailable Service
export const equipmentUnavailableService = {
  getAll: async () => await db.select().from(equipmentUnavailable),

  getByEquipmentId: async (equipmentId: number) =>
    await db.select().from(equipmentUnavailable).where(eq(equipmentUnavailable.equipmentId, equipmentId)),

  getById: async (id: number) => {
    const result = await db.select().from(equipmentUnavailable).where(eq(equipmentUnavailable.id, id));
    return result[0] || null;
  },

  create: async (data: typeof equipmentUnavailable.$inferInsert) => {
    const result = await db.insert(equipmentUnavailable).values(data).returning();
    return result[0];
  },

  update: async (id: number, data: Partial<typeof equipmentUnavailable.$inferInsert>) => {
    const result = await db.update(equipmentUnavailable).set(data).where(eq(equipmentUnavailable.id, id)).returning();
    return result[0] || null;
  },

  delete: async (id: number) => {
    const result = await db.delete(equipmentUnavailable).where(eq(equipmentUnavailable.id, id)).returning();
    return result[0] || null;
  },
};

// Equipment Disposals Service
export const equipmentDisposalsService = {
  getAll: async () => await db.select().from(equipmentDisposals),

  getByEquipmentId: async (equipmentId: number) =>
    await db.select().from(equipmentDisposals).where(eq(equipmentDisposals.equipmentId, equipmentId)),

  getById: async (id: number) => {
    const result = await db.select().from(equipmentDisposals).where(eq(equipmentDisposals.id, id));
    return result[0] || null;
  },

  create: async (data: typeof equipmentDisposals.$inferInsert) => {
    const result = await db.insert(equipmentDisposals).values(data).returning();
    return result[0];
  },

  update: async (id: number, data: Partial<typeof equipmentDisposals.$inferInsert>) => {
    const result = await db.update(equipmentDisposals).set(data).where(eq(equipmentDisposals.id, id)).returning();
    return result[0] || null;
  },

  delete: async (id: number) => {
    const result = await db.delete(equipmentDisposals).where(eq(equipmentDisposals.id, id)).returning();
    return result[0] || null;
  },
};

// Equipment Status Logs Service
export const equipmentStatusLogsService = {
  getAll: async () => await db.select().from(equipmentStatusLogs),

  getByEquipmentId: async (equipmentId: number) =>
    await db.select().from(equipmentStatusLogs).where(eq(equipmentStatusLogs.equipmentId, equipmentId)),

  create: async (data: typeof equipmentStatusLogs.$inferInsert) => {
    const result = await db.insert(equipmentStatusLogs).values(data).returning();
    return result[0];
  },
};