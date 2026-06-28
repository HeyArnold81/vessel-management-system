import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, type Vessel } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { VesselsService } from './vessels.service.js';
import type { VesselsRepository } from './vessels.repository.js';

const tenantId = '11111111-1111-4111-8111-111111111111';
const vesselId = '22222222-2222-4222-8222-222222222222';

function buildVessel(overrides: Partial<Vessel> = {}): Vessel {
  return {
    id: vesselId,
    tenantId,
    flagCountryId: null,
    name: 'MV Atlantic Meridian',
    imoNumber: '9321483',
    mmsi: '235123456',
    callSign: 'MAZU7',
    vesselType: 'Container Ship',
    grossTonnage: new Prisma.Decimal(54210),
    lengthOverallM: new Prisma.Decimal(294.1),
    maxDraftM: new Prisma.Decimal(12.4),
    status: 'active',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

function buildRepository(overrides: Partial<VesselsRepository> = {}): VesselsRepository {
  return {
    findPage: vi.fn().mockResolvedValue({ vessels: [buildVessel()], totalItems: 1 }),
    findById: vi.fn().mockResolvedValue(buildVessel()),
    findByImoNumber: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(buildVessel()),
    update: vi.fn().mockResolvedValue(buildVessel({ name: 'MV Atlantic Meridian II' })),
    softDelete: vi
      .fn()
      .mockResolvedValue(buildVessel({ status: 'inactive', deletedAt: new Date() })),
    ...overrides,
  };
}

describe('VesselsService', () => {
  it('returns a paginated vessel list', async () => {
    const service = new VesselsService(buildRepository(), { record: vi.fn() });

    await expect(service.list(tenantId, { page: 1, pageSize: 10 })).resolves.toMatchObject({
      data: [{ name: 'MV Atlantic Meridian', imoNumber: '9321483' }],
      meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    });
  });

  it('rejects duplicate IMO numbers on create', async () => {
    const service = new VesselsService(
      buildRepository({ findByImoNumber: vi.fn().mockResolvedValue(buildVessel()) }),
      { record: vi.fn() },
    );

    await expect(
      service.create(tenantId, {
        name: 'Duplicate',
        imoNumber: '9321483',
        vesselType: 'Container Ship',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('records an audit event when a vessel is updated', async () => {
    const audit = { record: vi.fn() };
    const service = new VesselsService(buildRepository(), audit);

    await service.update(tenantId, vesselId, { name: 'MV Atlantic Meridian II' });

    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        action: 'vessel.update',
        entityId: vesselId,
      }),
    );
  });

  it('throws not found when deleting a missing vessel', async () => {
    const service = new VesselsService(
      buildRepository({ findById: vi.fn().mockResolvedValue(null) }),
      { record: vi.fn() },
    );

    await expect(service.remove(tenantId, vesselId)).rejects.toBeInstanceOf(NotFoundException);
  });
});
