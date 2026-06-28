import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import type {
  BerthListQuery,
  BerthRecord,
  CreateBerthInput,
  PaginatedResponse,
  UpdateBerthInput,
} from '@vms/shared';

import { normalizePage, normalizePageSize } from '../../shared/pagination.js';

import { BerthsAuditService } from './audit.service.js';
import { toBerthRecord } from './berth.mapper.js';
import { BERTHS_REPOSITORY, type BerthsRepository } from './berths.repository.js';

type BerthAuditRecorder = Pick<BerthsAuditService, 'record'>;

export const BERTH_AUDIT_RECORDER = Symbol('BERTH_AUDIT_RECORDER');

const defaultQuery = {
  page: 1,
  pageSize: 20,
  search: '',
  terminalId: '',
  sortBy: 'name',
  sortDirection: 'asc',
} as const;

@Injectable()
export class BerthsService {
  constructor(
    @Inject(BERTHS_REPOSITORY)
    private readonly repository: BerthsRepository,
    @Inject(BERTH_AUDIT_RECORDER)
    private readonly auditService: BerthAuditRecorder,
  ) {}

  async list(tenantId: string, query: BerthListQuery): Promise<PaginatedResponse<BerthRecord>> {
    const normalizedQuery = {
      ...defaultQuery,
      ...query,
      search: query.search?.trim() ?? '',
      terminalId: query.terminalId?.trim() ?? '',
      page: normalizePage(query.page, defaultQuery.page),
      pageSize: normalizePageSize(query.pageSize, defaultQuery.pageSize),
      sortBy: query.sortBy ?? defaultQuery.sortBy,
      sortDirection: query.sortDirection ?? defaultQuery.sortDirection,
    };

    const result = await this.repository.findPage(tenantId, normalizedQuery);

    return {
      data: result.berths.map(toBerthRecord),
      meta: {
        page: normalizedQuery.page,
        pageSize: normalizedQuery.pageSize,
        totalItems: result.totalItems,
        totalPages: Math.max(1, Math.ceil(result.totalItems / normalizedQuery.pageSize)),
      },
    };
  }

  async getById(tenantId: string, id: string): Promise<BerthRecord> {
    const berth = await this.repository.findById(tenantId, id);

    if (!berth) {
      throw new NotFoundException('Berth was not found.');
    }

    return toBerthRecord(berth);
  }

  async create(tenantId: string, input: CreateBerthInput): Promise<BerthRecord> {
    await this.assertCodeAvailable(tenantId, input.terminalId, input.code);

    const berth = await this.repository.create(tenantId, input);
    const record = toBerthRecord(berth);

    await this.auditService.record({
      tenantId,
      action: 'berth.create',
      entityId: berth.id,
      afterData: record,
    });

    return record;
  }

  async update(tenantId: string, id: string, input: UpdateBerthInput): Promise<BerthRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('Berth was not found.');
    }

    const nextTerminalId = input.terminalId ?? existing.terminalId;
    const nextCode = input.code?.trim().toUpperCase() ?? existing.code;

    if (nextTerminalId !== existing.terminalId || nextCode !== existing.code) {
      await this.assertCodeAvailable(tenantId, nextTerminalId, nextCode, id);
    }

    const updated = await this.repository.update(tenantId, id, input);
    const beforeRecord = toBerthRecord(existing);
    const afterRecord = toBerthRecord(updated);

    await this.auditService.record({
      tenantId,
      action: 'berth.update',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  async remove(tenantId: string, id: string): Promise<BerthRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('Berth was not found.');
    }

    const deleted = await this.repository.softDelete(tenantId, id);
    const beforeRecord = toBerthRecord(existing);
    const afterRecord = toBerthRecord(deleted);

    await this.auditService.record({
      tenantId,
      action: 'berth.delete',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  private async assertCodeAvailable(
    tenantId: string,
    terminalId: string,
    code: string,
    currentBerthId?: string,
  ): Promise<void> {
    const existing = await this.repository.findByTerminalAndCode(
      tenantId,
      terminalId,
      code.trim().toUpperCase(),
    );

    if (existing && existing.id !== currentBerthId) {
      throw new ConflictException('A berth with this code already exists for the terminal.');
    }
  }
}
