import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { BookingRequest } from '@prisma/client';

import type {
  BookingRequestListQuery,
  BookingRequestedServiceRecord,
  BookingRequestRecord,
  BookingRequestStatus,
  CreateBookingRequestedServiceInput,
  CreateVesselCallInput,
  CreateBookingRequestInput,
  PaginatedResponse,
  UpdateBookingRequestInput,
  VesselCallRecord,
} from '@vms/shared';

import { normalizePage, normalizePageSize } from '../../shared/pagination.js';

import { BookingRequestsAuditService } from './audit.service.js';
import { toBookingRequestedServiceRecord } from './booking-requested-service.mapper.js';
import { toBookingRequestRecord } from './booking-request.mapper.js';
import {
  BOOKING_REQUESTS_REPOSITORY,
  type BookingRequestsRepository,
} from './booking-requests.repository.js';
import { toVesselCallRecord } from '../vessel-calls/vessel-call.mapper.js';

type BookingRequestAuditRecorder = Pick<BookingRequestsAuditService, 'record'>;

const defaultQuery = {
  page: 1,
  pageSize: 20,
  search: '',
  sortBy: 'requestedEta',
  sortDirection: 'asc',
} as const;

@Injectable()
export class BookingRequestsService {
  constructor(
    @Inject(BOOKING_REQUESTS_REPOSITORY)
    private readonly repository: BookingRequestsRepository,
    @Inject(BookingRequestsAuditService)
    private readonly auditService: BookingRequestAuditRecorder,
  ) {}

