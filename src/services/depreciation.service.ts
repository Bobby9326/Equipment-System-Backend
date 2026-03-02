import { db } from '../config/database.js';
import { equipment, departments, acquisitionSources } from '../db/schema/index.js';
import { eq, and, lte, isNull, inArray } from 'drizzle-orm';

const USEFUL_LIFE = 8;

// ============================================================
// DEPRECIATION CALCULATION (Straight-Line Method)
// ============================================================

const calcDepreciation = (
  price: number,
  acquisitionDate: Date,
  periodStart: Date,
  periodEnd: Date,
  usefulLife: number = USEFUL_LIFE
) => {
  const depPerYear = price / usefulLife;
  const depPerDay  = depPerYear / 365;

  // ยกมา = เสื่อมสะสมก่อนวัน periodStart
  const daysBeforeStart = Math.max(
    0,
    Math.floor((periodStart.getTime() - acquisitionDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const accumulatedBefore = parseFloat(Math.min(price, depPerDay * daysBeforeStart).toFixed(2));

  // เดือนนี้ = เสื่อมในช่วง period ที่สนใจ
  const effectiveStart = acquisitionDate > periodStart ? acquisitionDate : periodStart;
  const daysInPeriod   = Math.max(
    0,
    Math.floor((periodEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  const remaining       = price - accumulatedBefore;
  const depThisYear     = remaining <= 0 || acquisitionDate > periodEnd
    ? 0
    : parseFloat(Math.min(remaining, depPerDay * daysInPeriod).toFixed(2));

  const accumulatedAfter = parseFloat((accumulatedBefore + depThisYear).toFixed(2));
  const bookValueStart   = parseFloat((price - accumulatedBefore).toFixed(2));
  const bookValueEnd     = parseFloat((price - accumulatedAfter).toFixed(2));

  return { depreciationPerYear: parseFloat(depPerYear.toFixed(2)), accumulatedBefore, depreciationThisYear: depThisYear, accumulatedAfter, bookValueStart, bookValueEnd };
};

const calcUsefulAge = (acquisitionDate: Date, referenceDate: Date) =>
  parseFloat(((referenceDate.getTime() - acquisitionDate.getTime()) / (1000 * 60 * 60 * 24 * 365)).toFixed(2));

// ============================================================
// SERVICE
// ============================================================

export interface DepreciationFilter {
  startDate: string;           // YYYY-MM-DD
  endDate: string;             // YYYY-MM-DD
  departmentId?: number;
  fundId?: number;
  equipmentTypeId?: number;
  acquisitionMethodId?: number;
  acquisitionSourceId?: number;
  minPrice?: number;
}

export const depreciationService = {
  calculate: async (filters: DepreciationFilter) => {
    const periodStart = new Date(filters.startDate);
    const periodEnd   = new Date(filters.endDate);

    if (periodStart >= periodEnd) throw new Error('startDate ต้องน้อยกว่า endDate');

    // ── 1 query ดึงข้อมูลทั้งหมดพร้อม join ──────────────────
    const conditions = [
      isNull(equipment.deletedAt),
      lte(equipment.acquisitionDate, filters.endDate), // ได้มาก่อนหรือในช่วงที่สนใจ
      ...(filters.departmentId      ? [eq(equipment.departmentId,        filters.departmentId)]      : []),
      ...(filters.fundId            ? [eq(equipment.fundId,              filters.fundId)]            : []),
      ...(filters.equipmentTypeId   ? [eq(equipment.equipmentTypeId,     filters.equipmentTypeId)]   : []),
      ...(filters.acquisitionMethodId ? [eq(equipment.acquisitionMethodId, filters.acquisitionMethodId)] : []),
      ...(filters.acquisitionSourceId ? [eq(equipment.acquisitionSourceId, filters.acquisitionSourceId)] : []),
    ];

    const rows = await db
      .select({
        equipmentNumber:     equipment.equipmentNumber,
        equipmentName:       equipment.equipmentName,
        acquisitionDate:     equipment.acquisitionDate,
        price:               equipment.price,
        departmentName:      departments.name,
        acquisitionSource:   acquisitionSources.name,
      })
      .from(equipment)
      .leftJoin(departments,        eq(equipment.departmentId,        departments.id))
      .leftJoin(acquisitionSources, eq(equipment.acquisitionSourceId, acquisitionSources.id))
      .where(and(...conditions));
    // ─────────────────────────────────────────────────────────

    // คำนวณในหน่วยความจำ ไม่ยิง query เพิ่ม
    const details = rows
      .filter(r => r.acquisitionDate && r.price)
      .filter(r => !filters.minPrice || parseFloat(r.price!) >= filters.minPrice)
      .map(r => {
        const price           = parseFloat(r.price!);
        const acquisitionDate = new Date(r.acquisitionDate!);
        const dep             = calcDepreciation(price, acquisitionDate, periodStart, periodEnd);

        return {
          equipmentNumber:       r.equipmentNumber,
          equipmentName:         r.equipmentName,
          acquisitionDate:       r.acquisitionDate,
          usefulAge:             calcUsefulAge(acquisitionDate, periodEnd),
          usefulLife:            USEFUL_LIFE,
          price,
          acquisitionSource:     r.acquisitionSource ?? '-',
          depreciationPerYear:   dep.depreciationPerYear,
          accumulatedBefore:     dep.accumulatedBefore,
          depreciationThisYear:  dep.depreciationThisYear,
          accumulatedAfter:      dep.accumulatedAfter,
          bookValueStart:        dep.bookValueStart,
          bookValueEnd:          dep.bookValueEnd,
          departmentName:        r.departmentName ?? '-',
        };
      });

    // สรุปยอดในหน่วยความจำ ไม่ยิง query เพิ่ม
    const sum = (key: keyof typeof details[0]) =>
      parseFloat(details.reduce((s, r) => s + (r[key] as number), 0).toFixed(2));

    const summary = {
      totalItems:                details.length,
      periodStart:               filters.startDate,
      periodEnd:                 filters.endDate,
      totalPrice:                sum('price'),
      totalDepreciationPerYear:  sum('depreciationPerYear'),
      totalAccumulatedBefore:    sum('accumulatedBefore'),
      totalDepreciationThisYear: sum('depreciationThisYear'),
      totalAccumulatedAfter:     sum('accumulatedAfter'),
      totalBookValueStart:       sum('bookValueStart'),
      totalBookValueEnd:         sum('bookValueEnd'),
    };

    return { details, summary };
  },
};