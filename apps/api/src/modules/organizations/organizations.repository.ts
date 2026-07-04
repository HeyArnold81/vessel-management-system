import { Inject, Injectable } from '@nestjs/common';
import type { Organization, Prisma } from '@prisma/client';

import type { SortDirection } from '@vms/shared';

import { PrismaService } from '../../database/prisma.service.js';

export type OrganizationPageResult = {
  readonly organizations: readonly Organization[];
  readonly totalItems: number;
};

export type NormalizedOrganizationListQuery = {
  readonly page: number;
  readonly pageSize: number;
  readonly search: string;
  readonly status: string;
  readonly sortDirection: SortDirection;
};

export interface OrganizationsRepository {
  findPage(
    tenantId: string,
    query: NormalizedOrganizationListQuery,
  ): Promise<OrganizationPageResult>;
  findById(tenantId: string, id: string): Promise<Organization | null>;
}

export const ORGANIZATIONS_REPOSITORY = Symbol('ORGANIZATIONS_REPOSITORY');

@Injectable()
export class PrismaOrganizationsRepository implements OrganizationsRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findPage(
    tenantId: string,
    query: NormalizedOrganizationListQuery,
  ): Promise<OrganizationPageResult> {
    const where = this.buildWhere(tenantId, query);

    const [organizations, totalItems] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        where,
        orderBy: { legalName: query.sortDirection },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.organization.count({ where }),
    ]);

    return { organizations, totalItems };
  }

  findById(tenantId: string, id: string): Promise<Organization | null> {
    return this.prisma.organization.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  private buildWhere(
    tenantId: string,
    query: NormalizedOrganizationListQuery,
  ): Prisma.OrganizationWhereInput {
    return {
      tenantId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { legalName: { contains: query.search, mode: 'insensitive' } },
              { tradingName: { contains: query.search, mode: 'insensitive' } },
              { registrationNumber: { contains: query.search, mode: 'insensitive' } },
              { taxNumber: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }
}
