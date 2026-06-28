import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma, type Berth } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';

import { BerthsController } from './berths.controller.js';
import { BERTH_AUDIT_RECORDER, BerthsService } from './berths.service.js';
import { BERTHS_REPOSITORY, type BerthsRepository } from './berths.repository.js';

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

class InMemoryBerthsRepository implements BerthsRepository {
  private berths = [buildBerth()];

  async findPage(): Promise<{ berths: readonly Berth[]; totalItems: number }> {
    return { berths: this.berths, totalItems: this.berths.length };
  }

  async findById(_tenantId: string, id: string): Promise<Berth | null> {
    return this.berths.find((berth) => berth.id === id && berth.deletedAt === null) ?? null;
  }

  async findByTerminalAndCode(
    _tenantId: string,
    terminal: string,
    code: string,
  ): Promise<Berth | null> {
    return (
      this.berths.find(
        (berth) => berth.terminalId === terminal && berth.code === code && berth.deletedAt === null,
      ) ?? null
    );
  }

  async create(
    tenant: string,
    input: { terminalId: string; code: string; name: string },
  ): Promise<Berth> {
    const berth = buildBerth({
      id: '99999999-9999-4999-8999-999999999999',
      tenantId: tenant,
      terminalId: input.terminalId,
      code: input.code,
      name: input.name,
    });
    this.berths.push(berth);
    return berth;
  }

  async update(): Promise<Berth> {
    return buildBerth();
  }

  async softDelete(): Promise<Berth> {
    return buildBerth({ status: 'inactive', deletedAt: new Date('2026-01-03T00:00:00.000Z') });
  }
}

describe('BerthsController integration', () => {
  let controller: BerthsController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BerthsController],
      providers: [
        BerthsService,
        { provide: BERTHS_REPOSITORY, useClass: InMemoryBerthsRepository },
        { provide: BERTH_AUDIT_RECORDER, useValue: { record: async () => undefined } },
      ],
    }).compile();

    controller = moduleRef.get(BerthsController);
  });

  it('lists berths through the Nest module graph', async () => {
    await expect(
      controller.list(tenantId, { page: 1, pageSize: 10, search: 'B14' }),
    ).resolves.toMatchObject({
      data: [{ code: 'B14' }],
      meta: { totalItems: 1 },
    });
  });

  it('creates a berth through the Nest module graph', async () => {
    await expect(
      controller.create(tenantId, {
        terminalId,
        code: 'B15',
        name: 'Berth 15',
      }),
    ).resolves.toMatchObject({
      name: 'Berth 15',
      code: 'B15',
    });
  });

  it('rejects missing tenant context', async () => {
    expect(() =>
      controller.create(undefined, {
        terminalId,
        code: 'B15',
        name: 'Berth 15',
      }),
    ).toThrow(BadRequestException);
  });
});
