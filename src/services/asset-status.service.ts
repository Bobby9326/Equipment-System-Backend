import { db } from '../config/database.js';
import { assetBorrows, assetRepairs, assetUnavailable, assetDisposals } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';

// Asset Borrows Service
export const assetBorrowsService = {
  getAll: async () => await db.select().from(assetBorrows),

  getByAssetId: async (assetId: number) => {
    return await db.select().from(assetBorrows).where(eq(assetBorrows.assetId, assetId));
  },

  getById: async (id: number) => {
    const result = await db.select().from(assetBorrows).where(eq(assetBorrows.id, id));
    return result[0] || null;
  },

  create: async (data: typeof assetBorrows.$inferInsert) => {
    const result = await db.insert(assetBorrows).values(data).returning();
    return result[0];
  },

  update: async (id: number, data: Partial<typeof assetBorrows.$inferInsert>) => {
    const result = await db.update(assetBorrows)
      .set(data)
      .where(eq(assetBorrows.id, id))
      .returning();
    return result[0] || null;
  },

  delete: async (id: number) => {
    const result = await db.delete(assetBorrows).where(eq(assetBorrows.id, id)).returning();
    return result[0] || null;
  },

  returnAsset: async (id: number, actualReturnDate: Date) => {
    const result = await db.update(assetBorrows)
      .set({ actualReturnDate: actualReturnDate.toISOString().split('T')[0] })
      .where(eq(assetBorrows.id, id))
      .returning();
    return result[0] || null;
  },
};

// Asset Repairs Service
export const assetRepairsService = {
  getAll: async () => await db.select().from(assetRepairs),

  getByAssetId: async (assetId: number) => {
    return await db.select().from(assetRepairs).where(eq(assetRepairs.assetId, assetId));
  },

  getById: async (id: number) => {
    const result = await db.select().from(assetRepairs).where(eq(assetRepairs.id, id));
    return result[0] || null;
  },

  create: async (data: typeof assetRepairs.$inferInsert) => {
    const result = await db.insert(assetRepairs).values(data).returning();
    return result[0];
  },

  update: async (id: number, data: Partial<typeof assetRepairs.$inferInsert>) => {
    const result = await db.update(assetRepairs)
      .set(data)
      .where(eq(assetRepairs.id, id))
      .returning();
    return result[0] || null;
  },

  delete: async (id: number) => {
    const result = await db.delete(assetRepairs).where(eq(assetRepairs.id, id)).returning();
    return result[0] || null;
  },
};

// Asset Unavailable Service
export const assetUnavailableService = {
  getAll: async () => await db.select().from(assetUnavailable),

  getByAssetId: async (assetId: number) => {
    return await db.select().from(assetUnavailable).where(eq(assetUnavailable.assetId, assetId));
  },

  getById: async (id: number) => {
    const result = await db.select().from(assetUnavailable).where(eq(assetUnavailable.id, id));
    return result[0] || null;
  },

  create: async (data: typeof assetUnavailable.$inferInsert) => {
    const result = await db.insert(assetUnavailable).values(data).returning();
    return result[0];
  },

  update: async (id: number, data: Partial<typeof assetUnavailable.$inferInsert>) => {
    const result = await db.update(assetUnavailable)
      .set(data)
      .where(eq(assetUnavailable.id, id))
      .returning();
    return result[0] || null;
  },

  delete: async (id: number) => {
    const result = await db.delete(assetUnavailable).where(eq(assetUnavailable.id, id)).returning();
    return result[0] || null;
  },
};

// Asset Disposals Service
export const assetDisposalsService = {
  getAll: async () => await db.select().from(assetDisposals),

  getByAssetId: async (assetId: number) => {
    return await db.select().from(assetDisposals).where(eq(assetDisposals.assetId, assetId));
  },

  getById: async (id: number) => {
    const result = await db.select().from(assetDisposals).where(eq(assetDisposals.id, id));
    return result[0] || null;
  },

  create: async (data: typeof assetDisposals.$inferInsert) => {
    const result = await db.insert(assetDisposals).values(data).returning();
    return result[0];
  },

  update: async (id: number, data: Partial<typeof assetDisposals.$inferInsert>) => {
    const result = await db.update(assetDisposals)
      .set(data)
      .where(eq(assetDisposals.id, id))
      .returning();
    return result[0] || null;
  },

  delete: async (id: number) => {
    const result = await db.delete(assetDisposals).where(eq(assetDisposals.id, id)).returning();
    return result[0] || null;
  },
};