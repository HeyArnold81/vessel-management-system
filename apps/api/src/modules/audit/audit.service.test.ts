import type { AuditLog } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { AuditLogsService } from './audit.service.js';
import type { AuditLogsRepository } from './audit.repository.js';

const tenantId = '11111111-1111-4111-8111-111111111111';
const auditLogId = '22222222-2222-4222-8222-222222222222';
const entityId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function buildAuditLog(overrides: Partial<AuditLog> = {}): AuditLog {
  return {
    id: auditLogId,
    tenantId,
    actorUserId: null,
    action: 'vessel_call.update',
    entityType: 'vessel_call',
    entityId,
    requestId: null,
    ipAddress: null,
    userAgent: null,
    beforeData: { status: 'expected' },
    afterData: { status: 'arrived' },
    metadata: { source: 'vessel-calls-api' },
    createdAt: new Date('2026-07-01T12:00:00.000Z'),
    ...overrides,
  };
}

function buildRepository(overrides: Partial<AuditLogsRepository> = {}): AuditLogsRepository {
  return {
    findPage: vi.fn().mockResolvedValue({ auditLogs: [buildAuditLog()], totalItems: 1 }),
    ...overrides,
  };
}

describe('AuditLogsService', () => {
  it('returns a paginated audit log list', async () => {
    const service = new AuditLogsService(buildRepository());

    await expect(
      service.list(tenantId, { entityType: 'vessel_call', entityId }),
    ).resolves.toMatchObject({
      data: [
        {
          action: 'vessel_call.update',
          entityType: 'vessel_call',
          entityId,
          createdAt: '2026-07-01T12:00:00.000Z',
        },
      ],
      meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    });
  });

  it('normalizes string pagination values before querying the repository', async () => {
    const repository = buildRepository();
    const service = new AuditLogsService(repository);

    await service.list(tenantId, { page: '1', pageSize: '5' } as never);

    expect(repository.findPage).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ page: 1, pageSize: 5, sortDirection: 'desc' }),
    );
  });
});
