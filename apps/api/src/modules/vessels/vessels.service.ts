import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import type {
  CreateVesselInput,
  PaginatedResponse,
  UpdateVesselInput,
  VesselListQuery,
  VesselRecord,
} from '@vms/shared';

import { normalizePage, normalizePageSize } from '../../shared/pagination.js';

import { AuditService } from './audit.service.js';
import { toVesselRecord } from './vessel.mapper.js';
import { VESSELS_REPOSITORY, type VesselsRepository } from './vessels.repository.js';

type VesselAuditRecorder = Pick<AuditService, 'record'>;

export const VESSEL_AUDIT_RECORDER = Symbol('VESSEL_AUDIT_RECORDER');

const defaultQuery = {
  page: 1,
  pageSize: 20,
  search: '',
  vesselType: '',
  sortBy: 'name',
  sortDirection: 'asc',
} as const;

@Injectable()
export class VesselsService {
  constructor(
    @Inject(VESSELS_REPOSITORY)
    private readonly repository: VesselsRepository,
    @Inject(VESSEL_AUDIT_RECORDER)
    private readonly auditService: VesselAuditRecorder,
  ) {}

  async list(tenantId: string, query: VesselListQuery): Promise<PaginatedResponse<VesselRecord>> {
    const normalizedQuery = {
      ...defaultQuery,
      ...query,
      search: query.search?.trim() ?? '',
      vesselType: query.vesselType?.trim() ?? '',
      page: normalizePage(query.page, defaultQuery.page),
      pageSize: normalizePageSize(query.pageSize, defaultQuery.pageSize),
      sortBy: query.sortBy ?? defaultQuery.sortBy,
      sortDirection: query.sortDirection ?? defaultQuery.sortDirection,
    };

    const result = await this.repository.findPage(tenantId, normalizedQuery);

    return {
      data: result.vessels.map(toVesselRecord),
      meta: {
        page: normalizedQuery.page,
        pageSize: normalizedQuery.pageSize,
        totalItems: result.totalItems,
        totalPages: Math.max(1, Math.ceil(result.totalItems / normalizedQuery.pageSize)),
      },
    };
  }

  async getById(tenantId: string, id: string): Promise<VesselRecord> {
    const vessel = await this.repository.findById(tenantId, id);

    if (!vessel) {
      throw new NotFoundException('Vessel was not found.');
    }

    return toVesselRecord(vessel);
  }

  async create(tenantId: string, input: CreateVesselInput): Promise<VesselRecord> {
    await this.assertImoAvailable(tenantId, input.imoNumber);

    const vessel = await this.repository.create(tenantId, input);
    const record = toVesselRecord(vessel);

    await this.auditService.record({
      tenantId,
      action: 'vessel.create',
      entityId: vessel.id,
      afterData: record,
    });

    return record;
  }

  async update(tenantId: string, id: string, input: UpdateVesselInput): Promise<VesselRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('Vessel was not found.');
    }

    if (input.imoNumber && input.imoNumber !== existing.imoNumber) {
      await this.assertImoAvailable(tenantId, input.imoNumber, id);
    }

    const updated = await this.repository.update(tenantId, id, input);
    const beforeRecord = toVesselRecord(existing);
    const afterRecord = toVesselRecord(updated);

    await this.auditService.record({
      tenantId,
      action: 'vessel.update',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  async remove(tenantId: string, id: string): Promise<VesselRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('Vessel was not found.');
    }

    const deleted = await this.repository.softDelete(tenantId, id);
    const beforeRecord = toVesselRecord(existing);
    const afterRecord = toVesselRecord(deleted);

    await this.auditService.record({
      tenantId,
      action: 'vessel.delete',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  private async assertImoAvailable(
    tenantId: string,
    imoNumber: string,
    currentVesselId?: string,
  ): Promise<void> {
    const existing = await this.repository.findByImoNumber(tenantId, imoNumber);

    if (existing && existing.id !== currentVesselId) {
      throw new ConflictException('A vessel with this IMO number already exists.');
    }
  }
}
