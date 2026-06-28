import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { VesselMovement } from '@prisma/client';

import type {
  CreateMovementInput,
  MovementListQuery,
  MovementRecord,
  PaginatedResponse,
  UpdateMovementInput,
} from '@vms/shared';

import { normalizePage, normalizePageSize } from '../../shared/pagination.js';

import { MovementsAuditService } from './audit.service.js';
import { toMovementRecord } from './movement.mapper.js';
import { MOVEMENTS_REPOSITORY, type MovementsRepository } from './movements.repository.js';

type MovementAuditRecorder = Pick<MovementsAuditService, 'record'>;

export const MOVEMENT_AUDIT_RECORDER = Symbol('MOVEMENT_AUDIT_RECORDER');

const defaultQuery = {
  page: 1,
  pageSize: 20,
  search: '',
  sortBy: 'plannedAt',
  sortDirection: 'asc',
} as const;

@Injectable()
export class MovementsService {
  constructor(
    @Inject(MOVEMENTS_REPOSITORY)
    private readonly repository: MovementsRepository,
    @Inject(MOVEMENT_AUDIT_RECORDER)
    private readonly auditService: MovementAuditRecorder,
  ) {}

  async list(
    tenantId: string,
    query: MovementListQuery,
  ): Promise<PaginatedResponse<MovementRecord>> {
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
      data: result.movements.map(toMovementRecord),
      meta: {
        page: normalizedQuery.page,
        pageSize: normalizedQuery.pageSize,
        totalItems: result.totalItems,
        totalPages: Math.max(1, Math.ceil(result.totalItems / normalizedQuery.pageSize)),
      },
    };
  }

  async getById(tenantId: string, id: string): Promise<MovementRecord> {
    const movement = await this.repository.findById(tenantId, id);

    if (!movement) {
      throw new NotFoundException('Movement was not found.');
    }

    return toMovementRecord(movement);
  }

  async create(tenantId: string, input: CreateMovementInput): Promise<MovementRecord> {
    this.assertDateOrder(input);
    await this.assertMovementReferenceAvailable(tenantId, input.movementReference);

    const movement = await this.repository.create(tenantId, input);
    const record = toMovementRecord(movement);

    await this.auditService.record({
      tenantId,
      action: 'movement.create',
      entityId: movement.id,
      afterData: record,
    });

    return record;
  }

  async update(tenantId: string, id: string, input: UpdateMovementInput): Promise<MovementRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('Movement was not found.');
    }

    this.assertDateOrder(input, existing);

    const nextMovementReference =
      input.movementReference?.trim().toUpperCase() ?? existing.movementReference;

    if (nextMovementReference !== existing.movementReference) {
      await this.assertMovementReferenceAvailable(tenantId, nextMovementReference, id);
    }

    const updated = await this.repository.update(tenantId, id, input);
    const beforeRecord = toMovementRecord(existing);
    const afterRecord = toMovementRecord(updated);

    await this.auditService.record({
      tenantId,
      action: 'movement.update',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  async remove(tenantId: string, id: string): Promise<MovementRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('Movement was not found.');
    }

    const deleted = await this.repository.softDelete(tenantId, id);
    const beforeRecord = toMovementRecord(existing);
    const afterRecord = toMovementRecord(deleted);

    await this.auditService.record({
      tenantId,
      action: 'movement.delete',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  private async assertMovementReferenceAvailable(
    tenantId: string,
    movementReference: string,
    currentMovementId?: string,
  ): Promise<void> {
    const existing = await this.repository.findByMovementReference(
      tenantId,
      movementReference.trim().toUpperCase(),
    );

    if (existing && existing.id !== currentMovementId) {
      throw new ConflictException('A movement with this movement reference already exists.');
    }
  }

  private assertDateOrder(input: UpdateMovementInput, existing?: VesselMovement): void {
    const plannedAt = this.resolveDate(input.plannedAt, existing?.plannedAt);
    const actualAt = this.resolveDate(input.actualAt, existing?.actualAt);

    if (plannedAt && actualAt && actualAt.getTime() < plannedAt.getTime()) {
      throw new BadRequestException('Actual time cannot be earlier than planned time.');
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
