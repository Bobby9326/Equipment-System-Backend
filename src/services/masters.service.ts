import { db } from '../config/database.js';
import { sql, eq } from 'drizzle-orm';
import {
  departments,
  funds,
  equipmentTypes,
  acquisitionSources,
  acquisitionMethods,
  buildings,
  rooms,
  roomTypes,
  planSections,
} from '../db/schema/index.js';

const createMasterService = (table: any) => ({
  getAll:  async ()           => db.select().from(table),
  getById: async (id: number) => {
    const result = await db.select().from(table).where(eq(table.id, id));
    return result[0] || null;
  },
});

export const departmentsService        = createMasterService(departments);
export const fundsService              = createMasterService(funds);
export const equipmentTypesService     = createMasterService(equipmentTypes);
export const acquisitionSourcesService = createMasterService(acquisitionSources);
export const acquisitionMethodsService = createMasterService(acquisitionMethods);
export const roomTypesService          = createMasterService(roomTypes);
export const planSectionsService       = createMasterService(planSections);

// Buildings — format name เป็น [CODE] name
export const buildingsService = {
  getAll: async () =>
    db.select({
      id:   buildings.id,
      code: buildings.code,
      name: sql<string>`'[' || ${buildings.code} || '] ' || ${buildings.name}`,
    }).from(buildings),

  getById: async (id: number) => {
    const result = await db.select({
      id:   buildings.id,
      code: buildings.code,
      name: sql<string>`'[' || ${buildings.code} || '] ' || ${buildings.name}`,
    }).from(buildings).where(eq(buildings.id, id));
    return result[0] || null;
  },
};

// Rooms — filter by building
export const roomsService = {
  getAll:          async ()                   => db.select().from(rooms),
  getById:         async (id: number)         => {
    const result = await db.select().from(rooms).where(eq(rooms.id, id));
    return result[0] || null;
  },
  getByBuildingId: async (buildingId: number) =>
    db.select().from(rooms).where(eq(rooms.buildingId, buildingId)),
};