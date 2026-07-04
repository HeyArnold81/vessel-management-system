import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { OrganizationListQuery, OrganizationRecord, PaginatedResponse } from '@vms/shared';

import { normalizePage, normalizePageSize } from '../../shared/pagination.js';
import { toOrganizationRecord } from './organization.mapper.js';
import {
  ORGANIZATIONS_REPOSITORY,
  type OrganizationsRepository,
} from './organizations.repository.js';

const defaultQuery = {
  page: 1,
  pageSize: 100,
  search: '',
  status: 'active',
  sortDirection: 'asc',
} as const;

@Injectable()
export class OrganizationsService {
  constructor(
    @Inject(ORGANIZATIONS_REPOSITORY)
    private readonly repository: OrganizationsRepository,
  ) {}

  async list(
    tenantId: string,
    query: OrganizationListQuery,
  ): Promise<PaginatedResponse<OrganizationRecord>> {
    const normalizedQuery = {
      ...defaultQuery,
      ...query,
      search: query.search?.trim() ?? defaultQuery.search,
      status: query.status?.trim() ?? defaultQuery.status,
      page: normalizePage(query.page, defaultQuery.page),
      pageSize: normalizePageSize(query.pageSize, defaultQuery.pageSize),
      sortDirection: query.sortDirection ?? defaultQuery.sortDirection,
    };

    const result = await this.repository.findPage(tenantId, normalizedQuery);

    return {
      data: result.organizations.map(toOrganizationRecord),
      meta: {
        page: normalizedQuery.page,
        pageSize: normalizedQuery.pageSize,
        totalItems: result.totalItems,
        totalPages: Math.max(1, Math.ceil(result.totalItems / normalizedQuery.pageSize)),
      },
    };
  }

  async getById(tenantId: string, id: string): Promise<OrganizationRecord> {
    const organization = await this.repository.findById(tenantId, id);

    if (!organization) {
      throw new NotFoundException('Organization was not found.');
    }

    return toOrganizationRecord(organization);
  }
}
