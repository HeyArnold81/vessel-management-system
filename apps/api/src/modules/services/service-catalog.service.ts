import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import type {
  CreateServiceCatalogInput,
  PaginatedResponse,
  ServiceCatalogListQuery,
  ServiceCatalogRecord,
  UpdateServiceCatalogInput,
} from '@vms/shared';

import { normalizePage, normalizePageSize } from '../../shared/pagination.js';

import { ServiceCatalogAuditService } from './audit.service.js';
import { toServiceCatalogRecord } from './service-catalog.mapper.js';
import {
  SERVICE_CATALOG_REPOSITORY,
  type ServiceCatalogRepository,
} from './service-catalog.repository.js';

type ServiceCatalogAuditRecorder = Pick<ServiceCatalogAuditService, 'record'>;

export const SERVICE_CATALOG_AUDIT_RECORDER = Symbol('SERVICE_CATALOG_AUDIT_RECORDER');

const defaultQuery = {
  page: 1,
  pageSize: 20,
  search: '',
  sortBy: 'name',
  sortDirection: 'asc',
} as const;

@Injectable()
export class ServiceCatalogService {
  constructor(
    @Inject(SERVICE_CATALOG_REPOSITORY)
    private readonly repository: ServiceCatalogRepository,
    @Inject(SERVICE_CATALOG_AUDIT_RECORDER)
    private readonly auditService: ServiceCatalogAuditRecorder,
  ) {}

  async list(
    tenantId: string,
    query: ServiceCatalogListQuery,
  ): Promise<PaginatedResponse<ServiceCatalogRecord>> {
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
      data: result.services.map(toServiceCatalogRecord),
      meta: {
        page: normalizedQuery.page,
        pageSize: normalizedQuery.pageSize,
        totalItems: result.totalItems,
        totalPages: Math.max(1, Math.ceil(result.totalItems / normalizedQuery.pageSize)),
      },
    };
  }

  async getById(tenantId: string, id: string): Promise<ServiceCatalogRecord> {
    const service = await this.repository.findById(tenantId, id);

    if (!service) {
      throw new NotFoundException('Service was not found.');
    }

    return toServiceCatalogRecord(service);
  }

  async create(tenantId: string, input: CreateServiceCatalogInput): Promise<ServiceCatalogRecord> {
    await this.assertCodeAvailable(tenantId, input.code);

    const service = await this.repository.create(tenantId, input);
    const record = toServiceCatalogRecord(service);

    await this.auditService.record({
      tenantId,
      action: 'service_catalog.create',
      entityId: service.id,
      afterData: record,
    });

    return record;
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateServiceCatalogInput,
  ): Promise<ServiceCatalogRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('Service was not found.');
    }

    const nextCode = input.code?.trim().toUpperCase() ?? existing.code;

    if (nextCode !== existing.code) {
      await this.assertCodeAvailable(tenantId, nextCode, id);
    }

    const updated = await this.repository.update(tenantId, id, input);
    const beforeRecord = toServiceCatalogRecord(existing);
    const afterRecord = toServiceCatalogRecord(updated);

    await this.auditService.record({
      tenantId,
      action: 'service_catalog.update',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  async remove(tenantId: string, id: string): Promise<ServiceCatalogRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('Service was not found.');
    }

    const deleted = await this.repository.softDelete(tenantId, id);
    const beforeRecord = toServiceCatalogRecord(existing);
    const afterRecord = toServiceCatalogRecord(deleted);

    await this.auditService.record({
      tenantId,
      action: 'service_catalog.delete',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  private async assertCodeAvailable(
    tenantId: string,
    code: string,
    currentServiceId?: string,
  ): Promise<void> {
    const existing = await this.repository.findByCode(tenantId, code.trim().toUpperCase());

    if (existing && existing.id !== currentServiceId) {
      throw new ConflictException('A service with this code already exists.');
    }
  }
}
