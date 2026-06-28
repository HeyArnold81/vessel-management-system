import { ConflictException, NotFoundException } from '@nestjs/common';
import type { Port } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { PortsService } from './ports.service.js';
import type { PortsRepository } from './ports.repository.js';

const tenantId = '11111111-1111-4111-8111-111111111111';
const portId = '44444444-4444-4444-8444-444444444444';
const countryId = '55555555-5555-4555-8555-555555555555';

function buildPort(overrides: Partial<Port> = {}): Port {
  return {
    id: portId,
    tenantId,
    countryId,
    unlocode: 'GBLGP',
    name: 'London Gateway Port',
    timeZone: 'Europe/London',
    status: 'active',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

function buildRepository(overrides: Partial<PortsRepository> = {}): PortsRepository {
  return {
    findPage: vi.fn().mockResolvedValue({ ports: [buildPort()], totalItems: 1 }),
    findById: vi.fn().mockResolvedValue(buildPort()),
    findByUnlocode: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(buildPort()),
    update: vi.fn().mockResolvedValue(buildPort({ name: 'London Gateway Port East' })),
    softDelete: vi.fn().mockResolvedValue(buildPort({ status: 'inactive', deletedAt: new Date() })),
    ...overrides,
  };
}

describe('PortsService', () => {
  it('returns a paginated port list', async () => {
    const service = new PortsService(buildRepository(), { record: vi.fn() });

    await expect(service.list(tenantId, { page: 1, pageSize: 10 })).resolves.toMatchObject({
      data: [{ name: 'London Gateway Port', unlocode: 'GBLGP' }],
      meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    });
  });

  it('normalizes string pagination values before querying the repository', async () => {
    const repository = buildRepository();
    const service = new PortsService(repository, { record: vi.fn() });

    await service.list(tenantId, { page: '1', pageSize: '10' } as never);

    expect(repository.findPage).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ page: 1, pageSize: 10 }),
    );
  });

  it('rejects duplicate UN/LOCODE values on create', async () => {
    const service = new PortsService(
      buildRepository({ findByUnlocode: vi.fn().mockResolvedValue(buildPort()) }),
      { record: vi.fn() },
    );

    await expect(
      service.create(tenantId, {
        countryId,
        name: 'Duplicate Port',
        unlocode: 'GBLGP',
        timeZone: 'Europe/London',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('records an audit event when a port is updated', async () => {
    const audit = { record: vi.fn() };
    const service = new PortsService(buildRepository(), audit);

    await service.update(tenantId, portId, { name: 'London Gateway Port East' });

    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        action: 'port.update',
        entityId: portId,
      }),
    );
  });

  it('throws not found when deleting a missing port', async () => {
    const service = new PortsService(
      buildRepository({ findById: vi.fn().mockResolvedValue(null) }),
      { record: vi.fn() },
    );

    await expect(service.remove(tenantId, portId)).rejects.toBeInstanceOf(NotFoundException);
  });
});
