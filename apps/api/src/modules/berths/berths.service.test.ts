import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, type Berth } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { BerthsService } from './berths.service.js';
import type { BerthsRepository } from './berths.repository.js';

const tenantId = '11111111-1111-4111-8111-111111111111';
const berthId = '77777777-7777-4777-8777-777777777777';
const terminalId = '88888888-8888-4888-8888-888888888888';

function buildBerth(overrides: Partial<Berth> = {}): Berth {
  return {
    id: berthId,
    tenantId,
    terminalId,
    code: 'B14',
    name: 'Berth 14',
    maxLengthM: new Prisma.Decimal(320),
    maxDraftM: new Prisma.Decimal(14.5),
    status: 'active',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

function buildRepository(overrides: Partial<BerthsRepository> = {}): BerthsRepository {
  return {
    findPage: vi.fn().mockResolvedValue({ berths: [buildBerth()], totalItems: 1 }),
    findById: vi.fn().mockResolvedValue(buildBerth()),
    findByTerminalAndCode: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(buildBerth()),
    update: vi.fn().mockResolvedValue(buildBerth({ name: 'Berth 14 East' })),
    softDelete: vi
      .fn()
      .mockResolvedValue(buildBerth({ status: 'inactive', deletedAt: new Date() })),
    ...overrides,
  };
}

describe('BerthsService', () => {
  it('returns a paginated berth list', async () => {
    const service = new BerthsService(buildRepository(), { record: vi.fn() });

    await expect(service.list(tenantId, { page: 1, pageSize: 10 })).resolves.toMatchObject({
      data: [{ name: 'Berth 14', code: 'B14' }],
      meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    });
  });

  it('rejects duplicate berth codes within a terminal', async () => {
    const service = new BerthsService(
      buildRepository({ findByTerminalAndCode: vi.fn().mockResolvedValue(buildBerth()) }),
      { record: vi.fn() },
    );

    await expect(
      service.create(tenantId, {
        terminalId,
        code: 'B14',
        name: 'Duplicate Berth',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('records an audit event when a berth is updated', async () => {
    const audit = { record: vi.fn() };
    const service = new BerthsService(buildRepository(), audit);

    await service.update(tenantId, berthId, { name: 'Berth 14 East' });

    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        action: 'berth.update',
        entityId: berthId,
      }),
    );
  });

  it('throws not found when deleting a missing berth', async () => {
    const service = new BerthsService(
      buildRepository({ findById: vi.fn().mockResolvedValue(null) }),
      { record: vi.fn() },
    );

    await expect(service.remove(tenantId, berthId)).rejects.toBeInstanceOf(NotFoundException);
  });
});
