import { db } from '../config/database.js';
import { auditLogs } from '../db/schema/index.js';
import { eq, and, desc } from 'drizzle-orm';
import { users } from '../db/schema/index.js';

type AuditEntity = 'equipment' | 'mhesi' | 'project';
type AuditAction = 'update' | 'delete';

// เปรียบเทียบ before/after และคืนเฉพาะ field ที่เปลี่ยน
function diffObjects(
  before: Record<string, any>,
  after:  Record<string, any>
): { before: Record<string, any>; after: Record<string, any> } {
  const changedBefore: Record<string, any> = {};
  const changedAfter:  Record<string, any> = {};

  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    // ข้าม meta fields
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
  // บันทึก log — ใช้ใน service อื่น
  log: async (params: {
    entity:     AuditEntity;
    entityUuid: string;
    action:     AuditAction;
    before:     Record<string, any>;
    after:      Record<string, any>;
    userUuid:   string;
    tx?:        typeof db; // optional transaction context
  }) => {
    const { entity, entityUuid, action, before, after, userUuid, tx } = params;

    // resolve userUuid → id
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.uuid, userUuid));
    if (!userResult[0]) return; // ถ้าหาไม่เจอก็ข้ามไป ไม่ throw

    const diff = diffObjects(before, after);

    // ถ้าไม่มี field เปลี่ยนเลยไม่ต้อง log
    if (Object.keys(diff.after).length === 0 && action === 'update') return;

    const runner = tx ?? db;
    await (runner as any).insert(auditLogs).values({
      entity,
      entityUuid,
      action,
      before: diff.before,
      after:  diff.after,
      changedBy: userResult[0].id,
    });
  },

  // ดึง log ของ entity นั้น
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