import { BadRequestException } from '@nestjs/common';
import { Prisma, type BookingRequest, type BookingRequestedService, type ServiceCatalog, type VesselCall } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { BookingRequestsService } from './booking-requests.service.js';
import type { BookingRequestsRepository } from './booking-requests.repository.js';

const tenantId = '11111111-1111-4111-8111-111111111111';
const bookingRequestId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const vesselCallId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const vesselId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const portId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

function buildBookingRequest(overrides: Partial<BookingRequest> = {}): BookingRequest {
  return {
    id: bookingRequestId,
    tenantId,
    requestReference: 'BR-2026-0001',
    vesselId,
    portId,
    preferredBerthId: null,
    agentOrganizationId: null,
    customerOrganizationId: null,
    vesselCallId: null,
    status: 'approved',
    requestedEta: new Date('2026-07-01T10:00:00.000Z'),
    requestedEtd: new Date('2026-07-02T18:00:00.000Z'),
    voyageNumber: 'VOY-7781',
    cargoSummary: 'General cargo',
    remarks: 'Customer prefers morning arrival.',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    submittedAt: new Date('2026-01-01T12:00:00.000Z'),
    reviewedAt: null,
    deletedAt: null,
    ...overrides,
  };
}

function buildVesselCall(overrides: Partial<VesselCall> = {}): VesselCall {
  return {
    id: vesselCallId,
    tenantId,
    callReference: 'BR-2026-0001',
    vesselId,
    portId,
    berthId: null,
    agentId: null,
    operatorId: null,
    voyageNumber: 'VOY-7781',
    status: 'planned',
    eta: new Date('2026-07-01T10:00:00.000Z'),
    etd: new Date('2026-07-02T18:00:00.000Z'),
    ata: null,
    atd: null,
    remarks: 'Confirmed from booking request BR-2026-0001.',
    createdAt: new Date('2026-01-03T00:00:00.000Z'),
    updatedAt: new Date('2026-01-03T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

function buildService(overrides: Partial<ServiceCatalog> = {}): ServiceCatalog {
  return {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    tenantId,
    code: 'PILOT',
    name: 'Pilotage',
    category: 'pilotage',
    defaultUnit: 'each',
    isBillable: true,
    status: 'active',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

function buildRequestedService(
  overrides: Partial<BookingRequestedService> = {},
): BookingRequestedService & { service: ServiceCatalog } {
  return {
    id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
    tenantId,
    bookingRequestId,
    serviceId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    providerOrganizationId: null,
    serviceReceiverOrganizationId: null,
    billToOrganizationId: null,
    payerOrganizationId: null,
    status: 'requested',
    quantity: new Prisma.Decimal(1),
    unitOfMeasure: 'each',
    requestedAt: new Date('2026-07-01T10:00:00.000Z'),
    isBillable: true,
    notes: null,
    createdAt: new Date('2026-01-03T00:00:00.000Z'),
    updatedAt: new Date('2026-01-03T00:00:00.000Z'),
    service: buildService(),
    ...overrides,
  };
}

function buildRepository(overrides: Partial<BookingRequestsRepository> = {}): BookingRequestsRepository {
  return {
    findPage: vi.fn().mockResolvedValue({ bookingRequests: [buildBookingRequest()], totalItems: 1 }),
    findById: vi.fn().mockResolvedValue(buildBookingRequest()),
    findByRequestReference: vi.fn().mockResolvedValue(null),
    findVesselCallByCallReference: vi.fn().mockResolvedValue(null),
    findServiceById: vi.fn().mockResolvedValue(buildService()),
    create: vi.fn().mockResolvedValue(buildBookingRequest()),
    update: vi.fn().mockResolvedValue(buildBookingRequest()),
    updateStatus: vi.fn().mockResolvedValue(buildBookingRequest({ status: 'submitted' })),
    confirm: vi.fn().mockResolvedValue({
      bookingRequest: buildBookingRequest({ status: 'confirmed', vesselCallId }),
      vesselCall: buildVesselCall(),
    }),
    findRequestedServices: vi.fn().mockResolvedValue([buildRequestedService()]),
    findRequestedServiceById: vi.fn().mockResolvedValue(buildRequestedService()),
    createRequestedService: vi.fn().mockResolvedValue(buildRequestedService()),
    deleteRequestedService: vi.fn().mockResolvedValue(buildRequestedService()),
    softDelete: vi.fn().mockResolvedValue(buildBookingRequest({ status: 'cancelled' })),
    ...overrides,
  };
}

describe('BookingRequestsService', () => {
  it('confirms an approved booking request into a vessel call', async () => {
    const repository = buildRepository();
    const audit = { record: vi.fn() };
    const service = new BookingRequestsService(repository, audit);

    await expect(service.confirm(tenantId, bookingRequestId)).resolves.toMatchObject({
      bookingRequest: {
        id: bookingRequestId,
        status: 'confirmed',
        vesselCallId,
      },
      vesselCall: {
        id: vesselCallId,
        callReference: 'BR-2026-0001',
        status: 'planned',
      },
    });

    expect(repository.confirm).toHaveBeenCalledWith(
      tenantId,
      bookingRequestId,
      expect.objectContaining({
        callReference: 'BR-2026-0001',
        vesselId,
        portId,
        status: 'planned',
        eta: '2026-07-01T10:00:00.000Z',
        etd: '2026-07-02T18:00:00.000Z',
      }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'booking_request.confirm',
        entityId: bookingRequestId,
        metadata: { vesselCallId },
      }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'vessel_call.create_from_booking_request',
        entityType: 'vessel_call',
        entityId: vesselCallId,
        metadata: { bookingRequestId },
      }),
    );
  });

  it('rejects confirmation before approval', async () => {
    const service = new BookingRequestsService(
      buildRepository({ findById: vi.fn().mockResolvedValue(buildBookingRequest({ status: 'submitted' })) }),
      { record: vi.fn() },
    );

    await expect(service.confirm(tenantId, bookingRequestId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('adds a requested service before approval', async () => {
    const repository = buildRepository({
      findById: vi.fn().mockResolvedValue(buildBookingRequest({ status: 'under_review' })),
    });
    const audit = { record: vi.fn() };
    const service = new BookingRequestsService(repository, audit);

    await expect(
      service.createRequestedService(tenantId, bookingRequestId, {
        serviceId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        quantity: 1,
        unitOfMeasure: 'each',
      }),
    ).resolves.toMatchObject({
      serviceCode: 'PILOT',
      serviceName: 'Pilotage',
      quantity: '1',
      unitOfMeasure: 'each',
    });

    expect(repository.createRequestedService).toHaveBeenCalledWith(
      tenantId,
      bookingRequestId,
      expect.objectContaining({
        serviceId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        quantity: 1,
        unitOfMeasure: 'each',
        isBillable: true,
      }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'booking_request.service_request.create',
        entityId: bookingRequestId,
      }),
    );
  });

  it('prevents service changes after approval', async () => {
    const service = new BookingRequestsService(
      buildRepository({ findById: vi.fn().mockResolvedValue(buildBookingRequest({ status: 'approved' })) }),
      { record: vi.fn() },
    );

    await expect(
      service.createRequestedService(tenantId, bookingRequestId, {
        serviceId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        quantity: 1,
        unitOfMeasure: 'each',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
