import { db } from '../config/database.js';
import type { PgTableWithColumns } from 'drizzle-orm/pg-core'

import { 
  departments, 
  activities, 
  funds, 
  assetTypes, 
  acquisitionSources, 
  acquisitionMethods,
  buildings,
  rooms,
  faculties,
  supportUnits,
  plans
} from '../db/schema/index.js';
import { eq } from 'drizzle-orm';

// Generic CRUD functions for master tables
const createMasterService = <T extends PgTableWithColumns<any>>(table: T) => ({
  getAll: async () => {
    return await db.select().from(table);
  },

  getById: async (id: number) => {
    const result = await db.select().from(table).where(eq(table.id, id));
    return result[0] || null;
  },

  create: async (data: any) => {
    const result = await db.insert(table).values(data).returning();
    return result[0];
  },

  update: async (id: number, data: any) => {
    const result = await db.update(table).set(data).where(eq(table.id, id)).returning();
    return result[0] || null;
  },

  delete: async (id: number) => {
    const result = await db.delete(table).where(eq(table.id, id)).returning();
    return result[0] || null;
  },
});

export const departmentsService = createMasterService(departments);
export const activitiesService = createMasterService(activities);
export const fundsService = createMasterService(funds);
export const assetTypesService = createMasterService(assetTypes);
export const acquisitionSourcesService = createMasterService(acquisitionSources);
export const acquisitionMethodsService = createMasterService(acquisitionMethods);
export const buildingsService = createMasterService(buildings);
export const facultiesService = createMasterService(faculties);
export const supportUnitsService = createMasterService(supportUnits);
export const plansService = createMasterService(plans);

// Rooms service with building relationship
export const roomsService = {
  getAll: async () => {
    return await db.select().from(rooms);
  },

  getByBuildingId: async (buildingId: number) => {
    return await db.select().from(rooms).where(eq(rooms.buildingId, buildingId));
  },

  getById: async (id: number) => {
    const result = await db.select().from(rooms).where(eq(rooms.id, id));
    return result[0] || null;
  },

  create: async (data: typeof rooms.$inferInsert) => {
    const result = await db.insert(rooms).values(data).returning();
    return result[0];
  },

  update: async (id: number, data: Partial<typeof rooms.$inferInsert>) => {
    const result = await db.update(rooms).set(data).where(eq(rooms.id, id)).returning();
    return result[0] || null;
  },

  delete: async (id: number) => {
    const result = await db.delete(rooms).where(eq(rooms.id, id)).returning();
    return result[0] || null;
  },
};