import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import type {
  BillingExportBatchListQuery,
  BillingExportBatchRecord,
  CreateBillingExportBatchInput,
  PaginatedResponse,
  UpdateBillingExportBatchInput,
} from '@vms/shared';

import { normalizePage, normalizePageSize } from '../../shared/pagination.js';

import { BillingExportBatchesAuditService } from './audit.service.js';
import { toBillingExportBatchRecord } from './billing-export-batch.mapper.js';
import {
  BILLING_EXPORT_BATCHES_REPOSITORY,
  type BillingExportBatchesRepository,
} from './billing-export-batches.repository.js';

type BillingExportBatchAuditRecorder = Pick<BillingExportBatchesAuditService, 'record'>;

export const BILLING_EXPORT_BATCH_AUDIT_RECORDER = Symbol('BILLING_EXPORT_BATCH_AUDIT_RECORDER');

const defaultQuery = {
  page: 1,
  pageSize: 20,
  search: '',
  sortBy: 'requestedAt',
  sortDirection: 'desc',
} as const;

@Injectable()
export class BillingExportBatchesService {
  constructor(
    @Inject(BILLING_EXPORT_BATCHES_REPOSITORY)
    private readonly repository: BillingExportBatchesRepository,
    @Inject(BILLING_EXPORT_BATCH_AUDIT_RECORDER)
    private readonly auditService: BillingExportBatchAuditRecorder,
  ) {}

  async list(
    tenantId: string,
    query: BillingExportBatchListQuery,
  ): Promise<PaginatedResponse<BillingExportBatchRecord>> {
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
      data: result.batches.map(toBillingExportBatchRecord),
      meta: {
        page: normalizedQuery.page,
        pageSize: normalizedQuery.pageSize,
        totalItems: result.totalItems,
        totalPages: Math.max(1, Math.ceil(result.totalItems / normalizedQuery.pageSize)),
      },
    };
  }

  async getById(tenantId: string, id: string): Promise<BillingExportBatchRecord> {
    const batch = await this.repository.findById(tenantId, id);

    if (!batch) {
      throw new NotFoundException('Billing export batch was not found.');
    }

    return toBillingExportBatchRecord(batch);
  }

  async create(
    tenantId: string,
    input: CreateBillingExportBatchInput,
  ): Promise<BillingExportBatchRecord> {
    const uniqueEventIds = [...new Set(input.billingEventIds)];

    if (uniqueEventIds.length === 0) {
      throw new ConflictException('At least one billing event is required.');
    }

    if (input.batchReference) {
      const existingReference = await this.repository.findByReference(
        tenantId,
        input.batchReference.trim().toUpperCase(),
      );

      if (existingReference) {
        throw new ConflictException('A billing export batch with this reference already exists.');
      }
    }

    const eligibleEvents = await this.repository.findEligibleBillingEvents(
      tenantId,
      uniqueEventIds,
    );

    if (eligibleEvents.length !== uniqueEventIds.length) {
      throw new ConflictException(
        'Only ready billing events that are not already assigned to a batch can be exported.',
      );
    }

    const batch = await this.repository.create(tenantId, {
      ...input,
      billingEventIds: uniqueEventIds,
    });
    const record = toBillingExportBatchRecord(batch);

    await this.auditService.record({
      tenantId,
      action: 'billing_export_batch.create',
      entityId: batch.id,
      afterData: record,
    });

    return record;
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateBillingExportBatchInput,
  ): Promise<BillingExportBatchRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('Billing export batch was not found.');
    }

    const updated = await this.repository.update(tenantId, id, input);
    const beforeRecord = toBillingExportBatchRecord(existing);
    const afterRecord = toBillingExportBatchRecord(updated);

    await this.auditService.record({
      tenantId,
      action: 'billing_export_batch.update',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  async remove(tenantId: string, id: string): Promise<BillingExportBatchRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('Billing export batch was not found.');
    }

    if (existing.status === 'exported' || existing.status === 'accepted') {
      throw new ConflictException('Exported or accepted batches cannot be cancelled.');
    }

    const cancelled = await this.repository.cancel(tenantId, id);
    const beforeRecord = toBillingExportBatchRecord(existing);
    const afterRecord = toBillingExportBatchRecord(cancelled);

    await this.auditService.record({
      tenantId,
      action: 'billing_export_batch.cancel',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }
}
