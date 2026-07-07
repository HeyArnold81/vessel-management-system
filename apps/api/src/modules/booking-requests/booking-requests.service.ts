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
  BookingRequestRecord,
  BookingRequestStatus,
  CreateBookingRequestInput,
  PaginatedResponse,
  UpdateBookingRequestInput,
} from '@vms/shared';

import { normalizePage, normalizePageSize } from '../../shared/pagination.js';

import { toBookingRequestRecord } from './booking-request.mapper.js';
import {
  BOOKING_REQUESTS_REPOSITORY,
  type BookingRequestsRepository,
} from './booking-requests.repository.js';

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
    return toBookingRequestRecord(updated);
  }

  async remove(tenantId: string, id: string): Promise<BookingRequestRecord> {
    await this.getExisting(tenantId, id);
    const deleted = await this.repository.softDelete(tenantId, id);
    return toBookingRequestRecord(deleted);
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
      approved: ['confirmed', 'rejected', 'cancelled'],
      rejected: [],
      confirmed: [],
      cancelled: [],
    };

    return allowed[current]?.includes(next) ?? false;
  }
}
