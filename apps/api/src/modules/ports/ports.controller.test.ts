import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Port } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';

import { PortsController } from './ports.controller.js';
import { PORTS_REPOSITORY, type PortsRepository } from './ports.repository.js';
import { PORT_AUDIT_RECORDER, PortsService } from './ports.service.js';

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

class InMemoryPortsRepository implements PortsRepository {
  private ports = [buildPort()];

  async findPage(): Promise<{ ports: readonly Port[]; totalItems: number }> {
    return { ports: this.ports, totalItems: this.ports.length };
  }

  async findById(_tenantId: string, id: string): Promise<Port | null> {
    return this.ports.find((port) => port.id === id && port.deletedAt === null) ?? null;
  }

  async findByUnlocode(_tenantId: string, unlocode: string): Promise<Port | null> {
    return this.ports.find((port) => port.unlocode === unlocode && port.deletedAt === null) ?? null;
  }

  async create(
    tenant: string,
    input: { countryId: string; name: string; unlocode: string; timeZone: string },
  ): Promise<Port> {
    const port = buildPort({
      id: '66666666-6666-4666-8666-666666666666',
      tenantId: tenant,
      countryId: input.countryId,
      name: input.name,
      unlocode: input.unlocode,
      timeZone: input.timeZone,
    });
    this.ports.push(port);
    return port;
  }

  async update(): Promise<Port> {
    return buildPort();
  }

  async softDelete(): Promise<Port> {
    return buildPort({ status: 'inactive', deletedAt: new Date('2026-01-03T00:00:00.000Z') });
  }
}

describe('PortsController integration', () => {
  let controller: PortsController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PortsController],
      providers: [
        PortsService,
        { provide: PORTS_REPOSITORY, useClass: InMemoryPortsRepository },
        { provide: PORT_AUDIT_RECORDER, useValue: { record: async () => undefined } },
      ],
    }).compile();

    controller = moduleRef.get(PortsController);
  });

  it('lists ports through the Nest module graph', async () => {
    await expect(
      controller.list(tenantId, { page: 1, pageSize: 10, search: 'Gateway' }),
    ).resolves.toMatchObject({
      data: [{ unlocode: 'GBLGP' }],
      meta: { totalItems: 1 },
    });
  });

  it('creates a port through the Nest module graph', async () => {
    await expect(
      controller.create(tenantId, {
        countryId,
        name: 'Felixstowe',
        unlocode: 'GBFXT',
        timeZone: 'Europe/London',
      }),
    ).resolves.toMatchObject({
      name: 'Felixstowe',
      unlocode: 'GBFXT',
    });
  });

  it('rejects missing tenant context', async () => {
    expect(() =>
      controller.create(undefined, {
        countryId,
        name: 'Felixstowe',
        unlocode: 'GBFXT',
        timeZone: 'Europe/London',
      }),
    ).toThrow(BadRequestException);
  });
});
