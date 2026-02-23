import { db } from '../config/database.js';
import { sql } from 'drizzle-orm';
import {
  departments,
  activities,
  funds,
  equipmentTypes,
  acquisitionSources,
  acquisitionMethods,
  buildings,
  rooms,
  roomTypes,
  supportUnits,
  planSections,
  projectTypes,
} from '../db/schema/index.js';
import { eq } from 'drizzle-orm';

// Generic read-only service for master tables
const createMasterService = (table: any) => ({
  getAll: async () => {
    return await db.select().from(table);
  },

  getById: async (id: number) => {
    const result = await db.select().from(table).where(eq(table.id, id));
    return result[0] || null;
  },
});

export const departmentsService = createMasterService(departments);
export const activitiesService = createMasterService(activities);
export const fundsService = createMasterService(funds);
export const equipmentTypesService = createMasterService(equipmentTypes);
export const acquisitionSourcesService = createMasterService(acquisitionSources);
export const acquisitionMethodsService = createMasterService(acquisitionMethods);
export const buildingsService = createMasterService(buildings);
export const roomTypesService = createMasterService(roomTypes);
export const supportUnitsService = createMasterService(supportUnits);
export const planSectionsService = createMasterService(planSections);
export const projectTypesService = createMasterService(projectTypes);

// Rooms service with building filter
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
};