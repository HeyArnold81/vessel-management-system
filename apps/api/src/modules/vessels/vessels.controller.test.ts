import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma, type Vessel } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';

import { VesselsController } from './vessels.controller.js';
import { VESSEL_AUDIT_RECORDER, VesselsService } from './vessels.service.js';
import { VESSELS_REPOSITORY, type VesselsRepository } from './vessels.repository.js';

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

class InMemoryVesselsRepository implements VesselsRepository {
  private vessels = [buildVessel()];

  async findPage(): Promise<{ vessels: readonly Vessel[]; totalItems: number }> {
    return { vessels: this.vessels, totalItems: this.vessels.length };
  }

  async findById(_tenantId: string, id: string): Promise<Vessel | null> {
    return this.vessels.find((vessel) => vessel.id === id && vessel.deletedAt === null) ?? null;
  }

  async findByImoNumber(_tenantId: string, imoNumber: string): Promise<Vessel | null> {
    return (
      this.vessels.find((vessel) => vessel.imoNumber === imoNumber && vessel.deletedAt === null) ??
      null
    );
  }

  async create(
    tenant: string,
    input: { name: string; imoNumber: string; vesselType: string },
  ): Promise<Vessel> {
    const vessel = buildVessel({
      id: '33333333-3333-4333-8333-333333333333',
      tenantId: tenant,
      name: input.name,
      imoNumber: input.imoNumber,
      vesselType: input.vesselType,
    });
    this.vessels.push(vessel);
    return vessel;
  }

  async update(): Promise<Vessel> {
    return buildVessel();
  }

  async softDelete(): Promise<Vessel> {
    return buildVessel({ status: 'inactive', deletedAt: new Date('2026-01-03T00:00:00.000Z') });
  }
}

describe('VesselsController integration', () => {
  let controller: VesselsController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [VesselsController],
      providers: [
        VesselsService,
        { provide: VESSELS_REPOSITORY, useClass: InMemoryVesselsRepository },
        { provide: VESSEL_AUDIT_RECORDER, useValue: { record: async () => undefined } },
      ],
    }).compile();

    controller = moduleRef.get(VesselsController);
  });

  it('lists vessels through the Nest module graph', async () => {
    await expect(
      controller.list(tenantId, { page: 1, pageSize: 10, search: 'Atlantic' }),
    ).resolves.toMatchObject({
      data: [{ imoNumber: '9321483' }],
      meta: { totalItems: 1 },
    });
  });

  it('creates a vessel through the Nest module graph', async () => {
    await expect(
      controller.create(tenantId, {
        name: 'MV Baltic Trader',
        imoNumber: '9387421',
        vesselType: 'Bulk Carrier',
      }),
    ).resolves.toMatchObject({
      name: 'MV Baltic Trader',
    });
  });

  it('rejects missing tenant context', async () => {
    expect(() =>
      controller.create(undefined, {
        name: 'MV Baltic Trader',
        imoNumber: '9387421',
        vesselType: 'Container Ship',
      }),
    ).toThrow(BadRequestException);
  });
});
