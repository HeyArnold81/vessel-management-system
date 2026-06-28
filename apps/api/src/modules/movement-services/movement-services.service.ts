import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { MovementService } from '@prisma/client';

import type {
  CreateMovementServiceInput,
  MovementServiceListQuery,
  MovementServiceRecord,
  PaginatedResponse,
  UpdateMovementServiceInput,
} from '@vms/shared';

import { MovementServicesAuditService } from './audit.service.js';
import { toMovementServiceRecord } from './movement-service.mapper.js';
import {
  MOVEMENT_SERVICES_REPOSITORY,
  type MovementServicesRepository,
} from './movement-services.repository.js';

type MovementServiceAuditRecorder = Pick<MovementServicesAuditService, 'record'>;

export const MOVEMENT_SERVICE_AUDIT_RECORDER = Symbol('MOVEMENT_SERVICE_AUDIT_RECORDER');

const defaultQuery = {
  page: 1,
  pageSize: 20,
  sortBy: 'requestedAt',
  sortDirection: 'asc',
} as const;

@Injectable()
export class MovementServicesService {
  constructor(
    @Inject(MOVEMENT_SERVICES_REPOSITORY)
    private readonly repository: MovementServicesRepository,
    @Inject(MOVEMENT_SERVICE_AUDIT_RECORDER)
    private readonly auditService: MovementServiceAuditRecorder,
  ) {}

  async list(
    tenantId: string,
    query: MovementServiceListQuery,
  ): Promise<PaginatedResponse<MovementServiceRecord>> {
    const normalizedQuery = {
      ...defaultQuery,
      ...query,
      page: query.page ?? defaultQuery.page,
      pageSize: query.pageSize ?? defaultQuery.pageSize,
      sortBy: query.sortBy ?? defaultQuery.sortBy,
      sortDirection: query.sortDirection ?? defaultQuery.sortDirection,
    };

    const result = await this.repository.findPage(tenantId, normalizedQuery);

    return {
      data: result.movementServices.map(toMovementServiceRecord),
      meta: {
        page: normalizedQuery.page,
        pageSize: normalizedQuery.pageSize,
        totalItems: result.totalItems,
        totalPages: Math.max(1, Math.ceil(result.totalItems / normalizedQuery.pageSize)),
      },
    };
  }

  async getById(tenantId: string, id: string): Promise<MovementServiceRecord> {
    const movementService = await this.repository.findById(tenantId, id);

    if (!movementService) {
      throw new NotFoundException('Movement service was not found.');
    }

    return toMovementServiceRecord(movementService);
  }

  async create(
    tenantId: string,
    input: CreateMovementServiceInput,
  ): Promise<MovementServiceRecord> {
    this.assertDateOrder(input);

    const movementService = await this.repository.create(tenantId, input);
    const record = toMovementServiceRecord(movementService);

    await this.auditService.record({
      tenantId,
      action: 'movement_service.create',
      entityId: movementService.id,
      afterData: record,
    });

    return record;
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateMovementServiceInput,
  ): Promise<MovementServiceRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('Movement service was not found.');
    }

    this.assertDateOrder(input, existing);

    const updated = await this.repository.update(tenantId, id, input);
    const beforeRecord = toMovementServiceRecord(existing);
    const afterRecord = toMovementServiceRecord(updated);

    await this.auditService.record({
      tenantId,
      action: 'movement_service.update',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  async remove(tenantId: string, id: string): Promise<MovementServiceRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('Movement service was not found.');
    }

    const deleted = await this.repository.softDelete(tenantId, id);
    const beforeRecord = toMovementServiceRecord(existing);
    const afterRecord = toMovementServiceRecord(deleted);

    await this.auditService.record({
      tenantId,
      action: 'movement_service.delete',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  private assertDateOrder(input: UpdateMovementServiceInput, existing?: MovementService): void {
    const requestedAt = this.resolveDate(input.requestedAt, existing?.requestedAt);
    const completedAt = this.resolveDate(input.completedAt, existing?.completedAt);

    if (requestedAt && completedAt && completedAt.getTime() < requestedAt.getTime()) {
      throw new BadRequestException('Completed time cannot be earlier than requested time.');
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
