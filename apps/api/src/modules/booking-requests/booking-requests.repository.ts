import { Inject, Injectable } from '@nestjs/common';
import type { BookingRequest, Prisma, ServiceCatalog, VesselCall } from '@prisma/client';

import type {
  CreateBookingRequestedServiceInput,
  BookingRequestSortField,
  BookingRequestStatus,
  CreateBookingRequestInput,
  CreateVesselCallInput,
  SortDirection,
  UpdateBookingRequestInput,
} from '@vms/shared';

import { PrismaService } from '../../database/prisma.service.js';
import type { BookingRequestedServiceWithCatalog } from './booking-requested-service.mapper.js';

export type BookingRequestPageResult = {
  readonly bookingRequests: readonly BookingRequest[];
  readonly totalItems: number;
};

export type ConfirmBookingRequestResult = {
  readonly bookingRequest: BookingRequest;
  readonly vesselCall: VesselCall;
};

export type NormalizedBookingRequestListQuery = {
  readonly page: number;
  readonly pageSize: number;
  readonly search: string;
  readonly status?: BookingRequestStatus;
  readonly vesselId?: string;
  readonly portId?: string;
  readonly preferredBerthId?: string;
  readonly vesselCallId?: string;
  readonly sortBy: BookingRequestSortField;
  readonly sortDirection: SortDirection;
};

export interface BookingRequestsRepository {
  findPage(
    tenantId: string,
    query: NormalizedBookingRequestListQuery,
  ): Promise<BookingRequestPageResult>;
  findById(tenantId: string, id: string): Promise<BookingRequest | null>;
  findByRequestReference(
    tenantId: string,
    requestReference: string,
  ): Promise<BookingRequest | null>;
  findVesselCallByCallReference(tenantId: string, callReference: string): Promise<VesselCall | null>;
  findServiceById(tenantId: string, serviceId: string): Promise<ServiceCatalog | null>;
  create(tenantId: string, input: CreateBookingRequestInput): Promise<BookingRequest>;
  update(tenantId: string, id: string, input: UpdateBookingRequestInput): Promise<BookingRequest>;
  updateStatus(tenantId: string, id: string, status: BookingRequestStatus): Promise<BookingRequest>;
  confirm(
    tenantId: string,
    id: string,
    vesselCallInput: CreateVesselCallInput,
  ): Promise<ConfirmBookingRequestResult>;
  findRequestedServices(
    tenantId: string,
    bookingRequestId: string,
  ): Promise<readonly BookingRequestedServiceWithCatalog[]>;
  findRequestedServiceById(
    tenantId: string,
    bookingRequestId: string,
    requestedServiceId: string,
  ): Promise<BookingRequestedServiceWithCatalog | null>;
  createRequestedService(
    tenantId: string,
    bookingRequestId: string,
    input: CreateBookingRequestedServiceInput,
  ): Promise<BookingRequestedServiceWithCatalog>;
  deleteRequestedService(
    tenantId: string,
    bookingRequestId: string,
    requestedServiceId: string,
  ): Promise<BookingRequestedServiceWithCatalog>;
  softDelete(tenantId: string, id: string): Promise<BookingRequest>;
}

export const BOOKING_REQUESTS_REPOSITORY = Symbol('BOOKING_REQUESTS_REPOSITORY');

