import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import type {
  CargoItemListQuery,
  CargoItemRecord,
  CreateCargoItemInput,
  PaginatedResponse,
  UpdateCargoItemInput,
} from '@vms/shared';

import { CargoItemsAuditService } from './audit.service.js';
import { toCargoItemRecord } from './cargo-item.mapper.js';
import { CARGO_ITEMS_REPOSITORY, type CargoItemsRepository } from './cargo-items.repository.js';

type CargoItemAuditRecorder = Pick<CargoItemsAuditService, 'record'>;

export const CARGO_ITEM_AUDIT_RECORDER = Symbol('CARGO_ITEM_AUDIT_RECORDER');

const defaultQuery = {
  page: 1,
  pageSize: 20,
  search: '',
  sortBy: 'name',
  sortDirection: 'asc',
} as const;

@Injectable()
export class CargoItemsService {
  constructor(
    @Inject(CARGO_ITEMS_REPOSITORY)
    private readonly repository: CargoItemsRepository,
    @Inject(CARGO_ITEM_AUDIT_RECORDER)
    private readonly auditService: CargoItemAuditRecorder,
  ) {}

  async list(
    tenantId: string,
    query: CargoItemListQuery,
  ): Promise<PaginatedResponse<CargoItemRecord>> {
    const normalizedQuery = {
      ...defaultQuery,
      ...query,
      search: query.search?.trim() ?? '',
      page: query.page ?? defaultQuery.page,
      pageSize: query.pageSize ?? defaultQuery.pageSize,
      sortBy: query.sortBy ?? defaultQuery.sortBy,
      sortDirection: query.sortDirection ?? defaultQuery.sortDirection,
    };

    const result = await this.repository.findPage(tenantId, normalizedQuery);

    return {
      data: result.cargoItems.map(toCargoItemRecord),
      meta: {
        page: normalizedQuery.page,
        pageSize: normalizedQuery.pageSize,
        totalItems: result.totalItems,
        totalPages: Math.max(1, Math.ceil(result.totalItems / normalizedQuery.pageSize)),
      },
    };
  }

  async getById(tenantId: string, id: string): Promise<CargoItemRecord> {
    const cargoItem = await this.repository.findById(tenantId, id);

    if (!cargoItem) {
      throw new NotFoundException('Cargo item was not found.');
    }

    return toCargoItemRecord(cargoItem);
  }

  async create(tenantId: string, input: CreateCargoItemInput): Promise<CargoItemRecord> {
    await this.assertCargoCodeAvailable(tenantId, input.cargoCode);

    const cargoItem = await this.repository.create(tenantId, input);
    const record = toCargoItemRecord(cargoItem);

    await this.auditService.record({
      tenantId,
      action: 'cargo_item.create',
      entityId: cargoItem.id,
      afterData: record,
    });

    return record;
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateCargoItemInput,
  ): Promise<CargoItemRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('Cargo item was not found.');
    }

    const nextCargoCode = input.cargoCode?.trim().toUpperCase() ?? existing.cargoCode;

    if (nextCargoCode !== existing.cargoCode) {
      await this.assertCargoCodeAvailable(tenantId, nextCargoCode, id);
    }

    const updated = await this.repository.update(tenantId, id, input);
    const beforeRecord = toCargoItemRecord(existing);
    const afterRecord = toCargoItemRecord(updated);

    await this.auditService.record({
      tenantId,
      action: 'cargo_item.update',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  async remove(tenantId: string, id: string): Promise<CargoItemRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('Cargo item was not found.');
    }

    const deleted = await this.repository.softDelete(tenantId, id);
    const beforeRecord = toCargoItemRecord(existing);
    const afterRecord = toCargoItemRecord(deleted);

    await this.auditService.record({
      tenantId,
      action: 'cargo_item.delete',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  private async assertCargoCodeAvailable(
    tenantId: string,
    cargoCode: string,
    currentCargoItemId?: string,
  ): Promise<void> {
    const existing = await this.repository.findByCargoCode(
      tenantId,
      cargoCode.trim().toUpperCase(),
    );

    if (existing && existing.id !== currentCargoItemId) {
      throw new ConflictException('A cargo item with this cargo code already exists.');
    }
  }
}
