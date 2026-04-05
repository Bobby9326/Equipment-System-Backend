import { db } from '../config/database.js';
import { auditLogs } from '../db/schema/index.js';
import { eq, and, desc } from 'drizzle-orm';
import { users } from '../db/schema/index.js';

type AuditEntity = 'equipment' | 'mhesi' | 'project';
type AuditAction = 'create' | 'update' | 'status_change' | 'delete';

// เปรียบเทียบ before/after — ใช้เฉพาะ action='update'
function diffObjects(
  before: Record<string, any>,
  after:  Record<string, any>
): { before: Record<string, any>; after: Record<string, any> } {
  const changedBefore: Record<string, any> = {};
  const changedAfter:  Record<string, any> = {};

  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    if (['updatedAt', 'createdAt', 'deletedAt'].includes(key)) continue;
    const bVal = JSON.stringify(before[key]);
    const aVal = JSON.stringify(after[key]);
    if (bVal !== aVal) {
      changedBefore[key] = before[key];
      changedAfter[key]  = after[key];
    }
  }
  return { before: changedBefore, after: changedAfter };
}

export const auditService = {
  log: async (params: {
    entity:     AuditEntity;
    entityUuid: string;
    action:     AuditAction;
    before:     Record<string, any>;
    after:      Record<string, any>;
    userUuid:   string;
    tx?:        typeof db;
  }) => {
    const { entity, entityUuid, action, before, after, userUuid, tx } = params;

    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.uuid, userUuid));
    if (!userResult[0]) return;

    let logBefore = before;
    let logAfter  = after;

    // action='update' → เก็บเฉพาะ field ที่เปลี่ยน
    if (action === 'update') {
      const diff = diffObjects(before, after);
      if (Object.keys(diff.after).length === 0) return; // ไม่มีอะไรเปลี่ยน
      logBefore = diff.before;
      logAfter  = diff.after;
    }

    // action='create' | 'status_change' | 'delete' → เก็บทั้ง before/after ที่ส่งมา
    const runner = tx ?? db;
    await (runner as any).insert(auditLogs).values({
      entity,
      entityUuid,
      action,
      before: logBefore,
      after:  logAfter,
      changedBy: userResult[0].id,
    });
  },

  getHistory: async (entity: AuditEntity, entityUuid: string) => {
    const logs = await db
      .select({
        action:    auditLogs.action,
        before:    auditLogs.before,
        after:     auditLogs.after,
        createdAt: auditLogs.createdAt,
        firstName: users.firstName,
        lastName:  users.lastName,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.changedBy, users.id))
      .where(and(eq(auditLogs.entity, entity), eq(auditLogs.entityUuid, entityUuid)))
      .orderBy(desc(auditLogs.createdAt));

    return logs.map(log => ({
      action:    log.action,
      before:    log.before,
      after:     log.after,
      createdAt: log.createdAt,
      changedBy: `${log.firstName ?? ''} ${log.lastName ?? ''}`.trim(),
    }));
  },
};