@Injectable()
export class PrismaBookingRequestsRepository implements BookingRequestsRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findPage(
    tenantId: string,
    query: NormalizedBookingRequestListQuery,
  ): Promise<BookingRequestPageResult> {
    const where = this.buildWhere(tenantId, query);
    const orderBy = this.buildOrderBy(query);

    const [bookingRequests, totalItems] = await this.prisma.$transaction([
      this.prisma.bookingRequest.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.bookingRequest.count({ where }),
    ]);

    return { bookingRequests, totalItems };
  }

  findById(tenantId: string, id: string): Promise<BookingRequest | null> {
    return this.prisma.bookingRequest.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  findByRequestReference(
    tenantId: string,
    requestReference: string,
  ): Promise<BookingRequest | null> {
    return this.prisma.bookingRequest.findFirst({
      where: { tenantId, requestReference, deletedAt: null },
    });
  }

  findVesselCallByCallReference(tenantId: string, callReference: string): Promise<VesselCall | null> {
    return this.prisma.vesselCall.findFirst({
      where: { tenantId, callReference, deletedAt: null },
    });
  }

  findServiceById(tenantId: string, serviceId: string): Promise<ServiceCatalog | null> {
    return this.prisma.serviceCatalog.findFirst({
      where: { id: serviceId, tenantId, deletedAt: null },
    });
  }

  create(tenantId: string, input: CreateBookingRequestInput): Promise<BookingRequest> {
    return this.prisma.bookingRequest.create({
      data: {
        tenantId,
        requestReference: input.requestReference.trim().toUpperCase(),
        vesselId: input.vesselId,
        portId: input.portId,
        preferredBerthId: input.preferredBerthId?.trim() || null,
        agentOrganizationId: input.agentOrganizationId?.trim() || null,
        customerOrganizationId: input.customerOrganizationId?.trim() || null,
        requestedEta: this.toDate(input.requestedEta),
        requestedEtd: this.toDate(input.requestedEtd),
        voyageNumber: input.voyageNumber?.trim() || null,
        cargoSummary: input.cargoSummary?.trim() || null,
        remarks: input.remarks?.trim() || null,
      },
    });
  }

  update(tenantId: string, id: string, input: UpdateBookingRequestInput): Promise<BookingRequest> {
    return this.prisma.bookingRequest.update({
      where: { id, tenantId },
      data: {
        ...(input.requestReference !== undefined
          ? { requestReference: input.requestReference.trim().toUpperCase() }
          : {}),
        ...(input.vesselId !== undefined ? { vesselId: input.vesselId } : {}),
        ...(input.portId !== undefined ? { portId: input.portId } : {}),
        ...(input.preferredBerthId !== undefined
          ? { preferredBerthId: input.preferredBerthId?.trim() || null }
          : {}),
        ...(input.agentOrganizationId !== undefined
          ? { agentOrganizationId: input.agentOrganizationId?.trim() || null }
          : {}),
        ...(input.customerOrganizationId !== undefined
          ? { customerOrganizationId: input.customerOrganizationId?.trim() || null }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.requestedEta !== undefined
          ? { requestedEta: this.toDate(input.requestedEta) }
          : {}),
        ...(input.requestedEtd !== undefined
          ? { requestedEtd: this.toDate(input.requestedEtd) }
          : {}),
        ...(input.voyageNumber !== undefined
          ? { voyageNumber: input.voyageNumber?.trim() || null }
          : {}),
        ...(input.cargoSummary !== undefined
          ? { cargoSummary: input.cargoSummary?.trim() || null }
          : {}),
        ...(input.remarks !== undefined ? { remarks: input.remarks?.trim() || null } : {}),
      },
    });
  }

  updateStatus(
    tenantId: string,
    id: string,
    status: BookingRequestStatus,
  ): Promise<BookingRequest> {
    return this.prisma.bookingRequest.update({
      where: { id, tenantId },
      data: {
        status,
        ...(status === 'submitted' ? { submittedAt: new Date() } : {}),
        ...(['approved', 'rejected', 'confirmed'].includes(status)
          ? { reviewedAt: new Date() }
          : {}),
      },
    });
  }

  async confirm(
    tenantId: string,
    id: string,
    vesselCallInput: CreateVesselCallInput,
  ): Promise<ConfirmBookingRequestResult> {
    return this.prisma.$transaction(async (transaction) => {
      const vesselCall = await transaction.vesselCall.create({
        data: {
          tenantId,
          callReference: vesselCallInput.callReference.trim().toUpperCase(),
          vesselId: vesselCallInput.vesselId,
          portId: vesselCallInput.portId,
          berthId: vesselCallInput.berthId?.trim() || null,
          agentId: vesselCallInput.agentId?.trim() || null,
          operatorId: vesselCallInput.operatorId?.trim() || null,
          voyageNumber: vesselCallInput.voyageNumber?.trim() || null,
          status: vesselCallInput.status ?? 'planned',
          eta: this.toDate(vesselCallInput.eta),
          etd: this.toDate(vesselCallInput.etd),
          ata: this.toDate(vesselCallInput.ata),
          atd: this.toDate(vesselCallInput.atd),
          remarks: vesselCallInput.remarks?.trim() || null,
        },
      });

      const bookingRequest = await transaction.bookingRequest.update({
        where: { id, tenantId },
        data: {
          status: 'confirmed',
          vesselCallId: vesselCall.id,
          reviewedAt: new Date(),
        },
      });

      return { bookingRequest, vesselCall };
    });
  }

  findRequestedServices(
    tenantId: string,
    bookingRequestId: string,
  ): Promise<readonly BookingRequestedServiceWithCatalog[]> {
    return this.prisma.bookingRequestedService.findMany({
      where: { tenantId, bookingRequestId },
      include: { service: true },
      orderBy: [{ requestedAt: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findRequestedServiceById(
    tenantId: string,
    bookingRequestId: string,
    requestedServiceId: string,
  ): Promise<BookingRequestedServiceWithCatalog | null> {
    return this.prisma.bookingRequestedService.findFirst({
      where: { id: requestedServiceId, tenantId, bookingRequestId },
      include: { service: true },
    });
  }

  createRequestedService(
    tenantId: string,
    bookingRequestId: string,
    input: CreateBookingRequestedServiceInput,
  ): Promise<BookingRequestedServiceWithCatalog> {
    return this.prisma.bookingRequestedService.create({
      data: {
        tenantId,
        bookingRequestId,
        serviceId: input.serviceId,
        providerOrganizationId: input.providerOrganizationId?.trim() || null,
        serviceReceiverOrganizationId: input.serviceReceiverOrganizationId?.trim() || null,
        billToOrganizationId: input.billToOrganizationId?.trim() || null,
        payerOrganizationId: input.payerOrganizationId?.trim() || null,
        quantity: input.quantity,
        unitOfMeasure: input.unitOfMeasure.trim().toLowerCase(),
        requestedAt: this.toDate(input.requestedAt),
        isBillable: input.isBillable ?? true,
        notes: input.notes?.trim() || null,
      },
      include: { service: true },
    });
  }

  async deleteRequestedService(
    tenantId: string,
    bookingRequestId: string,
    requestedServiceId: string,
  ): Promise<BookingRequestedServiceWithCatalog> {
    const existing = await this.findRequestedServiceById(
      tenantId,
      bookingRequestId,
      requestedServiceId,
    );

    await this.prisma.bookingRequestedService.delete({
      where: { id: requestedServiceId },
    });

    return existing as BookingRequestedServiceWithCatalog;
  }

  softDelete(tenantId: string, id: string): Promise<BookingRequest> {
    return this.prisma.bookingRequest.update({
      where: { id, tenantId },
      data: {
        status: 'cancelled',
        deletedAt: new Date(),
      },
    });
  }

  private buildWhere(
    tenantId: string,
    query: NormalizedBookingRequestListQuery,
  ): Prisma.BookingRequestWhereInput {
    return {
      tenantId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.vesselId ? { vesselId: query.vesselId } : {}),
      ...(query.portId ? { portId: query.portId } : {}),
      ...(query.preferredBerthId ? { preferredBerthId: query.preferredBerthId } : {}),
      ...(query.vesselCallId ? { vesselCallId: query.vesselCallId } : {}),
      ...(query.search
        ? {
            OR: [
              { requestReference: { contains: query.search, mode: 'insensitive' } },
              { voyageNumber: { contains: query.search, mode: 'insensitive' } },
              { cargoSummary: { contains: query.search, mode: 'insensitive' } },
              { remarks: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  private buildOrderBy(
    query: NormalizedBookingRequestListQuery,
  ): Prisma.BookingRequestOrderByWithRelationInput {
    const sortMap = {
      requestReference: 'requestReference',
      requestedEta: 'requestedEta',
      status: 'status',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    } satisfies Record<
      BookingRequestSortField,
      keyof Prisma.BookingRequestOrderByWithRelationInput
    >;

    return { [sortMap[query.sortBy]]: query.sortDirection };
  }

  private toDate(value: string | null | undefined): Date | null {
    return value ? new Date(value) : null;
  }
}
