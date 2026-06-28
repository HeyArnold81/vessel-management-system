import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { VesselCall } from '@prisma/client';

import type {
  CreateVesselCallInput,
  PaginatedResponse,
  UpdateVesselCallInput,
  VesselCallListQuery,
  VesselCallRecord,
} from '@vms/shared';

import { normalizePage, normalizePageSize } from '../../shared/pagination.js';

import { VesselCallsAuditService } from './audit.service.js';
import { toVesselCallRecord } from './vessel-call.mapper.js';
import { VESSEL_CALLS_REPOSITORY, type VesselCallsRepository } from './vessel-calls.repository.js';

type VesselCallAuditRecorder = Pick<VesselCallsAuditService, 'record'>;

export const VESSEL_CALL_AUDIT_RECORDER = Symbol('VESSEL_CALL_AUDIT_RECORDER');

const defaultQuery = {
  page: 1,
  pageSize: 20,
  search: '',
  sortBy: 'eta',
  sortDirection: 'asc',
} as const;

@Injectable()
export class VesselCallsService {
  constructor(
    @Inject(VESSEL_CALLS_REPOSITORY)
    private readonly repository: VesselCallsRepository,
    @Inject(VESSEL_CALL_AUDIT_RECORDER)
    private readonly auditService: VesselCallAuditRecorder,
  ) {}

  async list(
    tenantId: string,
    query: VesselCallListQuery,
  ): Promise<PaginatedResponse<VesselCallRecord>> {
    const normalizedQuery = {
      ...defaultQuery,
      ...query,
      search: query.search?.trim() ?? '',
      page: normalizePage(query.page, defaultQuery.page),
      pageSize: normalizePageSize(query.pageSize, defaultQuery.pageSize),
      sortBy: query.sortBy ?? defaultQuery.sortBy,
      sortDirection: query.sortDirection ?? defaultQuery.sortDirection,
    };

    const result = await this.repository.findPage(tenantId, normalizedQuery);

    return {
      data: result.vesselCalls.map(toVesselCallRecord),
      meta: {
        page: normalizedQuery.page,
        pageSize: normalizedQuery.pageSize,
        totalItems: result.totalItems,
        totalPages: Math.max(1, Math.ceil(result.totalItems / normalizedQuery.pageSize)),
      },
    };
  }

  async getById(tenantId: string, id: string): Promise<VesselCallRecord> {
    const vesselCall = await this.repository.findById(tenantId, id);

    if (!vesselCall) {
      throw new NotFoundException('Vessel call was not found.');
    }

    return toVesselCallRecord(vesselCall);
  }

  async create(tenantId: string, input: CreateVesselCallInput): Promise<VesselCallRecord> {
    this.assertDateOrder(input);
    await this.assertCallReferenceAvailable(tenantId, input.callReference);

    const vesselCall = await this.repository.create(tenantId, input);
    const record = toVesselCallRecord(vesselCall);

    await this.auditService.record({
      tenantId,
      action: 'vessel_call.create',
      entityId: vesselCall.id,
      afterData: record,
    });

    return record;
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateVesselCallInput,
  ): Promise<VesselCallRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('Vessel call was not found.');
    }

    this.assertDateOrder(input, existing);

    const nextCallReference = input.callReference?.trim().toUpperCase() ?? existing.callReference;

    if (nextCallReference !== existing.callReference) {
      await this.assertCallReferenceAvailable(tenantId, nextCallReference, id);
    }

    const updated = await this.repository.update(tenantId, id, input);
    const beforeRecord = toVesselCallRecord(existing);
    const afterRecord = toVesselCallRecord(updated);

    await this.auditService.record({
      tenantId,
      action: 'vessel_call.update',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  async remove(tenantId: string, id: string): Promise<VesselCallRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('Vessel call was not found.');
    }

    const deleted = await this.repository.softDelete(tenantId, id);
    const beforeRecord = toVesselCallRecord(existing);
    const afterRecord = toVesselCallRecord(deleted);

    await this.auditService.record({
      tenantId,
      action: 'vessel_call.delete',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  private async assertCallReferenceAvailable(
    tenantId: string,
    callReference: string,
    currentVesselCallId?: string,
  ): Promise<void> {
    const existing = await this.repository.findByCallReference(
      tenantId,
      callReference.trim().toUpperCase(),
    );

    if (existing && existing.id !== currentVesselCallId) {
      throw new ConflictException('A vessel call with this call reference already exists.');
    }
  }

  private assertDateOrder(input: UpdateVesselCallInput, existing?: VesselCall): void {
    const eta = this.resolveDate(input.eta, existing?.eta);
    const etd = this.resolveDate(input.etd, existing?.etd);
    const ata = this.resolveDate(input.ata, existing?.ata);
    const atd = this.resolveDate(input.atd, existing?.atd);

    if (eta && etd && eta.getTime() > etd.getTime()) {
      throw new BadRequestException('ETA cannot be later than ETD.');
    }

    if (ata && atd && ata.getTime() > atd.getTime()) {
      throw new BadRequestException('ATA cannot be later than ATD.');
    }
  }

  private resolveDate(
    nextValue: string | null | undefined,
    existingValue?: Date | null,
  ): Date | null {
    if (nextValue === undefined) {
      return existingValue ?? null;
    }

    return nextValue ? new Date(nextValue) : null;
  }
}
