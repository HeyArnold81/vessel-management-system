import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import type {
  CreatePortInput,
  PaginatedResponse,
  PortListQuery,
  PortRecord,
  UpdatePortInput,
} from '@vms/shared';

import { PortsAuditService } from './audit.service.js';
import { toPortRecord } from './port.mapper.js';
import { PORTS_REPOSITORY, type PortsRepository } from './ports.repository.js';

type PortAuditRecorder = Pick<PortsAuditService, 'record'>;

export const PORT_AUDIT_RECORDER = Symbol('PORT_AUDIT_RECORDER');

const defaultQuery = {
  page: 1,
  pageSize: 20,
  search: '',
  countryId: '',
  sortBy: 'name',
  sortDirection: 'asc',
} as const;

@Injectable()
export class PortsService {
  constructor(
    @Inject(PORTS_REPOSITORY)
    private readonly repository: PortsRepository,
    @Inject(PORT_AUDIT_RECORDER)
    private readonly auditService: PortAuditRecorder,
  ) {}

  async list(tenantId: string, query: PortListQuery): Promise<PaginatedResponse<PortRecord>> {
    const normalizedQuery = {
      ...defaultQuery,
      ...query,
      search: query.search?.trim() ?? '',
      countryId: query.countryId?.trim() ?? '',
      page: query.page ?? defaultQuery.page,
      pageSize: query.pageSize ?? defaultQuery.pageSize,
      sortBy: query.sortBy ?? defaultQuery.sortBy,
      sortDirection: query.sortDirection ?? defaultQuery.sortDirection,
    };

    const result = await this.repository.findPage(tenantId, normalizedQuery);

    return {
      data: result.ports.map(toPortRecord),
      meta: {
        page: normalizedQuery.page,
        pageSize: normalizedQuery.pageSize,
        totalItems: result.totalItems,
        totalPages: Math.max(1, Math.ceil(result.totalItems / normalizedQuery.pageSize)),
      },
    };
  }

  async getById(tenantId: string, id: string): Promise<PortRecord> {
    const port = await this.repository.findById(tenantId, id);

    if (!port) {
      throw new NotFoundException('Port was not found.');
    }

    return toPortRecord(port);
  }

  async create(tenantId: string, input: CreatePortInput): Promise<PortRecord> {
    await this.assertUnlocodeAvailable(tenantId, input.unlocode);

    const port = await this.repository.create(tenantId, input);
    const record = toPortRecord(port);

    await this.auditService.record({
      tenantId,
      action: 'port.create',
      entityId: port.id,
      afterData: record,
    });

    return record;
  }

  async update(tenantId: string, id: string, input: UpdatePortInput): Promise<PortRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('Port was not found.');
    }

    if (input.unlocode && input.unlocode.toUpperCase() !== existing.unlocode) {
      await this.assertUnlocodeAvailable(tenantId, input.unlocode, id);
    }

    const updated = await this.repository.update(tenantId, id, input);
    const beforeRecord = toPortRecord(existing);
    const afterRecord = toPortRecord(updated);

    await this.auditService.record({
      tenantId,
      action: 'port.update',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  async remove(tenantId: string, id: string): Promise<PortRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('Port was not found.');
    }

    const deleted = await this.repository.softDelete(tenantId, id);
    const beforeRecord = toPortRecord(existing);
    const afterRecord = toPortRecord(deleted);

    await this.auditService.record({
      tenantId,
      action: 'port.delete',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  private async assertUnlocodeAvailable(
    tenantId: string,
    unlocode: string,
    currentPortId?: string,
  ): Promise<void> {
    const existing = await this.repository.findByUnlocode(tenantId, unlocode.trim().toUpperCase());

    if (existing && existing.id !== currentPortId) {
      throw new ConflictException('A port with this UN/LOCODE already exists.');
    }
  }
}
