import type { BookingRequest } from '@prisma/client';

import type { BookingRequestRecord, BookingRequestStatus } from '@vms/shared';

export function toBookingRequestRecord(bookingRequest: BookingRequest): BookingRequestRecord {
  return {
    id: bookingRequest.id,
    tenantId: bookingRequest.tenantId,
    requestReference: bookingRequest.requestReference,
    vesselId: bookingRequest.vesselId,
    portId: bookingRequest.portId,
    preferredBerthId: bookingRequest.preferredBerthId,
    agentOrganizationId: bookingRequest.agentOrganizationId,
    customerOrganizationId: bookingRequest.customerOrganizationId,
    vesselCallId: bookingRequest.vesselCallId,
    status: bookingRequest.status as BookingRequestStatus,
    requestedEta: bookingRequest.requestedEta?.toISOString() ?? null,
    requestedEtd: bookingRequest.requestedEtd?.toISOString() ?? null,
    voyageNumber: bookingRequest.voyageNumber,
    cargoSummary: bookingRequest.cargoSummary,
    remarks: bookingRequest.remarks,
    createdAt: bookingRequest.createdAt.toISOString(),
    updatedAt: bookingRequest.updatedAt.toISOString(),
    submittedAt: bookingRequest.submittedAt?.toISOString() ?? null,
    reviewedAt: bookingRequest.reviewedAt?.toISOString() ?? null,
  };
}
