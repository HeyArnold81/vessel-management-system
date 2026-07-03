import type { AuditLog } from '@prisma/client';

import type { AuditLogRecord } from '@vms/shared';

export function toAuditLogRecord(auditLog: AuditLog): AuditLogRecord {
  return {
    id: auditLog.id,
    tenantId: auditLog.tenantId,
    actorUserId: auditLog.actorUserId,
    action: auditLog.action,
    entityType: auditLog.entityType,
    entityId: auditLog.entityId,
    requestId: auditLog.requestId,
    ipAddress: auditLog.ipAddress,
    userAgent: auditLog.userAgent,
    beforeData: auditLog.beforeData,
    afterData: auditLog.afterData,
    metadata: auditLog.metadata,
    createdAt: auditLog.createdAt.toISOString(),
  };
}
