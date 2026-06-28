import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import type {
  BillingEventListQuery,
  BillingEventRecord,
  CreateBillingEventInput,
  PaginatedResponse,
  UpdateBillingEventInput,
} from '@vms/shared';

import { normalizePage, normalizePageSize } from '../../shared/pagination.js';

import { BillingEventsAuditService } from './audit.service.js';
import { toBillingEventRecord } from './billing-event.mapper.js';
import {
  BILLING_EVENTS_REPOSITORY,
  type BillingEventsRepository,
} from './billing-events.repository.js';

type BillingEventAuditRecorder = Pick<BillingEventsAuditService, 'record'>;

export const BILLING_EVENT_AUDIT_RECORDER = Symbol('BILLING_EVENT_AUDIT_RECORDER');

const defaultQuery = {
  page: 1,
  pageSize: 20,
  search: '',
  sortBy: 'createdAt',
  sortDirection: 'desc',
} as const;

@Injectable()
export class BillingEventsService {
  constructor(
    @Inject(BILLING_EVENTS_REPOSITORY)
    private readonly repository: BillingEventsRepository,
    @Inject(BILLING_EVENT_AUDIT_RECORDER)
    private readonly auditService: BillingEventAuditRecorder,
  ) {}

  async list(
    tenantId: string,
    query: BillingEventListQuery,
  ): Promise<PaginatedResponse<BillingEventRecord>> {
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
      data: result.billingEvents.map(toBillingEventRecord),
      meta: {
        page: normalizedQuery.page,
        pageSize: normalizedQuery.pageSize,
        totalItems: result.totalItems,
        totalPages: Math.max(1, Math.ceil(result.totalItems / normalizedQuery.pageSize)),
      },
    };
  }

  async getById(tenantId: string, id: string): Promise<BillingEventRecord> {
    const event = await this.repository.findById(tenantId, id);

    if (!event) {
      throw new NotFoundException('Billing event was not found.');
    }

    return toBillingEventRecord(event);
  }

  async create(tenantId: string, input: CreateBillingEventInput): Promise<BillingEventRecord> {
    const existingForSource = await this.repository.findByMovementServiceId(
      tenantId,
      input.movementServiceId,
    );

    if (existingForSource) {
      throw new ConflictException('A billing event already exists for this movement service.');
    }

    if (input.eventReference) {
      const existingReference = await this.repository.findByEventReference(
        tenantId,
        input.eventReference.trim().toUpperCase(),
      );

      if (existingReference) {
        throw new ConflictException('A billing event with this reference already exists.');
      }
    }

    const event = await this.repository.create(tenantId, input);
    const record = toBillingEventRecord(event);

    await this.auditService.record({
      tenantId,
      action: 'billing_event.create',
      entityId: event.id,
      afterData: record,
    });

    return record;
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateBillingEventInput,
  ): Promise<BillingEventRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('Billing event was not found.');
    }

    const updated = await this.repository.update(tenantId, id, input);
    const beforeRecord = toBillingEventRecord(existing);
    const afterRecord = toBillingEventRecord(updated);

    await this.auditService.record({
      tenantId,
      action: 'billing_event.update',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  async remove(tenantId: string, id: string): Promise<BillingEventRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('Billing event was not found.');
    }

    const deleted = await this.repository.softDelete(tenantId, id);
    const beforeRecord = toBillingEventRecord(existing);
    const afterRecord = toBillingEventRecord(deleted);

    await this.auditService.record({
      tenantId,
      action: 'billing_event.delete',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }
}