  async list(
    tenantId: string,
    query: BookingRequestListQuery,
  ): Promise<PaginatedResponse<BookingRequestRecord>> {
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
      data: result.bookingRequests.map(toBookingRequestRecord),
      meta: {
        page: normalizedQuery.page,
        pageSize: normalizedQuery.pageSize,
        totalItems: result.totalItems,
        totalPages: Math.max(1, Math.ceil(result.totalItems / normalizedQuery.pageSize)),
      },
    };
  }

  async getById(tenantId: string, id: string): Promise<BookingRequestRecord> {
    const bookingRequest = await this.getExisting(tenantId, id);
    return toBookingRequestRecord(bookingRequest);
  }

  async create(tenantId: string, input: CreateBookingRequestInput): Promise<BookingRequestRecord> {
    this.assertDateOrder(input);
    await this.assertRequestReferenceAvailable(tenantId, input.requestReference);

    const bookingRequest = await this.repository.create(tenantId, input);
    return toBookingRequestRecord(bookingRequest);
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateBookingRequestInput,
  ): Promise<BookingRequestRecord> {
    const existing = await this.getExisting(tenantId, id);
    this.assertDateOrder(input, existing);

    const nextReference = input.requestReference?.trim().toUpperCase() ?? existing.requestReference;

    if (nextReference !== existing.requestReference) {
      await this.assertRequestReferenceAvailable(tenantId, nextReference, id);
    }

    const updated = await this.repository.update(tenantId, id, input);
    return toBookingRequestRecord(updated);
  }

  async transition(
    tenantId: string,
    id: string,
    status: BookingRequestStatus,
  ): Promise<BookingRequestRecord> {
    const existing = await this.getExisting(tenantId, id);

    if (!this.canTransition(existing.status as BookingRequestStatus, status)) {
      throw new BadRequestException(
        `Cannot move booking request from ${existing.status} to ${status}.`,
      );
    }

    const updated = await this.repository.updateStatus(tenantId, id, status);
    const beforeRecord = toBookingRequestRecord(existing);
    const afterRecord = toBookingRequestRecord(updated);

    await this.auditService.record({
      tenantId,
      action: `booking_request.${status}`,
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  async confirm(
    tenantId: string,
    id: string,
  ): Promise<{ bookingRequest: BookingRequestRecord; vesselCall: VesselCallRecord }> {
    const existing = await this.getExisting(tenantId, id);

    if (existing.status !== 'approved') {
      throw new BadRequestException('Only approved booking requests can be confirmed.');
    }

    if (existing.vesselCallId) {
      throw new ConflictException('This booking request is already linked to a vessel call.');
    }

    const vesselCallInput = this.toVesselCallInput(existing);
    const existingVesselCall = await this.repository.findVesselCallByCallReference(
      tenantId,
      vesselCallInput.callReference,
    );

    if (existingVesselCall) {
      throw new ConflictException('A vessel call with this booking reference already exists.');
    }

    const result = await this.repository.confirm(tenantId, id, vesselCallInput);
    const beforeRecord = toBookingRequestRecord(existing);
    const afterRecord = toBookingRequestRecord(result.bookingRequest);
    const vesselCallRecord = toVesselCallRecord(result.vesselCall);

    await this.auditService.record({
      tenantId,
      action: 'booking_request.confirm',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
      metadata: { vesselCallId: result.vesselCall.id },
    });

    await this.auditService.record({
      tenantId,
      action: 'vessel_call.create_from_booking_request',
      entityType: 'vessel_call',
      entityId: result.vesselCall.id,
      afterData: vesselCallRecord,
      metadata: { bookingRequestId: id },
    });

    return {
      bookingRequest: afterRecord,
      vesselCall: vesselCallRecord,
    };
  }

  async remove(tenantId: string, id: string): Promise<BookingRequestRecord> {
    await this.getExisting(tenantId, id);
    const deleted = await this.repository.softDelete(tenantId, id);
    return toBookingRequestRecord(deleted);
  }

  async listRequestedServices(
    tenantId: string,
    id: string,
  ): Promise<readonly BookingRequestedServiceRecord[]> {
    await this.getExisting(tenantId, id);

    const requestedServices = await this.repository.findRequestedServices(tenantId, id);
    return requestedServices.map(toBookingRequestedServiceRecord);
  }

  async createRequestedService(
    tenantId: string,
    id: string,
    input: CreateBookingRequestedServiceInput,
  ): Promise<BookingRequestedServiceRecord> {
    const bookingRequest = await this.getExisting(tenantId, id);
    this.assertServicesEditable(bookingRequest);

    const service = await this.repository.findServiceById(tenantId, input.serviceId);

    if (!service || service.status !== 'active') {
      throw new BadRequestException('Requested service must reference an active service catalog item.');
    }

    const requestedService = await this.repository.createRequestedService(tenantId, id, {
      ...input,
      unitOfMeasure: input.unitOfMeasure.trim() || service.defaultUnit,
      isBillable: input.isBillable ?? service.isBillable,
    });
    const record = toBookingRequestedServiceRecord(requestedService);

    await this.auditService.record({
      tenantId,
      action: 'booking_request.service_request.create',
      entityId: id,
      afterData: record,
      metadata: { requestedServiceId: requestedService.id, serviceId: requestedService.serviceId },
    });

    return record;
  }

  async deleteRequestedService(
    tenantId: string,
    id: string,
    requestedServiceId: string,
  ): Promise<BookingRequestedServiceRecord> {
    const bookingRequest = await this.getExisting(tenantId, id);
    this.assertServicesEditable(bookingRequest);

    const existing = await this.repository.findRequestedServiceById(
      tenantId,
      id,
      requestedServiceId,
    );

    if (!existing) {
      throw new NotFoundException('Requested service was not found.');
    }

    const deleted = await this.repository.deleteRequestedService(tenantId, id, requestedServiceId);
    const record = toBookingRequestedServiceRecord(deleted);

    await this.auditService.record({
      tenantId,
      action: 'booking_request.service_request.delete',
      entityId: id,
      beforeData: record,
      metadata: { requestedServiceId, serviceId: record.serviceId },
    });

    return record;
  }

  private async getExisting(tenantId: string, id: string): Promise<BookingRequest> {
    const bookingRequest = await this.repository.findById(tenantId, id);

    if (!bookingRequest) {
      throw new NotFoundException('Booking request was not found.');
    }

    return bookingRequest;
  }

  private async assertRequestReferenceAvailable(
    tenantId: string,
    requestReference: string,
    currentBookingRequestId?: string,
  ): Promise<void> {
    const existing = await this.repository.findByRequestReference(
      tenantId,
      requestReference.trim().toUpperCase(),
    );

    if (existing && existing.id !== currentBookingRequestId) {
      throw new ConflictException('A booking request with this reference already exists.');
    }
  }

  private assertDateOrder(
    input: Pick<UpdateBookingRequestInput, 'requestedEta' | 'requestedEtd'>,
    existing?: BookingRequest,
  ): void {
    const eta = this.resolveDate(input.requestedEta, existing?.requestedEta);
    const etd = this.resolveDate(input.requestedEtd, existing?.requestedEtd);

    if (eta && etd && eta.getTime() > etd.getTime()) {
      throw new BadRequestException('Requested ETA cannot be later than requested ETD.');
    }
  }

  private assertServicesEditable(bookingRequest: BookingRequest): void {
    const editableStatuses: readonly BookingRequestStatus[] = [
      'draft',
      'submitted',
      'under_review',
      'availability_checked',
    ];

    if (!editableStatuses.includes(bookingRequest.status as BookingRequestStatus)) {
      throw new BadRequestException(
        'Requested services can only be changed before the booking request is approved.',
      );
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

  private canTransition(current: BookingRequestStatus, next: BookingRequestStatus): boolean {
    const allowed: Record<BookingRequestStatus, readonly BookingRequestStatus[]> = {
      draft: ['submitted', 'cancelled'],
      submitted: ['under_review', 'cancelled'],
      under_review: ['availability_checked', 'approved', 'rejected', 'cancelled'],
      availability_checked: ['approved', 'rejected', 'cancelled'],
      approved: ['rejected', 'cancelled'],
      rejected: [],
      confirmed: [],
      cancelled: [],
    };

    return allowed[current]?.includes(next) ?? false;
  }

  private toVesselCallInput(bookingRequest: BookingRequest): CreateVesselCallInput {
    return {
      callReference: bookingRequest.requestReference,
      vesselId: bookingRequest.vesselId,
      portId: bookingRequest.portId,
      berthId: bookingRequest.preferredBerthId,
      agentId: bookingRequest.agentOrganizationId,
      operatorId: null,
      voyageNumber: bookingRequest.voyageNumber,
      status: 'planned',
      eta: bookingRequest.requestedEta?.toISOString() ?? null,
      etd: bookingRequest.requestedEtd?.toISOString() ?? null,
      remarks: this.buildConfirmedVesselCallRemarks(bookingRequest),
    };
  }

  private buildConfirmedVesselCallRemarks(bookingRequest: BookingRequest): string | null {
    const remarks = [
      `Confirmed from booking request ${bookingRequest.requestReference}.`,
      bookingRequest.cargoSummary ? `Cargo: ${bookingRequest.cargoSummary}` : '',
      bookingRequest.remarks ?? '',
    ].filter(Boolean);

    return remarks.length > 0 ? remarks.join('\n') : null;
  }
}
